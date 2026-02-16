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
    } catch (error) {
        console.error('Error updating tax:', error)
        return NextResponse.json({ error: 'Error updating tax' }, { status: 500 })
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
    } catch (error) {
        console.error('Error deleting tax:', error)
        return NextResponse.json({ error: 'Error deleting tax' }, { status: 500 })
    }
}
