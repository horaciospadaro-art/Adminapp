import prisma from '../db'
import { MovementType, ProductType } from '@prisma/client'
import { AccountingEngine, TransactionEvent } from './accounting-engine'

export interface InventoryMovementInput {
    companyId: string
    productId: string
    date: Date
    type: MovementType
    quantity: number
    unitCost?: number  // Required for PURCHASE, ADJUSTMENT_IN
    reference?: string
    description?: string
    documentId?: string
}

export class InventoryService {
    private accountingEngine: AccountingEngine

    constructor() {
        this.accountingEngine = new AccountingEngine()
    }

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
     * Unified method to process ANY inventory movement
     * Handles: purchases, sales, adjustments, transfers
     * Updates stock, recalculates avg cost, creates movement record, generates journal entry
     */
    async processInventoryMovement(input: InventoryMovementInput) {
        const { companyId, productId, date, type, quantity, unitCost, reference, description, documentId } = input

        // Execute everything in a transaction
        return await prisma.$transaction(async (tx) => {
            // 1. Get product
            const product = await tx.product.findUnique({
                where: { id: productId },
                include: {
                    income_account: true,
                    cogs_account: true,
                    asset_account: true
                }
            })

            if (!product) {
                throw new Error(`Product ${productId} not found`)
            }

            if (product.type !== ProductType.GOODS || !product.track_inventory) {
                throw new Error(`Product ${product.name} is not configured for inventory tracking`)
            }

            const currentStock = Number(product.quantity_on_hand)
            const currentAvgCost = Number(product.avg_cost)

            let newStock = currentStock
            let newAvgCost = currentAvgCost
            let movementUnitCost = currentAvgCost
            let totalValue = 0

            // 2. Calculate new stock and avg cost based on movement type
            switch (type) {
                case MovementType.PURCHASE:
                case MovementType.ADJUSTMENT_IN:
                    if (!unitCost || unitCost <= 0) {
                        throw new Error('Unit cost is required for purchases and adjustments in')
                    }
                    newStock = currentStock + quantity
                    newAvgCost = this.calculateNewCost(currentStock, currentAvgCost, quantity, unitCost)
                    movementUnitCost = unitCost
                    totalValue = quantity * unitCost
                    break

                case MovementType.SALE:
                case MovementType.ADJUSTMENT_OUT:
                    if (currentStock < quantity) {
                        throw new Error(`Insufficient stock. Available: ${currentStock}, Requested: ${quantity}`)
                    }
                    newStock = currentStock - quantity
                    // Avg cost doesn't change on exits
                    newAvgCost = currentAvgCost
                    movementUnitCost = currentAvgCost
                    totalValue = quantity * currentAvgCost
                    break

                case MovementType.TRANSFER_IN:
                case MovementType.TRANSFER_OUT:
                    // Future implementation
                    throw new Error('Transfer movements not yet implemented')

                default:
                    throw new Error(`Unknown movement type: ${type}`)
            }

            // 3. Update product
            const updatedProduct = await tx.product.update({
                where: { id: productId },
                data: {
                    quantity_on_hand: newStock,
                    avg_cost: newAvgCost,
                    last_purchase_date: type === MovementType.PURCHASE ? date : undefined
                }
            })

            // 4. Create inventory movement record
            const movement = await tx.inventoryMovement.create({
                data: {
                    company_id: companyId,
                    product_id: productId,
                    date,
                    type,
                    quantity,
                    unit_cost: movementUnitCost,
                    total_value: totalValue,
                    avg_cost_before: currentAvgCost,
                    avg_cost_after: newAvgCost,
                    reference,
                    description,
                    document_id: documentId
                }
            })

            // 5. Generate journal entry based on movement type
            const journalEntry = await this.createJournalEntryForMovement(
                companyId,
                date,
                type,
                product,
                totalValue,
                description || `${type} - ${product.name}`,
                tx
            )

            // 6. Link journal entry to movement
            if (journalEntry) {
                await tx.inventoryMovement.update({
                    where: { id: movement.id },
                    data: { journal_entry_id: journalEntry.id }
                })
            }

            // 7. Check stock alerts
            const alertsTriggered = await this.checkStockAlert(productId, newStock, Number(product.minimum_stock), tx)

            return {
                movement,
                product: updatedProduct,
                journalEntry,
                alertsTriggered
            }
        })
    }

