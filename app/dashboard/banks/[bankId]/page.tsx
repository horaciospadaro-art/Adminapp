import prisma from '@/lib/db'
import { BankTransactionForm } from '@/components/banks/BankTransactionForm'
import { notFound } from 'next/navigation'

async function getBankDetails(bankId: string) {
    const bank = await prisma.bankAccount.findUnique({
        where: { id: bankId },
        include: {
            gl_account: true,
            transactions: {
                orderBy: { date: 'desc' },
                include: { journal_entry: true }
            }
        }
    })
    return bank
}

export default async function BankDetailsPage({ params }: { params: { bankId: string } }) {
    const bank = await getBankDetails(params.bankId)

    if (!bank) return notFound()

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-white p-6 rounded shadow border-l-4 border-blue-600">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">{bank.bank_name}</h1>
                    <p className="text-gray-500">{bank.account_number} | {bank.gl_account.currency}</p>
                </div>
                <div className="text-right">
                    <p className="text-sm text-gray-500">Saldo Disponible</p>
                    <p className={`text-3xl font-bold ${Number(bank.gl_account.balance) < 0 ? 'text-red-500' : 'text-green-600'}`}>
                        {Number(bank.gl_account.balance).toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <div className="bg-white rounded shadow border border-gray-100 overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                            <h2 className="font-bold text-gray-800">Movimientos Recientes</h2>
                            <button className="text-sm text-blue-600 hover:underline">Conciliar</button>
                        </div>
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ref</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Concepto</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Monto</th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">IGTF</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {bank.transactions.map((tx: any) => (
                                    <tr key={tx.id}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {new Date(tx.date).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {tx.reference}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-900">
                                            {tx.description}
                                        </td>
                                        <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-mono ${tx.type === 'DEBIT' ? 'text-green-600' : 'text-red-600'}`}>
                                            {tx.type === 'DEBIT' ? '+' : '-'}{Number(tx.amount).toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-500">
                                            {tx.is_igtf_applied ? 'Sí' : '-'}
                                        </td>
                                    </tr>
                                ))}
                                {bank.transactions.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                                            No hay movimientos registrados
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div>
                    <BankTransactionForm bankAccountId={bank.id} />
                </div>
            </div>
        </div>
    )
}
