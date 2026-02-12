
'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Calendar, Printer, Download, Search, ArrowRight } from 'lucide-react'

interface Movement {
    id: string
    date: string
    type: string
    number: string
    reference: string | null
    description: string
    debit: number
    credit: number
    balance: number
}

interface StatementData {
    period: { start: string, end: string }
    initialBalance: number
    movements: Movement[]
    finalBalance: number
}

export function SupplierStatement({ supplierId }: { supplierId: string }) {
    const [data, setData] = useState<StatementData | null>(null)
    const [loading, setLoading] = useState(true)
    const [startDate, setStartDate] = useState(
        new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]
    ) // Start of current month
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]) // Today

    const fetchStatement = async () => {
        setLoading(true)
        try {
            const res = await fetch(`/api/operations/suppliers/${supplierId}/statement?startDate=${startDate}&endDate=${endDate}`)
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
        if (supplierId) {
            fetchStatement()
        }
    }, [supplierId])

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-VE', { style: 'currency', currency: 'VES' }).format(amount)
    }

    const totalDebits = data?.movements.reduce((sum, m) => sum + m.debit, 0) || 0
    const totalCredits = data?.movements.reduce((sum, m) => sum + m.credit, 0) || 0

    return (
        <div className="space-y-6">
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
                        <Search className="w-4 h-4" /> Consultar
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
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                    <div className="text-sm text-gray-500 mb-1">Saldo Inicial</div>
                    <div className="text-xl font-bold">{data ? formatCurrency(data.initialBalance) : '...'}</div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                    <div className="text-sm text-gray-500 mb-1">Cargos (+)</div>
                    <div className="text-xl font-bold text-red-600">{formatCurrency(totalCredits)}</div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                    <div className="text-sm text-gray-500 mb-1">Abonos (-)</div>
                    <div className="text-xl font-bold text-green-600">{formatCurrency(totalDebits)}</div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 bg-blue-50 border-blue-100">
                    <div className="text-sm text-blue-700 mb-1">Saldo Final</div>
                    <div className="text-xl font-bold text-blue-900">{data ? formatCurrency(data.finalBalance) : '...'}</div>
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
                            <th className="px-4 py-3 text-right">Cargos</th>
                            <th className="px-4 py-3 text-right">Abonos</th>
                            <th className="px-4 py-3 text-right">Saldo</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {loading ? (
                            <tr><td colSpan={7} className="p-8 text-center text-gray-500">Cargando movimientos...</td></tr>
                        ) : data?.movements.length === 0 ? (
                            <tr><td colSpan={7} className="p-8 text-center text-gray-500">No hay movimientos en el periodo seleccionado.</td></tr>
                        ) : (
                            data?.movements.map((move) => (
                                <tr key={move.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 whitespace-nowrap">
                                        {format(new Date(move.date), 'dd/MM/yyyy')}
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium 
                                            ${move.type === 'BILL' ? 'bg-orange-100 text-orange-800' :
                                                move.type === 'PAYMENT' ? 'bg-green-100 text-green-800' :
                                                    move.type === 'RETENTION' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'}`}>
                                            {move.type}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 font-mono text-xs">{move.number}</td>
                                    <td className="px-4 py-3 text-gray-600 truncate max-w-xs">{move.description}</td>
                                    <td className="px-4 py-3 text-right font-medium text-red-600">
                                        {move.credit > 0 ? formatCurrency(move.credit) : '-'}
                                    </td>
                                    <td className="px-4 py-3 text-right font-medium text-green-600">
                                        {move.debit > 0 ? formatCurrency(move.debit) : '-'}
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
