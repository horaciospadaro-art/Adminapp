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
            include: { gl_account: true },
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
        const { name, rate, type, description, gl_account_id, company_id } = body

        // Resolve Company ID
        let targetCompanyId = company_id
        if (!targetCompanyId) {
            const company = await prisma.company.findFirst()
            if (company) targetCompanyId = company.id
        }

        if (!targetCompanyId || !name || rate === undefined || !type || !gl_account_id) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        const newTax = await prisma.tax.create({
            data: {
                company_id: targetCompanyId,
                name,
                rate,
                type,
                description,
                gl_account_id
            }
        })

        return NextResponse.json(newTax)
    } catch (error) {
        console.error('Error creating tax:', error)
        return NextResponse.json({ error: 'Error creating tax' }, { status: 500 })
    }
}