    /**
     * Create appropriate journal entry for inventory movement
     */
    private async createJournalEntryForMovement(
        companyId: string,
        date: Date,
        type: MovementType,
        product: any,
        totalValue: number,
        description: string,
        tx: any
    ) {
        let lines: { account_id: string; debit: number; credit: number; description?: string }[] = []

        switch (type) {
            case MovementType.PURCHASE:
                // Debit: Inventory Asset, Credit: Accounts Payable (this will be handled by Document module)
                // For now, we only create the inventory side
                if (product.asset_account_id) {
                    lines.push({
                        account_id: product.asset_account_id,
                        debit: totalValue,
                        credit: 0,
                        description: `Compra - ${product.name}`
                    })
                    // We need a contra account - for now use a placeholder or skip
                    // In real integration, this would be linked to Bill/Document
                }
                break

            case MovementType.SALE:
                // Debit: COGS, Credit: Inventory Asset
                if (product.cogs_account_id && product.asset_account_id) {
                    lines = [
                        {
                            account_id: product.cogs_account_id,
                            debit: totalValue,
                            credit: 0,
                            description: `COGS - ${product.name}`
                        },
                        {
                            account_id: product.asset_account_id,
                            debit: 0,
                            credit: totalValue,
                            description: `Inventario - ${product.name}`
                        }
                    ]
                }
                break

            case MovementType.ADJUSTMENT_IN:
                // Debit: Inventory Asset, Credit: Inventory Adjustment (Gain)
                break

            case MovementType.ADJUSTMENT_OUT:
                // Debit: Inventory Loss/Shrinkage, Credit: Inventory Asset
                break
        }

        if (lines.length > 0) {
            return await tx.journalEntry.create({
                data: {
                    company_id: companyId,
                    date,
                    number: await this.accountingEngine.generateCorrelative(companyId, date, 'I'), // 'I' for Inventory
                    description,
                    status: 'POSTED',
                    lines: {
                        create: lines
                    }
                },
                include: { lines: true }
            })
        }

        return null
    }

    /**
     * Check if product stock is below minimum and trigger alert
     */
    private async checkStockAlert(productId: string, currentStock: number, minimumStock: number, tx: any) {
        if (currentStock < minimumStock && minimumStock > 0) {
            // Stock is below minimum
            return {
                triggered: true,
                productId,
                currentStock,
                minimumStock
            }
        }
        return { triggered: false }
    }

    /**
     * Get all products with low stock alerts
     */
    async getStockAlerts(companyId: string) {
        const products = await prisma.product.findMany({
            where: {
                company_id: companyId,
                type: ProductType.GOODS,
                track_inventory: true,
                is_active: true
            }
        })

        const alerts = products
            .filter(p => Number(p.quantity_on_hand) < Number(p.minimum_stock) && Number(p.minimum_stock) > 0)
            .map(p => ({
                productId: p.id,
                productName: p.name,
                sku: p.sku,
                currentStock: Number(p.quantity_on_hand),
                minimumStock: Number(p.minimum_stock),
                reorderPoint: p.reorder_point ? Number(p.reorder_point) : null
            }))

        return alerts
    }

    /**
     * Calculate total inventory valuation
     */
    async getInventoryValuation(companyId: string) {
        const products = await prisma.product.findMany({
            where: {
                company_id: companyId,
                type: ProductType.GOODS,
                track_inventory: true,
                is_active: true
            }
        })

        const valuation = products.map(p => ({
            productId: p.id,
            productName: p.name,
            sku: p.sku,
            quantityOnHand: Number(p.quantity_on_hand),
            avgCost: Number(p.avg_cost),
            totalValue: Number(p.quantity_on_hand) * Number(p.avg_cost)
        }))

        const totalValue = valuation.reduce((sum, item) => sum + item.totalValue, 0)

        return {
            items: valuation,
            totalValue
        }
    }

    /**
     * Get inventory movements with filters
     */
    async getMovements(companyId: string, filters?: {
        productId?: string
        type?: MovementType
        startDate?: Date
        endDate?: Date
    }) {
        return await prisma.inventoryMovement.findMany({
            where: {
                company_id: companyId,
                ...(filters?.productId && { product_id: filters.productId }),
                ...(filters?.type && { type: filters.type }),
                ...(filters?.startDate && { date: { gte: filters.startDate } }),
                ...(filters?.endDate && { date: { lte: filters.endDate } })
            },
            include: {
                product: {
                    select: {
                        name: true,
                        sku: true
                    }
                },
                journal_entry: {
                    select: {
                        id: true,
                        description: true
                    }
                }
            },
            orderBy: { date: 'desc' }
        })
    }
}
