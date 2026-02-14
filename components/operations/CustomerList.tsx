'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Search, Plus, Filter, Download, Eye, FileText, Trash2 } from 'lucide-react'

interface ThirdParty {
    id: string
    name: string
    rif: string
    email: string | null
    phone: string | null
    receivable_account?: {
        balance: number
    }
}

export function CustomerList() {
    const [customers, setCustomers] = useState<ThirdParty[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')

    useEffect(() => {
        fetchCustomers()
    }, [])

    async function fetchCustomers() {
        setLoading(true)
        try {
            const res = await fetch('/api/operations/clients?companyId=1') // TODO: Dynamic Company ID
            if (res.ok) {
                const data = await res.json()
                setCustomers(data)
            }
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    const filteredCustomers = customers.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.rif.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-800">Directorio de Clientes</h1>
                <Link href="/dashboard/revenue/customers/new" className="bg-[#2ca01c] hover:bg-[#248217] text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium">
                    <Plus className="w-5 h-5" /> Nuevo Cliente
                </Link>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex flex-wrap gap-4 items-center">
                <div className="flex-1 relative min-w-[200px]">
                    <Search className="absolute left-3 top-2.5 text-gray-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Buscar por nombre o RIF..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full pl-10 p-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>

                <div className="flex gap-2">
                    <button className="px-4 py-2 border rounded-lg hover:bg-gray-50 flex items-center gap-2 text-gray-600">
                        <Download className="w-4 h-4" /> Exportar
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-700 font-medium">
                        <tr>
                            <th className="px-6 py-4">Nombre / Razón Social</th>
                            <th className="px-6 py-4">RIF</th>
                            <th className="px-6 py-4">Contacto</th>
                            <th className="px-6 py-4 text-center">Estado</th>
                            <th className="px-6 py-4 text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {loading ? (
                            <tr><td colSpan={5} className="p-8 text-center text-gray-500">Cargando clientes...</td></tr>
                        ) : filteredCustomers.length === 0 ? (
                            <tr><td colSpan={5} className="p-8 text-center text-gray-500">No se encontraron clientes.</td></tr>
                        ) : (
                            filteredCustomers.map(c => (
                                <tr key={c.id} className="hover:bg-gray-50 group">
                                    <td className="px-6 py-4 font-medium text-gray-900">
                                        <div className="flex flex-col">
                                            <span>{c.name}</span>
                                            {/* <span className="text-xs text-gray-500">ID: {c.id.slice(0,8)}</span> */}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 font-mono text-gray-600">{c.rif}</td>
                                    <td className="px-6 py-4 text-gray-600">
                                        <div className="flex flex-col text-xs">
                                            <span>{c.email}</span>
                                            <span>{c.phone}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-semibold">ACTIVO</span>
                                    </td>
                                    <td className="px-6 py-4 text-right flex justify-end gap-2 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Link href={`/dashboard/revenue/customers/${c.id}/statement`} title="Ver Estado de Cuenta" className="p-1 hover:bg-gray-100 rounded text-blue-600">
                                            <FileText className="w-4 h-4" />
                                        </Link>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
