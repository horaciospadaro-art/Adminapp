'use client'

import { useState } from 'react'
import { CompanyForm } from '@/components/admin/CompanyForm'
import { CompanyList } from '@/components/admin/CompanyList'

export default function CompaniesPage() {
    const [editingCompany, setEditingCompany] = useState<any | null>(null)
    const [refreshKey, setRefreshKey] = useState(0)

    const handleEdit = (company: any) => {
        setEditingCompany(company)
    }

    const handleSuccess = () => {
        setEditingCompany(null)
        setRefreshKey(prev => prev + 1)
    }

    const handleCancel = () => {
        setEditingCompany(null)
    }

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-800">Gestión de Empresas</h1>
            <p className="text-gray-500">Administre las empresas registradas en el sistema.</p>

            <CompanyForm
                initialData={editingCompany}
                onSuccess={handleSuccess}
                onCancel={handleCancel}
            />

            <CompanyList
                key={refreshKey}
                onEdit={handleEdit}
            />
        </div>
    )
}
