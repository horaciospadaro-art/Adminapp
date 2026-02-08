import prisma from '@/lib/db'
import { ReportSelector } from '@/components/reports/ReportSelector'
import { DateRangePicker } from '@/components/reports/DateRangePicker'
import { FinancialTable, FinancialRow } from '@/components/reports/FinancialTable'
import { AccountType } from '@prisma/client'

// Tipos de Reporte
type ReportType = 'trial_balance' | 'income_statement' | 'balance_sheet'

interface PageProps {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

async function getFinancialData(
    reportType: ReportType,
    startDate: string,
    endDate: string
): Promise<{ rows: FinancialRow[], title: string }> {

    // 1. Fetch Accounts
    const accounts = await prisma.chartOfAccount.findMany({
        orderBy: { code: 'asc' }
    })

    // 2. Fetch Aggregated Lines
    // Use raw query for date filtering on joined table
    // For Balance Sheet, we need cumulative balance (from start of time), 
    // but for P&L we need movement in period.

    let queryStart = startDate
    if (reportType === 'balance_sheet') {
        // Balance Sheet is cumulative. Start date strictly implies "from beginning" 
        // effectively, but typically we want balance AT endDate.
        // However, standard P&L is "Over period".
        // Let's assume for BS we sum everything <= endDate.
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
        JOIN "JournalEntry" je ON jl.journal_entry_id = je.id
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
        rows = accounts.map(acc => {
            const bal = balanceMap.get(acc.id) || { debit: 0, credit: 0 }
            const net = bal.debit - bal.credit
            // Show only if there's movement or balance
            // Actually Trial Balance shows Debit and Credit sums usually.
            // Let's simplified version: Net Balance? 
            // Standard Trial Balance has 2 columns: Debit Balance | Credit Balance
            // My FinancialTable has 1 value column. Let's show Net Balance.
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

        // Add Totals
        const totalDebit = aggregations.reduce((s, r: any) => s + Number(r.debit), 0)
        const totalCredit = aggregations.reduce((s, r: any) => s + Number(r.credit), 0)

        // In a perfect double-entry system, totalDebit should equal totalCredit.
        // Net balance sum should be 0.
        rows.push({
            id: 'total',
            code: '',
            name: 'TOTAL (Debe - Haber)',
            level: 1,
            type: 'TOTAL',
            value: totalDebit - totalCredit
        })

    } else if (reportType === 'income_statement') {
        title = 'Estado de Resultados (Ganancias y Pérdidas)'
        // INGRESOS (Credit normal), COSTOS (Debit normal), GASTOS (Debit normal)

        // Revenue (Ingresos)
        const revenue = processSection(accounts, balanceMap, [AccountType.INCOME], -1) // Invert sign for Credit accounts to match UI "Positive is good" usually?
        // Actually, Revenue is Credit. If we show it positive, we need to invert (Credit - Debit).
        // My balance calculation is (Debit - Credit). So Revenue will be negative.
        // Let's multiply by -1 to show positive Revenue.

        const costs = processSection(accounts, balanceMap, [AccountType.COST, AccountType.EXPENSE], 1) // Debit normal, show positive.

        const grossProfit = revenue.total - costs.total

        rows = [
            { id: 'h_rev', code: '', name: 'INGRESOS', value: 0, level: 1, type: 'HEADER' },
            ...revenue.rows,
            { id: 't_rev', code: '', name: 'Total Ingresos', value: revenue.total, level: 1, type: 'TOTAL' },

            { id: 'h_exp', code: '', name: 'COSTOS Y GASTOS', value: 0, level: 1, type: 'HEADER' },
            ...costs.rows,
            { id: 't_exp', code: '', name: 'Total Costos y Gastos', value: costs.total, level: 1, type: 'TOTAL' },

            { id: 't_net', code: '', name: 'UTILIDAD / PÉRDIDA DEL EJERCICIO', value: grossProfit, level: 1, type: 'TOTAL' }
        ]

    } else if (reportType === 'balance_sheet') {
        title = 'Balance General'
        // ACTIVO (Debit), PASIVO (Credit), PATRIMONIO (Credit)

        const assets = processSection(accounts, balanceMap, [AccountType.ASSET], 1)
        const liabilities = processSection(accounts, balanceMap, [AccountType.LIABILITY], -1)
        const equity = processSection(accounts, balanceMap, [AccountType.EQUITY], -1) // Excluding Current Year Earnings

        // Calculate Current Year Earnings (Revenue - Expenses from P&L logic) manually?
        // We need to calculate Net Income for the period to balance the sheet?
        // Actually, Balance Sheet should theoretically sum to 0 if we include Equity.
        // Assets - Liabilities - Equity = 0.
        // But "Equity" in DB might not include the current year retained earnings.
        // We usually calculate "Resultado del Ejercicio" as a plug.

        const result = assets.total - liabilities.total - equity.total

        rows = [
            { id: 'h_asset', code: '', name: 'ACTIVOS', value: 0, level: 1, type: 'HEADER' },
            ...assets.rows,
            { id: 't_asset', code: '', name: 'Total Activos', value: assets.total, level: 1, type: 'TOTAL' },

            { id: 'h_liab', code: '', name: 'PASIVOS', value: 0, level: 1, type: 'HEADER' },
            ...liabilities.rows,
            { id: 't_liab', code: '', name: 'Total Pasivos', value: liabilities.total, level: 1, type: 'TOTAL' },

            { id: 'h_eq', code: '', name: 'PATRIMONIO', value: 0, level: 1, type: 'HEADER' },
            ...equity.rows,
            { id: 'res_eq', code: '', name: 'Resultado Acumulado (Calculado)', value: result, level: 2, type: 'ACCOUNT' },
            { id: 't_eq', code: '', name: 'Total Patrimonio', value: equity.total + result, level: 1, type: 'TOTAL' },

            { id: 't_check', code: '', name: 'Control (Activo - Pasivo - Patrimonio)', value: assets.total - (liabilities.total + equity.total + result), level: 1, type: 'TOTAL' }
        ]
    }

    return { rows, title }
}

function processSection(
    accounts: any[],
    balanceMap: Map<string, { debit: number, credit: number }>,
    types: AccountType[],
    signMultiplier: number
) {
    const filtered = accounts.filter(a => types.includes(a.type))
    const rows = filtered.map(acc => {
        const bal = balanceMap.get(acc.id) || { debit: 0, credit: 0 }
        // Net = (Debit - Credit) * Multiplier
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

export default async function ReportsPage(props: PageProps) {
    const searchParams = await props.searchParams;
    const reportType = (searchParams.report as ReportType) || 'trial_balance'

    // Default dates: Current Month
    const now = new Date()
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]

    const startDate = (searchParams.start as string) || firstDay
    const endDate = (searchParams.end as string) || lastDay

    const data = await getFinancialData(reportType, startDate, endDate)

    async function navigate(path: string) {
        'use server'
        // Note: Server Actions can't strictly navigate client-side router easily without hacks or `redirect` which reloads.
        // Better to use Client Component wrapper for the filters that pushes to router.
        // We'll pass the params to Client Components and let them drive navigation.
    }

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-800">Reportes Financieros</h1>

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                {/* Client Component Controls */}
                <ControlsWrapper
                    currentReport={reportType}
                    startDate={startDate}
                    endDate={endDate}
                />
            </div>

            <FinancialTable rows={data.rows} title={data.title} />
        </div>
    )
}

// Client Wrapper for interactivity
import { ControlsWrapper } from './ControlsWrapper'
