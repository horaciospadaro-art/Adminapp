'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface ClientListProps {
    companyId: string
    onEdit: (client: any) => void
    refreshKey?: number
}

export function ClientList({ companyId, onEdit, refreshKey }: ClientListProps) {
    const [clients, setClients] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const router = useRouter()

    useEffect(() => {
        if (!companyId) return

        setLoading(true)
        fetch(`/api/operations/clients?companyId=${companyId}`)
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) setClients(data)
                setLoading(false)
            })
            .catch(err => {
                console.error(err)
                setLoading(false)
            })
    }, [companyId, refreshKey])

    const handleCreateInvoice = (clientId: string) => {
        router.push(`/dashboard/operations/invoices/new?clientId=${clientId}`)
    }

    if (loading) return <div>Cargando clientes...</div>

    return (
        <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-sm font-bold text-gray-500 uppercase tracking-wider">
                                Cliente / Razón Social
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-sm font-bold text-gray-500 uppercase tracking-wider">
                                RIF / Contacto
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-sm font-bold text-gray-500 uppercase tracking-wider">
                                Cuenta Por Cobrar
                            </th>
                            <th scope="col" className="relative px-6 py-3">
                                <span className="sr-only">Acciones</span>
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {clients.map((client) => (
                            <tr key={client.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-base font-medium text-[#393a3d]">{client.name}</div>
                                    <div className="text-sm text-gray-500">{client.email}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-base text-gray-900">{client.rif}</div>
                                    <div className="text-sm text-gray-500">{client.phone}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    {client.receivable_account ? (
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                                            {client.receivable_account.code} - {client.receivable_account.name}
                                        </span>
                                    ) : (
                                        <span className="text-sm text-gray-400 italic">No asignada</span>
                                    )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-base font-medium">
                                    <div className="flex justify-end gap-2">
                                        <button
                                            className="text-[#2ca01c] hover:text-[#248217] font-semibold text-sm"
                                            onClick={() => onEdit(client)}
                                        >
                                            Editar
                                        </button>
                                        <span className="text-gray-300">|</span>
                                        <button
                                            className="text-blue-600 hover:text-blue-900 text-sm font-semibold"
                                            onClick={() => handleCreateInvoice(client.id)}
                                        >
                                            Crear factura
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {clients.length === 0 && (
                <div className="p-12 text-center text-gray-500">
                    <p className="text-lg mb-2">No hay clientes registrados aún.</p>
                </div>
            )}
        </div>
    )
}
