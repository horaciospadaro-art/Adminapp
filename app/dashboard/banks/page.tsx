import Link from 'next/link'
import prisma from '@/lib/db'

async function getBankAccounts() {
    const banks = await prisma.bankAccount.findMany({
        include: {
            gl_account: true // Include GL Account to show current accounting balance
        }
    })
    return banks
}

export default async function BanksPage() {
    const banks = await getBankAccounts()

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-800">Bancos y Caja</h1>
                <Link
                    href="/dashboard/banks/new"
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
                >
                    + Nueva Cuenta
                </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {banks.map((bank) => (
                    <div key={bank.id} className="bg-white p-6 rounded shadow border border-gray-100 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="font-bold text-lg text-gray-800">{bank.bank_name}</h3>
                                <p className="text-sm text-gray-500">{bank.account_number}</p>
                            </div>
                            <span className="bg-gray-100 text-gray-600 text-xs font-mono px-2 py-1 rounded">
                                {bank.gl_account.currency || 'VES'}
                            </span>
                        </div>

                        <div className="mb-4">
                            <p className="text-xs text-gray-500 uppercase tracking-wide">Saldo Contable</p>
                            <p className={`text-2xl font-bold ${Number(bank.gl_account.balance) < 0 ? 'text-red-500' : 'text-green-600'}`}>
                                {Number(bank.gl_account.balance).toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                            </p>
                        </div>

                        <div className="flex gap-2">
                            <Link
                                href={`/dashboard/banks/${bank.id}`}
                                className="flex-1 text-center bg-gray-50 text-gray-700 border border-gray-200 py-2 rounded hover:bg-gray-100 text-sm font-medium"
                            >
                                Ver Movimientos
                            </Link>
                        </div>
                    </div>
                ))}

                {banks.length === 0 && (
                    <div className="col-span-full text-center py-12 bg-white rounded border border-dashed border-gray-300">
                        <p className="text-gray-500 mb-2">No hay cuentas bancarias registradas.</p>
                        <Link href="/dashboard/banks/new" className="text-blue-600 hover:underline">
                            Crear la primera cuenta
                        </Link>
                    </div>
                )}
            </div>
        </div>
    )
}
