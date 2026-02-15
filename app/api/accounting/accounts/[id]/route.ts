import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        if (!id) {
            return NextResponse.json({ error: 'ID de cuenta requerido' }, { status: 400 })
        }

        const account = await prisma.chartOfAccount.findUnique({
            where: { id }
        })

        if (!account) {
            return NextResponse.json({ error: 'Cuenta no encontrada' }, { status: 404 })
        }

        const movementCount = await prisma.journalLine.count({
            where: { account_id: id }
        })

        if (movementCount > 0) {
            return NextResponse.json(
                { error: 'No se puede borrar la cuenta porque tiene movimientos. Solo se pueden eliminar cuentas sin movimiento.' },
                { status: 422 }
            )
        }

        const childrenCount = await prisma.chartOfAccount.count({
            where: { parent_id: id }
        })

        if (childrenCount > 0) {
            return NextResponse.json(
                { error: 'No se puede borrar la cuenta porque tiene subcuentas. Elimine primero las subcuentas.' },
                { status: 422 }
            )
        }

        await prisma.chartOfAccount.delete({
            where: { id }
        })

        return NextResponse.json({ success: true })
    } catch (error: any) {
        console.error('Error deleting account:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
