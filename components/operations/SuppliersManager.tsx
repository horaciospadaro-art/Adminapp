'use client'

import { useState } from 'react'
import { SupplierForm } from '@/components/operations/SupplierForm'
import { SupplierList } from '@/components/operations/SupplierList'

export function SuppliersManager({ companyId }: { companyId: string }) {
    const [editingSupplier, setEditingSupplier] = useState<any | null>(null)
    const [isFormOpen, setIsFormOpen] = useState(false)
    const [refreshKey, setRefreshKey] = useState(0)

    const handleEdit = (supplier: any) => {
        setEditingSupplier(supplier)
        setIsFormOpen(true)
    }

    const handleSuccess = () => {
        setEditingSupplier(null)
        setIsFormOpen(false)
        setRefreshKey(prev => prev + 1)
    }

    const handleCancel = () => {
        setEditingSupplier(null)
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
                        <span>+ Nuevo Proveedor</span>
                    </button>
                )}
            </div>

            {isFormOpen && (
                <div className="animate-fade-in-down">
                    <SupplierForm
                        companyId={companyId}
                        initialData={editingSupplier}
                        onSuccess={handleSuccess}
                        onCancel={handleCancel}
                    />
                </div>
            )}

            <SupplierList
                companyId={companyId}
                refreshKey={refreshKey}
                onEdit={handleEdit}
            />
        </div>
    )
}
