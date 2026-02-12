'use client'

import { deleteJournalEntry } from '@/lib/actions/journal-actions'
import { Trash2 } from 'lucide-react'
import { useState } from 'react'

export function DeleteEntryButton({ id, entryNumber }: { id: string, entryNumber: string }) {
    const [isDeleting, setIsDeleting] = useState(false)

    const handleDelete = async () => {
        if (!confirm(`¿Estás seguro de que deseas eliminar el asiento ${entryNumber}? Esta acción no se puede deshacer.`)) {
            return
        }

        setIsDeleting(true)
        try {
            const res = await deleteJournalEntry(id)
            if (!res.success) {
                alert('Error al eliminar: ' + res.error)
            }
        } catch (error) {
            alert('Error al eliminar el asiento')
        } finally {
            setIsDeleting(false)
        }
    }

    return (
        <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50 transition-colors disabled:opacity-50"
            title="Eliminar Asiento"
        >
            <Trash2 className="w-4 h-4" />
        </button>
    )
}
