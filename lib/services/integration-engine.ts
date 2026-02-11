import { AccountingEngine, TransactionEvent } from './accounting-engine'
import { AccountMappingService, MappingKeys } from './account-mapping'
import { TaxService } from './tax-service'
import { InventoryService } from './inventory-service'
import prisma from '../db'

const accountingEngine = new AccountingEngine()
const accountMapping = new AccountMappingService()
const taxService = new TaxService()
const inventoryService = new InventoryService()

export enum EventType {
    INVOICE_APPROVED = 'INVOICE_APPROVED',
    PAYMENT_RECEIVED = 'PAYMENT_RECEIVED',
    PURCHASE_ORDER_RECEIVED = 'PURCHASE_ORDER_RECEIVED',
}

export type BusinessEvent = {
    type: EventType
    companyId: string
    payload: any // Dynamic payload based on event type
    date: Date
}

export class IntegrationEngine {

    async handleEvent(event: BusinessEvent) {
        console.log(`Processing event: ${event.type}`)

        switch (event.type) {
            case EventType.INVOICE_APPROVED:
                await this.handleInvoiceApproved(event)
                break
            case EventType.PURCHASE_ORDER_RECEIVED:
                await this.handlePurchaseReceived(event)
                break
            default:
                console.warn(`Unhandled event type: ${event.type}`)
        }
    }

    private async handleInvoiceApproved(event: BusinessEvent) {
        // Logic to convert Invoice to Journal Entry
        // Payload expected: { invoiceId, items: [{ sku, qty, price }], total, ... }
        const { items, thirdPartyName } = event.payload

        const lines = []

        // 1. Credit Sales Income (for each product) & Calculate Taxes
        let totalIncome = 0
        let totalIVA = 0

        for (const item of items) {
            // In a real scenario, we might optimize this with a single query or cache
            const product = await prisma.product.findUnique({
                where: { company_id_sku: { company_id: event.companyId, sku: item.sku } },
                include: { income_account: true, cogs_account: true, asset_account: true }
            })

            if (!product) throw new Error(`Product ${item.sku} not found`)

            // Validate Accounting Configuration
            if (!product.income_account) throw new Error(`Product ${product.name} missing Income Account`)
            if (!product.cogs_account) throw new Error(`Product ${product.name} missing COGS Account`)
            if (!product.asset_account) throw new Error(`Product ${product.name} missing Asset Account`)

            const amount = item.qty * item.price
            totalIncome += amount

            // Calculate IVA line per item or total (usually total, but for granularity we can do line)
            // Simplified: assuming all products have IVA. Real world needs Tax Code on Product.
            const iva = taxService.calculateIVA(amount)
            totalIVA += iva

            lines.push({
                accountCode: product.income_account.code,
                debit: 0,
                credit: amount,
                description: `Sale of ${product.name}`
            })

            // COGS Integration (Inventory)
            // When selling, we must reduce inventory and recognize Cost of Goods Sold
            // We need the current cost to credit inventory and debit COGS
            const costAmount = Number(product.avg_cost) * item.qty

            lines.push({
                accountCode: product.cogs_account.code,
                debit: costAmount,
                credit: 0,
                description: `COGS for ${product.name}`
            })

            lines.push({
                accountCode: product.asset_account.code, // Inventory Asset
                debit: 0,
                credit: costAmount,
                description: `Inventory reduction for ${product.name}`
            })

            // Update Stock (Decrease)
            await prisma.product.update({
                where: { id: product.id },
                data: { quantity_on_hand: { decrement: item.qty } }
            })
        }

        // 2. Debit Accounts Receivable (Client)
        // Use the mapping service to find the AR account
        const arAccountCode = await accountMapping.getAccountCode(event.companyId, MappingKeys.ACCOUNTS_RECEIVABLE_DEFAULT)
        const totalReceivable = totalIncome + totalIVA

        lines.push({
            accountCode: arAccountCode,
            debit: totalReceivable,
            credit: 0,
            description: `Invoice for ${thirdPartyName}`
        })

        // 3. Credit Fiscal Debit (IVA por Pagar)
        const ivaAccountCode = await accountMapping.getAccountCode(event.companyId, MappingKeys.TAX_IVA_DEBIT)
        lines.push({
            accountCode: ivaAccountCode,
            debit: 0,
            credit: totalIVA,
            description: `Fiscal Debit (IVA) for ${thirdPartyName}`
        })

        const transactionEvent: TransactionEvent = {
            companyId: event.companyId,
            date: event.date,
            description: `Invoice Approved - ${thirdPartyName}`,
            lines: lines
        }

        await accountingEngine.createJournalEntry(transactionEvent, 'C')
    }

    private async handlePurchaseReceived(event: BusinessEvent) {
        // Logic for Inventory Purchase
        const { items, supplierName } = event.payload
        // Iterates items, calls inventoryService.processPurchase(), generates Journal Entry (Debit Asset / Credit Payable)
    }
}
