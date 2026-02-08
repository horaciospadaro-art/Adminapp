import { NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { DocumentType, PaymentStatus, ProductType } from '@prisma/client'

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const {
            company_id,
            third_party_id,
            type,
            date,
            due_date,
            number,
            reference,
            items, // Array of { product_id, description, quantity, unit_price, tax_id }
            ignore_inventory = false
        } = body

        // 1. Validation
        let targetCompanyId = company_id
        if (!targetCompanyId) {
            const company = await prisma.company.findFirst()
            if (company) targetCompanyId = company.id
        }

        if (!targetCompanyId || !third_party_id || !type || !date || !items || items.length === 0) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        // 2. Calculations
        let subtotal = 0
        let totalTax = 0

        // Fetch taxes for calculation if needed, or rely on frontend values?
        // Better to fetch to ensure integrity, but for speed we might trust frontend tax_amount if validated.
        // Let's iterate items and calculate.

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

        const total = subtotal + totalTax

        // 3. Transaction
        const result = await prisma.$transaction(async (tx) => {
            // Create Document
            const doc = await tx.document.create({
                data: {
                    company_id: targetCompanyId,
                    third_party_id,
                    type: type as DocumentType,
                    date: new Date(date),
                    due_date: due_date ? new Date(due_date) : null,
                    number,
                    reference,
                    currency_code: 'VES', // Default for now

                    subtotal,
                    tax_amount: totalTax,
                    total,
                    balance: total, // Initially unpaid
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
                            total: item.total,
                            gl_account_id: item.gl_account_id || null
                        }))
                    }
                }
            })

            // Update Inventory (if applicable and strictly tracked)
            // For now, simple decrement if it's a sale (INVOICE) or increment if it's a purchase (BILL)
            // AND if the product tracks inventory.

            // Limit inventory check to relevant types
            if (!ignore_inventory) {
                // Fetch Third Party to determine direction (CLIENT vs SUPPLIER)
                // If it's a CREDIT_NOTE, we need to know who it is for.
                const thirdParty = await tx.thirdParty.findUnique({ where: { id: third_party_id } })
                const isClient = thirdParty?.type === 'CLIENTE' || thirdParty?.type === 'AMBOS'
                const isSupplier = thirdParty?.type === 'PROVEEDOR' || thirdParty?.type === 'AMBOS'

                for (const item of processedItems) {
                    if (item.product_id) {
                        const product = await tx.product.findUnique({ where: { id: item.product_id } })

                        if (product?.track_inventory && product.type === ProductType.GOODS) {
                            let adjustment = 0

                            if (type === DocumentType.INVOICE) {
                                // Sale -> Decrease
                                adjustment = -item.quantity
                            } else if (type === DocumentType.BILL) {
                                // Purchase -> Increase
                                adjustment = item.quantity
                            } else if (type === DocumentType.CREDIT_NOTE) {
                                if (isClient) {
                                    // Sale Return -> Increase
                                    adjustment = item.quantity
                                } else if (isSupplier) {
                                    // Purchase Return -> Decrease
                                    adjustment = -item.quantity
                                }
                            }
                            // DEBIT_NOTE usually doesn't affect inventory

                            if (adjustment !== 0) {
                                await tx.product.update({
                                    where: { id: item.product_id },
                                    data: {
                                        quantity_on_hand: { increment: adjustment }
                                    }
                                })
                            }
                        }
                    }
                }
            }

            return doc
        })

        return NextResponse.json(result)
    } catch (error) {
        console.error('Error creating document:', error)
        return NextResponse.json({ error: 'Error creating document' }, { status: 500 })
    }
}
