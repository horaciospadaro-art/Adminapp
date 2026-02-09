'use client'

import { PageHeader } from '@/components/ui/PageHeader'
import { SummaryCards } from '@/components/ui/SummaryCards'
import { TransactionList } from '@/components/banks/TransactionList'
import { BankTransactionForm } from '@/components/banks/BankTransactionForm'

type BankAccount = {
    id: string
    bank_name: string
    account_number: string
    currency: string
    type: string
    balance: number
    transactions: any[]
}

export function BankDetailsClient({ bank, accounts, taxes }: { bank: BankAccount, accounts: any[], taxes?: any[] }) {
    return (
        <div className="min-h-screen space-y-6">
            <PageHeader
                title={bank.bank_name}
                description={`${bank.type} • ${bank.account_number} • ${bank.currency}`}
                backHref="/dashboard/banks"
            />

            <SummaryCards cards={[
                {
                    title: 'Saldo en Libros',
                    amount: `${bank.currency} ${Number(bank.balance).toLocaleString('es-VE', { minimumFractionDigits: 2 })}`,
                    subtitle: 'Saldo actual registrado',
                    color: Number(bank.balance) >= 0 ? 'green' : 'orange'
                },
                {
                    title: 'Movimientos',
                    amount: bank.transactions.length.toString(),
                    subtitle: 'Total registros',
                    color: 'blue'
                },
                {
                    title: 'Conciliación',
                    amount: 'Pendiente',
                    subtitle: 'Última: Nunca',
                    color: 'orange'
                }
            ]} />

            {/* New Transaction Form */}
            <BankTransactionForm bankAccount={bank} />

            {/* Transaction History */}
            <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-[#393a3d]">Historial de Movimientos</h3>
                </div>
                <TransactionList transactions={bank.transactions} />
            </div>
        </div>
    )
}
