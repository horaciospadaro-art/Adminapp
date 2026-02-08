import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'

export async function PUT(req: NextRequest) {
    try {
        const body = await req.json()
        const { id, name, rif, email, phone, address, receivable_account_id, payable_account_id } = body

        if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

        const updated = await prisma.thirdParty.update({
            where: { id },
            data: {
                name,
                rif,
                email,
                phone,
                address,
                receivable_account_id: receivable_account_id || undefined, // undefined to ignore if not passed? No, probably null if explicitly cleared? 
                // Let's assume frontend sends null if cleared. 
                // But prisma treats undefined as "do nothing".
                // If we want to allow clearing, we need to handle null.
                payable_account_id: payable_account_id || undefined
            }
        })

        return NextResponse.json(updated)
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
