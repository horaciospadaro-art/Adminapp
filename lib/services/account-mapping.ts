import prisma from '../db'

export enum MappingKeys {
    ACCOUNTS_RECEIVABLE_DEFAULT = 'ACCOUNTS_RECEIVABLE_DEFAULT',
    ACCOUNTS_PAYABLE_DEFAULT = 'ACCOUNTS_PAYABLE_DEFAULT',
    TAX_IVA_DEBIT = 'TAX_IVA_DEBIT',
    TAX_IVA_CREDIT = 'TAX_IVA_CREDIT',
    IGTF_EXPENSE = 'IGTF_EXPENSE',
}

export class AccountMappingService {

    /**
     * Resolves an account code for a given key and company.
     * In a real app, this would look up a 'Settings' or 'Mappings' table.
     * For now, we return default Venezuelan chart codes or mock values.
     */
    async getAccountCode(companyId: string, key: MappingKeys): Promise<string> {
        // TODO: Implement database lookup for dynamic configuration

        switch (key) {
            case MappingKeys.ACCOUNTS_RECEIVABLE_DEFAULT:
                return '1.1.01.02' // Mock: Using Bank as placeholder for AR if AR not in seed
            case MappingKeys.ACCOUNTS_PAYABLE_DEFAULT:
                return '2.1.01' // Cuentas por Pagar
            case MappingKeys.TAX_IVA_DEBIT:
                return '2.1.02' // Debito Fiscal (Liability - Sales)
            case MappingKeys.TAX_IVA_CREDIT:
                return '1.1.02' // Credito Fiscal (Asset - Purchases)
            case MappingKeys.IGTF_EXPENSE:
                return '6.1.99' // IGTF Expense
            default:
                throw new Error(`Mapping key ${key} not configured.`)
        }
    }

    /**
     * Resolves income account for a product.
     * Fallback to category or default if product specific is missing (though our schema enforces it)
     */
    async getProductIncomeAccount(companyId: string, sku: string): Promise<string> {
        const product = await prisma.product.findUnique({
            where: { company_id_sku: { company_id: companyId, sku } },
            include: { income_account: true }
        })

        if (!product) throw new Error(`Product ${sku} not found`)
        if (!product.income_account) throw new Error(`Product ${sku} has no income account assigned`)
        return product.income_account.code
    }
}
