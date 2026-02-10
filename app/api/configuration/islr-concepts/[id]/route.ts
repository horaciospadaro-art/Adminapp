import { NextResponse } from 'next/server'
import prisma from '@/lib/db'


export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params
        const body = await req.json()
        const {
            seniat_code,
            description,
            pn_resident_rate,
            pj_domiciled_rate,
            pn_non_resident_rate,
            pj_non_domiciled_rate
        } = body

        const concept = await prisma.iSLRConcept.update({
            where: { id },
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
