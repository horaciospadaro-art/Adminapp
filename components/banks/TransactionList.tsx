'use client'

import { useState } from 'react'

interface BankTransaction {
    id: string
    date: string
    description: string
    reference: string
    amount: number
    type: 'DEBIT' | 'CREDIT'
    status: string
}

export function TransactionList({ transactions }: { transactions: BankTransaction[] }) {
    if (transactions.length === 0) {
        return (
            <div className="text-center py-12 text-gray-500">
                No hay movimientos registrados en esta cuenta.
            </div>
        )
    }

    return (
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-[#f4f5f8]">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Fecha</th>
                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Descripción</th>
                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Ref.</th>
                        <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Pagos (Salidas)</th>
                        <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Depósitos (Entradas)</th>
                        <th className="px-6 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Estado</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {transactions.map((tx) => {
                        const isDebit = tx.type === 'DEBIT' // Ingreso
                        const isCredit = tx.type === 'CREDIT' // Egreso

                        return (
                            <tr key={tx.id} className="hover:bg-gray-50 transaction-row">
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {new Date(tx.date).toLocaleDateString('es-VE')}
                                </td>
                                <td className="px-6 py-4 text-sm text-[#393a3d] font-medium">
                                    {tx.description}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {tx.reference || '-'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-mono text-gray-900">
                                    {isCredit ? Number(tx.amount).toLocaleString('es-VE', { minimumFractionDigits: 2 }) : ''}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-mono text-gray-900">
                                    {isDebit ? Number(tx.amount).toLocaleString('es-VE', { minimumFractionDigits: 2 }) : ''}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${tx.status === 'RECONCILED' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                        }`}>
                                        {tx.status === 'RECONCILED' ? 'R' : 'C'}
                                    </span>
                                </td>
                            </tr>
                        )
                    })}
                </tbody>
            </table>
        </div>
    )
}
