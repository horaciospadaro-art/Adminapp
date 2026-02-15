'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface SupplierListProps {
    companyId: string
    onEdit: (supplier: any) => void
    refreshKey?: number
}

export function SupplierList({ companyId, onEdit, refreshKey }: SupplierListProps) {
    const [suppliers, setSuppliers] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const router = useRouter()

    useEffect(() => {
        if (!companyId) {
            setLoading(false)
            return
        }

        setLoading(true)
        fetch(`/api/operations/suppliers?companyId=${companyId}`)
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    setSuppliers(data)
                } else {
                    console.error('Expected array of suppliers, got:', data)
                    setSuppliers([])
                }
                setLoading(false)
            })
            .catch(err => {
                console.error(err)
                setLoading(false)
            })
    }, [companyId, refreshKey])

    const handleCreateBill = (supplierId: string) => {
        router.push(`/dashboard/operations/bills/new?supplierId=${supplierId}`)
    }

    if (loading) return <div>Cargando proveedores...</div>

    return (
        <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-sm font-bold text-gray-500 uppercase tracking-wider">
                                Proveedor / Razón Social
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-sm font-bold text-gray-500 uppercase tracking-wider">
                                RIF / Contacto
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-sm font-bold text-gray-500 uppercase tracking-wider">
                                Cuenta Por Pagar
                            </th>
                            <th scope="col" className="relative px-6 py-3">
                                <span className="sr-only">Acciones</span>
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {suppliers.map((supplier) => (
                            <tr key={supplier.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-base font-medium text-[#393a3d]">{supplier.name}</div>
                                    <div className="text-sm text-gray-500">{supplier.email}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-base text-gray-900">{supplier.rif}</div>
                                    <div className="text-sm text-gray-500">{supplier.phone}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    {supplier.payable_account ? (
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-orange-100 text-orange-800">
                                            {supplier.payable_account.code} - {supplier.payable_account.name}
                                        </span>
                                    ) : (
                                        <span className="text-sm text-gray-400 italic">No asignada</span>
                                    )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-base font-medium">
                                    <div className="flex justify-end gap-2">
                                        <button
                                            className="text-[#2ca01c] hover:text-[#248217] font-semibold text-sm"
                                            onClick={() => onEdit(supplier)}
                                        >
                                            Editar
                                        </button>
                                        <span className="text-gray-300">|</span>
                                        <button
                                            className="text-orange-600 hover:text-orange-900 text-sm font-semibold"
                                            onClick={() => handleCreateBill(supplier.id)}
                                        >
                                            Crear orden
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {suppliers.length === 0 && (
                <div className="p-12 text-center text-gray-500">
                    <p className="text-lg mb-2">No hay proveedores registrados aún.</p>
                </div>
            )}
        </div>
    )
}
