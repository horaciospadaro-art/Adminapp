'use client'

import { useState } from 'react'
import { PageHeader } from '@/components/ui/PageHeader'
import { SummaryCards } from '@/components/ui/SummaryCards'
import { TransactionList } from '@/components/banks/TransactionList'
import { NewTransactionModal } from '@/components/banks/NewTransactionModal'

export function BankDetailsClient({ bank, accounts, taxes }: { bank: any, accounts: any[], taxes?: any[] }) {
    const [isModalOpen, setIsModalOpen] = useState(false)

    return (
        <div className="min-h-screen">
            <PageHeader
                title={bank.bank_name}
                description={`${bank.type} • ${bank.account_number} • ${bank.currency}`}
                actionLabel="Registrar Movimiento"
                onAction={() => setIsModalOpen(true)}
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

            <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-[#393a3d]">Historial de Movimientos</h3>
                </div>
                <TransactionList transactions={bank.transactions} />
            </div>

            <NewTransactionModal
                bankId={bank.id}
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                accounts={accounts}
                taxes={taxes || []}
            />
        </div>
    )
}
