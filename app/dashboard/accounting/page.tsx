import { Suspense } from 'react'
import Link from 'next/link'
import { JournalEntryForm } from '@/components/accounting/JournalEntryForm'
import { RecentEntries } from '@/components/accounting/RecentEntries'

import prisma from '@/lib/db'

import { getPersistentCompanyId } from '@/lib/company-utils'

export default async function AccountingPage() {
    const companyId = await getPersistentCompanyId()

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-800">Contabilidad</h1>

            {/* Reports Navigation */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Link href="/dashboard/accounting/reports/journal" className="block p-6 bg-white border border-gray-200 rounded-lg shadow hover:bg-gray-50 transition-colors">
                    <h5 className="mb-2 text-xl font-bold tracking-tight text-gray-900">Diario Legal</h5>
                    <p className="font-normal text-gray-700">Visualizar asientos por mes en formato legal.</p>
                </Link>
                <Link href="/dashboard/accounting/reports/ledger" className="block p-6 bg-white border border-gray-200 rounded-lg shadow hover:bg-gray-50 transition-colors">
                    <h5 className="mb-2 text-xl font-bold tracking-tight text-gray-900">Mayor Analítico</h5>
                    <p className="font-normal text-gray-700">Detalle de movimientos y saldos por cuenta.</p>
                </Link>
                <Link href="/dashboard/accounting/reports/entries" className="block p-6 bg-white border border-gray-200 rounded-lg shadow hover:bg-gray-50 transition-colors">
                    <h5 className="mb-2 text-xl font-bold tracking-tight text-gray-900">Listado de Asientos</h5>
                    <p className="font-normal text-gray-700">Consulta cronológica de todos los asientos.</p>
                </Link>
            </div>

            {/* Journal Entry Form */}
            <JournalEntryForm companyId={companyId} />

            {/* Recent Entries List */}
            <Suspense fallback={<div>Cargando asientos...</div>}>
                <RecentEntries companyId={companyId} />
            </Suspense>
        </div>
    )
}
