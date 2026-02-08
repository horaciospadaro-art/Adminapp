import { NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { ThirdPartyType } from '@prisma/client'

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const type = searchParams.get('type')
        const companyId = searchParams.get('companyId')

        // Default to first company if not provided (Demo)
        let targetCompanyId = companyId
        if (!targetCompanyId) {
            const company = await prisma.company.findFirst()
            if (company) targetCompanyId = company.id
        }

        if (!targetCompanyId) {
            return NextResponse.json([])
        }

        const where: any = { company_id: targetCompanyId }

        if (type) {
            // Handle AMBOS case or specific type
            if (type === 'CLIENTE') {
                where.type = { in: ['CLIENTE', 'AMBOS'] }
            } else if (type === 'PROVEEDOR') {
                where.type = { in: ['PROVEEDOR', 'AMBOS'] }
            }
        }

        const thirdParties = await prisma.thirdParty.findMany({
            where,
            orderBy: { name: 'asc' }
        })

        return NextResponse.json(thirdParties)
    } catch (error) {
        console.error('Error fetching third parties:', error)
        return NextResponse.json({ error: 'Error fetching third parties' }, { status: 500 })
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const {
            name, rif, email, phone, address, type,
            is_tax_payer_special, retention_agent_islr,
            company_id
        } = body

        // Resolve Company ID
        let targetCompanyId = company_id
        if (!targetCompanyId) {
            const company = await prisma.company.findFirst()
            if (company) targetCompanyId = company.id
        }

        if (!targetCompanyId || !name || !rif) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        const newThirdParty = await prisma.thirdParty.create({
            data: {
                company_id: targetCompanyId,
                name,
                rif,
                email,
                phone,
                address,
                type: type as ThirdPartyType || 'CLIENTE',
                is_tax_payer_special: is_tax_payer_special || false,
                retention_agent_islr: retention_agent_islr || false
            }
        })

        return NextResponse.json(newThirdParty)
    } catch (error) {
        console.error('Error creating third party:', error)
        return NextResponse.json({ error: 'Error creating third party' }, { status: 500 })
    }
}
