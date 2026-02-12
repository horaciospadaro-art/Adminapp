'use client'

import { useState } from 'react'
import { Calendar, ChevronDown, Download, Filter, Layout, Search, RefreshCw } from 'lucide-react'
import { getDynamicReportData } from '@/app/actions/reports'
import { DateInput } from '@/components/common/DateInput'

// Field Definition
type ReportField = {
    id: string
    label: string
    category: 'basic' | 'contact' | 'fiscal' | 'accounting' | 'document' | 'financial'
}

const AVAILABLE_FIELDS: ReportField[] = [
    // Basic
    { id: 'name', label: 'Nombre / Razón Social', category: 'basic' },
    { id: 'rif', label: 'RIF / CI', category: 'basic' },
    { id: 'status', label: 'Estado', category: 'basic' },
    // Contact
    { id: 'email', label: 'Correo Electrónico', category: 'contact' },
    { id: 'phone', label: 'Teléfono', category: 'contact' },
    { id: 'address', label: 'Dirección', category: 'contact' },
    // Fiscal
    { id: 'type', label: 'Tipo Persona', category: 'fiscal' },
    { id: 'is_tax_payer_special', label: 'Contribuyente Especial', category: 'fiscal' },
    { id: 'retention_agent_islr', label: 'Agente Retención ISLR', category: 'fiscal' },
    // Accounting
    { id: 'account_code', label: 'Cuenta Contable', category: 'accounting' },
    { id: 'balance', label: 'Saldo Actual (Contable)', category: 'accounting' },
    // Document Specific
    { id: 'date', label: 'Fecha Emisión', category: 'document' },
    { id: 'due_date', label: 'Fecha Vencimiento', category: 'document' },
    { id: 'number', label: 'Número Control', category: 'document' },
    { id: 'reference', label: 'Referencia', category: 'document' },
    // Financial Specific
    { id: 'subtotal', label: 'Subtotal', category: 'financial' },
    { id: 'tax_amount', label: 'Impuestos', category: 'financial' },
    { id: 'total', label: 'Total', category: 'financial' },
    { id: 'pending_balance', label: 'Saldo Pendiente', category: 'financial' },
]

