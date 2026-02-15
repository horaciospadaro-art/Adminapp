import Link from 'next/link'
import prisma from '@/lib/db'
import { PageHeader } from '@/components/ui/PageHeader'
import { SummaryCards } from '@/components/ui/SummaryCards'
import { BankCard } from '@/components/banks/BankCard'

export const dynamic = 'force-dynamic'

async function getBankAccounts() {
    return await prisma.bankAccount.findMany({
        orderBy: { created_at: 'desc' }
    })
}

export default async function BanksPage() {
    const banks = await getBankAccounts()

    // Calculate totals
    // Calculate totals
    const totalBalance = banks.reduce((sum: number, bank: any) => sum + Number((bank as any).balance), 0)

    // We could format this per currency, but for summary cards we'll simplify for now
    // or just show main currency metrics.

    return (
        <div className="min-h-screen">
            <PageHeader
                title="Bancos y Caja"
                actionLabel="Nueva Cuenta"
                actionHref="/dashboard/banks/new"
            />

            <SummaryCards cards={[
                { title: 'Saldo Total', amount: `VEF ${totalBalance.toLocaleString('es-VE')}`, subtitle: 'En todas las cuentas', color: 'green' },
                { title: 'Cuentas Activas', amount: banks.length.toString(), subtitle: 'Bancos registrados', color: 'blue' },
                { title: 'Movimientos', amount: '0', subtitle: 'Últimos 30 días', color: 'orange' } // Placeholder logic
            ]} />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {banks.map((bank: any) => {
                    const b = bank as any
                    return (
                        <BankCard key={b.id} bank={{
                            ...b,
                            balance: Number(b.balance)
                        }} />
                    )
                })}

                {banks.length === 0 && (
                    <div className="col-span-full text-center py-16 bg-white rounded-lg border-2 border-dashed border-gray-300">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="text-2xl text-gray-400">🏦</span>
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-1">No hay cuentas bancarias</h3>
                        <p className="text-gray-500 mb-6">Comience registrando su primera cuenta bancaria o caja chica.</p>
                        <Link
                            href="/dashboard/banks/new"
                            className="bg-[#2ca01c] text-white px-6 py-2 rounded-full font-medium hover:bg-[#248217] transition-colors"
                        >
                            Crear Cuenta
                        </Link>
                    </div>
                )}
            </div>
        </div>
    )
}
