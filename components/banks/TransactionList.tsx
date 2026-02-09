'use client'

interface BankTransaction {
    id: string
    date: string
    description: string
    reference: string
    amount: number
    type: 'DEBIT' | 'CREDIT'
    subtype?: string
    status: string
    is_igtf_applied?: boolean
    igtf_amount?: number
}

const subtypeLabels: Record<string, string> = {
    'DEPOSIT': 'Depósito',
    'WITHDRAWAL': 'Retiro',
    'TRANSFER_OUT': 'Transf. Enviada',
    'TRANSFER_IN': 'Transf. Recibida',
    'DEBIT_NOTE': 'N/D',
    'CREDIT_NOTE': 'N/C',
    'OTHER': ''
}

const subtypeColors: Record<string, string> = {
    'DEPOSIT': 'bg-green-100 text-green-700',
    'WITHDRAWAL': 'bg-red-100 text-red-700',
    'TRANSFER_OUT': 'bg-blue-100 text-blue-700',
    'TRANSFER_IN': 'bg-blue-100 text-blue-700',
    'DEBIT_NOTE': 'bg-purple-100 text-purple-700',
    'CREDIT_NOTE': 'bg-orange-100 text-orange-700',
    'OTHER': 'bg-gray-100 text-gray-700'
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
                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Tipo</th>
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
                        const subtype = tx.subtype || 'OTHER'

                        return (
                            <tr key={tx.id} className="hover:bg-gray-50 transaction-row">
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {new Date(tx.date).toLocaleDateString('es-VE')}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    {subtypeLabels[subtype] && (
                                        <span className={`px-2 py-1 text-xs font-semibold rounded ${subtypeColors[subtype]}`}>
                                            {subtypeLabels[subtype]}
                                        </span>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-sm text-[#393a3d]">
                                    <div className="font-medium">{tx.description}</div>
                                    {tx.is_igtf_applied && tx.igtf_amount && tx.igtf_amount > 0 && (
                                        <div className="text-xs text-yellow-600 mt-1">
                                            + IGTF: {Number(tx.igtf_amount).toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                                        </div>
                                    )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {tx.reference || '-'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-mono font-semibold text-red-600">
                                    {isCredit ? Number(tx.amount).toLocaleString('es-VE', { minimumFractionDigits: 2 }) : ''}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-mono font-semibold text-green-600">
                                    {isDebit ? Number(tx.amount).toLocaleString('es-VE', { minimumFractionDigits: 2 }) : ''}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${tx.status === 'RECONCILED'
                                            ? 'bg-green-100 text-green-800'
                                            : tx.status === 'PENDING'
                                                ? 'bg-yellow-100 text-yellow-800'
                                                : 'bg-gray-100 text-gray-800'
                                        }`}>
                                        {tx.status === 'RECONCILED' ? 'Conciliado' : tx.status === 'PENDING' ? 'Pendiente' : tx.status}
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
