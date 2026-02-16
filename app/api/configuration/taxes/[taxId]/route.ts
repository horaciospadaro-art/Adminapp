import { NextResponse } from 'next/server'
import prisma from '@/lib/db'

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ taxId: string }> }
) {
    try {
        const { taxId } = await params
        const body = await request.json()
        const {
            name,
            rate,
            type,
            description,
            gl_account_id,
            debito_fiscal_account_id,
            credito_fiscal_account_id,
            is_active
        } = body

        const updatedTax = await prisma.tax.update({
            where: { id: taxId },
            data: {
                ...(name !== undefined && { name }),
                ...(rate !== undefined && { rate }),
                ...(type !== undefined && { type }),
                ...(description !== undefined && { description }),
                ...(gl_account_id !== undefined && { gl_account_id: gl_account_id || null }),
                ...(debito_fiscal_account_id !== undefined && { debito_fiscal_account_id: debito_fiscal_account_id || null }),
                ...(credito_fiscal_account_id !== undefined && { credito_fiscal_account_id: credito_fiscal_account_id || null }),
                ...(is_active !== undefined && { is_active })
            }
        })

        return NextResponse.json(updatedTax)
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Error updating tax'
        console.error('Error updating tax:', error)
        const hint = message.includes('column') || message.includes('does not exist')
            ? ' Ejecute la migración de Prisma en la base de datos (prisma migrate deploy o prisma db push).'
            : ''
        return NextResponse.json({ error: message + hint }, { status: 500 })
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ taxId: string }> }
) {
    try {
        const { taxId } = await params

        // Soft delete
        await prisma.tax.update({
            where: { id: taxId },
            data: { is_active: false }
        })

        return NextResponse.json({ success: true })
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Error deleting tax'
        console.error('Error deleting tax:', error)
        return NextResponse.json({ error: message }, { status: 500 })
    }
}
