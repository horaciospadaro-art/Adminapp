
'use client'

import { useState, useEffect } from 'react'
import { Printer, Download, Search } from 'lucide-react'
import { formatDate } from '@/lib/date-utils'

interface Movement {
    id: string
    date: string
    type: string
    number: string
    description: string
    charge: number
    payment: number
    balance: number
}

interface StatementData {
    customer: {
        name: string
        tax_id: string
        email: string
        phone: string
        address: string
    }
    transactions: Movement[]
    total_balance: number
}

export function CustomerStatement({ customerId }: { customerId: string }) {
    const [data, setData] = useState<StatementData | null>(null)
    const [loading, setLoading] = useState(true)
    const [startDate, setStartDate] = useState(
        new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]
    ) // Start of current month
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]) // Today

    const fetchStatement = async () => {
        setLoading(true)
        try {
            const res = await fetch(`/api/reports/customer-statement/${customerId}`)
            if (!res.ok) throw new Error('Error loading statement')
            const json = await res.json()
            setData(json)
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (customerId) {
            fetchStatement()
        }
    }, [customerId])

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-VE', { style: 'currency', currency: 'VES' }).format(amount)
    }

    // Filter displayed transactions based on date range for display only
    const displayedTransactions = data?.transactions.filter(t => {
        const d = new Date(t.date).toISOString().split('T')[0]
        return d >= startDate && d <= endDate
    }) || []

    // Calculate totals for displayed range
    const totalCharges = displayedTransactions.reduce((sum, m) => sum + m.charge, 0) || 0
    const totalPayments = displayedTransactions.reduce((sum, m) => sum + m.payment, 0) || 0


    return (
        <div className="space-y-6">
            {/* Header / Customer Info */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h2 className="text-xl font-bold text-gray-800 mb-4">{data?.customer.name || 'Cargando...'}</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                    <div>
                        <span className="font-semibold text-gray-900">RIF/CI:</span> {data?.customer.tax_id}
                    </div>
                    <div>
                        <span className="font-semibold text-gray-900">Email:</span> {data?.customer.email}
                    </div>
                    <div>
                        <span className="font-semibold text-gray-900">Teléfono:</span> {data?.customer.phone}
                    </div>
                </div>
            </div>

            {/* Controls */}
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex flex-wrap gap-4 items-end justify-between">
                <div className="flex gap-4 items-end">
                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Desde</label>
                        <input
                            type="date"
                            value={startDate}
                            onChange={e => setStartDate(e.target.value)}
                            className="p-2 border rounded text-sm"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Hasta</label>
                        <input
                            type="date"
                            value={endDate}
                            onChange={e => setEndDate(e.target.value)}
                            className="p-2 border rounded text-sm"
                        />
                    </div>
                    <button
                        onClick={fetchStatement}
                        className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 flex items-center gap-2"
                    >
                        <Search className="w-4 h-4" /> Actualizar
                    </button>
                </div>

                <div className="flex gap-2">
                    <button className="border border-gray-300 bg-white text-gray-700 px-3 py-2 rounded text-sm hover:bg-gray-50 flex items-center gap-2">
                        <Printer className="w-4 h-4" /> Imprimir
                    </button>
                    <button className="border border-gray-300 bg-white text-gray-700 px-3 py-2 rounded text-sm hover:bg-gray-50 flex items-center gap-2">
                        <Download className="w-4 h-4" /> Exportar
                    </button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                    <div className="text-sm text-gray-500 mb-1">Total Cargos (Periodo)</div>
                    <div className="text-xl font-bold text-red-600">{formatCurrency(totalCharges)}</div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                    <div className="text-sm text-gray-500 mb-1">Total Abonos (Periodo)</div>
                    <div className="text-xl font-bold text-green-600">{formatCurrency(totalPayments)}</div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 bg-blue-50 border-blue-100">
                    <div className="text-sm text-blue-700 mb-1">Saldo Final Total</div>
                    <div className="text-3xl font-bold text-blue-900">{data ? formatCurrency(data.total_balance) : '...'}</div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 border-b font-medium text-gray-700">
                        <tr>
                            <th className="px-4 py-3">Fecha</th>
                            <th className="px-4 py-3">Tipo</th>
                            <th className="px-4 py-3">Número</th>
                            <th className="px-4 py-3">Descripción</th>
                            <th className="px-4 py-3 text-right">Cargos (+)</th>
                            <th className="px-4 py-3 text-right">Abonos (-)</th>
                            <th className="px-4 py-3 text-right">Saldo</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {loading ? (
                            <tr><td colSpan={7} className="p-8 text-center text-gray-500">Cargando estado de cuenta...</td></tr>
                        ) : displayedTransactions.length === 0 ? (
                            <tr><td colSpan={7} className="p-8 text-center text-gray-500">No hay movimientos en el periodo seleccionado.</td></tr>
                        ) : (
                            displayedTransactions.map((move) => (
                                <tr key={move.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 whitespace-nowrap">
                                        {formatDate(move.date)}
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium 
                                            ${move.type === 'INVOICE' || move.type === 'DEBIT_NOTE' ? 'bg-orange-100 text-orange-800' :
                                                move.type === 'RECEIPT' || move.type === 'CREDIT_NOTE' ? 'bg-green-100 text-green-800' :
                                                    'bg-gray-100 text-gray-800'}`}>
                                            {move.type === 'INVOICE' ? 'FACTURA' :
                                                move.type === 'RECEIPT' ? 'COBRO' :
                                                    move.type === 'CREDIT_NOTE' ? 'NOTA CRÉDITO' : move.type}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 font-mono text-xs">{move.number}</td>
                                    <td className="px-4 py-3 text-gray-600 truncate max-w-xs">{move.description}</td>
                                    <td className="px-4 py-3 text-right font-medium text-red-600">
                                        {move.charge > 0 ? formatCurrency(move.charge) : '-'}
                                    </td>
                                    <td className="px-4 py-3 text-right font-medium text-green-600">
                                        {move.payment > 0 ? formatCurrency(move.payment) : '-'}
                                    </td>
                                    <td className="px-4 py-3 text-right font-bold text-gray-800">
                                        {formatCurrency(move.balance)}
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
