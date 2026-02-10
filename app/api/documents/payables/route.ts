
import { NextResponse } from 'next/server'
import prisma from '@/lib/db'

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const supplierIds = searchParams.get('supplierIds')?.split(',') || []

    try {
        const whereClause: any = {
            type: 'BILL',
            status: { in: ['PENDING', 'PARTIAL'] },
            balance: { gt: 0 }
        }

        if (supplierIds.length > 0) {
            whereClause.third_party_id = { in: supplierIds }
        }

        const bills = await prisma.document.findMany({
            where: whereClause,
            include: {
                third_party: {
                    select: {
                        id: true,
                        name: true,
                        rif: true
                    }
                }
            },
            orderBy: {
                date: 'asc'
            }
        })

        return NextResponse.json(bills)
    } catch (error) {
        console.error('Error fetching payables:', error)
        return NextResponse.json(
            { error: 'Error fetching payables' },
            { status: 500 }
        )
    }
}
