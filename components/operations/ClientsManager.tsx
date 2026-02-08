'use client'

import { useState } from 'react'
import { ClientForm } from '@/components/operations/ClientForm'
import { ClientList } from '@/components/operations/ClientList'

export function ClientsManager({ companyId }: { companyId: string }) {
    const [editingClient, setEditingClient] = useState<any | null>(null)
    const [isFormOpen, setIsFormOpen] = useState(false)
    const [refreshKey, setRefreshKey] = useState(0)

    const handleEdit = (client: any) => {
        setEditingClient(client)
        setIsFormOpen(true)
    }

    const handleSuccess = () => {
        setEditingClient(null)
        setIsFormOpen(false)
        setRefreshKey(prev => prev + 1)
    }

    const handleCancel = () => {
        setEditingClient(null)
        setIsFormOpen(false)
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-end">
                {!isFormOpen && (
                    <button
                        onClick={() => setIsFormOpen(true)}
                        className="bg-[#2ca01c] text-white px-4 py-2 rounded text-sm font-medium hover:bg-[#258b18] transition-colors flex items-center"
                    >
                        <span>+ Nuevo Cliente</span>
                    </button>
                )}
            </div>

            {isFormOpen && (
                <div className="animate-fade-in-down">
                    <ClientForm
                        companyId={companyId}
                        initialData={editingClient}
                        onSuccess={handleSuccess}
                        onCancel={handleCancel}
                    />
                </div>
            )}

            <ClientList
                companyId={companyId}
                refreshKey={refreshKey}
                onEdit={handleEdit}
            />
        </div>
    )
}
