'use client'

import { useState, useEffect } from 'react'

interface ClientListProps {
    companyId: string
    onEdit: (client: any) => void
    refreshKey?: number
}

export function ClientList({ companyId, onEdit, refreshKey }: ClientListProps) {
    const [clients, setClients] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

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

    if (loading) return <div>Cargando clientes...</div>

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
                    {clients.map(client => (
                        <tr key={client.id} className="hover:bg-gray-50">
                            <td className="px-6 py-3 font-medium">{client.name}</td>
                            <td className="px-6 py-3">{client.rif}</td>
                            <td className="px-6 py-3 hidden md:table-cell text-gray-500">{client.email}</td>
                            <td className="px-6 py-3 hidden md:table-cell text-gray-500">{client.phone}</td>
                            <td className="px-6 py-3 hidden lg:table-cell text-xs text-blue-600">
                                {client.receivable_account ? `${client.receivable_account.code} - ${client.receivable_account.name}` : '-'}
                            </td>
                            <td className="px-6 py-3">
                                <button
                                    onClick={() => onEdit(client)}
                                    className="text-blue-600 hover:text-blue-800 font-medium"
                                >
                                    Editar
                                </button>
                            </td>
                        </tr>
                    ))}
                    {clients.length === 0 && (
                        <tr>
                            <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                                No hay clientes registrados.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    )
}
