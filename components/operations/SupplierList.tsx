'use client'

import { useState, useEffect } from 'react'

interface SupplierListProps {
    companyId: string
    onEdit: (supplier: any) => void
    refreshKey?: number
}

export function SupplierList({ companyId, onEdit, refreshKey }: SupplierListProps) {
    const [suppliers, setSuppliers] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!companyId) return

        setLoading(true)
        fetch(`/api/operations/suppliers?companyId=${companyId}`)
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) setSuppliers(data)
                setLoading(false)
            })
            .catch(err => {
                console.error(err)
                setLoading(false)
            })
    }, [companyId, refreshKey])

    if (loading) return <div>Cargando proveedores...</div>

    return (
        <div className="bg-white rounded shadow border border-gray-100 overflow-hidden">
            <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-700 font-medium border-b">
                    <tr>
                        <th className="px-6 py-3">Nombre</th>
                        <th className="px-6 py-3">RIF</th>
                        <th className="px-6 py-3 hidden md:table-cell">Email</th>
                        <th className="px-6 py-3 hidden md:table-cell">Teléfono</th>
                        <th className="px-6 py-3 hidden lg:table-cell">Cuenta Contable</th>
                        <th className="px-6 py-3">Acciones</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {suppliers.map(supplier => (
                        <tr key={supplier.id} className="hover:bg-gray-50">
                            <td className="px-6 py-3 font-medium">{supplier.name}</td>
                            <td className="px-6 py-3">{supplier.rif}</td>
                            <td className="px-6 py-3 hidden md:table-cell text-gray-500">{supplier.email}</td>
                            <td className="px-6 py-3 hidden md:table-cell text-gray-500">{supplier.phone}</td>
                            <td className="px-6 py-3 hidden lg:table-cell text-xs text-orange-600">
                                {supplier.payable_account ? `${supplier.payable_account.code} - ${supplier.payable_account.name}` : '-'}
                            </td>
                            <td className="px-6 py-3">
                                <button
                                    onClick={() => onEdit(supplier)}
                                    className="text-blue-600 hover:text-blue-800 font-medium"
                                >
                                    Editar
                                </button>
                            </td>
                        </tr>
                    ))}
                    {suppliers.length === 0 && (
                        <tr>
                            <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                                No hay proveedores registrados.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    )
}
