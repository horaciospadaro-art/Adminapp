import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'

export async function GET(req: NextRequest) {
    try {
        const companies = await prisma.company.findMany({
            orderBy: { created_at: 'desc' }
        })
        return NextResponse.json(companies)
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const { name, rif, fiscal_year_start, currency } = body

        if (!name || !rif || !fiscal_year_start || !currency) {
            return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 })
        }

        // Validate RIF Uniqueness
        const existing = await prisma.company.findUnique({
            where: { rif }
        })

        if (existing) {
            return NextResponse.json({ error: 'El RIF ya está registrado' }, { status: 400 })
        }

        const company = await prisma.company.create({
            data: {
                name,
                rif,
                fiscal_year_start: new Date(fiscal_year_start),
                currency
            }
        })

        return NextResponse.json(company)
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

export async function PUT(req: NextRequest) {
    try {
        const body = await req.json()
        const { id, name, rif, fiscal_year_start, currency } = body // ID in body

        if (!id) {
            return NextResponse.json({ error: 'ID requerido' }, { status: 400 })
        }

        const company = await prisma.company.update({
            where: { id },
            data: {
                name,
                rif,
                fiscal_year_start: fiscal_year_start ? new Date(fiscal_year_start) : undefined,
                currency
            }
        })

        return NextResponse.json(company)
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
