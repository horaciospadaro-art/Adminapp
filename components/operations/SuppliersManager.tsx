'use client'

import { useState } from 'react'
import { SupplierForm } from '@/components/operations/SupplierForm'
import { SupplierList } from '@/components/operations/SupplierList'

export function SuppliersManager({ companyId }: { companyId: string }) {
    const [editingSupplier, setEditingSupplier] = useState<any | null>(null)
    const [refreshKey, setRefreshKey] = useState(0)

    const handleEdit = (supplier: any) => {
        setEditingSupplier(supplier)
    }

    const handleSuccess = () => {
        setEditingSupplier(null)
        setRefreshKey(prev => prev + 1)
    }

    const handleCancel = () => {
        setEditingSupplier(null)
    }

    return (
        <div className="space-y-6">
            <SupplierForm
                companyId={companyId}
                initialData={editingSupplier}
                onSuccess={handleSuccess}
                onCancel={handleCancel}
            />

            <SupplierList
                companyId={companyId}
                refreshKey={refreshKey}
                onEdit={handleEdit}
            />
        </div>
    )
}
