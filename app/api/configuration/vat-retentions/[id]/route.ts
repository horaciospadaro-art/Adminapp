import { NextResponse } from 'next/server'
import prisma from '@/lib/db'

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params
        const body = await req.json()
        const { description, rate, active } = body

        const retention = await prisma.vATRetention.update({
            where: { id },
            data: {
                description,
                rate,
                active
            }
        })
        return NextResponse.json(retention)
    } catch (error) {
        return NextResponse.json({ error: 'Error updating VAT retention' }, { status: 500 })
    }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params
        await prisma.vATRetention.delete({
            where: { id }
        })
        return NextResponse.json({ success: true })
    } catch (error) {
        return NextResponse.json({ error: 'Error deleting VAT retention' }, { status: 500 })
    }
}
