import prisma from '../db'

export class InventoryService {
    /**
     * Calculates new Moving Average Cost
     * Formula: Cp = (V_existente + V_compra) / (Q_existente + Q_compra)
     */
    calculateNewCost(
        currentStock: number,
        currentCost: number,
        purchaseQty: number,
        purchaseCost: number
    ): number {
        const totalValueParams = (currentStock * currentCost) + (purchaseQty * purchaseCost)
        const totalQty = currentStock + purchaseQty

        if (totalQty === 0) return 0

        return totalValueParams / totalQty
    }

    /**
     * Process a purchase: Update stock and cost, and return the transaction details for accounting
     */
    async processPurchase(
        companyId: string,
        productSku: string,
        qty: number,
        unitCost: number
    ) {
        const product = await prisma.product.findUnique({
            where: {
                company_id_sku: {
                    company_id: companyId,
                    sku: productSku
                }
            }
        })

        if (!product) {
            throw new Error(`Product ${productSku} not found`)
        }

        const newCost = this.calculateNewCost(
            Number(product.quantity_on_hand),
            Number(product.avg_cost),
            qty,
            unitCost
        )

        // Update Product
        const updatedProduct = await prisma.product.update({
            where: { id: product.id },
            data: {
                quantity_on_hand: { increment: qty },
                avg_cost: newCost
            }
        })

        return {
            product: updatedProduct,
            movementValue: qty * unitCost,
            assetAccountId: product.asset_account_id
        }
    }
}
