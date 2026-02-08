import { JournalEntryForm } from '@/components/accounting/JournalEntryForm'

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

            {/* Journal Entry Form */}
            <JournalEntryForm companyId={companyId} />

            {/* Recent Entries List - Placeholder */}
            <div className="bg-white p-6 rounded shadow border border-gray-100">
                <h2 className="text-lg font-bold mb-4">Asientos Recientes</h2>
                <p className="text-gray-500 text-sm">Las transacciones recientes aparecerán aquí...</p>
            </div>
        </div>
    )
}
