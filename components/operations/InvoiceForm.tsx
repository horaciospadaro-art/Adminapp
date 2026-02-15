'use client'

import { useState, useEffect, useMemo } from 'react'
import { Plus, Trash2, Save, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { DateInput } from '@/components/common/DateInput'

interface Tax {
    id: string
    name: string
    rate: string
    type: string
}

interface Product {
    id: string
    name: string
    sku: string
    sales_price: string
    type: string
    tax_id: string | null
}

interface ThirdParty {
    id: string
    name: string
    rif: string
}

interface InvoiceItem {
    product_id: string
    description: string
    quantity: number
    unit_price: number
    tax_id: string
    // derived
    total: number
}

export function InvoiceForm() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [loading, setLoading] = useState(false)
    const [pageLoading, setPageLoading] = useState(true)

    // Resources
    const [clients, setClients] = useState<ThirdParty[]>([])
    const [products, setProducts] = useState<Product[]>([])
    const [taxes, setTaxes] = useState<Tax[]>([])

    // Form State
    const [type, setType] = useState('INVOICE')
    const [date, setDate] = useState(new Date().toISOString().split('T')[0])
    const [dueDate, setDueDate] = useState('')
    const [number, setNumber] = useState('') // Invoice Number (Control)
    const [reference, setReference] = useState('')
    const [thirdPartyId, setThirdPartyId] = useState('')

    const [items, setItems] = useState<InvoiceItem[]>([])

    // Initial Load
    useEffect(() => {
        async function loadResources() {
            try {
                const [cliRes, prodRes, taxRes] = await Promise.all([
                    fetch('/api/third-parties?type=CLIENTE'),
                    fetch('/api/inventory/products'),
                    fetch('/api/configuration/taxes')
                ])

                if (cliRes.ok) setClients(await cliRes.json())
                if (prodRes.ok) setProducts(await prodRes.json())
                if (taxRes.ok) setTaxes(await taxRes.json())
            } catch (error) {
                console.error(error)
            } finally {
                setPageLoading(false)
            }
        }
        loadResources()
    }, [])

    // Pre-select client from URL
    useEffect(() => {
        const clientId = searchParams?.get('clientId')
        if (clientId) {
            setThirdPartyId(clientId)
        }
    }, [searchParams])

    const addItem = () => {
        setItems([...items, {
            product_id: '',
            description: '',
            quantity: 1,
            unit_price: 0,
            tax_id: taxes.find(t => t.type === 'IVA')?.id || '',
            total: 0
        }])
    }

    const updateItem = (index: number, field: keyof InvoiceItem, value: any) => {
        const newItems = [...items]
        const item = { ...newItems[index], [field]: value }

        if (field === 'product_id') {
            const prod = products.find(p => p.id === value)
            if (prod) {
                item.description = prod.name
                item.unit_price = parseFloat(prod.sales_price)
                if (prod.tax_id) item.tax_id = prod.tax_id
            }
        }

        item.total = item.quantity * item.unit_price
        newItems[index] = item
        setItems(newItems)
    }

    const removeItem = (index: number) => {
        setItems(items.filter((_, i) => i !== index))
    }

    const calculations = useMemo(() => {
        let subtotal = 0
        let totalTax = 0

        items.forEach(item => {
            const lineBase = item.quantity * item.unit_price
            subtotal += lineBase

            const tax = taxes.find(t => t.id === item.tax_id)
            if (tax) {
                totalTax += lineBase * (parseFloat(tax.rate) / 100)
            }
        })

        const totalInvoice = subtotal + totalTax

        return {
            subtotal,
            totalTax,
            totalInvoice
        }
    }, [items, taxes])

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (!thirdPartyId || !number || items.length === 0) {
            alert('Por favor complete los campos obligatorios')
            return
        }

        setLoading(true)
        try {
            const payload = {
                company_id: '',
                third_party_id: thirdPartyId,
                type: type, // Uses state
                date,
                due_date: dueDate || null,
                number,
                reference,
                items: items.map(item => {
                    const tax = taxes.find(t => t.id === item.tax_id)
                    return {
                        ...item,
                        tax_rate: tax ? parseFloat(tax.rate) : 0
                    }
                })
            }

            const res = await fetch('/api/documents', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })

            if (res.ok) {
                router.push('/dashboard/operations/invoices')
                router.refresh()
            } else {
                const err = await res.json()
                alert('Error: ' + (err.error || 'Unknown error'))
            }
        } catch (error) {
            console.error(error)
            alert('Error de conexión')
        } finally {
            setLoading(false)
        }
    }

    if (pageLoading) return <div className="p-8"><Loader2 className="animate-spin" /></div>

    return (
        <form onSubmit={handleSubmit} className="max-w-5xl mx-auto space-y-6 pb-20">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <h1 className="text-2xl font-bold text-gray-800">
                        {type === 'INVOICE' && 'Factura de Venta'}
                        {type === 'CREDIT_NOTE' && 'Nota de Crédito'}
                        {type === 'DEBIT_NOTE' && 'Nota de Débito'}
                    </h1>
                </div>
                <Link href="/dashboard/operations/invoices" className="text-sm text-blue-600 hover:underline">
                    &larr; Volver
                </Link>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="mb-6 border-b pb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Documento</label>
                    <div className="flex gap-4">
                        <button
                            type="button"
                            onClick={() => setType('INVOICE')}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${type === 'INVOICE' ? 'bg-[#2ca01c] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                        >
                            Factura
                        </button>
                        <button
                            type="button"
                            onClick={() => setType('CREDIT_NOTE')}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${type === 'CREDIT_NOTE' ? 'bg-orange-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                        >
                            Nota de Crédito
                        </button>
                        <button
                            type="button"
                            onClick={() => setType('DEBIT_NOTE')}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${type === 'DEBIT_NOTE' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                        >
                            Nota de Débito
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <div>
                        <label htmlFor="clientSelect" className="block text-sm font-medium text-gray-700 mb-1">Cliente <span className="text-red-500">*</span></label>
                        <select
                            id="clientSelect"
                            value={thirdPartyId}
                            onChange={e => setThirdPartyId(e.target.value)}
                            className="w-full p-2 border rounded focus:ring-blue-500"
                            required
                        >
                            <option value="">Seleccionar...</option>
                            {clients.map(c => (
                                <option key={c.id} value={c.id}>{c.name} ({c.rif})</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="invoiceNumber" className="block text-sm font-medium text-gray-700 mb-1">Nro. {type === 'INVOICE' ? 'Factura' : 'Control'} <span className="text-red-500">*</span></label>
                        <input
                            id="invoiceNumber"
                            value={number}
                            onChange={e => setNumber(e.target.value)}
                            className="w-full p-2 border rounded focus:ring-blue-500"
                            placeholder="000001"
                            required
                        />
                    </div>
                    <div>
                        <DateInput
                            label="Fecha Emisión"
                            value={date}
                            onChange={e => setDate(e.target.value)}
                            required
                        />
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 overflow-hidden">
                <h3 className="text-sm font-semibold text-gray-900 mb-4 uppercase tracking-wider">Items de Venta</h3>

                <table className="w-full text-sm text-left mb-4">
                    <thead className="bg-gray-50 text-gray-600">
                        <tr>
                            <th className="p-2 pl-4">Producto / Servicio</th>
                            <th className="p-2 w-24 text-right">Cant.</th>
                            <th className="p-2 w-32 text-right">Precio Unit.</th>
                            <th className="p-2 w-32">Impuesto</th>
                            <th className="p-2 w-32 text-right">Total</th>
                            <th className="p-2 w-10"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {items.map((item, idx) => (
                            <tr key={idx} className="group">
                                <td className="p-2 pl-4">
                                    <div className="space-y-1">
                                        <select
                                            aria-label="Seleccionar producto"
                                            value={item.product_id}
                                            onChange={e => updateItem(idx, 'product_id', e.target.value)}
                                            className="w-full p-1 border rounded text-xs mb-1"
                                        >
                                            <option value="">(Libre) - Escribir descripción</option>
                                            {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                        </select>
                                        <input
                                            aria-label="Descripción del item"
                                            value={item.description}
                                            onChange={e => updateItem(idx, 'description', e.target.value)}
                                            placeholder="Detalle de venta"
                                            className="w-full p-1 border-b border-gray-300 focus:border-blue-500 focus:outline-none"
                                        />
                                    </div>
                                </td>
                                <td className="p-2">
                                    <input
                                        aria-label="Cantidad"
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={item.quantity}
                                        onChange={e => updateItem(idx, 'quantity', parseFloat(e.target.value) || 0)}
                                        className="w-full text-right p-1 border rounded"
                                    />
                                </td>
                                <td className="p-2">
                                    <input
                                        aria-label="Precio Unitario"
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={item.unit_price}
                                        onChange={e => updateItem(idx, 'unit_price', parseFloat(e.target.value) || 0)}
                                        className="w-full text-right p-1 border rounded"
                                    />
                                </td>
                                <td className="p-2">
                                    <select
                                        aria-label="Impuesto"
                                        value={item.tax_id}
                                        onChange={e => updateItem(idx, 'tax_id', e.target.value)}
                                        className="w-full p-1 border rounded text-xs"
                                    >
                                        {taxes.map(t => <option key={t.id} value={t.id}>{t.name} ({Number(t.rate)}%)</option>)}
                                    </select>
                                </td>
                                <td className="p-2 text-right font-medium">
                                    {(item.quantity * item.unit_price).toFixed(2)}
                                </td>
                                <td className="p-2 text-center">
                                    <button
                                        type="button"
                                        aria-label="Eliminar item"
                                        onClick={() => removeItem(idx)}
                                        className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                <button
                    type="button"
                    onClick={addItem}
                    className="flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm font-medium px-4"
                >
                    <Plus className="w-4 h-4" /> Agregar Item
                </button>
            </div>

            {/* Calculations & Submit */}
            <div className="flex justify-end">
                <div className="w-full md:w-1/2 bg-gray-50 p-6 rounded-lg border border-gray-200">
                    <div className="space-y-3 text-sm">
                        <div className="flex justify-between text-[1.006rem]">
                            <span className="text-gray-600">Subtotal</span>
                            <span className="font-medium">{calculations.subtotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-[1.006rem]">
                            <span className="text-gray-600">IVA</span>
                            <span className="font-medium">{calculations.totalTax.toFixed(2)}</span>
                        </div>
                        <div className="border-t-2 border-gray-800 pt-3 mt-4">
                            <div className="flex justify-between text-lg font-bold">
                                <span>Neto a Cobrar</span>
                                <span className="text-[#2ca01c]">
                                    {calculations.totalInvoice.toFixed(2)}
                                </span>
                            </div>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full mt-6 bg-[#2ca01c] hover:bg-[#248217] text-white px-8 py-3 rounded-lg font-medium shadow-sm flex items-center justify-center gap-2"
                    >
                        {loading ? <Loader2 className="animate-spin w-5 h-5" /> : <Save className="w-5 h-5" />}
                        Guardar Venta
                    </button>
                </div>
            </div>
        </form>
    )
}
