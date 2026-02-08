'use client'

import { useState } from 'react'
import { CompanyForm } from '@/components/admin/CompanyForm'
import { CompanyList } from '@/components/admin/CompanyList'
import { PageHeader } from '@/components/ui/PageHeader'

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
            <PageHeader title="Gestión de Empresas" description="Administre las empresas registradas en el sistema." />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                    <h2 className="text-lg font-medium text-gray-700 mb-4">
                        {editingCompany ? 'Editar Empresa' : 'Registrar Nueva Empresa'}
                    </h2>
                    <CompanyForm
                        initialData={editingCompany}
                        onSuccess={handleSuccess}
                        onCancel={handleCancel}
                    />
                </div>
                <div>
                    <h2 className="text-lg font-medium text-gray-700 mb-4">Empresas Existentes</h2>
                    <CompanyList
                        key={refreshKey}
                        onEdit={handleEdit}
                    />
                </div>
            </div>
        </div>
    )
}
