
import { NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { DocumentType, PaymentStatus, ProductType } from '@prisma/client'
import { createDocumentJournalEntry } from '@/lib/accounting-helpers'

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const type = searchParams.get('type')
        const status = searchParams.get('status') // Can be comma separated
        const third_party_id = searchParams.get('third_party_id')
        const company_id = searchParams.get('company_id')

        let targetCompanyId = company_id
        if (!targetCompanyId) {
            const company = await prisma.company.findFirst()
            targetCompanyId = company?.id
        }

        const where: any = {
            company_id: targetCompanyId
        }

        if (type) {
            where.type = type as DocumentType
        }

        if (status) {
            const statuses = status.split(',')
            where.status = { in: statuses.map(s => s.trim() as PaymentStatus) }
        }

        if (third_party_id) {
            where.third_party_id = third_party_id
        }

        const documents = await prisma.document.findMany({
            where,
            include: {
                third_party: true,
                items: true
            },
            orderBy: {
                date: 'desc'
            }
        })

        return NextResponse.json(documents)
    } catch (error) {
        console.error('Error fetching documents:', error)
        return NextResponse.json({ error: 'Error fetching documents' }, { status: 500 })
    }
}

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
            control_number, // New
            accounting_date, // New
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

        const processedItems = items.map((item: any) => {
            const qty = parseFloat(item.quantity)
            const price = parseFloat(item.unit_price)
            const lineTotal = qty * price
            const taxRate = parseFloat(item.tax_rate) || 0
            const taxAmount = lineTotal * (taxRate / 100)

            // Retention Snapshots
            const vatRetRate = parseFloat(item.vat_retention_rate) || 0
            const vatRetAmount = taxAmount * (vatRetRate / 100)

            const islrRate = parseFloat(item.islr_rate) || 0
            const islrAmount = lineTotal * (islrRate / 100) // ISLR base is usually subtotal

            subtotal += lineTotal
            totalTax += taxAmount

            return {
                ...item,
                quantity: qty,
                unit_price: price,
                tax_rate: taxRate,
                tax_amount: taxAmount,
                vat_retention_rate: vatRetRate,
                vat_retention_amount: vatRetAmount,
                islr_rate: islrRate,
                islr_amount: islrAmount,
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
                    control_number,
                    accounting_date: accounting_date ? new Date(accounting_date) : new Date(date),
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

                            // New Fields
                            vat_retention_rate: item.vat_retention_rate,
                            vat_retention_amount: item.vat_retention_amount,
                            islr_rate: item.islr_rate,
                            islr_amount: item.islr_amount,

                            total: item.total,
                            gl_account_id: item.gl_account_id || null
                        }))
                    }
                }
            })

            // Update Inventory (if applicable and strictly tracked)
            if (!ignore_inventory) {
                // Fetch Third Party to determine direction (CLIENT vs SUPPLIER)
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

            // 4. Accounting Entry (Auto-generate)
            try {
                await createDocumentJournalEntry(tx, doc.id, targetCompanyId)
            } catch (accountingError) {
                console.error('Accounting Error:', accountingError)
                // Optional: throw to rollback transaction if accounting is strict
                // throw accountingError 
            }

            return doc
        })

        return NextResponse.json(result)
    } catch (error) {
        console.error('Error creating document:', error)
        return NextResponse.json({ error: 'Error creating document' }, { status: 500 })
    }
}
