import prisma from '@/lib/db'
import { AccountType } from '@prisma/client'

export type ReportType = 'trial_balance' | 'income_statement' | 'balance_sheet'

export interface FinancialRow {
    id: string
    code: string
    name: string
    value: number
    level: number
    type: 'HEADER' | 'ACCOUNT' | 'TOTAL'
    isNegative?: boolean
}

export class ReportService {

    static async getFinancialData(
        reportType: ReportType,
        startDate: string,
        endDate: string
    ): Promise<{ rows: FinancialRow[], title: string }> {

        // 1. Fetch Accounts
        const accounts = await prisma.chartOfAccount.findMany({
            orderBy: { code: 'asc' }
        })

        // 2. Fetch Aggregated Lines
        let queryStart = startDate
        // For Balance Sheet, we need cumulative balance from the beginning of time
        // or up to the endDate if no start date relevant (though traditionally it's a point in time).
        // However, in this system, since we calculate from journal lines, we need from start.
        if (reportType === 'balance_sheet') {
            queryStart = '1900-01-01'
        }

        const aggregations = await prisma.$queryRaw<
            { account_id: string; debit: number; credit: number }[]
        >`
            SELECT 
                jl.account_id, 
                SUM(jl.debit) as debit, 
                SUM(jl.credit) as credit
            FROM "JournalLine" jl
            JOIN "JournalEntry" je ON jl.entry_id = je.id
            WHERE je.date >= ${new Date(queryStart)} AND je.date <= ${new Date(endDate)}
            GROUP BY jl.account_id
        `

        // Map to dictionary for fast lookup
        const balanceMap = new Map<string, { debit: number; credit: number }>()
        aggregations.forEach((row: any) => {
            balanceMap.set(row.account_id, {
                debit: Number(row.debit),
                credit: Number(row.credit)
            })
        })

        // 3. Process Data based on Report Type
        let rows: FinancialRow[] = []
        let title = ''

        if (reportType === 'trial_balance') {
            title = 'Balance de Comprobación'
            return this.generateTrialBalance(accounts, balanceMap, aggregations)
        } else if (reportType === 'income_statement') {
            title = 'Estado de Resultados (Ganancias y Pérdidas)'
            return this.generateIncomeStatement(accounts, balanceMap)
        } else if (reportType === 'balance_sheet') {
            title = 'Balance General'
            return this.generateBalanceSheet(accounts, balanceMap)
        }

        return { rows, title }
    }

    private static generateTrialBalance(
        accounts: any[],
        balanceMap: Map<string, { debit: number, credit: number }>,
        aggregations: any[]
    ): { rows: FinancialRow[], title: string } {
        const rows = accounts.map(acc => {
            const bal = balanceMap.get(acc.id) || { debit: 0, credit: 0 }
            const net = bal.debit - bal.credit
            return {
                id: acc.id,
                code: acc.code,
                name: acc.name,
                level: acc.code.split('.').length,
                type: 'ACCOUNT',
                value: net,
                isNegative: net < 0
            } as FinancialRow
        }).filter(r => r.value !== 0)

        const totalDebit = aggregations.reduce((s, r: any) => s + Number(r.debit), 0)
        const totalCredit = aggregations.reduce((s, r: any) => s + Number(r.credit), 0)

        rows.push({
            id: 'total',
            code: '',
            name: 'TOTAL (Debe - Haber)',
            level: 1,
            type: 'TOTAL',
            value: totalDebit - totalCredit
        })

        return { rows, title: 'Balance de Comprobación' }
    }

    private static generateIncomeStatement(
        accounts: any[],
        balanceMap: Map<string, { debit: number, credit: number }>
    ): { rows: FinancialRow[], title: string } {
        // Revenue (Ingresos) are Credit normal, so multiplier -1 to show positive
        const revenue = this.processSection(accounts, balanceMap, [AccountType.INCOME], -1)
        // Expenses (Gastos) are Debit normal, so multiplier 1
        const costs = this.processSection(accounts, balanceMap, [AccountType.COST, AccountType.EXPENSE], 1)

        const grossProfit = revenue.total - costs.total

        const rows: FinancialRow[] = [
            { id: 'h_rev', code: '', name: 'INGRESOS', value: 0, level: 1, type: 'HEADER' },
            ...revenue.rows,
            { id: 't_rev', code: '', name: 'Total Ingresos', value: revenue.total, level: 1, type: 'TOTAL' },

            { id: 'h_exp', code: '', name: 'COSTOS Y GASTOS', value: 0, level: 1, type: 'HEADER' },
            ...costs.rows,
            { id: 't_exp', code: '', name: 'Total Costos y Gastos', value: costs.total, level: 1, type: 'TOTAL' },

            { id: 't_net', code: '', name: 'UTILIDAD / PÉRDIDA DEL EJERCICIO', value: grossProfit, level: 1, type: 'TOTAL' }
        ]

        return { rows, title: 'Estado de Resultados' }
    }

    private static generateBalanceSheet(
        accounts: any[],
        balanceMap: Map<string, { debit: number, credit: number }>
    ): { rows: FinancialRow[], title: string } {
        // Assets: Debit normal -> 1
        const assets = this.processSection(accounts, balanceMap, [AccountType.ASSET], 1)
        // Liabilities: Credit normal -> -1
        const liabilities = this.processSection(accounts, balanceMap, [AccountType.LIABILITY], -1)
        // Equity: Credit normal -> -1
        const equity = this.processSection(accounts, balanceMap, [AccountType.EQUITY], -1)

        const result = assets.total - liabilities.total - equity.total

        const rows: FinancialRow[] = [
            { id: 'h_asset', code: '', name: 'ACTIVOS', value: 0, level: 1, type: 'HEADER' },
            ...assets.rows,
            { id: 't_asset', code: '', name: 'Total Activos', value: assets.total, level: 1, type: 'TOTAL' },

            { id: 'h_liab', code: '', name: 'PASIVOS', value: 0, level: 1, type: 'HEADER' },
            ...liabilities.rows,
            { id: 't_liab', code: '', name: 'Total Pasivos', value: liabilities.total, level: 1, type: 'TOTAL' },

            { id: 'h_eq', code: '', name: 'PATRIMONIO', value: 0, level: 1, type: 'HEADER' },
            ...equity.rows,
            { id: 'res_eq', code: '', name: 'Resultado del Periodo (Calculado)', value: result, level: 2, type: 'ACCOUNT' },
            { id: 't_eq', code: '', name: 'Total Patrimonio', value: equity.total + result, level: 1, type: 'TOTAL' },

            { id: 't_check', code: '', name: 'Control (Activo - Pasivo - Patrimonio)', value: assets.total - (liabilities.total + equity.total + result), level: 1, type: 'TOTAL' }
        ]

        return { rows, title: 'Balance General' }
    }

    private static processSection(
        accounts: any[],
        balanceMap: Map<string, { debit: number, credit: number }>,
        types: AccountType[],
        signMultiplier: number
    ) {
        const filtered = accounts.filter(a => types.includes(a.type))
        const rows = filtered.map(acc => {
            const bal = balanceMap.get(acc.id) || { debit: 0, credit: 0 }
            const net = (bal.debit - bal.credit) * signMultiplier
            return {
                id: acc.id,
                code: acc.code,
                name: acc.name,
                level: acc.code.split('.').length,
                type: 'ACCOUNT',
                value: net
            } as FinancialRow
        }).filter(r => r.value !== 0)

        const total = rows.reduce((s, r) => s + r.value, 0)
        return { rows, total }
    }
}
