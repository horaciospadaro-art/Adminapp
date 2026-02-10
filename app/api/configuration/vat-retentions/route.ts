import { NextResponse } from 'next/server'
import prisma from '@/lib/db'

export async function GET() {
    try {
        const retentions = await prisma.vATRetention.findMany({
            orderBy: { rate: 'asc' }
        })
        return NextResponse.json(retentions)
    } catch (error) {
        return NextResponse.json({ error: 'Error fetching VAT retentions' }, { status: 500 })
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json()
        const { description, rate, active } = body

        const retention = await prisma.vATRetention.create({
            data: {
                description,
                rate,
                active: active ?? true
            }
        })
        return NextResponse.json(retention)
    } catch (error) {
        return NextResponse.json({ error: 'Error creating VAT retention' }, { status: 500 })
    }
}
