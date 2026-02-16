
import { NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { DocumentType, WithholdingDirection, TaxType, ProductType, PaymentStatus, Prisma, MovementType } from '@prisma/client'
import { createBillJournalEntry } from '@/lib/accounting-helpers'

// Helper function to generate retention numbers
async function generateRetentionNumber(tx: any, companyId: string, type: 'IVA' | 'ISLR') {
    const prefix = type === 'IVA' ? 'RET-IVA' : 'RET-ISLR'

    // Find the last retention of this type for this company
    const lastRetention = await tx.withholding.findFirst({
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

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const thirdPartyId = searchParams.get('third_party_id')
        const type = searchParams.get('type') // optional filter
        const companyId = searchParams.get('companyId')
        const q = searchParams.get('q')?.trim()
        const dateFrom = searchParams.get('dateFrom')?.trim()
        const dateTo = searchParams.get('dateTo')?.trim()

        // Por defecto listar todos los documentos de compra (factura, nota de crédito, nota de débito)
        const purchaseDocTypes = [DocumentType.BILL, DocumentType.CREDIT_NOTE, DocumentType.DEBIT_NOTE]
        const whereClause: Prisma.DocumentWhereInput = {
            company_id: companyId || '1',
            type: type ? (type as DocumentType) : { in: purchaseDocTypes },
            status: { not: 'VOID' }
        }

        if (dateFrom || dateTo) {
            const from = dateFrom ? new Date(dateFrom) : undefined
            const to = dateTo ? new Date(dateTo) : undefined
            if (to) to.setHours(23, 59, 59, 999)
            if (from && to) whereClause.date = { gte: from, lte: to }
            else if (from) whereClause.date = { gte: from }
            else if (to) whereClause.date = { lte: to }
        }

        const id = searchParams.get('id')
        if (id) {
            const doc = await prisma.document.findUnique({
                where: { id },
                include: {
                    third_party: true,
                    items: true,
                    withholdings: true
                }
            })
            return NextResponse.json(doc ? [doc] : [])
        }

        if (thirdPartyId) {
            whereClause.third_party_id = thirdPartyId
        }

        if (q) {
            whereClause.OR = [
                { number: { contains: q, mode: 'insensitive' } },
                { control_number: { contains: q, mode: 'insensitive' } },
                { third_party: { name: { contains: q, mode: 'insensitive' } } }
            ]
        }

        const documents = await prisma.document.findMany({
            where: whereClause,
            include: {
                third_party: true,
                items: true,
                withholdings: true // just in case
            },
            orderBy: { date: 'desc' }
        })

        return NextResponse.json(documents)
    } catch (error: any) {
        console.error('Error fetching bills:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const {
            company_id,
            third_party_id,
            date,
            accounting_date,
            due_date,
            number,
            control_number,
            reference,
            type = 'BILL', // Default to BILL if not provided
            bill_type, // PURCHASE or EXPENSE
            items, // Array of { product_id, description, quantity, unit_price, tax_rate, gl_account_id ... }

            // Note: Global rates for labels
            vat_retention_rate = 0,
            islr_concept_id = null
        } = body

        if (!company_id || !third_party_id || !date || !items || items.length === 0) {
            return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400 })
        }

        const islrConcepts = await prisma.iSLRConcept.findMany() // Fetch for naming 

        // 1. Calculations
        let subtotal = 0
        let totalTax = 0
        let totalRetIVA = 0
        let totalRetISLR = 0

        const processedItems: any[] = []
        for (const item of items) {
            const qty = parseFloat(item.quantity)
            const price = parseFloat(item.unit_price)
            const lineBase = qty * price
            const taxRate = parseFloat(item.tax_rate) || 0
            const taxAmount = parseFloat(item.tax_amount) || 0
            const retIVAAmount = parseFloat(item.vat_retention_amount) || 0
            const retISLRAmount = parseFloat(item.islr_amount) || 0

            subtotal += lineBase
            totalTax += taxAmount
            totalRetIVA += retIVAAmount
            totalRetISLR += retISLRAmount

            let glAccountId = item.gl_account_id

            // If no GL account provided but product is linked, fetch product's GL account
            if (!glAccountId && item.product_id) {
                const product = await prisma.product.findUnique({
                    where: { id: item.product_id },
                    select: { asset_account_id: true, cogs_account_id: true, type: true }
                })
                if (product) {
                    glAccountId = product.type === 'GOODS' ? product.asset_account_id : product.cogs_account_id
                }
            }

            processedItems.push({
                ...item,
                quantity: qty,
                unit_price: price,
                tax_rate: taxRate,
                tax_amount: taxAmount,
                vat_retention_rate: parseFloat(item.vat_retention_rate) || 0,
                vat_retention_amount: retIVAAmount,
                islr_rate: parseFloat(item.islr_rate) || 0,
                islr_amount: retISLRAmount,
                total: lineBase + taxAmount,
                gl_account_id: glAccountId
            })
        }

        const totalInvoice = subtotal + totalTax
        const totalPayable = totalInvoice - totalRetIVA - totalRetISLR

        // 2. Transaction
        const result = await prisma.$transaction(async (tx: any) => {
            // A. Create Document (Bill)
            const doc = await tx.document.create({
                data: {
                    company_id,
                    third_party_id,
                    type: type as DocumentType,
                    date: new Date(date),
                    accounting_date: accounting_date ? new Date(accounting_date) : new Date(date),
                    due_date: due_date ? new Date(due_date) : null,
                    number,
                    reference,
                    currency_code: 'VES',

                    subtotal,
                    tax_amount: totalTax,
                    total: totalInvoice,
                    balance: totalPayable,

                    status: PaymentStatus.PENDING,

                    items: {
                        create: processedItems.map((item: any) => ({
                            product_id: item.product_id || null,
                            description: item.description,
                            quantity: item.quantity,
                            unit_price: item.unit_price,
                            tax_id: item.tax_id || null,
                            tax_rate: item.tax_rate,
                            tax_amount: item.tax_amount,
                            vat_retention_rate: item.vat_retention_rate,
                            vat_retention_amount: item.vat_retention_amount,
                            islr_rate: item.islr_rate,
                            islr_amount: item.islr_amount,
                            total: item.total,
                            gl_account_id: item.gl_account_id || null
                        }))
                    },

                    // Handle withholdings (Global values derived from items)
                    withholdings: {
                        create: [
                            ...(totalRetIVA > 0 ? [{
                                company: { connect: { id: company_id } },
                                third_party: { connect: { id: third_party_id } },
                                type: TaxType.RETENCION_IVA,
                                base_amount: subtotal,
                                tax_amount: totalTax,
                                rate: vat_retention_rate,
                                amount: totalRetIVA,
                                direction: WithholdingDirection.ISSUED,
                                certificate_number: await generateRetentionNumber(tx, company_id, 'IVA'),
                                date: new Date(date)
                            }] : []),
                            ...(totalRetISLR > 0 ? [{
                                company: { connect: { id: company_id } },
                                third_party: { connect: { id: third_party_id } },
                                type: TaxType.RETENCION_ISLR,
                                base_amount: subtotal,
                                tax_amount: 0,
                                rate: processedItems.find((i: any) => i.islr_rate > 0)?.islr_rate || 0,
                                amount: totalRetISLR,
                                direction: WithholdingDirection.ISSUED,
                                islr_concept_name: islrConcepts.find((c: any) => c.id === processedItems.find((i: any) => i.islr_concept_id)?.islr_concept_id)?.description || null,
                                certificate_number: await generateRetentionNumber(tx, company_id, 'ISLR'),
                                date: new Date(date)
                            }] : [])
                        ]
                    }
                }
            })

            // C. Update Inventory (Moving Average Cost)
            // Only for BILLs or specific types that affect inventory. 
            // Debit Notes usually don't move stock. Credit Notes (Financial) don't move stock.
            // Purchase Returns (Physical) will move stock but they are handled separately or via type='PURCHASE_RETURN' (future)
            if (type === 'BILL') {
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
            } else if (type === 'CREDIT_NOTE' && bill_type === 'PURCHASE') {
                for (const item of processedItems) {
                    if (item.product_id) {
                        const product = await tx.product.findUnique({ where: { id: item.product_id } })

                        if (product?.track_inventory && product.type === ProductType.GOODS) {
                            // Returns: Exit at Current Average Cost
                            const currentCost = Number(product.avg_cost)
                            const returnQty = item.quantity // Quantity to return

                            // Create Movement Record (PURCHASE_RETURN)
                            // Note: We use PURCHASE_RETURN if available in enum, else ADJUSTMENT_OUT or similar.
                            // Assuming PURCHASE_RETURN was added to schema as per task.
                            // If enum not updated in types yet, we might need cast or use generic string if enum allows.
                            // But usually prisma generates types.
                            await tx.inventoryMovement.create({
                                data: {
                                    company_id,
                                    product_id: item.product_id,
                                    date: new Date(date),
                                    type: MovementType.PURCHASE_RETURN,
                                    quantity: returnQty,
                                    unit_cost: currentCost,
                                    total_value: returnQty * currentCost,
                                    avg_cost_before: currentCost,
                                    avg_cost_after: currentCost,
                                    document_id: doc.id,
                                    description: `Devolución Compra ${number}`
                                }
                            })

                            // Update Product Stock (Decrement)
                            await tx.product.update({
                                where: { id: item.product_id },
                                data: {
                                    quantity_on_hand: { decrement: returnQty },
                                    last_purchase_date: new Date(date)
                                }
                            })
                        }
                    }
                }
            }

            // D. Accounting Entries
            await createBillJournalEntry(tx, doc.id, company_id)

            return { document: doc }
        }, {
            timeout: 20000 // Increase timeout to 20s for complex operations
        })

        return NextResponse.json(result)
    } catch (error: any) {
        console.error('Error creating bill:', error)
        const message = error?.message ?? 'Error creating bill'
        if (
            message.includes('Payable Account') ||
            message.includes('missing GL Account') ||
            message.includes('GL Account') ||
            message.includes('Tax') ||
            message.includes('not found')
        ) {
            return NextResponse.json(
                { error: 'Error contable: ' + message },
                { status: 422 }
            )
        }
        return NextResponse.json({ error: message }, { status: 500 })
    }
}
