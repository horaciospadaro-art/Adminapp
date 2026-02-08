import { NextResponse } from 'next/server'
import prisma from '@/lib/db'

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const companyId = searchParams.get('companyId')

        if (!companyId) {
            // Fallback to first company found (Demo mode)
            const company = await prisma.company.findFirst()
            if (!company) {
                return NextResponse.json({ error: 'No companies found' }, { status: 404 })
            }
            const banks = await prisma.bankAccount.findMany({
                where: { company_id: company.id },
                include: { gl_account: true }
            })
            return NextResponse.json(banks)
        }

        const banks = await prisma.bankAccount.findMany({
            where: { company_id: companyId },
            include: { gl_account: true },
            orderBy: { created_at: 'desc' }
        })

        return NextResponse.json(banks)
    } catch (error) {
        console.error('Error fetching banks:', error)
        return NextResponse.json({ error: 'Error fetching banks' }, { status: 500 })
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { company_id, name, account_number, currency, type, balance, gl_account_id, create_gl_account } = body

        // Resolve Company ID
        let targetCompanyId = company_id
        if (!targetCompanyId) {
            const company = await prisma.company.findFirst()
            if (company) targetCompanyId = company.id
        }

        if (!targetCompanyId || !name || !account_number) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        let finalGlAccountId = gl_account_id

        // Auto-create GL Account logic
        if (!finalGlAccountId && create_gl_account) {
            // 1. Find a suitable parent (Cash/Banks - usually 1.1.01 or 1.01.01)
            // We search for an Asset account that likely represents Cash/Banks
            const parent = await prisma.chartOfAccount.findFirst({
                where: {
                    company_id: targetCompanyId,
                    OR: [
                        { code: '1.1.01' },
                        { name: { contains: 'Efectivo', mode: 'insensitive' } },
                        { name: { contains: 'Caja', mode: 'insensitive' } }
                    ],
                    type: 'ASSET'
                },
                orderBy: { code: 'asc' }
            })

            if (parent) {
                // 2. Generate new code
                const lastChild = await prisma.chartOfAccount.findFirst({
                    where: { parent_id: parent.id },
                    orderBy: { code: 'desc' }
                })

                let nextCode = ''
                if (lastChild) {
                    // Simple increment logic. 1.1.01.001 -> 1.1.01.002
                    const parts = lastChild.code.split('.')
                    const lastPart = parts[parts.length - 1]
                    const nextNum = parseInt(lastPart) + 1
                    parts[parts.length - 1] = nextNum.toString().padStart(lastPart.length, '0')
                    nextCode = parts.join('.')
                } else {
                    // First child
                    nextCode = `${parent.code}.001`
                }

                // 3. Create Account
                const newAccount = await prisma.chartOfAccount.create({
                    data: {
                        company_id: targetCompanyId,
                        code: nextCode,
                        name: name, // Bank Name as Account Name
                        type: 'ASSET',
                        parent_id: parent.id,
                        balance: balance || 0
                    }
                })
                finalGlAccountId = newAccount.id
            } else {
                return NextResponse.json({ error: 'Could not find a parent account for auto-creation. Please create the account manually in Accounting.' }, { status: 400 })
            }
        }

        if (!finalGlAccountId) {
            return NextResponse.json({ error: 'GL Account ID is required' }, { status: 400 })
        }

        const bank = await prisma.bankAccount.create({
            data: {
                company_id: targetCompanyId,
                bank_name: name,
                account_number,
                currency: currency || 'VES',
                type: type || 'CORRIENTE',
                balance: balance || 0,
                gl_account_id: finalGlAccountId
            }
        })

        return NextResponse.json(bank)
    } catch (error) {
        console.error('Error creating bank:', error)
        return NextResponse.json({ error: 'Error creating bank' }, { status: 500 })
    }
}
