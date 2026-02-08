import { JournalEntryForm } from '@/components/accounting/JournalEntryForm'
import { AccountForm } from '@/components/accounting/AccountForm'
import { AccountTree } from '@/components/accounting/AccountTree'
import prisma from '@/lib/db'

async function getDemoCompanyId() {
    const company = await prisma.company.findFirst()
    return company?.id || ''
}

export default async function AccountingPage() {
    const companyId = await getDemoCompanyId()

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-800">Contabilidad</h1>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Columna Izquierda: Gestión de Cuentas */}
                <div className="space-y-6">
                    <AccountForm companyId={companyId} />
                    <AccountTree companyId={companyId} />
                </div>

                {/* Columna Derecha: Asientos y Operaciones */}
                <div className="space-y-6">
                    <JournalEntryForm companyId={companyId} />

                    {/* Recent Entries List - Placeholder */}
                    <div className="bg-white p-6 rounded shadow border border-gray-100">
                        <h2 className="text-lg font-bold mb-4">Asientos Recientes</h2>
                        <p className="text-gray-500 text-sm">Las transacciones recientes aparecerán aquí...</p>
                    </div>
                </div>
            </div>
        </div>
    )
}
