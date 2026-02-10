
import { NextResponse } from 'next/server'
import prisma from '@/lib/db'

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const clientIds = searchParams.get('clientIds')?.split(',') || []

    try {
        const whereClause: any = {
            type: 'INVOICE',
            status: { in: ['PENDING', 'PARTIAL'] },
            balance: { gt: 0 }
        }

        if (clientIds.length > 0) {
            whereClause.third_party_id = { in: clientIds }
        }

        const invoices = await prisma.document.findMany({
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

        return NextResponse.json(invoices)
    } catch (error) {
        console.error('Error fetching receivables:', error)
        return NextResponse.json(
            { error: 'Error fetching receivables' },
            { status: 500 }
        )
    }
}
