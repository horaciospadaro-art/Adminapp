import { NextResponse } from 'next/server'
import prisma from '@/lib/db'

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const companyId = searchParams.get('companyId')

    if (!companyId) {
        return NextResponse.json({ error: 'Company ID required' }, { status: 400 })
    }

    try {
        const accounts = await prisma.chartOfAccount.findMany({
            where: { company_id: companyId },
            orderBy: { code: 'asc' }
        })
        return NextResponse.json(accounts)
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch accounts' }, { status: 500 })
    }
}

export async function POST(request: Request) {
    try {
        const json = await request.json()
        const account = await prisma.chartOfAccount.create({
            data: json
        })
        return NextResponse.json(account)
    } catch (error) {
        return NextResponse.json({ error: 'Failed to create account' }, { status: 500 })
    }
}
