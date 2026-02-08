'use client'

import { useState, useEffect } from 'react'
import { Plus, Search, FileText } from 'lucide-react'
import Link from 'next/link'

interface Invoice {
    id: string
    number: string
    date: string
    third_party: { name: string }
    total: string
    status: string
}

export default function InvoicesPage() {
    const [invoices, setInvoices] = useState<Invoice[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        // fetchInvoices()
        setLoading(false)
    }, [])

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <FileText className="w-6 h-6 text-gray-600" />
                    Facturas de Venta (Ingresos)
                </h1>
                <Link
                    href="/dashboard/operations/invoices/new"
                    className="bg-[#2ca01c] hover:bg-[#248217] text-white px-4 py-2 rounded-md flex items-center gap-2 font-medium"
                >
                    <Plus className="w-5 h-5" /> Nueva Venta
                </Link>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <div className="relative max-w-md">
                    <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                    <input
                        placeholder="Buscar por cliente o número..."
                        className="pl-10 w-full border rounded-md p-2 focus:ring-blue-500"
                    />
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 border-b">
                        <tr>
                            <th className="px-6 py-3 font-medium text-gray-700">Fecha</th>
                            <th className="px-6 py-3 font-medium text-gray-700">Número</th>
                            <th className="px-6 py-3 font-medium text-gray-700">Cliente</th>
                            <th className="px-6 py-3 font-medium text-gray-700 text-right">Total</th>
                            <th className="px-6 py-3 font-medium text-gray-700 text-center">Estado</th>
                            <th className="px-6 py-3 text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {loading ? (
                            <tr><td colSpan={6} className="p-8 text-center">Cargando...</td></tr>
                        ) : invoices.length === 0 ? (
                            <tr><td colSpan={6} className="p-8 text-center text-gray-500">No hay facturas registradas.</td></tr>
                        ) : (
                            invoices.map(invoice => (
                                <tr key={invoice.id}>
                                    {/* Map rows here */}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
