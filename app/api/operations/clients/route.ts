import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { ThirdPartyType } from '@prisma/client'

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url)
        const companyId = searchParams.get('companyId')

        if (!companyId) return NextResponse.json({ error: 'Company ID required' }, { status: 400 })

        const clients = await prisma.thirdParty.findMany({
            where: {
                company_id: companyId,
                type: { in: [ThirdPartyType.CLIENTE, ThirdPartyType.AMBOS] }
            },
            orderBy: { name: 'asc' },
            include: {
                receivable_account: true
            }
        })
        return NextResponse.json(clients)
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const { companyId, name, rif, email, phone, address, receivable_account_id } = body

        if (!companyId || !name || !rif) {
            return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 })
        }

        const client = await prisma.thirdParty.create({
            data: {
                company_id: companyId,
                name,
                rif,
                email,
                phone,
                address,
                type: ThirdPartyType.CLIENTE,
                receivable_account_id: receivable_account_id || null
            }
        })

        return NextResponse.json(client)
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
