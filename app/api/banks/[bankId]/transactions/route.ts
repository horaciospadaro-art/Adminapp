import { NextResponse } from 'next/server'
import { BankService } from '@/lib/services/bank-service'
import prisma from '@/lib/db'

export async function POST(request: Request, { params }: { params: { bankId: string } }) {
    try {
        const body = await request.json()
        const { bankId } = params

        // Get company ID (assuming single company for MVP or from session)
        const company = await prisma.company.findFirst()
        if (!company) return NextResponse.json({ error: 'Company not found' }, { status: 400 })

        const transaction = await BankService.createTransaction({
            companyId: company.id,
            bankAccountId: bankId,
            date: new Date(body.date),
            reference: body.reference,
            description: body.description,
            amount: body.amount,
            type: body.type, // DEBIT | CREDIT
            isIgtfApplied: body.isIgtfApplied,
            contrapartidaId: body.contrapartidaId
        })

        return NextResponse.json(transaction)
    } catch (error: any) {
        console.error('Error processing transaction:', error)
        return NextResponse.json({ error: error.message || 'Internal Error' }, { status: 500 })
    }
}
