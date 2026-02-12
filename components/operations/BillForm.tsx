'use client'

import { useState, useEffect, useMemo } from 'react'
import { Calendar, Upload, Plus, Trash2, Calculator, Save, Loader2, ArrowLeft } from 'lucide-react'
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

interface BillItem {
    product_id: string
    description: string
    quantity: number
    unit_price: number
    tax_id: string
    // derived
    total: number

    // New fields
    tax_rate: number
    tax_amount: number

    vat_retention_rate: number
    vat_retention_amount: number

    islr_rate: number
    islr_amount: number
    islr_concept_id?: string // New field
}

interface ISLRConcept {
    id: string
    description: string
    pn_resident_rate: number
    pn_non_resident_rate: number
    pj_domiciled_rate: number
    pj_non_domiciled_rate: number
}

export function BillForm() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [loading, setLoading] = useState(false)
    const [pageLoading, setPageLoading] = useState(true)

    // Resources
    const [suppliers, setSuppliers] = useState<ThirdParty[]>([])
    const [products, setProducts] = useState<Product[]>([])
    const [taxes, setTaxes] = useState<Tax[]>([])
    const [islrConcepts, setIslrConcepts] = useState<ISLRConcept[]>([])

    // Form State
    const [date, setDate] = useState(new Date().toISOString().split('T')[0])
    const [accountingDate, setAccountingDate] = useState(new Date().toISOString().split('T')[0])
    const [dueDate, setDueDate] = useState('')
    const [number, setNumber] = useState('')
    const [controlNumber, setControlNumber] = useState('')
    const [reference, setReference] = useState('')
    const [thirdPartyId, setThirdPartyId] = useState('')

    const [items, setItems] = useState<BillItem[]>([])

    // Initial Load
    useEffect(() => {
        async function loadResources() {
            try {
                const [supRes, prodRes, taxRes, conceptRes] = await Promise.all([
                    fetch('/api/third-parties?type=PROVEEDOR'),
                    fetch('/api/inventory/products'),
                    fetch('/api/configuration/taxes'),
                    fetch('/api/configuration/islr-concepts')
                ])

                if (supRes.ok) setSuppliers(await supRes.json())
                if (prodRes.ok) setProducts(await prodRes.json())
                if (taxRes.ok) setTaxes(await taxRes.json())
                if (conceptRes.ok) setIslrConcepts(await conceptRes.json())
            } catch (error) {
                console.error(error)
            } finally {
                setPageLoading(false)
            }
        }
        loadResources()
    }, [])

    // Pre-select supplier from URL
    useEffect(() => {
        const supplierId = searchParams?.get('supplierId')
        if (supplierId) {
            setThirdPartyId(supplierId)
        }
    }, [searchParams])

    const addItem = () => {
        setItems([...items, {
            product_id: '',
            description: '',
            quantity: 1,
            unit_price: 0,
            tax_id: taxes.find(t => t.type === 'IVA')?.id || '',
            total: 0,
            tax_rate: 0,
            tax_amount: 0,
            vat_retention_rate: 0,
            vat_retention_amount: 0,
            islr_rate: 0,
            islr_amount: 0,
            islr_concept_id: ''
        }])
    }

    const updateItem = (index: number, field: keyof BillItem, value: any) => {
        const newItems = [...items]
        const item = { ...newItems[index], [field]: value }

        // Auto-fill defaults if product selected
        if (field === 'product_id') {
            const prod = products.find(p => p.id === value)
            if (prod) {
                item.description = prod.name
                item.unit_price = parseFloat(prod.sales_price)
                if (prod.tax_id) item.tax_id = prod.tax_id
            }
        }

        // Auto-update tax rate if tax_id changes (or product changed)
        if (field === 'tax_id' || field === 'product_id') {
            const tax = taxes.find(t => t.id === item.tax_id)
            item.tax_rate = tax ? parseFloat(tax.rate) : 0
        }

        // Auto-update ISLR rate if concept or supplier changes (concept change handled here)
        if (field === 'islr_concept_id') {
            const concept = islrConcepts.find(c => c.id === value)
            const supplier = suppliers.find(s => s.id === thirdPartyId) as any
            const type = supplier?.taxpayer_type || 'PJ_DOMICILIADA'

            if (concept) {
                let rate = 0
                switch (type) {
                    case 'PN_RESIDENTE': rate = Number(concept.pn_resident_rate); break;
                    case 'PN_NO_RESIDENTE': rate = Number(concept.pn_non_resident_rate); break;
                    case 'PJ_DOMICILIADA': rate = Number(concept.pj_domiciled_rate); break;
                    case 'PJ_NO_DOMICILIADA': rate = Number(concept.pj_non_domiciled_rate); break;
                    default: rate = Number(concept.pj_domiciled_rate);
                }
                item.islr_rate = rate
            } else {
                item.islr_rate = 0
            }
        }

        // Calculations per line
        const base = item.quantity * item.unit_price
        item.tax_amount = base * (item.tax_rate / 100)

        // Retentions
        item.vat_retention_amount = item.tax_amount * (item.vat_retention_rate / 100)
        item.islr_amount = base * (item.islr_rate / 100)

        item.total = base + item.tax_amount

        newItems[index] = item
        setItems(newItems)
    }

    const removeItem = (index: number) => {
        setItems(items.filter((_, i) => i !== index))
    }

    // Calculations
    const calculations = useMemo(() => {
        let subtotal = 0
        let totalTax = 0
        let totalRetIVA = 0
        let totalRetISLR = 0

        items.forEach(item => {
            const lineBase = item.quantity * item.unit_price
            subtotal += lineBase
            totalTax += item.tax_amount
            totalRetIVA += item.vat_retention_amount
            totalRetISLR += item.islr_amount
        })

        const totalInvoice = subtotal + totalTax

        return {
            subtotal,
            totalTax,
            totalInvoice,
            totalRetIVA,
            totalRetISLR,
            totalPayable: totalInvoice - totalRetIVA - totalRetISLR
        }
    }, [items])

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (!thirdPartyId || !number || items.length === 0) {
            alert('Por favor complete los campos obligatorios')
            return
        }

        setLoading(true)
        try {
            const payload = {
                company_id: '', // Backend resolves
                third_party_id: thirdPartyId,
                type: 'BILL',
                date,
                accounting_date: accountingDate,
                due_date: dueDate || null,
                number,
                control_number: controlNumber,
                reference,
                items: items.map(item => ({
                    ...item,
                    quantity: Number(item.quantity),
                    unit_price: Number(item.unit_price),
                    tax_rate: Number(item.tax_rate),
                    tax_amount: Number(item.tax_amount),
                    vat_retention_rate: Number(item.vat_retention_rate),
                    vat_retention_amount: Number(item.vat_retention_amount),
                    islr_rate: Number(item.islr_rate),
                    islr_amount: Number(item.islr_amount),
                })),
            }

            const res = await fetch('/api/documents', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })

            if (res.ok) {
                router.push('/dashboard/operations/bills')
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
        <form onSubmit={handleSubmit} className="w-full mx-auto space-y-6 pb-20">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-800">Registrar Factura de Compra</h1>
                <Link href="/dashboard/operations/bills" className="text-sm text-blue-600 hover:underline">
                    &larr; Volver
                </Link>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Proveedor <span className="text-red-500">*</span></label>
                        <select
                            value={thirdPartyId}
                            onChange={e => setThirdPartyId(e.target.value)}
                            className="w-full p-2 border rounded focus:ring-blue-500"
                            required
                        >
                            <option value="">Seleccionar...</option>
                            {suppliers.map(s => (
                                <option key={s.id} value={s.id}>{s.name} ({s.rif})</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <div className="flex gap-2">
                            <div className="flex-1">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nro. Factura <span className="text-red-500">*</span></label>
                                <input
                                    value={number}
                                    onChange={e => setNumber(e.target.value)}
                                    className="w-full p-2 border rounded focus:ring-blue-500"
                                    placeholder="000123"
                                    required
                                />
                            </div>
                            <div className="flex-1">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nro. Control</label>
                                <input
                                    value={controlNumber}
                                    onChange={e => setControlNumber(e.target.value)}
                                    className="w-full p-2 border rounded focus:ring-blue-500"
                                    placeholder="00-..."
                                />
                            </div>
                        </div>
                    </div>
                    <div>
                        <div className="flex gap-2">
                            <div className="flex-1">
                                <DateInput
                                    label="Fecha Emisión"
                                    value={date}
                                    onChange={e => {
                                        setDate(e.target.value)
                                        if (e.target.value) setAccountingDate(e.target.value)
                                    }}
                                    required
                                />
                            </div>
                            <div className="flex-1">
                                <DateInput
                                    label="F. Contable"
                                    value={accountingDate}
                                    onChange={e => setAccountingDate(e.target.value)}
                                    required
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 overflow-hidden">
                <h3 className="text-sm font-semibold text-gray-900 mb-4 uppercase tracking-wider">Detalle de Factura</h3>

                <div className="overflow-x-auto">
                    <table className="w-full text-xs mb-4 table-auto">
                        <thead className="bg-gray-100 text-gray-700">
                            <tr>
                                <th className="p-2 pl-4 text-center">Producto / Descripción</th>
                                <th className="p-2 text-center">Cant.</th>
                                <th className="p-2 text-center">Precio Unit.</th>
                                <th className="p-2 text-center">Base Imp.</th>
                                <th className="p-2 text-center">Tasa IVA</th>
                                <th className="p-2 text-center">Monto IVA</th>
                                <th className="p-2 text-center">% Ret IVA</th>
                                <th className="p-2 text-center">Ret IVA</th>
                                <th className="p-2 text-center text-red-600 font-bold">Concepto ISLR</th>
                                <th className="p-2 text-center">% ISLR</th>
                                <th className="p-2 text-center">Ret ISLR</th>
                                <th className="p-2 text-center font-semibold">Total</th>
                                <th className="p-2 text-center font-bold">Neto</th>
                                <th className="p-2"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {items.map((item, idx) => (
                                <tr key={idx} className="group hover:bg-gray-50 transition-colors">
                                    <td className="p-2 pl-4">
                                        <div className="space-y-1">
                                            <select
                                                value={item.product_id}
                                                onChange={e => updateItem(idx, 'product_id', e.target.value)}
                                                className="w-full p-1 border rounded text-xs mb-1"
                                            >
                                                <option value="">(Libre)</option>
                                                {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                            </select>
                                            <input
                                                value={item.description}
                                                onChange={e => updateItem(idx, 'description', e.target.value)}
                                                placeholder="Descripción"
                                                className="w-full p-1 border-b border-gray-300 focus:border-blue-500 focus:outline-none bg-transparent"
                                            />
                                        </div>
                                    </td>
                                    <td className="p-2">
                                        <input
                                            type="number" min="0" step="0.01"
                                            value={item.quantity}
                                            onChange={e => updateItem(idx, 'quantity', parseFloat(e.target.value) || 0)}
                                            className="w-full text-right p-1 border rounded"
                                        />
                                    </td>
                                    <td className="p-2">
                                        <input
                                            type="number" min="0" step="0.01"
                                            value={item.unit_price}
                                            onChange={e => updateItem(idx, 'unit_price', parseFloat(e.target.value) || 0)}
                                            className="w-full text-right p-1 border rounded"
                                        />
                                    </td>
                                    <td className="p-2 text-right">
                                        {(item.quantity * item.unit_price).toFixed(2)}
                                    </td>
                                    <td className="p-2">
                                        <select
                                            value={item.tax_id}
                                            onChange={e => updateItem(idx, 'tax_id', e.target.value)}
                                            className="w-full p-1 border rounded text-xs"
                                        >
                                            {taxes.map(t => <option key={t.id} value={t.id}>{t.name} ({Number(t.rate)}%)</option>)}
                                        </select>
                                    </td>
                                    <td className="p-2 text-right">
                                        {item.tax_amount.toFixed(2)}
                                    </td>
                                    <td className="p-2">
                                        <select
                                            value={item.vat_retention_rate}
                                            onChange={e => updateItem(idx, 'vat_retention_rate', parseFloat(e.target.value) || 0)}
                                            className="w-full p-1 border rounded text-xs"
                                        >
                                            <option value="0">0%</option>
                                            <option value="75">75%</option>
                                            <option value="100">100%</option>
                                        </select>
                                    </td>
                                    <td className="p-2 text-right">
                                        {item.vat_retention_amount.toFixed(2)}
                                    </td>
                                    <td className="p-2">
                                        <input
                                            type="number" min="0" step="0.5"
                                            value={item.islr_rate}
                                            onChange={e => updateItem(idx, 'islr_rate', parseFloat(e.target.value) || 0)}
                                            className="w-full text-right p-1 border rounded"
                                            placeholder="%"
                                            readOnly
                                            aria-label="Tasa ISLR"
                                        />
                                    </td>
                                    <td className="p-2">
                                        <select
                                            value={item.islr_concept_id || ''}
                                            onChange={e => updateItem(idx, 'islr_concept_id', e.target.value)}
                                            className="w-full p-1 border rounded text-xs"
                                            aria-label="Concepto ISLR"
                                        >
                                            <option value="">(Ninguno)</option>
                                            {islrConcepts.map(c => <option key={c.id} value={c.id}>{c.description}</option>)}
                                        </select>

                                    </td>
                                    <td className="p-2 text-right">
                                        {item.islr_amount.toFixed(2)}
                                    </td>
                                    <td className="p-2 text-right font-medium">
                                        {(item.quantity * item.unit_price + item.tax_amount).toFixed(2)}
                                    </td>
                                    <td className="p-2 text-right font-bold">
                                        {(item.quantity * item.unit_price + item.tax_amount - item.vat_retention_amount - item.islr_amount).toFixed(2)}
                                    </td>
                                    <td className="p-2 text-center">
                                        <button type="button" onClick={() => removeItem(idx)} className="text-gray-400 hover:text-red-500">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <button
                    type="button"
                    onClick={addItem}
                    className="flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm font-medium px-4"
                >
                    <Plus className="w-4 h-4" /> Agregar Línea
                </button>
            </div>

            {/* Calculations & Submit */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                    {/* Left blank or for notes */}
                </div>

                <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                    <div className="space-y-3 text-sm">
                        <div className="flex justify-between">
                            <span className="text-gray-600">Subtotal (Base Imponible)</span>
                            <span className="font-medium">{calculations.subtotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600">IVA Total</span>
                            <span className="font-medium">{calculations.totalTax.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between border-t pt-2 font-semibold">
                            <span>Total Factura</span>
                            <span>{calculations.totalInvoice.toFixed(2)}</span>
                        </div>

                        <div className="flex justify-between text-red-600 text-xs mt-2">
                            <span>(-) Total Retención IVA</span>
                            <span>-{calculations.totalRetIVA.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-red-600 text-xs mt-1">
                            <span>(-) Total Retención ISLR</span>
                            <span>-{calculations.totalRetISLR.toFixed(2)}</span>
                        </div>

                        <div className="border-t-2 border-gray-800 pt-3 mt-4">
                            <div className="flex justify-between text-lg font-bold">
                                <span>Neto a Pagar</span>
                                <span className="text-[#2ca01c]">
                                    {calculations.totalPayable.toFixed(2)}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex justify-end gap-4">
                <Link href="/dashboard/operations/bills" className="px-6 py-3 text-gray-600 hover:bg-gray-50 rounded-lg">
                    Cancelar
                </Link>
                <button
                    type="submit"
                    disabled={loading}
                    className="bg-[#2ca01c] hover:bg-[#248217] text-white px-8 py-3 rounded-lg font-medium shadow-sm flex items-center gap-2"
                >
                    {loading ? <Loader2 className="animate-spin w-5 h-5" /> : <Save className="w-5 h-5" />}
                    Registrar Factura
                </button>
            </div>
        </form>
    )
}
