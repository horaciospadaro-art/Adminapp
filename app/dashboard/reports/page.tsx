import prisma from '@/lib/db'
import { ChartOfAccount } from '@prisma/client'

async function getTrialBalance() {
    // Group lines by account, sum debits and credits
    // Prisma doesn't support complex groupBy with relations easily in one go for balance calculation *per account* if we want hierarchy
    // For MVP: Fetch all accounts, and fetch summed lines for each.

    // 1. Fetch Accounts
    const accounts = await prisma.chartOfAccount.findMany({
        orderBy: { code: 'asc' }
    })

    // 2. Fetch Aggregated Balances
    const balances = await prisma.journalLine.groupBy({
        by: ['account_id'],
        _sum: {
            debit: true,
            credit: true
        }
    })

    // 3. Merge
    const report = accounts.map((acc: ChartOfAccount) => {
        const bal = balances.find(b => b.account_id === acc.id)
        const debit = Number(bal?._sum.debit || 0)
        const credit = Number(bal?._sum.credit || 0)
        return {
            ...acc,
            debit,
            credit,
            balance: debit - credit // Asset nature: Debit positive. Liability: Credit positive (handled in UI or logic)
        }
    }).filter(a => a.debit !== 0 || a.credit !== 0) // Only show active accounts

    return report
}

export default async function ReportsPage() {
    const trialBalance = await getTrialBalance()
    const totalDebit = trialBalance.reduce((s, a) => s + a.debit, 0)
    const totalCredit = trialBalance.reduce((s, a) => s + a.credit, 0)

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-800">Reportes Financieros</h1>

            <div className="bg-white p-6 rounded shadow border border-gray-100">
                <h2 className="text-lg font-bold mb-4">Balance de Comprobación</h2>

                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 text-sm">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Código</th>
                                <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Cuenta</th>
                                <th className="px-6 py-3 text-right font-medium text-gray-500 uppercase tracking-wider">Debe</th>
                                <th className="px-6 py-3 text-right font-medium text-gray-500 uppercase tracking-wider">Haber</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {trialBalance.map((row) => (
                                <tr key={row.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-gray-900">{row.code}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-gray-900">{row.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-gray-600">{row.debit.toFixed(2)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-gray-600">{row.credit.toFixed(2)}</td>
                                </tr>
                            ))}
                            <tr className="bg-gray-50 font-bold">
                                <td colSpan={2} className="px-6 py-4 text-right">Totales</td>
                                <td className="px-6 py-4 text-right">{totalDebit.toFixed(2)}</td>
                                <td className="px-6 py-4 text-right">{totalCredit.toFixed(2)}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
