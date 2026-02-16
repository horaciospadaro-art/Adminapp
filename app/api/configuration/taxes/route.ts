import { NextResponse } from 'next/server'
import prisma from '@/lib/db'

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const companyId = searchParams.get('companyId')

        // Default to first company if not provided (Demo mode)
        let targetCompanyId = companyId
        if (!targetCompanyId) {
            const company = await prisma.company.findFirst()
            if (company) targetCompanyId = company.id
        }

        if (!targetCompanyId) {
            return NextResponse.json([])
        }

        const taxes = await prisma.tax.findMany({
            where: { company_id: targetCompanyId, is_active: true },
            include: {
                gl_account: true,
                debito_fiscal_account: true,
                credito_fiscal_account: true
            },
            orderBy: { name: 'asc' }
        })

        return NextResponse.json(taxes)
    } catch (error) {
        console.error('Error fetching taxes:', error)
        return NextResponse.json({ error: 'Error fetching taxes' }, { status: 500 })
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const {
            name,
            rate,
            type,
            description,
            gl_account_id,
            debito_fiscal_account_id,
            credito_fiscal_account_id,
            company_id
        } = body

        // Resolve Company ID
        let targetCompanyId = company_id
        if (!targetCompanyId) {
            const company = await prisma.company.findFirst()
            if (company) targetCompanyId = company.id
        }

        const isIva = type === 'IVA'
        const hasAccount = gl_account_id || (isIva && (debito_fiscal_account_id || credito_fiscal_account_id))
        if (!targetCompanyId || !name || rate === undefined || !type) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }
        if (!isIva && !gl_account_id) {
            return NextResponse.json({ error: 'Impuestos no IVA requieren Cuenta Contable.' }, { status: 400 })
        }

        const newTax = await prisma.tax.create({
            data: {
                company_id: targetCompanyId,
                name,
                rate,
                type,
                description,
                gl_account_id: gl_account_id || null,
                debito_fiscal_account_id: debito_fiscal_account_id || null,
                credito_fiscal_account_id: credito_fiscal_account_id || null
            }
        })

        return NextResponse.json(newTax)
    } catch (error) {
        console.error('Error creating tax:', error)
        return NextResponse.json({ error: 'Error creating tax' }, { status: 500 })
    }
}
