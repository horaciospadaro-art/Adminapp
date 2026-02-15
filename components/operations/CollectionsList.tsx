
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Search, Plus, Filter, Download, Eye, Trash2 } from 'lucide-react'
import { formatDate } from '@/lib/date-utils'

interface ThirdParty {
    id: string
    name: string
}

interface Receipt {
    id: string
    number: string
    date: string
    third_party: ThirdParty
    total: number
    status: string
    reference: string | null
    // Add payment_method if available in doc or separate field
    // Assuming backend returns it or we stored it in notes/reference or specific field
    // For now, listing just basics.
}

export function CollectionsList() {
    const [receipts, setReceipts] = useState<Receipt[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')

    useEffect(() => {
        fetchReceipts()
    }, [])

    async function fetchReceipts() {
        setLoading(true)
        try {
            const res = await fetch('/api/documents?type=RECEIPT')
            if (res.ok) {
                const data = await res.json()
                setReceipts(data)
            }
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    const filteredReceipts = receipts.filter(r =>
        r.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.third_party.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (r.reference && r.reference.toLowerCase().includes(searchTerm.toLowerCase()))
    )

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-800">Cobranzas (Recibos de Caja)</h1>
                <Link href="/dashboard/revenue/collections/new" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2">
                    <Plus className="w-5 h-5" /> Nuevo Cobro
                </Link>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex gap-4">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-2.5 text-gray-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Buscar por cliente, número de recibo o referencia..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full pl-10 p-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>
                <button className="px-4 py-2 border rounded-lg hover:bg-gray-50 flex items-center gap-2 text-gray-600">
                    <Filter className="w-4 h-4" /> Filtros
                </button>
                <button className="px-4 py-2 border rounded-lg hover:bg-gray-50 flex items-center gap-2 text-gray-600">
                    <Download className="w-4 h-4" /> Exportar
                </button>
            </div>

            {/* Table */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-700 font-medium">
                        <tr>
                            <th className="px-6 py-4">Nro. Recibo</th>
                            <th className="px-6 py-4">Fecha</th>
                            <th className="px-6 py-4">Cliente</th>
                            <th className="px-6 py-4">Referencia</th>
                            <th className="px-6 py-4 text-right">Monto</th>
                            <th className="px-6 py-4 text-center">Estado</th>
                            <th className="px-6 py-4 text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {loading ? (
                            <tr><td colSpan={7} className="p-8 text-center text-gray-500">Cargando cobranzas...</td></tr>
                        ) : filteredReceipts.length === 0 ? (
                            <tr><td colSpan={7} className="p-8 text-center text-gray-500">No se encontraron recibos de cobro.</td></tr>
                        ) : (
                            filteredReceipts.map(receipt => (
                                <tr key={receipt.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 font-mono font-medium text-blue-600">{receipt.number}</td>
                                    <td className="px-6 py-4 text-gray-600">{formatDate(receipt.date)}</td>
                                    <td className="px-6 py-4 font-medium text-gray-800">{receipt.third_party.name}</td>
                                    <td className="px-6 py-4 text-gray-600">{receipt.reference || '-'}</td>
                                    <td className="px-6 py-4 text-right font-bold text-gray-900">
                                        {new Intl.NumberFormat('es-VE', { style: 'currency', currency: 'VES' }).format(Number(receipt.total))}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={`px-2 py-1 rounded-full text-xs font-semibold
                                            ${receipt.status === 'PAID' ? 'bg-green-100 text-green-800' :
                                                receipt.status === 'VOID' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}`}>
                                            {receipt.status === 'PAID' ? 'COBRADO' : receipt.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right flex justify-end gap-2">
                                        <button title="Ver Detalle" className="p-1 hover:bg-gray-100 rounded text-blue-600">
                                            <Eye className="w-4 h-4" />
                                        </button>
                                        <button title="Anular" className="p-1 hover:bg-gray-100 rounded text-red-600">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
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
