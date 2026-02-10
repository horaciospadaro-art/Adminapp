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
            return NextResponse.json(null)
        }

        const config = await prisma.globalTaxConfiguration.findUnique({
            where: { company_id: targetCompanyId },
            include: {
                iva_fiscal_debit_account: true,
                iva_fiscal_credit_account: true,
                iva_retention_account: true,
                islr_retention_account: true,
                igtf_account: true
            }
        })

        return NextResponse.json(config)
    } catch (error) {
        console.error('Error fetching global tax config:', error)
        return NextResponse.json({ error: 'Error fetching configuration' }, { status: 500 })
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const {
            company_id,
            iva_fiscal_debit_account_id,
            iva_fiscal_credit_account_id,
            iva_retention_account_id,
            islr_retention_account_id,
            igtf_account_id
        } = body

        // Resolve Company ID
        let targetCompanyId = company_id
        if (!targetCompanyId) {
            const company = await prisma.company.findFirst()
            if (company) targetCompanyId = company.id
        }

        if (!targetCompanyId) {
            return NextResponse.json({ error: 'Company ID required' }, { status: 400 })
        }

        const config = await prisma.globalTaxConfiguration.upsert({
            where: { company_id: targetCompanyId },
            update: {
                iva_fiscal_debit_account_id,
                iva_fiscal_credit_account_id,
                iva_retention_account_id,
                islr_retention_account_id,
                igtf_account_id
            },
            create: {
                company_id: targetCompanyId,
                iva_fiscal_debit_account_id,
                iva_fiscal_credit_account_id,
                iva_retention_account_id,
                islr_retention_account_id,
                igtf_account_id
            }
        })

        return NextResponse.json(config)
    } catch (error) {
        console.error('Error updating global tax config:', error)
        return NextResponse.json({ error: 'Error updating configuration' }, { status: 500 })
    }
}
