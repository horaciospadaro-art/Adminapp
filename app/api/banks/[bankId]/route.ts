import { NextResponse } from 'next/server'
import prisma from '@/lib/db'

export async function GET(
    request: Request,
    { params }: { params: Promise<{ bankId: string }> }
) {
    try {
        const { bankId } = await params
        const bank = await prisma.bankAccount.findUnique({
            where: { id: bankId },
            include: { gl_account: true }
        })

        if (!bank) {
            return NextResponse.json({ error: 'Bank account not found' }, { status: 404 })
        }

        return NextResponse.json(bank)
    } catch (error) {
        console.error('Error fetching bank:', error)
        return NextResponse.json({ error: 'Error fetching bank' }, { status: 500 })
    }
}

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ bankId: string }> }
) {
    try {
        const { bankId } = await params
        const body = await request.json()
        const { name, account_number, type, currency, gl_account_id } = body

        // Validations
        if (!name || !account_number) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        // Update
        const updatedBank = await prisma.bankAccount.update({
            where: { id: bankId },
            data: {
                bank_name: name,
                account_number,
                type,
                currency,
                // We typically don't update gl_account_id lightly as it affects accounting ref
                // But if provided, we update it.
                ...(gl_account_id ? { gl_account_id } : {})
            }
        })

        // Optionally update the GL Account name if it matches the old bank name?
        // For now, let's keep it simple.

        return NextResponse.json(updatedBank)
    } catch (error) {
        console.error('Error updating bank:', error)
        return NextResponse.json({ error: 'Error updating bank' }, { status: 500 })
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ bankId: string }> }
) {
    try {
        const { bankId } = await params

        // Check for transactions
        const transactionCount = await prisma.bankTransaction.count({
            where: { bank_account_id: bankId }
        })

        if (transactionCount > 0) {
            return NextResponse.json({
                error: 'No se puede eliminar la cuenta porque tiene movimientos registrados. Considere inactivarla.'
            }, { status: 400 })
        }

        // Delete
        await prisma.bankAccount.delete({
            where: { id: bankId }
        })

        // Optional: Delete associated GL Account if it was auto-created and has no other entries?
        // Too risky for now.

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error deleting bank:', error)
        return NextResponse.json({ error: 'Error deleting bank' }, { status: 500 })
    }
}
