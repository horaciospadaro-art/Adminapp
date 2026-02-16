import { getJournalEntryById, getJournalEntryRepairIvaInfo } from '@/lib/actions/journal-actions'
import { JournalEntryForm } from '@/components/accounting/JournalEntryForm'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

/** Serializa el asiento para pasarlo al Client Component (evita Date y Decimal no serializables en RSC). */
function serializeEntry(entry: Awaited<ReturnType<typeof getJournalEntryById>>) {
    if (!entry) return null
    return {
        id: entry.id,
        company_id: entry.company_id,
        number: entry.number ?? undefined,
        date: entry.date.toISOString().slice(0, 10),
        description: entry.description ?? '',
        lines: (entry.lines ?? []).map((l) => ({
            id: l.id,
            account_id: l.account_id,
            debit: l.debit.toString(),
            credit: l.credit.toString(),
            description: l.description ?? ''
        }))
    }
}

export default async function EditJournalEntryPage({
    params
}: {
    params: Promise<{ id: string }> | { id: string }
}) {
    const { id } = await Promise.resolve(params)
    const entry = await getJournalEntryById(id)

    if (!entry) {
        notFound()
    }

    const initialData = serializeEntry(entry)
    const repairIvaInfo = await getJournalEntryRepairIvaInfo(entry.id)
    const repairIvaOffer =
        repairIvaInfo.canRepair && repairIvaInfo.amount != null && repairIvaInfo.accountId
            ? { amount: repairIvaInfo.amount, accountId: repairIvaInfo.accountId }
            : null

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Link
                    href="/dashboard/accounting/reports/entries"
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    title="Volver al listado"
                >
                    <ArrowLeft className="w-6 h-6 text-gray-600" />
                </Link>
                <h1 className="text-2xl font-bold text-gray-800">Editar Asiento {entry.number ?? id}</h1>
            </div>

            <JournalEntryForm
                companyId={entry.company_id}
                initialData={initialData ?? undefined}
                entryId={entry.id}
                repairIvaOffer={repairIvaOffer}
            />
        </div>
    )
}
