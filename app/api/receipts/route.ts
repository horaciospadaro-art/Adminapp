
import { NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { DocumentType, PaymentStatus } from '@prisma/client'
import { createPaymentJournalEntry } from '@/lib/accounting-helpers'

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const {
            company_id,
            third_party_id,
            date,
            amount,
            reference,
            payment_method, // 'CASH', 'BANK', etc.
            bank_account_id,
            cash_account_id,
            notes,
            allocations // Array of { invoice_id, amount }
        } = body

        if (!company_id || !third_party_id || !amount || parseFloat(amount) <= 0) {
            return NextResponse.json({ error: 'Missing required fields or invalid amount' }, { status: 400 })
        }

        const totalAmount = parseFloat(amount)

        const result = await prisma.$transaction(async (tx) => {
            // 1. Create Receipt Document
            // For now, generating a simple number or expecting one. 
            // In a real app, we might want auto-increment sequence specifically for receipts.
            const receiptCount = await tx.document.count({
                where: { company_id, type: DocumentType.RECEIPT }
            })
            const number = `REC-${String(receiptCount + 1).padStart(6, '0')}`

            const receipt = await tx.document.create({
                data: {
                    company_id,
                    third_party_id,
                    type: DocumentType.RECEIPT,
                    date: new Date(date || new Date()),
                    number,
                    reference,
                    currency_code: 'VES',
                    subtotal: totalAmount,
                    tax_amount: 0,
                    total: totalAmount,
                    balance: 0, // Fully applied or hold balance? Usually 0 if fully applied.
                    status: PaymentStatus.PAID,
                    notes,
                    // Store payment allocations
                    payment_allocations: {
                        create: allocations?.map((alloc: any) => ({
                            invoice_id: alloc.invoice_id,
                            amount: parseFloat(alloc.amount)
                        }))
                    }
                }
            })

            // 2. Update Allocated Invoices
            if (allocations && allocations.length > 0) {
                for (const alloc of allocations) {
                    const allocAmount = parseFloat(alloc.amount)
                    const invoice = await tx.document.findUnique({ where: { id: alloc.invoice_id } })

                    if (invoice) {
                        const newBalance = Number(invoice.balance) - allocAmount
                        const newStatus = newBalance <= 0.01 ? PaymentStatus.PAID : PaymentStatus.PARTIAL

                        await tx.document.update({
                            where: { id: alloc.invoice_id },
                            data: {
                                balance: newBalance,
                                status: newStatus
                            }
                        })
                    }
                }
            }

            // 3. Generate Accounting Entry
            try {
                await createPaymentJournalEntry(
                    tx,
                    receipt.id,
                    bank_account_id,
                    cash_account_id,
                    company_id
                )
            } catch (error) {
                console.error('Accounting Error (Receipt):', error)
                // throw error // Uncomment to enforce strict accounting
            }

            return receipt
        })

        return NextResponse.json(result)

    } catch (error) {
        console.error('Error creating receipt:', error)
        return NextResponse.json({ error: 'Error creating payment receipt' }, { status: 500 })
    }
}
