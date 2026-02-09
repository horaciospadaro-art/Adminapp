import { NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { InventoryService } from '@/lib/services/inventory-service'
import { MovementType } from '@prisma/client'

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const companyId = searchParams.get('companyId')
        const type = searchParams.get('type') // "entries", "exits", "valuation", "movement_history"
        const productId = searchParams.get('productId')
        const startDate = searchParams.get('startDate')
        const endDate = searchParams.get('endDate')

        // Default to first company if not provided
        let targetCompanyId = companyId
        if (!targetCompanyId) {
            const company = await prisma.company.findFirst()
            if (company) targetCompanyId = company.id
        }

        if (!targetCompanyId) {
            return NextResponse.json({ error: 'No company found' }, { status: 400 })
        }

        const service = new InventoryService()

        // Handle different report types
        if (type === 'valuation') {
            const valuation = await service.getInventoryValuation(targetCompanyId)
            return NextResponse.json(valuation)
        }

        if (type === 'entries' || type === 'exits' || type === 'movement_history') {
            const filters: any = {
                productId: productId || undefined,
                startDate: startDate ? new Date(startDate) : undefined,
                endDate: endDate ? new Date(endDate) : undefined
            }

            if (type === 'entries') {
                const movements = await service.getMovements(targetCompanyId, filters)
                const entries = movements.filter(m =>
                    m.type === MovementType.PURCHASE ||
                    m.type === MovementType.ADJUSTMENT_IN ||
                    m.type === MovementType.TRANSFER_IN
                )
                return NextResponse.json({ movements: entries })
            }

            if (type === 'exits') {
                const movements = await service.getMovements(targetCompanyId, filters)
                const exits = movements.filter(m =>
                    m.type === MovementType.SALE ||
                    m.type === MovementType.ADJUSTMENT_OUT ||
                    m.type === MovementType.TRANSFER_OUT
                )
                return NextResponse.json({ movements: exits })
            }

            if (type === 'movement_history') {
                const movements = await service.getMovements(targetCompanyId, filters)
                return NextResponse.json({ movements })
            }
        }

        return NextResponse.json({ error: 'Invalid report type' }, { status: 400 })
    } catch (error: any) {
        console.error('Error generating report:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
