import { NextResponse } from 'next/server'
import prisma from '@/lib/db'

export async function GET() {
    try {
        const concepts = await prisma.iSLRConcept.findMany({
            orderBy: { seniat_code: 'asc' }
        })
        return NextResponse.json(concepts)
    } catch (error) {
        return NextResponse.json({ error: 'Error fetching ISLR concepts' }, { status: 500 })
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json()
        const {
            seniat_code,
            description,
            pn_resident_rate,
            pj_domiciled_rate,
            pn_non_resident_rate,
            pj_non_domiciled_rate
        } = body

        const concept = await prisma.iSLRConcept.create({
            data: {
                seniat_code,
                description,
                pn_resident_rate,
                pj_domiciled_rate,
                pn_non_resident_rate,
                pj_non_domiciled_rate
            }
        })
        return NextResponse.json(concept)
    } catch (error) {
        return NextResponse.json({ error: 'Error creating ISLR concept' }, { status: 500 })
    }
}
