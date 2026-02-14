
import { NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { DocumentType, WithholdingDirection, TaxType, ProductType, PaymentStatus } from '@prisma/client'
import { createBillJournalEntry } from '@/lib/accounting-helpers'

// Helper function to generate retention numbers
async function generateRetentionNumber(companyId: string, type: 'IVA' | 'ISLR') {
    const prefix = type === 'IVA' ? 'RET-IVA' : 'RET-ISLR'

    // Find the last retention of this type for this company
    const lastRetention = await prisma.withholding.findFirst({
        where: {
            company_id: companyId,
            type: type === 'IVA' ? TaxType.RETENCION_IVA : TaxType.RETENCION_ISLR,
            certificate_number: { startsWith: prefix }
        },
        orderBy: { created_at: 'desc' }
    })

    let nextNum = 1
    if (lastRetention) {
        const parts = lastRetention.certificate_number.split('-')
        const lastSeq = parseInt(parts[parts.length - 1])
        if (!isNaN(lastSeq)) nextNum = lastSeq + 1
    }

    return `${prefix}-${nextNum.toString().padStart(6, '0')}`
}

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const {
            company_id,
            third_party_id,
            date,
            due_date,
            number,
            reference,
            items, // Array of { product_id, description, quantity, unit_price, tax_rate, gl_account_id }

            // Retention params
            apply_retention_iva = false,
            retention_iva_percentage = 0, // 75, 100

            apply_retention_islr = false,
            retention_islr_concept_id,
            retention_islr_rate = 0,
            retention_islr_subtract = 0 // Sustraendo logic (if any)
        } = body

        if (!company_id || !third_party_id || !date || !items || items.length === 0) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        // 1. Calculations
        let subtotal = 0
        let totalTax = 0

        const processedItems = items.map((item: any) => {
            const qty = parseFloat(item.quantity)
            const price = parseFloat(item.unit_price)
            const lineTotal = qty * price
            const taxRate = parseFloat(item.tax_rate) || 0
            const taxAmount = lineTotal * (taxRate / 100)

            subtotal += lineTotal
            totalTax += taxAmount

            return {
                ...item,
                quantity: qty,
                unit_price: price,
                tax_rate: taxRate,
                tax_amount: taxAmount,
                total: lineTotal + taxAmount
            }
        })

        const totalInvoice = subtotal + totalTax

        // Calculate Retentions
        let retentionIVAAmount = 0
        let retentionISLRAmount = 0

        if (apply_retention_iva && totalTax > 0) {
            retentionIVAAmount = totalTax * (parseFloat(retention_iva_percentage) / 100)
        }

        if (apply_retention_islr) {
            // ISLR is usually calculated on base amount (subtotal)
            // Or specific base depending on concept. Assuming Subtotal for now.
            const baseForISLR = subtotal
            const calc = (baseForISLR * (parseFloat(retention_islr_rate) / 100)) - (parseFloat(retention_islr_subtract) || 0)
            retentionISLRAmount = Math.max(0, calc)
        }

        const totalPayable = totalInvoice - retentionIVAAmount - retentionISLRAmount

        // 2. Transaction
        const result = await prisma.$transaction(async (tx) => {
            // A. Create Document (Bill)
            const doc = await tx.document.create({
                data: {
                    company_id,
                    third_party_id,
                    type: DocumentType.BILL,
                    date: new Date(date),
                    due_date: due_date ? new Date(due_date) : null,
                    number,
                    reference,
                    currency_code: 'VES',

                    subtotal,
                    tax_amount: totalTax,
                    total: totalInvoice,
                    balance: totalPayable, // Initial balance is what remains after retentions (if retentions open)
                    // OR totalInvoice if retentions are treated as payment?
                    // Usually, balance = totalInvoice. Retentions are created as "Payment" or specific "Withholding" records that reduce balance.
                    // Let's create Withholding records and link them. If we link them, we should reduce balance?
                    // Yes, effectively they are a form of payment.

                    status: PaymentStatus.PENDING,

                    items: {
                        create: processedItems.map((item: any) => ({
                            product_id: item.product_id || null,
                            description: item.description,
                            quantity: item.quantity,
                            unit_price: item.unit_price,
                            tax_rate: item.tax_rate,
                            tax_amount: item.tax_amount,
                            total: item.total,
                            gl_account_id: item.gl_account_id || null
                        }))
                    }
                }
            })

            // B. Create Retentions
            const generatedRetentions = []

            if (retentionIVAAmount > 0) {
                const retNumber = await generateRetentionNumber(company_id, 'IVA')
                const retIVA = await tx.withholding.create({
                    data: {
                        company_id,
                        document_id: doc.id,
                        third_party_id,
                        direction: WithholdingDirection.ISSUED, // We issue this retention to supplier
                        type: TaxType.RETENCION_IVA,
                        date: new Date(date),
                        certificate_number: retNumber,
                        base_amount: totalTax, // Base for IVA retention is the Tax Amount? Or Base Amount? Usually Tax Amount * 75%. 
                        // But schema says base_amount. Let's store Tax Amount as base.
                        // Wait, base_amount usually means the amount on which rate is applied.
                        // For IVA retention: Rate applied on IVA Amount. So base = totalTax.
                        tax_amount: totalTax, // Information purposes
                        rate: retention_iva_percentage,
                        amount: retentionIVAAmount
                    }
                })
                generatedRetentions.push(retIVA)
            }

            if (retentionISLRAmount > 0) {
                const retNumber = await generateRetentionNumber(company_id, 'ISLR')
                const retISLR = await tx.withholding.create({
                    data: {
                        company_id,
                        document_id: doc.id,
                        third_party_id,
                        direction: WithholdingDirection.ISSUED,
                        type: TaxType.RETENCION_ISLR,
                        date: new Date(date),
                        certificate_number: retNumber,
                        base_amount: subtotal,
                        tax_amount: 0,
                        rate: retention_islr_rate,
                        amount: retentionISLRAmount,
                        islr_concept_code: retention_islr_concept_id // Storing ID or Code
                    }
                })
                generatedRetentions.push(retISLR)
            }

            // Update Document Balance (Subtract Retentions as they are "paid" via certificate)
            if (generatedRetentions.length > 0) {
                const totalRetained = retentionIVAAmount + retentionISLRAmount
                await tx.document.update({
                    where: { id: doc.id },
                    data: {
                        balance: { decrement: totalRetained }
                        // Status update logic could be here (if balance becomes 0)
                    }
                })
            }

            // C. Update Inventory (Moving Average Cost)
            for (const item of processedItems) {
                if (item.product_id) {
                    const product = await tx.product.findUnique({ where: { id: item.product_id } })

                    if (product?.track_inventory && product.type === ProductType.GOODS) {
                        // Calculate new Weighted Average Cost
                        const currentQty = Number(product.quantity_on_hand)
                        const currentCost = Number(product.avg_cost)
                        const newQty = item.quantity
                        const newCost = item.unit_price

                        // Formula: ((CurrentQty * CurrentCost) + (NewQty * NewCost)) / (CurrentQty + NewQty)
                        const totalValue = (currentQty * currentCost) + (newQty * newCost)
                        const totalQty = currentQty + newQty

                        let newAvgCost = currentCost
                        if (totalQty > 0) {
                            newAvgCost = totalValue / totalQty
                        }

                        // Create Movement Record
                        await tx.inventoryMovement.create({
                            data: {
                                company_id,
                                product_id: item.product_id,
                                date: new Date(date),
                                type: 'PURCHASE', // Assuming enum fits
                                quantity: newQty,
                                unit_cost: newCost,
                                total_value: newQty * newCost,
                                avg_cost_before: currentCost,
                                avg_cost_after: newAvgCost,
                                document_id: doc.id,
                                description: `Compra Factura ${number}`
                            }
                        })

                        // Update Product
                        await tx.product.update({
                            where: { id: item.product_id },
                            data: {
                                quantity_on_hand: { increment: newQty },
                                avg_cost: newAvgCost,
                                last_purchase_date: new Date(date)
                            }
                        })
                    }
                }
            }

            // D. Accounting Entries
            await createBillJournalEntry(tx, doc.id, company_id)

            return { document: doc, retentions: generatedRetentions }
        })

        return NextResponse.json(result)
    } catch (error: any) {
        console.error('Error creating bill:', error)
        return NextResponse.json({ error: error.message || 'Error creating bill' }, { status: 500 })
    }
}
