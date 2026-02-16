'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Plus, Search, FileText, Loader2, Receipt, Calendar, ArrowLeft } from 'lucide-react'
import { DateInput } from '@/components/common/DateInput'
import Link from 'next/link'
import { formatDate } from '@/lib/date-utils'
import { paymentStatusLabel, documentTypeLabel } from '@/lib/labels'
import { useRouter } from 'next/navigation'

interface Bill {
    id: string
    number: string
    date: string
    type?: string
    third_party: { name: string }
    total: string
    status: string
}

interface Supplier {
    id: string
    name: string
    rif: string
}

const DEBOUNCE_MS = 300

function getDefaultDateRange() {
    const now = new Date()
    const from = new Date(now.getFullYear(), now.getMonth(), 1)
    return {
        from: from.toISOString().slice(0, 10),
        to: now.toISOString().slice(0, 10)
    }
}

export default function BillsPage() {
    const router = useRouter()
    const defaults = getDefaultDateRange()
    const [bills, setBills] = useState<Bill[]>([])
    const [loading, setLoading] = useState(true)
    const [companyId, setCompanyId] = useState<string>('')
    const [dateFrom, setDateFrom] = useState(defaults.from)
    const [dateTo, setDateTo] = useState(defaults.to)
    const [searchText, setSearchText] = useState('')
    const [supplierResults, setSupplierResults] = useState<Supplier[]>([])
    const [supplierSearching, setSupplierSearching] = useState(false)
    const [showDropdown, setShowDropdown] = useState(false)
    const [showFallbackMessage, setShowFallbackMessage] = useState(false)
    const dropdownRef = useRef<HTMLDivElement>(null)

    // Usar la misma empresa activa que el resto de la app (layout, formulario de facturas)
    useEffect(() => {
        fetch('/api/companies/active')
            .then(res => res.json())
            .then((data: { id?: string; error?: string }) => {
                if (data && data.id) {
                    setCompanyId(data.id)
                }
            })
            .catch(() => {})
    }, [])

    const fetchBills = useCallback(async (filterQ?: string) => {
        if (!companyId) return
        setLoading(true)
        const params = new URLSearchParams({ companyId, dateFrom, dateTo })
        if (filterQ?.trim()) params.set('q', filterQ.trim())
        try {
            const res = await fetch(`/api/operations/suppliers/bills?${params}`)
            const data = await res.json()
            setBills(Array.isArray(data) ? data : [])
        } catch {
            setBills([])
        } finally {
            setLoading(false)
        }
    }, [companyId, dateFrom, dateTo])

    useEffect(() => {
        fetchBills()
    }, [fetchBills])

    // Filtrar listado por proveedor o número de factura al escribir
    useEffect(() => {
        if (!companyId) return
        const t = setTimeout(() => {
            fetchBills(searchText.trim() || undefined)
        }, DEBOUNCE_MS)
        return () => clearTimeout(t)
    }, [companyId, searchText, fetchBills])

    useEffect(() => {
        if (!companyId) return
        const t = setTimeout(() => {
            const q = searchText.trim()
            if (q.length >= 2) {
                setSupplierSearching(true)
                const url = `/api/operations/suppliers?companyId=${companyId}&q=${encodeURIComponent(q)}`
                fetch(url)
                    .then(res => res.json())
                    .then((data: Supplier[] | { error?: string }) => {
                        const list = Array.isArray(data) ? data : []
                        if (list.length === 0 && q) {
                            // Sin coincidencias: mostrar todos los proveedores de la empresa para que pueda elegir
                            return fetch(`/api/operations/suppliers?companyId=${companyId}`)
                                .then(r => r.json())
                                .then((all: Supplier[] | { error?: string }) => ({
                                    list: Array.isArray(all) ? all : [],
                                    fallback: true
                                }))
                                .catch(() => ({ list: [], fallback: false }))
                        }
                        return { list, fallback: false }
                    })
                    .then(({ list, fallback }: { list: Supplier[]; fallback: boolean }) => {
                        setSupplierResults(list)
                        setShowDropdown(true)
                        setShowFallbackMessage(fallback && list.length > 0)
                    })
                    .catch(() => {
                        setSupplierResults([])
                        setShowFallbackMessage(false)
                    })
                    .finally(() => setSupplierSearching(false))
            } else {
                setSupplierResults([])
                setShowDropdown(false)
                setShowFallbackMessage(false)
            }
        }, DEBOUNCE_MS)
        return () => clearTimeout(t)
    }, [companyId, searchText])

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setShowDropdown(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const handleSelectSupplier = (supplier: Supplier) => {
        setShowDropdown(false)
        setSearchText('')
        setSupplierResults([])
        router.push(`/dashboard/operations/bills/new?supplierId=${supplier.id}`)
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center flex-wrap gap-4">
                <div className="flex items-center gap-3">
                    <Link
                        href="/dashboard/operations/suppliers"
                        className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Volver a Proveedores
                    </Link>
                    <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <FileText className="w-6 h-6 text-gray-600" />
                        Documentos de Compra
                    </h1>
                </div>
                <Link
                    href="/dashboard/operations/bills/new"
                    className="bg-[#2ca01c] hover:bg-[#248217] text-white px-4 py-2 rounded-md flex items-center gap-2 font-medium"
                >
                    <Plus className="w-5 h-5" /> Guardar documento
                </Link>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 space-y-4">
                <div className="flex flex-wrap items-end gap-4">
                    <div className="flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-gray-500" />
                        <DateInput
                            label="Desde"
                            value={dateFrom}
                            onChange={e => setDateFrom(e.target.value)}
                            className="border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <DateInput
                        label="Hasta"
                        value={dateTo}
                        onChange={e => setDateTo(e.target.value)}
                        className="border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                        type="button"
                        onClick={() => fetchBills()}
                        className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-md text-sm font-medium"
                    >
                        Aplicar fechas
                    </button>
                </div>
                <p className="text-sm text-gray-500">
                    Se muestran facturas, notas de crédito y notas de débito en el rango de fechas. Filtre por proveedor o número de documento en el buscador. Para registrar una factura, use el botón verde o el buscador para ir directo al proveedor.
                </p>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 relative" ref={dropdownRef}>
                <label className="block text-sm font-medium text-gray-700 mb-2">Filtrar por proveedor o número de documento</label>
                <div className="relative max-w-xl">
                    <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                    <input
                        value={searchText}
                        onChange={e => setSearchText(e.target.value)}
                        onFocus={() => searchText.trim().length >= 2 && setShowDropdown(true)}
                        placeholder="Nombre del proveedor o número de documento para filtrar..."
                        className="pl-10 w-full border rounded-md p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    {supplierSearching && (
                        <Loader2 className="absolute right-3 top-2.5 h-5 w-5 text-gray-400 animate-spin" />
                    )}
                </div>
                {showDropdown && supplierResults.length > 0 && (
                    <div className="absolute z-10 mt-1 w-full max-w-md bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
                        {showFallbackMessage && (
                            <p className="px-4 py-2 text-sm text-amber-700 bg-amber-50 border-b">
                                No hay coincidencias con &quot;{searchText.trim()}&quot;. Mostrando todos los proveedores de la empresa:
                            </p>
                        )}
                        <ul>
                        {supplierResults.map(s => (
                            <li key={s.id}>
                                <button
                                    type="button"
                                    onClick={() => handleSelectSupplier(s)}
                                    className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-2 text-sm"
                                >
                                    <Receipt className="w-4 h-4 text-gray-500" />
                                    <span className="font-medium">{s.name}</span>
                                    <span className="text-gray-500 text-xs">({s.rif})</span>
                                    <span className="ml-auto text-xs text-[#2ca01c]">Guardar documento</span>
                                </button>
                            </li>
                        ))}
                        </ul>
                    </div>
                )}
                {showDropdown && searchText.trim().length >= 2 && !supplierSearching && supplierResults.length === 0 && (
                    <div className="absolute z-10 mt-1 max-w-md px-4 py-3 bg-white border border-gray-200 rounded-md shadow-lg text-sm text-gray-500">
                        No se encontraron proveedores. Usa el botón &quot;Guardar documento&quot; para cargar una sin seleccionar.
                    </div>
                )}
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 border-b">
                        <tr>
                            <th className="px-6 py-3 font-medium text-gray-700">Fecha</th>
                            <th className="px-6 py-3 font-medium text-gray-700">Tipo</th>
                            <th className="px-6 py-3 font-medium text-gray-700">Número</th>
                            <th className="px-6 py-3 font-medium text-gray-700">Proveedor</th>
                            <th className="px-6 py-3 font-medium text-gray-700 text-right">Total</th>
                            <th className="px-6 py-3 font-medium text-gray-700 text-center">Estado</th>
                            <th className="px-6 py-3 text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {loading ? (
                            <tr><td colSpan={7} className="p-8 text-center">Cargando...</td></tr>
                        ) : bills.length === 0 ? (
                            <tr><td colSpan={7} className="p-8 text-center text-gray-500">No hay documentos de compra en el rango de fechas seleccionado.</td></tr>
                        ) : (
                            bills.map((bill: any) => (
                                <tr key={bill.id}>
                                    <td className="px-6 py-3">{formatDate(bill.date)}</td>
                                    <td className="px-6 py-3">{documentTypeLabel(bill.type)}</td>
                                    <td className="px-6 py-3">{bill.number || bill.control_number || '—'}</td>
                                    <td className="px-6 py-3">{bill.third_party?.name ?? '—'}</td>
                                    <td className="px-6 py-3 text-right">{bill.total ?? '0'}</td>
                                    <td className="px-6 py-3 text-center">{paymentStatusLabel(bill.status)}</td>
                                    <td className="px-6 py-3 text-right">
                                        <Link
                                            href={`/dashboard/operations/bills/new?id=${bill.id}`}
                                            className="text-blue-600 hover:underline"
                                        >
                                            Ver
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
