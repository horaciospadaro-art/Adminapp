import { NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { AccountType } from '@prisma/client'

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { bankName, accountNumber, currency, glAccountName } = body

        // 1. Get default company
        const company = await prisma.company.findFirst()
        if (!company) return NextResponse.json({ error: 'Company not found' }, { status: 400 })

        // 2. Create GL Account for the Bank (Asset)
        // We need to find a parent account for "Banks" (e.g., 1.1.01). For MVP, we'll just create it as a top-level asset or child of 1.1.01 if exists.
        // Let's assume 1.1.01 exists or we create it. 
        // Logic: Find parent 1.1.01 (Cash & Banks). If not, create it.

        let parent = await prisma.chartOfAccount.findFirst({
            where: { company_id: company.id, code: '1.1.01' }
        })

        if (!parent) {
            // Create parent "Efectivo y Equivalentes"
            parent = await prisma.chartOfAccount.create({
                data: {
                    company_id: company.id,
                    code: '1.1.01',
                    name: 'EFECTIVO Y EQUIVALENTES',
                    type: AccountType.ASSET
                }
            })
        }

        // Generate next code for the new bank account (e.g. 1.1.01.01, 1.1.01.02...)
        const siblings = await prisma.chartOfAccount.findMany({
            where: { company_id: company.id, parent_id: parent.id }
        })
        const nextCodeSuffix = (siblings.length + 1).toString().padStart(2, '0')
        const newCode = `${parent.code}.${nextCodeSuffix}`

        const glAccount = await prisma.chartOfAccount.create({
            data: {
                company_id: company.id,
                code: newCode,
                name: glAccountName || `${bankName} ${currency}`,
                type: AccountType.ASSET,
                parent_id: parent.id
            }
        })

        // 3. Create Bank Account linked to GL Account
        const bankAccount = await prisma.bankAccount.create({
            data: {
                company_id: company.id,
                bank_name: bankName,
                account_number: accountNumber,
                gl_account_id: glAccount.id
            }
        })

        return NextResponse.json(bankAccount)
    } catch (error) {
        console.error('Error creating bank account:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
