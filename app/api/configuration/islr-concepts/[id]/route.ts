import { NextResponse } from 'next/server'
import prisma from '@/lib/db'


export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params
        const body = await req.json()
        const { description, rate, base_percentage, seniat_code } = body

        const concept = await prisma.iSLRConcept.update({
            where: { id },
            data: {
                description,
                rate,
                base_percentage,
                seniat_code
            }
        })
        return NextResponse.json(concept)
    } catch (error) {
        return NextResponse.json({ error: 'Error updating ISLR concept' }, { status: 500 })
    }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params
        await prisma.iSLRConcept.delete({
            where: { id }
        })
        return NextResponse.json({ success: true })
    } catch (error) {
        return NextResponse.json({ error: 'Error deleting ISLR concept' }, { status: 500 })
    }
}

