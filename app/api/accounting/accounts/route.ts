import { NextResponse } from 'next/server'
import prisma from '@/lib/db'

export async function GET() {
    try {
        const accounts = await prisma.chartOfAccount.findMany({
            orderBy: { code: 'asc' },
            select: { id: true, code: true, name: true, type: true }
        })
        return NextResponse.json(accounts)
    } catch (error) {
        return NextResponse.json({ error: 'Error fetching accounts' }, { status: 500 })
    }
}
