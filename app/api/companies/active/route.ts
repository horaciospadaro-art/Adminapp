import { NextResponse } from 'next/server'
import prisma from '@/lib/db'

export async function GET() {
    try {
        const company = await prisma.company.findFirst()
        if (!company) return NextResponse.json({ error: 'No hay empresa' }, { status: 404 })
        return NextResponse.json(company)
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
