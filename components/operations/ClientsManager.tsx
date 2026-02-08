'use client'

import { useState } from 'react'
import { ClientForm } from '@/components/operations/ClientForm'
import { ClientList } from '@/components/operations/ClientList'

export function ClientsManager({ companyId }: { companyId: string }) {
    const [editingClient, setEditingClient] = useState<any | null>(null)
    const [refreshKey, setRefreshKey] = useState(0)

    const handleEdit = (client: any) => {
        setEditingClient(client)
    }

    const handleSuccess = () => {
        setEditingClient(null)
        setRefreshKey(prev => prev + 1)
    }

    const handleCancel = () => {
        setEditingClient(null)
    }

    return (
        <div className="space-y-6">
            <ClientForm
                companyId={companyId}
                initialData={editingClient}
                onSuccess={handleSuccess}
                onCancel={handleCancel}
            />

            <ClientList
                companyId={companyId}
                refreshKey={refreshKey}
                onEdit={handleEdit}
            />
        </div>
    )
}
