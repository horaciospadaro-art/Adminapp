
import { NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { createWithholdingJournalEntry } from '@/lib/accounting-helpers'

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const {
            company_id,
            document_id,
            third_party_id,
            type, // 'RETENCION_IVA', 'RETENCION_ISLR'
            date,
            certificate_number,
            base_amount,
            rate,
            amount
        } = body

        if (!company_id || !document_id || !third_party_id || !amount || !certificate_number) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        const withholdingAmount = parseFloat(amount)

        const result = await prisma.$transaction(async (tx) => {
            // 1. Create Withholding Record
            const withholding = await tx.withholding.create({
                data: {
                    company_id,
                    document_id,
                    third_party_id,
                    direction: 'RECEIVED', // Default for withholdings we receive
                    type,
                    date: new Date(date || new Date()),
                    certificate_number,
                    base_amount: parseFloat(base_amount),
                    tax_amount: 0, // Can be updated if needed
                    rate: parseFloat(rate),
                    amount: withholdingAmount
                }
            })

            // 2. Update Invoice Balance (Reduce by withholding amount)
            const invoice = await tx.document.findUnique({ where: { id: document_id } })
            if (invoice) {
                const newBalance = Number(invoice.balance) - withholdingAmount
                // Status update logic (if balance 0, PAID? No, withholding is part of payment usually, but logically yes)
                // However, usually withholding is just one part.
                // If newBalance <= 0.01 -> PAID.
                const status = newBalance <= 0.01 ? 'PAID' : 'PARTIAL' // Using string or Enum

                await tx.document.update({
                    where: { id: document_id },
                    data: {
                        balance: newBalance,
                        status: status as any // Cast to Enum if needed
                    }
                })
            }

            // 3. Generate Accounting Entry
            try {
                await createWithholdingJournalEntry(tx, withholding.id, company_id)
            } catch (error) {
                console.error('Accounting Error (Withholding):', error)
            }

            return withholding
        })

        return NextResponse.json(result)

    } catch (error) {
        console.error('Error creating withholding:', error)
        return NextResponse.json({ error: 'Error creating withholding' }, { status: 500 })
    }
}
