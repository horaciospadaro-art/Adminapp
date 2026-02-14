
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Search, Plus, Filter, Download, Eye, FileX, DollarSign, MoreVertical } from 'lucide-react'
import { formatDate } from '@/lib/date-utils'

interface ThirdParty {
    id: string
    name: string
}

interface Invoice {
    id: string
    number: string
    date: string
    third_party: ThirdParty
    total: number
    balance: number
    status: string
}

export function InvoiceList() {
    const [invoices, setInvoices] = useState<Invoice[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [statusFilter, setStatusFilter] = useState('ALL') // ALL, PENDING, PAID

    useEffect(() => {
        fetchInvoices()
    }, [statusFilter])

    async function fetchInvoices() {
        setLoading(true)
        try {
            let url = '/api/documents?type=INVOICE'
            if (statusFilter !== 'ALL') {
                if (statusFilter === 'PENDING') url += '&status=PENDING,PARTIAL'
                else url += `&status=${statusFilter}`
            }

            const res = await fetch(url)
            if (res.ok) {
                const data = await res.json()
                setInvoices(data)
            }
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    const filteredInvoices = invoices.filter(inv =>
        inv.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inv.third_party.name.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-800">Facturas de Venta</h1>
                <Link href="/dashboard/revenue/invoices/new" className="bg-[#2ca01c] hover:bg-[#248217] text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium">
                    <Plus className="w-5 h-5" /> Nueva Factura
                </Link>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex flex-wrap gap-4 items-center">
                <div className="flex-1 relative min-w-[200px]">
                    <Search className="absolute left-3 top-2.5 text-gray-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Buscar por cliente o número..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full pl-10 p-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>

                <div className="flex items-center space-x-2">
                    <select
                        value={statusFilter}
                        onChange={e => setStatusFilter(e.target.value)}
                        className="p-2 border rounded-lg bg-gray-50 text-gray-700 font-medium"
                    >
                        <option value="ALL">Todas las Facturas</option>
                        <option value="PENDING">Pendientes de Pago</option>
                        <option value="PAID">Pagadas</option>
                        <option value="VOID">Anuladas</option>
                    </select>
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
                            <th className="px-6 py-4">Nro. Factura</th>
                            <th className="px-6 py-4">Fecha</th>
                            <th className="px-6 py-4">Cliente</th>
                            <th className="px-6 py-4 text-right">Total</th>
                            <th className="px-6 py-4 text-right">Saldo Pendiente</th>
                            <th className="px-6 py-4 text-center">Estado</th>
                            <th className="px-6 py-4 text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {loading ? (
                            <tr><td colSpan={7} className="p-8 text-center text-gray-500">Cargando facturas...</td></tr>
                        ) : filteredInvoices.length === 0 ? (
                            <tr><td colSpan={7} className="p-8 text-center text-gray-500">No se encontraron facturas.</td></tr>
                        ) : (
                            filteredInvoices.map(inv => (
                                <tr key={inv.id} className="hover:bg-gray-50 group">
                                    <td className="px-6 py-4 font-mono font-medium text-blue-600">{inv.number}</td>
                                    <td className="px-6 py-4 text-gray-600">{formatDate(inv.date)}</td>
                                    <td className="px-6 py-4 font-medium text-gray-800">{inv.third_party.name}</td>
                                    <td className="px-6 py-4 text-right font-medium text-gray-900">
                                        {new Intl.NumberFormat('es-VE', { style: 'currency', currency: 'VES' }).format(Number(inv.total))}
                                    </td>
                                    <td className={`px-6 py-4 text-right font-bold ${Number(inv.balance) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                        {new Intl.NumberFormat('es-VE', { style: 'currency', currency: 'VES' }).format(Number(inv.balance))}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={`px-2 py-1 rounded-full text-xs font-semibold
                                            ${inv.status === 'PAID' ? 'bg-green-100 text-green-800' :
                                                inv.status === 'VOID' ? 'bg-red-100 text-red-800' :
                                                    inv.status === 'PARTIAL' ? 'bg-yellow-100 text-yellow-800' :
                                                        'bg-blue-50 text-blue-600'}`}>
                                            {inv.status === 'PAID' ? 'PAGADO' :
                                                inv.status === 'PARTIAL' ? 'PARCIAL' :
                                                    inv.status === 'VOID' ? 'ANULADO' : 'PENDIENTE'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right flex justify-end gap-2 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button title="Ver Detalle" className="p-1 hover:bg-gray-100 rounded text-gray-600">
                                            <Eye className="w-4 h-4" />
                                        </button>
                                        {Number(inv.balance) > 0 && inv.status !== 'VOID' && (
                                            <Link href="/dashboard/revenue/collections/new" title="Registrar Cobro" className="p-1 hover:bg-gray-100 rounded text-green-600">
                                                <DollarSign className="w-4 h-4" />
                                            </Link>
                                        )}
                                        {inv.status !== 'VOID' && Number(inv.balance) === Number(inv.total) && (
                                            <button title="Anular" className="p-1 hover:bg-gray-100 rounded text-red-600">
                                                <FileX className="w-4 h-4" />
                                            </button>
                                        )}
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
