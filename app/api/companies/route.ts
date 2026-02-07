import { NextResponse } from 'next/server'
import prisma from '@/lib/db'

export async function GET() {
    try {
        const companies = await prisma.company.findMany()
        return NextResponse.json(companies)
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch companies' }, { status: 500 })
    }
}

export async function POST(request: Request) {
    try {
        const json = await request.json()
        const company = await prisma.company.create({
            data: json
        })
        return NextResponse.json(company)
    } catch (error) {
        return NextResponse.json({ error: 'Failed to create company' }, { status: 500 })
    }
}
