import { NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { InventoryService } from '@/lib/services/inventory-service'

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const companyId = searchParams.get('companyId')

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
        const alerts = await service.getStockAlerts(targetCompanyId)

        return NextResponse.json(alerts)
    } catch (error: any) {
        console.error('Error fetching stock alerts:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
