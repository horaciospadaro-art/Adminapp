import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
    try {
        const concepts = await prisma.iSLRConcept.findMany({
            orderBy: { description: 'asc' }
        })
        return NextResponse.json(concepts)
    } catch (error) {
        return NextResponse.json({ error: 'Error fetching ISLR concepts' }, { status: 500 })
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json()
        const { description, rate, base_percentage, seniat_code } = body

        const concept = await prisma.iSLRConcept.create({
            data: {
                description,
                rate,
                base_percentage: base_percentage || 100,
                seniat_code
            }
        })
        return NextResponse.json(concept)
    } catch (error) {
        return NextResponse.json({ error: 'Error creating ISLR concept' }, { status: 500 })
    }
}
