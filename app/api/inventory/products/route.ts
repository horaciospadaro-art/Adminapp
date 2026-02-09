import { NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { ProductType } from '@prisma/client'

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const type = searchParams.get('type') as ProductType | null
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

        const products = await prisma.product.findMany({
            where: {
                company_id: targetCompanyId,
                is_active: true,
                ...(type ? { type } : {})
            },
            orderBy: { name: 'asc' }
        })

        return NextResponse.json(products)
    } catch (error) {
        console.error('Error fetching products:', error)
        return NextResponse.json({ error: 'Error fetching products' }, { status: 500 })
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const {
            name, sku, description, type, sales_price, tax_id,
            track_inventory, quantity_on_hand, avg_cost,
            income_account_id, cogs_account_id, asset_account_id,
            company_id
        } = body

        // Resolve Company ID
        let targetCompanyId = company_id
        if (!targetCompanyId) {
            const company = await prisma.company.findFirst()
            if (company) targetCompanyId = company.id
        }

        if (!targetCompanyId || !name || !type) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        const newProduct = await prisma.product.create({
            data: {
                company_id: targetCompanyId,
                name,
                sku,
                description,
                type: type as ProductType,
                sales_price,
                tax_id,

                track_inventory,
                quantity_on_hand,
                avg_cost,
                minimum_stock: body.minimum_stock || 0,
                reorder_point: body.reorder_point || null,

                income_account_id: income_account_id || null,
                cogs_account_id: cogs_account_id || null,
                asset_account_id: asset_account_id || null
            }
        })

        return NextResponse.json(newProduct)
    } catch (error) {
        console.error('Error creating product:', error)
        return NextResponse.json({ error: 'Error creating product' }, { status: 500 })
    }
}