export function DynamicReportBuilder() {
    const [module, setModule] = useState('clients') // clients, suppliers, invoices, bills
    const [selectedFields, setSelectedFields] = useState<string[]>(['name', 'rif', 'email', 'balance'])
    const [data, setData] = useState<any[]>([])
    const [loading, setLoading] = useState(false)
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

    // Date Filters
    const now = new Date()
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]
    const [startDate, setStartDate] = useState(firstDay)
    const [endDate, setEndDate] = useState(lastDay)

    const toggleField = (id: string) => {
        if (selectedFields.includes(id)) {
            setSelectedFields(selectedFields.filter(f => f !== id))
        } else {
            setSelectedFields([...selectedFields, id])
        }
    }

    const handleGenerate = async () => {
        setLoading(true)
        try {
            const results = await getDynamicReportData(module, selectedFields, startDate, endDate)
            setData(results)
            setLastUpdated(new Date())
        } catch (error) {
            console.error(error)
            alert('Error generando el reporte')
        } finally {
            setLoading(false)
        }
    }

    const handleExport = () => {
        if (data.length === 0) return

        // CSV Header
        const header = selectedFields.map(id => {
            const field = AVAILABLE_FIELDS.find(f => f.id === id)
            return `"${field?.label || id}"`
        }).join(',')

        // CSV Rows
        const rows = data.map(row => {
            return selectedFields.map(id => {
                const val = row[id] !== undefined && row[id] !== null ? String(row[id]) : ''
                return `"${val.replace(/"/g, '""')}"` // Escape quotes
            }).join(',')
        }).join('\n')

        const csvContent = `\uFEFF${header}\n${rows}` // Add BOM for Excel
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.setAttribute('download', `reporte_${module}_${new Date().toISOString().split('T')[0]}.csv`)
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    // Group fields for UI
    const groupedFields = {
        basic: AVAILABLE_FIELDS.filter(f => f.category === 'basic'),
        contact: AVAILABLE_FIELDS.filter(f => f.category === 'contact'),
        fiscal: AVAILABLE_FIELDS.filter(f => f.category === 'fiscal'),
        accounting: AVAILABLE_FIELDS.filter(f => f.category === 'accounting'),
        document: AVAILABLE_FIELDS.filter(f => f.category === 'document'),
        financial: AVAILABLE_FIELDS.filter(f => f.category === 'financial'),
    }

    return (
        <div className="grid grid-cols-12 gap-6 h-[calc(100vh-140px)]">
            {/* Sidebar: Configuración */}
            <div className="col-span-12 md:col-span-3 flex flex-col gap-4">

                {/* Selector de Módulo */}
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Módulo</label>
                        <select
                            value={module}
                            onChange={(e) => {
                                setModule(e.target.value)
                                // Reset fields based on module? Or keep intersecting ones?
                                // For now keep as is, user must select relevant fields.
                                if (e.target.value === 'invoices' || e.target.value === 'bills') {
                                    setSelectedFields(['date', 'number', 'name', 'total', 'status'])
                                } else {
                                    setSelectedFields(['name', 'rif', 'email', 'balance'])
                                }
                            }}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="clients">Clientes</option>
                            <option value="suppliers">Proveedores</option>
                            <option value="invoices">Ventas (Facturas)</option>
                            <option value="bills">Compras (Facturas)</option>
                        </select>
                    </div>

                    {/* Date Filters */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Rango de Fecha</label>
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <DateInput
                                    value={startDate}
                                    onChange={e => setStartDate(e.target.value)}
                                />
                            </div>
                            <div>
                                <DateInput
                                    value={endDate}
                                    onChange={e => setEndDate(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Selector de Campos */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 flex-1 flex flex-col overflow-hidden">
                    <div className="p-3 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                        <h3 className="font-semibold text-gray-700 text-sm flex items-center gap-2">
                            <Layout className="w-4 h-4 text-orange-500" />
                            Columnas
                        </h3>
                        <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">
                            {selectedFields.length}
                        </span>
                    </div>

                    <div className="p-4 overflow-y-auto space-y-4 flex-1">
                        {Object.entries(groupedFields).map(([category, fields]) => {
                            if (fields.length === 0) return null
                            // Hide document fields if not looking at documents
                            const isDocModule = module === 'invoices' || module === 'bills'
                            if ((category === 'document' || category === 'financial') && !isDocModule) return null
                            // Hide some contact fields if looking at documents (maybe kep them joined?)
                            // Let's allow everything for now, but in reality backend only maps some.

                            return (
                                <div key={category}>
                                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                                        {category === 'basic' ? 'Básicos' :
                                            category === 'contact' ? 'Contacto' :
                                                category === 'fiscal' ? 'Fiscal' :
                                                    category === 'accounting' ? 'Contable' :
                                                        category === 'document' ? 'Documento' : 'Financiero'}
                                    </h4>
                                    <div className="space-y-2">
                                        {fields.map(field => (
                                            <label key={field.id} className="flex items-center gap-2 cursor-pointer group">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedFields.includes(field.id)}
                                                    onChange={() => toggleField(field.id)}
                                                    className="w-4 h-4 text-[#4CAF50] border-gray-300 rounded focus:ring-[#4CAF50] cursor-pointer"
                                                />
                                                <span className={`text-sm group-hover:text-gray-900 ${selectedFields.includes(field.id) ? 'text-gray-800 font-medium' : 'text-gray-500'}`}>
                                                    {field.label}
                                                </span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            )
                        })}
                    </div>

                    <div className="p-4 border-t border-gray-100 bg-gray-50">
                        <button
                            onClick={handleGenerate}
                            disabled={loading}
                            className="w-full flex justify-center items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md text-sm font-medium transition-colors disabled:opacity-50"
                        >
                            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Filter className="w-4 h-4" />}
                            {loading ? 'Generando...' : 'Generar Reporte'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Main: Visor de Reporte */}
            <div className="col-span-12 md:col-span-9 flex flex-col">
                {/* Toolbar */}
                <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-200 flex justify-between items-center mb-4">
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Filtrar resultados..."
                                className="pl-9 pr-4 py-1.5 border border-gray-300 rounded-md text-sm w-48 focus:ring-1 focus:ring-blue-500"
                            />
                        </div>
                        {lastUpdated && (
                            <span className="text-xs text-gray-400">
                                Actualizado: {lastUpdated.toLocaleTimeString()}
                            </span>
                        )}
                    </div>
                    <button
                        onClick={handleExport}
                        disabled={data.length === 0}
                        className="flex items-center gap-2 px-3 py-1.5 text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 text-sm font-medium disabled:opacity-50"
                    >
                        <Download className="w-4 h-4" /> Exportar CSV
                    </button>
                </div>

                {/* Tabla Results */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 flex-1 overflow-hidden flex flex-col">
                    {data.length === 0 && !loading && (
                        <div className="h-full flex flex-col items-center justify-center text-gray-400">
                            <Layout className="w-16 h-16 mb-4 opacity-10" />
                            <p>Seleccione sus columnas y haga clic en "Generar Reporte"</p>
                        </div>
                    )}

                    {data.length > 0 && (
                        <div className="overflow-auto flex-1">
                            <table className="w-full text-sm text-left border-collapse">
                                <thead className="text-xs text-gray-500 uppercase bg-gray-50 sticky top-0 z-10 shadow-sm">
                                    <tr>
                                        {selectedFields.map(fieldId => {
                                            const field = AVAILABLE_FIELDS.find(f => f.id === fieldId)
                                            return (
                                                <th key={fieldId} className="px-6 py-3 font-semibold whitespace-nowrap border-b border-gray-200 bg-gray-50">
                                                    {field?.label}
                                                </th>
                                            )
                                        })}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {data.map((row, idx) => (
                                        <tr key={idx} className="hover:bg-blue-50/30 transition-colors">
                                            {selectedFields.map(fieldId => (
                                                <td key={`${idx}-${fieldId}`} className="px-6 py-3 whitespace-nowrap text-gray-700 border-b border-gray-100 font-mono">
                                                    {row[fieldId] !== undefined && row[fieldId] !== null ? String(row[fieldId]) : '-'}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
