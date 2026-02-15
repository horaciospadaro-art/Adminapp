
import { NextResponse } from 'next/server'
import prisma from '@/lib/db'

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> } // Params are Promises in Next.js 15
) {
    try {
        const { id: customerId } = await params

        // Fetch Customer
        const customer = await prisma.thirdParty.findUnique({
            where: { id: customerId }
        })

        if (!customer) {
            return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
        }

        // Fetch all financial documents
        const documents = await prisma.document.findMany({
            where: {
                third_party_id: customerId,
                status: { not: 'VOID' }
            },
            orderBy: { date: 'asc' },
            select: {
                id: true,
                date: true,
                type: true,
                number: true,
                total: true,
                status: true,
                created_at: true
            }
        })

        // Process for Running Balance
        let runningBalance = 0
        const transactions = documents.map((doc: any) => {
            let charge = 0
            let payment = 0

            // Logic for "Customer Balance"
            // Invoice: Increases Debt (Charge)
            // Credit Note: Decreases Debt (Payment/Credit)
            // Receipt: Decreases Debt (Payment)
            // Debit Note: Increases Debt (Charge)

            if (doc.type === 'INVOICE' || doc.type === 'DEBIT_NOTE') {
                charge = Number(doc.total)
                runningBalance += charge
            } else if (doc.type === 'RECEIPT' || doc.type === 'CREDIT_NOTE') {
                payment = Number(doc.total)
                runningBalance -= payment
            }

            return {
                id: doc.id,
                date: doc.date,
                type: doc.type,
                number: doc.number,
                description: doc.type, // Could be more descriptive
                charge,
                payment,
                balance: runningBalance,
                status: doc.status
            }
        })

        return NextResponse.json({
            customer: {
                id: customer.id,
                name: customer.name,
                tax_id: customer.rif,
                email: customer.email,
                phone: customer.phone,
                address: customer.address
            },
            transactions,
            total_balance: runningBalance
        })

    } catch (error) {
        console.error('Error fetching statement:', error)
        return NextResponse.json({ error: 'Error fetching statement' }, { status: 500 })
    }
}
