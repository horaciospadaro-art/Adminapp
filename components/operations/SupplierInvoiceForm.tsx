'use client'

import { useState, useMemo } from 'react'
import { Calendar, Upload, Plus, Trash2, Calculator } from 'lucide-react'

// Mock Tax Data - In production this comes from API/DB
const TAX_RATES = [
    { id: '1', name: 'IVA General', rate: 16.00, type: 'IVA' },
    { id: '2', name: 'IVA Reducido', rate: 8.00, type: 'IVA' },
    { id: '3', name: 'Exento', rate: 0.00, type: 'IVA' },
]

const RETENTION_IVA_RATES = [0, 75, 100]
const RETENTION_ISLR_CONCEPTS = [
    { id: '1', name: 'Honorarios Profesionales', base_min: 0, rate: 3, subtract: 0 },
    { id: '2', name: 'Servicios', base_min: 0, rate: 2, subtract: 0 },
]

export function SupplierInvoiceForm() {
    // Form State
    const [baseAmount, setBaseAmount] = useState<number>(0)
    const [selectedTaxId, setSelectedTaxId] = useState<string>('1')

    // Retention State
    const [applyRetentionIVA, setApplyRetentionIVA] = useState(false)
    const [retentionIVAPercentage, setRetentionIVAPercentage] = useState(75)

    const [applyRetentionISLR, setApplyRetentionISLR] = useState(false)
    const [selectedISLRConcept, setSelectedISLRConcept] = useState<string>('1')

    // Derived Calculations
    const calculations = useMemo(() => {
        const taxRate = TAX_RATES.find(t => t.id === selectedTaxId)?.rate || 0
        const ivaAmount = baseAmount * (taxRate / 100)
        const totalInvoice = baseAmount + ivaAmount

        let retIVA = 0
        if (applyRetentionIVA) {
            retIVA = ivaAmount * (retentionIVAPercentage / 100)
        }

        let retISLR = 0
        if (applyRetentionISLR) {
            const concept = RETENTION_ISLR_CONCEPTS.find(c => c.id === selectedISLRConcept)
            if (concept) {
                retISLR = (baseAmount * (concept.rate / 100)) - concept.subtract
                if (retISLR < 0) retISLR = 0
            }
        }

        const totalPayable = totalInvoice - retIVA - retISLR

        return {
            ivaAmount,
            totalInvoice,
            retIVA,
            retISLR,
            totalPayable
        }
    }, [baseAmount, selectedTaxId, applyRetentionIVA, retentionIVAPercentage, applyRetentionISLR, selectedISLRConcept])

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 max-w-4xl mx-auto">
            <h2 className="text-xl font-bold text-gray-800 mb-6 border-b pb-2">
                Registro de Factura de Compra
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {/* Header Info */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Proveedor</label>
                    <div className="p-2 bg-gray-50 border rounded text-gray-600">
                        Selector de Proveedor...
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nro. Factura / Control</label>
                    <input type="text" className="w-full p-2 border rounded focus:ring-blue-500 focus:border-blue-500" placeholder="000123" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Emisión</label>
                    <div className="relative">
                        <input type="date" className="w-full p-2 border rounded focus:ring-blue-500 focus:border-blue-500" />
                    </div>
                </div>
            </div>

            {/* Core Financials */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                {/* Inputs */}
                <div className="space-y-4">
                    <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                        <Upload className="w-4 h-4" /> Datos de la Factura
                    </h3>

                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 space-y-4">
                        <div>
                            <label className="block text-sm font-semibold text-blue-900 mb-1">Base Imponible</label>
                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={baseAmount || ''}
                                onChange={(e) => setBaseAmount(parseFloat(e.target.value) || 0)}
                                className="w-full p-2 border border-blue-200 rounded text-right font-mono text-lg focus:ring-blue-500"
                                placeholder="0.00"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Alícuota IVA</label>
                            <select
                                value={selectedTaxId}
                                onChange={(e) => setSelectedTaxId(e.target.value)}
                                className="w-full p-2 border rounded bg-white"
                            >
                                {TAX_RATES.map(tax => (
                                    <option key={tax.id} value={tax.id}>
                                        {tax.name} ({tax.rate}%)
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={applyRetentionIVA}
                                onChange={(e) => setApplyRetentionIVA(e.target.checked)}
                                className="rounded text-blue-600 focus:ring-blue-500"
                            />
                            Aplicar Retención de IVA
                        </label>

                        {applyRetentionIVA && (
                            <div className="pl-6 animate-in fade-in slide-in-from-top-2">
                                <select
                                    value={retentionIVAPercentage}
                                    onChange={(e) => setRetentionIVAPercentage(Number(e.target.value))}
                                    className="w-full p-2 border rounded text-sm bg-gray-50"
                                >
                                    {RETENTION_IVA_RATES.map(rate => (
                                        <option key={rate} value={rate}>{rate}% Retención</option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>

                    <div className="space-y-2">
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={applyRetentionISLR}
                                onChange={(e) => setApplyRetentionISLR(e.target.checked)}
                                className="rounded text-blue-600 focus:ring-blue-500"
                            />
                            Aplicar Retención de ISLR
                        </label>

                        {applyRetentionISLR && (
                            <div className="pl-6 animate-in fade-in slide-in-from-top-2">
                                <select
                                    value={selectedISLRConcept}
                                    onChange={(e) => setSelectedISLRConcept(e.target.value)}
                                    className="w-full p-2 border rounded text-sm bg-gray-50"
                                >
                                    {RETENTION_ISLR_CONCEPTS.map(concept => (
                                        <option key={concept.id} value={concept.id}>
                                            {concept.name} ({concept.rate}%)
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>
                </div>

                {/* Summary / Calculations */}
                <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                    <h3 className="font-semibold text-gray-900 flex items-center gap-2 mb-4">
                        <Calculator className="w-4 h-4" /> Resumen de Cálculos
                    </h3>

                    <div className="space-y-3 text-sm">
                        <div className="flex justify-between">
                            <span className="text-gray-600">Base Imponible</span>
                            <span className="font-medium">{baseAmount.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600">IVA Calculado</span>
                            <span className="font-medium">{calculations.ivaAmount.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between border-t pt-2 font-semibold">
                            <span>Total Factura</span>
                            <span>{calculations.totalInvoice.toFixed(2)}</span>
                        </div>

                        {(calculations.retIVA > 0 || calculations.retISLR > 0) && (
                            <div className="border-t border-dashed border-gray-300 my-2"></div>
                        )}

                        {calculations.retIVA > 0 && (
                            <div className="flex justify-between text-red-600">
                                <span>(-) Retención IVA ({retentionIVAPercentage}%)</span>
                                <span>-{calculations.retIVA.toFixed(2)}</span>
                            </div>
                        )}

                        {calculations.retISLR > 0 && (
                            <div className="flex justify-between text-red-600">
                                <span>(-) Retención ISLR</span>
                                <span>-{calculations.retISLR.toFixed(2)}</span>
                            </div>
                        )}

                        <div className="border-t-2 border-gray-800 pt-3 mt-4">
                            <div className="flex justify-between text-lg font-bold">
                                <span>Total a Pagar</span>
                                <span className="text-[#2ca01c]">
                                    {calculations.totalPayable.toFixed(2)}
                                </span>
                            </div>
                        </div>
                    </div>

                    <button className="w-full mt-8 bg-[#2ca01c] hover:bg-[#248217] text-white font-medium py-3 rounded-lg shadow transition-colors flex items-center justify-center gap-2">
                        <Plus className="w-5 h-5" /> Registrar Compra
                    </button>
                </div>
            </div>
        </div>
    )
}
