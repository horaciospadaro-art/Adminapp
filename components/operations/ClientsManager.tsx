'use client'

import { useState } from 'react'
import { ClientForm } from '@/components/operations/ClientForm'
import { ClientList } from '@/components/operations/ClientList'
import { ClientReportsModal } from '@/components/operations/ClientReportsModal'
import { BarChart3 } from 'lucide-react'

export function ClientsManager({ companyId }: { companyId: string }) {
    const [editingClient, setEditingClient] = useState<any | null>(null)
    const [isFormOpen, setIsFormOpen] = useState(false)
    const [isReportsOpen, setIsReportsOpen] = useState(false)
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
            <div className="flex justify-end gap-2">
                {!isFormOpen && (
                    <>
                        <button
                            onClick={() => setIsReportsOpen(true)}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-md border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
                        >
                            <BarChart3 className="w-4 h-4" />
                            Reportes
                        </button>
                        <button
                            onClick={() => setIsFormOpen(true)}
                            className="bg-[#2ca01c] text-white px-4 py-2 rounded text-sm font-medium hover:bg-[#258b18] transition-colors flex items-center"
                        >
                            <span>+ Nuevo Cliente</span>
                        </button>
                    </>
                )}
            </div>

            <ClientReportsModal
                companyId={companyId}
                isOpen={isReportsOpen}
                onClose={() => setIsReportsOpen(false)}
            />

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
