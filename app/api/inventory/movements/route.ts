import { NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { InventoryService } from '@/lib/services/inventory-service'
import { MovementType } from '@prisma/client'

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const companyId = searchParams.get('companyId')
        const productId = searchParams.get('productId')
        const type = searchParams.get('type') as MovementType | null
        const startDate = searchParams.get('startDate')
        const endDate = searchParams.get('endDate')

        // Default to first company if not provided
        let targetCompanyId = companyId
        if (!targetCompanyId) {
            const company = await prisma.company.findFirst()
            if (company) targetCompanyId = company.id
        }

        if (!targetCompanyId) {
            return NextResponse.json([])
        }

        const service = new InventoryService()
        const movements = await service.getMovements(targetCompanyId, {
            productId: productId || undefined,
            type: type || undefined,
            startDate: startDate ? new Date(startDate) : undefined,
            endDate: endDate ? new Date(endDate) : undefined
        })

        return NextResponse.json(movements)
    } catch (error: any) {
        console.error('Error fetching movements:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const {
            companyId,
            productId,
            date,
            type,
            quantity,
            unitCost,
            reference,
            description,
            documentId
        } = body

        // Default to first company if not provided
        let targetCompanyId = companyId
        if (!targetCompanyId) {
            const company = await prisma.company.findFirst()
            if (company) targetCompanyId = company.id
        }

        if (!targetCompanyId || !productId || !date || !type || !quantity) {
            return NextResponse.json(
                { error: 'Missing required fields: companyId, productId, date, type, quantity' },
                { status: 400 }
            )
        }

        const service = new InventoryService()
        const result = await service.processInventoryMovement({
            companyId: targetCompanyId,
            productId,
            date: new Date(date),
            type,
            quantity: parseFloat(quantity),
            unitCost: unitCost ? parseFloat(unitCost) : undefined,
            reference,
            description,
            documentId
        })

        return NextResponse.json(result)
    } catch (error: any) {
        console.error('Error creating movement:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
