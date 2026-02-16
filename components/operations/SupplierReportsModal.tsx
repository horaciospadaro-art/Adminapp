'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { X, FileText, Calendar, Receipt, Percent } from 'lucide-react'

const REPORT_TYPES = [
    { id: 'statement', label: 'Estado de cuenta', icon: FileText },
    { id: 'aging', label: 'Análisis de vencimiento', icon: Calendar },
    { id: 'retention-islr', label: 'Comprobante de retención (ISLR)', icon: Receipt },
    { id: 'retention-iva', label: 'Comprobante de retención (IVA)', icon: Percent }
] as const

interface SupplierReportsModalProps {
    companyId: string
    isOpen: boolean
    onClose: () => void
}

export function SupplierReportsModal({ companyId, isOpen, onClose }: SupplierReportsModalProps) {
    const router = useRouter()
    const [suppliers, setSuppliers] = useState<{ id: string; name: string; rif: string }[]>([])
    const [loading, setLoading] = useState(false)
    const [selectedSupplierId, setSelectedSupplierId] = useState('')
    const [selectedReportType, setSelectedReportType] = useState<string>('statement')

    useEffect(() => {
        if (!isOpen || !companyId) return
        setLoading(true)
        fetch(`/api/operations/suppliers?companyId=${companyId}`)
            .then(res => res.json())
            .then(data => {
                setSuppliers(Array.isArray(data) ? data : [])
                setSelectedSupplierId(Array.isArray(data) && data.length > 0 ? data[0].id : '')
            })
            .catch(() => setSuppliers([]))
            .finally(() => setLoading(false))
    }, [isOpen, companyId])

    const handleGenerate = () => {
        if (!selectedSupplierId) return
        onClose()
        const base = `/dashboard/operations/suppliers/${selectedSupplierId}`
        switch (selectedReportType) {
            case 'statement':
                router.push(`${base}/statement`)
                break
            case 'aging':
                router.push(`${base}/aging`)
                break
            case 'retention-islr':
                router.push(`${base}/retentions/islr`)
                break
            case 'retention-iva':
                router.push(`${base}/retentions/iva`)
                break
            default:
                router.push(`${base}/statement`)
        }
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
            <div
                className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-5"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex items-center justify-between border-b border-gray-200 pb-3">
                    <h2 className="text-lg font-bold text-gray-800">Reportes por proveedor</h2>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-1 rounded hover:bg-gray-100 text-gray-500 hover:text-gray-700"
                        aria-label="Cerrar"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {loading ? (
                    <p className="text-sm text-gray-500">Cargando proveedores...</p>
                ) : (
                    <>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Proveedor</label>
                            <select
                                value={selectedSupplierId}
                                onChange={e => setSelectedSupplierId(e.target.value)}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="">Seleccione un proveedor</option>
                                {suppliers.map(s => (
                                    <option key={s.id} value={s.id}>{s.name} ({s.rif})</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de reporte</label>
                            <div className="space-y-2">
                                {REPORT_TYPES.map(({ id, label, icon: Icon }) => (
                                    <label
                                        key={id}
                                        className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                                            selectedReportType === id
                                                ? 'border-blue-500 bg-blue-50 text-blue-800'
                                                : 'border-gray-200 hover:bg-gray-50'
                                        }`}
                                    >
                                        <input
                                            type="radio"
                                            name="reportType"
                                            value={id}
                                            checked={selectedReportType === id}
                                            onChange={() => setSelectedReportType(id)}
                                            className="sr-only"
                                        />
                                        <Icon className="w-5 h-5 text-gray-500 flex-shrink-0" />
                                        <span className="text-sm font-medium">{label}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="flex gap-2 pt-2">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                onClick={handleGenerate}
                                disabled={!selectedSupplierId}
                                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Ver reporte
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}
