import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { ThirdPartyType } from '@prisma/client'

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url)
        const companyId = searchParams.get('companyId')
        const q = searchParams.get('q')?.trim()

        if (!companyId) return NextResponse.json({ error: 'Company ID required' }, { status: 400 })

        const where: { company_id: string; type: { in: ThirdPartyType[] }; name?: { contains: string; mode: 'insensitive' } } = {
            company_id: companyId,
            type: { in: [ThirdPartyType.PROVEEDOR, ThirdPartyType.AMBOS] }
        }
        // Búsqueda por nombre: normalizar espacios para que "FARMATODO" coincida con "Farma Todo"
        if (q) {
            const normalized = q.replace(/\s+/g, ' ').trim()
            where.name = { contains: normalized, mode: 'insensitive' }
        }

        const suppliers = await prisma.thirdParty.findMany({
            where,
            orderBy: { name: 'asc' },
            include: {
                payable_account: true
            }
        })
        return NextResponse.json(suppliers)
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const { companyId, name, rif, email, phone, address, payable_account_id } = body

        if (!companyId || !name || !rif) {
            return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 })
        }

        const supplier = await prisma.thirdParty.create({
            data: {
                company_id: companyId,
                name,
                rif,
                email,
                phone,
                address,
                type: ThirdPartyType.PROVEEDOR,
                taxpayer_type: body.taxpayer_type || undefined,
                payable_account_id: payable_account_id || null
            }
        })

        return NextResponse.json(supplier)
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
