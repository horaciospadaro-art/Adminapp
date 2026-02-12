import { getJournalEntryById } from '@/lib/actions/journal-actions'
import { JournalEntryForm } from '@/components/accounting/JournalEntryForm'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default async function EditJournalEntryPage({ params }: { params: { id: string } }) {
    const entry = await getJournalEntryById(params.id)

    if (!entry) {
        notFound()
    }

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
                {/* @ts-ignore */}
                <h1 className="text-2xl font-bold text-gray-800">Editar Asiento {entry.number}</h1>
            </div>

            <JournalEntryForm
                companyId={entry.company_id}
                initialData={entry}
                entryId={entry.id}
            />
        </div>
    )
}
