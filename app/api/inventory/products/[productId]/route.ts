import { NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { ProductType } from '@prisma/client'

export async function GET(
    request: Request,
    { params }: { params: Promise<{ productId: string }> }
) {
    try {
        const { productId } = await params
        const product = await prisma.product.findUnique({
            where: { id: productId }
        })

        if (!product) {
            return NextResponse.json({ error: 'Product not found' }, { status: 404 })
        }
        return NextResponse.json(product)
    } catch (error) {
        return NextResponse.json({ error: 'Error fetching product' }, { status: 500 })
    }
}

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ productId: string }> }
) {
    try {
        const { productId } = await params
        const body = await request.json()
        const {
            name, sku, description, type, sales_price, tax_id,
            track_inventory, quantity_on_hand, avg_cost,
            income_account_id, cogs_account_id, asset_account_id
        } = body

        const updatedProduct = await prisma.product.update({
            where: { id: productId },
            data: {
                name,
                sku,
                description,
                type: type as ProductType,
                sales_price,
                tax_id,

                track_inventory,
                quantity_on_hand,
                avg_cost,

                income_account_id: income_account_id || null,
                cogs_account_id: cogs_account_id || null,
                asset_account_id: asset_account_id || null
            }
        })

        return NextResponse.json(updatedProduct)
    } catch (error) {
        console.error('Error updating product:', error)
        return NextResponse.json({ error: 'Error updating product' }, { status: 500 })
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ productId: string }> }
) {
    try {
        const { productId } = await params

        // Soft delete
        await prisma.product.update({
            where: { id: productId },
            data: { is_active: false }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error deleting product:', error)
        return NextResponse.json({ error: 'Error deleting product' }, { status: 500 })
    }
}
