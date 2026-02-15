'use client'

import { useState, useEffect, useMemo } from 'react'
import { Calendar, Upload, Plus, Trash2, Calculator, Save, Loader2, ArrowLeft, Package, Receipt } from 'lucide-react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { DateInput } from '@/components/common/DateInput'
import { AccountSelector } from '@/components/common/AccountSelector'

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
    gl_account_id: string  // For expense bills
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

interface BillFormProps {
    companyId?: string
}

export function BillForm({ companyId }: BillFormProps) {
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
    const [documentType, setDocumentType] = useState('BILL') // BILL, DEBIT_NOTE, CREDIT_NOTE
    const [billType, setBillType] = useState<'PURCHASE' | 'EXPENSE'>('PURCHASE')

    // Effect: Debit/Credit Notes are strictly Expense/Financial type
    // Effect: Debit Notes are strictly Expense. Credit Notes can be both (Financial or Return).
    useEffect(() => {
        if (documentType === 'DEBIT_NOTE') {
            setBillType('EXPENSE')
        }
    }, [documentType])

    // Origin Bill Logic (For Returns)
    const [originBillId, setOriginBillId] = useState('')
    const [supplierBills, setSupplierBills] = useState<any[]>([])

    useEffect(() => {
        if (thirdPartyId && documentType === 'CREDIT_NOTE' && billType === 'PURCHASE') {
            fetch(`/api/operations/suppliers/bills?third_party_id=${thirdPartyId}&type=BILL`)
                .then(res => res.json())
                .then(data => {
                    if (Array.isArray(data)) setSupplierBills(data)
                })
                .catch(err => console.error(err))
        } else {
            setSupplierBills([])
        }
    }, [thirdPartyId, documentType, billType])

    // Load items from origin bill
    const handleOriginBillChange = (billId: string) => {
        setOriginBillId(billId)
        const bill = supplierBills.find(b => b.id === billId)
        if (bill && bill.items) {
            // Map items
            const newItems = bill.items.map((item: any) => ({
                product_id: item.product_id,
                gl_account_id: item.gl_account_id,
                description: item.description,
                quantity: Number(item.quantity), // Default to full return? Or 0? Let's default to full for convenience.
                unit_price: Number(item.unit_price), // Lock price?
                tax_id: '',
                total: 0,
                // Taxes need to be recalculated or loaded?
                // For simplicity, we assume same tax structure.
                tax_rate: Number(item.tax_rate),
                tax_amount: Number(item.tax_amount),
                vat_retention_rate: Number(item.vat_retention_rate),
                vat_retention_amount: Number(item.vat_retention_amount),
                islr_rate: Number(item.islr_rate),
                islr_amount: Number(item.islr_amount),
                islr_concept_id: '' // Need to find logic for this
            }))
            setItems(newItems)
        }
    }

    const [items, setItems] = useState<BillItem[]>([])

    // Global Taxes & Retentions
    const [globalTaxId, setGlobalTaxId] = useState('')
    const [vatRetentionRate, setVatRetentionRate] = useState(0)
    const [islrConceptId, setIslrConceptId] = useState('')

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
                if (taxRes.ok) {
                    const taxList = await taxRes.json()
                    setTaxes(taxList)
                    // Set default IVA tax
                    const defaultTax = taxList.find((t: any) => t.type === 'IVA')
                    if (defaultTax) setGlobalTaxId(defaultTax.id)
                }
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
        async function loadBill() {
            const billId = searchParams.get('id')
            if (billId) {
                try {
                    setPageLoading(true)
                    const res = await fetch(`/api/operations/suppliers/bills?id=${billId}`)
                    if (res.ok) {
                        const data = await res.json()
                        const bill = data[0]
                        if (bill) {
                            // Populate Form
                            setDate(new Date(bill.date).toISOString().split('T')[0])
                            setAccountingDate(new Date(bill.accounting_date || bill.date).toISOString().split('T')[0])
                            setDueDate(bill.due_date ? new Date(bill.due_date).toISOString().split('T')[0] : '')
                            setNumber(bill.number)
                            setControlNumber(bill.control_number || '')
                            setReference(bill.reference || '')
                            setThirdPartyId(bill.third_party_id)
                            setDocumentType(bill.type)
                            setBillType(bill.bill_type || 'PURCHASE') // Fallback if missing

                            // Load Items
                            if (bill.items) {
                                // Find ISLR Concept Name from Withholdings (if any)
                                const islrRetention = bill.withholdings?.find((w: any) => w.type === 'RETENCION_ISLR')
                                const islrConceptName = islrRetention?.islr_concept_name
                                const islrConceptId = islrConceptName ? (islrConcepts.find((c: any) => c.description === islrConceptName)?.id || '') : ''

                                if (islrConceptId) setIslrConceptId(islrConceptId) // Set global concept

                                setItems(bill.items.map((item: any) => ({
                                    product_id: item.product_id || '',
                                    gl_account_id: item.gl_account_id || '',
                                    description: item.description,
                                    quantity: Number(item.quantity),
                                    unit_price: Number(item.unit_price),
                                    tax_id: '',
                                    total: Number(item.total),
                                    tax_rate: Number(item.tax_rate),
                                    tax_amount: Number(item.tax_amount),
                                    vat_retention_rate: Number(item.vat_retention_rate),
                                    vat_retention_amount: Number(item.vat_retention_amount),
                                    islr_rate: Number(item.islr_rate),
                                    islr_amount: Number(item.islr_amount),
                                    islr_concept_id: islrConceptId // Use resolved ID
                                })))
                            }

                            // Set global tax based on first item tax rate if possible, or just default
                            // Assuming all items have same tax rate for now or we just load what we have
                        }
                    }
                } catch (error) {
                    console.error('Error loading bill:', error)
                } finally {
                    setPageLoading(false)
                }
            } else {
                const supplierId = searchParams?.get('supplierId')
                if (supplierId) {
                    setThirdPartyId(supplierId)
                }
            }
        }

        loadBill()
    }, [searchParams])

    const addItem = () => {
        setItems([...items, {
            product_id: '',
            gl_account_id: '',
            description: '',
            quantity: 1,
            unit_price: 0,
            tax_id: '', // Deprecated per line
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

        if (field === 'product_id') {
            const prod = products.find(p => p.id === value)
            if (prod) {
                item.description = prod.name
                item.unit_price = parseFloat(prod.sales_price)
            }
        }

        // Calculations moved to global useMemo
        newItems[index] = item
        setItems(newItems)
    }

    const removeItem = (index: number) => {
        setItems(items.filter((_, i) => i !== index))
    }

    const calculations = useMemo(() => {
        const subtotal = items.reduce((sum: number, item: any) => sum + (Number(item.quantity) * Number(item.unit_price)), 0)

        // 1. IVA
        let totalTax = 0
        let taxRateValue = 0
        if (globalTaxId) {
            const tax = taxes.find(t => t.id === globalTaxId)
            taxRateValue = tax ? parseFloat(tax.rate) : 0
            totalTax = subtotal * (taxRateValue / 100)
        }

        // 3. Retentions
        const totalRetIVA = totalTax * (vatRetentionRate / 100)

        let islrRateValue = 0
        let taxpayerTypeLabel = ''
        if (islrConceptId) {
            const concept = islrConcepts.find(c => c.id === islrConceptId)
            const supplier = suppliers.find(s => s.id === thirdPartyId) as any
            const type = supplier?.taxpayer_type || 'PJ_DOMICILIADA'

            // Map taxpayer type to human-readable label
            const taxpayerTypeLabels: Record<string, string> = {
                'PN_RESIDENTE': 'Persona Natural Residente',
                'PN_NO_RESIDENTE': 'Persona Natural No Residente',
                'PJ_DOMICILIADA': 'Persona Jurídica Domiciliada',
                'PJ_NO_DOMICILIADA': 'Persona Jurídica No Domiciliada'
            }
            taxpayerTypeLabel = taxpayerTypeLabels[type] || type

            console.log('ISLR Debug:', { concept, supplier, type, taxpayerTypeLabel })

            if (concept) {
                switch (type) {
                    case 'PN_RESIDENTE': islrRateValue = Number(concept.pn_resident_rate); break;
                    case 'PN_NO_RESIDENTE': islrRateValue = Number(concept.pn_non_resident_rate); break;
                    case 'PJ_DOMICILIADA': islrRateValue = Number(concept.pj_domiciled_rate); break;
                    case 'PJ_NO_DOMICILIADA': islrRateValue = Number(concept.pj_non_domiciled_rate); break;
                    default: islrRateValue = Number(concept.pj_domiciled_rate);
                }
                console.log('ISLR Rate calculated:', islrRateValue)
            }
        }
        const totalRetISLR = subtotal * (islrRateValue / 100)

        const totalInvoice = subtotal + totalTax
        const totalPayable = totalInvoice - totalRetIVA - totalRetISLR

        const islrConceptName = islrConceptId ? (islrConcepts.find(c => c.id === islrConceptId)?.description || '') : ''

        return {
            subtotal,
            totalTax,
            totalRetIVA,
            totalRetISLR,
            totalInvoice,
            totalPayable,
            taxRate: taxRateValue,
            islrRate: islrRateValue,
            islrConceptName,
            taxpayerTypeLabel
        }
    }, [items, globalTaxId, vatRetentionRate, islrConceptId, taxes, islrConcepts, thirdPartyId, suppliers])

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (!thirdPartyId || !number || items.length === 0) {
            alert('Por favor complete los campos obligatorios')
            return
        }

        // Validation for items based on type
        for (const item of items) {
            if (billType === 'PURCHASE' && !item.product_id && !item.description) {
                alert('Cada línea de compra debe tener un producto o descripción')
                return
            }
            if (billType === 'EXPENSE' && !item.gl_account_id) {
                alert('Debe asignar una cuenta contable a cada línea de gasto')
                return
            }
        }

        setLoading(true)
        try {
            const payload = {
                company_id: companyId,
                third_party_id: thirdPartyId,
                type: documentType, // Passed payload type
                bill_type: billType, // PURCHASE or EXPENSE
                related_document_id: originBillId || null, // Link to origin
                date,
                accounting_date: accountingDate,
                due_date: dueDate || null,
                number,
                control_number: controlNumber,
                reference,
                items: items.map(item => {
                    const itemBase = Number(item.quantity) * Number(item.unit_price)
                    const proportion = calculations.subtotal > 0 ? itemBase / calculations.subtotal : 1 / (items.length || 1)

                    return {
                        ...item,
                        quantity: Number(item.quantity),
                        unit_price: Number(item.unit_price),
                        tax_id: globalTaxId,
                        tax_rate: calculations.taxRate,
                        tax_amount: calculations.totalTax * proportion,
                        vat_retention_rate: vatRetentionRate,
                        vat_retention_amount: calculations.totalRetIVA * proportion,
                        islr_rate: calculations.islrRate,
                        islr_amount: calculations.totalRetISLR * proportion,
                        islr_concept_id: islrConceptId || null
                    }
                })
            }

            const res = await fetch('/api/operations/suppliers/bills', {
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
                <h1 className="text-2xl font-bold text-gray-800">Registrar Factura</h1>
                <Link href="/dashboard/operations/bills" className="text-sm text-blue-600 hover:underline">
                    &larr; Volver
                </Link>
            </div>

            <h2 className="text-lg font-semibold text-gray-900">Detalles de Factura</h2>

            {/* Document Type Selector */}
            <div className="flex gap-4 mb-4">
                <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Documento</label>
                    <div className="flex rounded-md shadow-sm">
                        <button
                            type="button"
                            onClick={() => setDocumentType('BILL')}
                            className={`relative inline-flex items-center px-4 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:z-10 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 ${documentType === 'BILL' ? 'bg-indigo-50 text-indigo-700 border-indigo-500 z-10' : ''}`}
                        >
                            Factura
                        </button>
                        <button
                            type="button"
                            onClick={() => setDocumentType('DEBIT_NOTE')}
                            className={`relative inline-flex items-center px-4 py-2 border-t border-b border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:z-10 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 ${documentType === 'DEBIT_NOTE' ? 'bg-indigo-50 text-indigo-700 border-indigo-500 z-10' : ''}`}
                        >
                            Nota de Débito
                        </button>
                        <button
                            type="button"
                            onClick={() => setDocumentType('CREDIT_NOTE')}
                            className={`relative inline-flex items-center px-4 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:z-10 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 ${documentType === 'CREDIT_NOTE' ? 'bg-indigo-50 text-indigo-700 border-indigo-500 z-10' : ''}`}
                        >
                            Nota de Crédito (Rebaja)
                        </button>
                    </div>
                </div>
            </div>

            {/* Mode Selector */}
            {(documentType === 'BILL' || documentType === 'CREDIT_NOTE') && (
                <div className="flex gap-4 mb-4">
                    <button
                        type="button"
                        onClick={() => setBillType('PURCHASE')}
                        className={`flex-1 py-2 px-4 text-center rounded-lg border ${billType === 'PURCHASE'
                            ? 'bg-blue-50 border-blue-200 text-blue-700 font-medium'
                            : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                            }`}
                    >
                        <Package className="w-4 h-4 inline-block mr-2" />
                        {documentType === 'CREDIT_NOTE' ? 'Devolución de Mercancía' : 'Compra de Inventario'}
                    </button>
                    <button
                        type="button"
                        onClick={() => setBillType('EXPENSE')}
                        className={`flex-1 py-2 px-4 text-center rounded-lg border ${billType === 'EXPENSE'
                            ? 'bg-purple-50 border-purple-200 text-purple-700 font-medium'
                            : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                            }`}
                    >
                        <Receipt className="w-4 h-4 inline-block mr-2" />
                        {documentType === 'CREDIT_NOTE' ? 'Rebaja / Descuento Financiero' : 'Gasto / Servicio'}
                    </button>
                </div>
            )}

            {/* Origin Invoice Selector (For Returns) */}
            {documentType === 'CREDIT_NOTE' && billType === 'PURCHASE' && (
                <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
                    <label htmlFor="originBill" className="block text-sm font-medium text-blue-900 mb-2">Factura de Origen (Para Devolución)</label>
                    <select
                        id="originBill"
                        value={originBillId}
                        onChange={(e) => handleOriginBillChange(e.target.value)}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    >
                        <option value="">Seleccione Factura a Devolver...</option>
                        {supplierBills.map((bill: any) => (
                            <option key={bill.id} value={bill.id}>
                                {bill.number} - {new Date(bill.date).toLocaleDateString()} - Total: {Number(bill.total).toFixed(2)}
                            </option>
                        ))}
                    </select>
                </div>
            )}

            {/* Info Banner for Notes */}
            {documentType === 'DEBIT_NOTE' && (
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <Receipt className="h-5 w-5 text-yellow-400" />
                        </div>
                        <div className="ml-3">
                            <p className="text-sm text-yellow-700">
                                Nota de Débito: Registra un cargo adicional al proveedor (aumenta tu deuda). Selecciona la cuenta de gasto correspondiente.
                            </p>
                        </div>
                    </div>
                </div>
            )}
            {documentType === 'CREDIT_NOTE' && (
                <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-4">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <Receipt className="h-5 w-5 text-green-400" />
                        </div>
                        <div className="ml-3">
                            <p className="text-sm text-green-700">
                                Nota de Crédito: Registra una rebaja o descuento (disminuye tu deuda). Selecciona la cuenta de "Descuentos en Compras" o similar.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Proveedor <span className="text-red-500">*</span></label>
                        <select
                            value={thirdPartyId}
                            onChange={e => setThirdPartyId(e.target.value)}
                            className="w-full p-2 border rounded focus:ring-blue-500"
                            required
                            title="Seleccionar Proveedor"
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

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 overflow-hidden">
                <h3 className="text-sm font-semibold text-gray-900 mb-2 uppercase tracking-wider">Detalle de Factura</h3>

                <div className="overflow-x-auto">
                    <table className="w-full text-xs mb-4 table-auto">
                        <thead className="bg-gray-100 text-gray-700">
                            <tr>
                                <th className="p-2 pl-4 text-left">{billType === 'PURCHASE' ? 'Producto' : 'Cuenta Contable'} / Descripción</th>
                                <th className="p-2 text-center">Cant.</th>
                                <th className="p-2 text-center">Precio Unit.</th>
                                <th className="p-2 text-center font-semibold text-blue-600">Base Imp.</th>
                                <th className="p-2"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {items.map((item, idx) => (
                                <tr key={idx} className="group hover:bg-gray-50 transition-colors">
                                    <td className="p-2 pl-4 w-1/2">
                                        <div className="space-y-1">
                                            {billType === 'PURCHASE' ? (
                                                <select
                                                    value={item.product_id}
                                                    onChange={e => updateItem(idx, 'product_id', e.target.value)}
                                                    className="w-full p-1 border rounded text-xs mb-1"
                                                    title="Seleccionar Producto"
                                                >
                                                    <option value="">(Libre)</option>
                                                    {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                                </select>
                                            ) : (
                                                <AccountSelector
                                                    value={item.gl_account_id}
                                                    onChange={val => updateItem(idx, 'gl_account_id', val)}
                                                    placeholder="Seleccionar cuenta..."
                                                    className="mb-1"
                                                />
                                            )}
                                            <input
                                                value={item.description}
                                                onChange={e => updateItem(idx, 'description', e.target.value)}
                                                placeholder="Descripción"
                                                className="w-full p-1 border-b border-gray-300 focus:border-blue-500 focus:outline-none bg-transparent"
                                                title="Descripción"
                                            />
                                        </div>
                                    </td>
                                    <td className="p-2">
                                        <input
                                            type="number" min="0" step="0.01"
                                            value={item.quantity}
                                            onChange={e => updateItem(idx, 'quantity', parseFloat(e.target.value) || 0)}
                                            className="w-full text-right p-1 border rounded"
                                            title="Cantidad"
                                        />
                                    </td>
                                    <td className="p-2">
                                        <input
                                            type="number" min="0" step="0.01"
                                            value={item.unit_price}
                                            onChange={e => updateItem(idx, 'unit_price', parseFloat(e.target.value) || 0)}
                                            className="w-full text-right p-1 border rounded"
                                            title="Precio Unitario"
                                        />
                                    </td>
                                    <td className="p-2 text-right font-medium text-blue-600">
                                        {(item.quantity * item.unit_price).toFixed(2)}
                                    </td>
                                    <td className="p-2 text-center">
                                        <button
                                            type="button"
                                            onClick={() => removeItem(idx)}
                                            className="text-gray-400 hover:text-red-500"
                                            aria-label="Eliminar"
                                        >
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                {/* Global Taxes Management Table */}
                <div className="bg-white p-3 rounded-lg border border-gray-200">
                    <h3 className="text-sm font-semibold text-gray-900 mb-2 uppercase tracking-wider">Impuestos y Retenciones</h3>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between gap-4">
                            <div className="flex-1">
                                <label className="block text-xs font-medium text-gray-500 mb-1">IVA (Tasa Global)</label>
                                <select
                                    value={globalTaxId}
                                    onChange={e => setGlobalTaxId(e.target.value)}
                                    className="w-full p-2 border rounded text-sm bg-gray-50 disabled:opacity-50"
                                    title="Tasa IVA"
                                >
                                    <option value="">(Exento / Ninguno)</option>
                                    {taxes.filter(t => t.type === 'IVA').map(t => (
                                        <option key={t.id} value={t.id}>{t.name} ({Number(t.rate)}%)</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex-1">
                                <label className="block text-xs font-medium text-gray-500 mb-1">Retención IVA</label>
                                <select
                                    value={vatRetentionRate}
                                    onChange={e => setVatRetentionRate(parseFloat(e.target.value) || 0)}
                                    disabled={!globalTaxId}
                                    className="w-full p-2 border rounded text-sm bg-gray-50 disabled:opacity-50"
                                    title="Tasa Retención IVA"
                                >
                                    <option value="0">0%</option>
                                    <option value="75">75%</option>
                                    <option value="100">100%</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Retención ISLR (Concepto)</label>
                            <select
                                value={islrConceptId}
                                onChange={e => setIslrConceptId(e.target.value)}
                                className="w-full p-2 border rounded text-sm bg-gray-50"
                                title="Concepto ISLR"
                            >
                                <option value="">(Ninguno)</option>
                                {islrConcepts.map(c => (
                                    <option key={c.id} value={c.id}>{c.description}</option>
                                ))}
                            </select>
                            {calculations.islrRate > 0 && (
                                <p className="text-[10px] text-blue-600 mt-1">Tasa aplicada: {calculations.islrRate}%</p>
                            )}
                        </div>

                    </div>
                </div>

                <div className="bg-white p-3 rounded-lg border border-gray-200">
                    <h3 className="text-sm font-semibold text-gray-900 mb-2 uppercase tracking-wider">Totalización</h3>
                    <div className="space-y-3 text-base">
                        <div className="flex justify-between">
                            <span className="text-gray-600">Sumatoria Base Imponible</span>
                            <span className="font-medium text-blue-600">{calculations.subtotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                        </div>

                        <div className="flex justify-between items-center bg-blue-50/50 px-2 py-1 rounded">
                            <span className="text-gray-600">IVA ({calculations.taxRate}%)</span>
                            <span className="font-medium">{calculations.totalTax.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                        </div>


                        <div className="flex justify-between border-t pt-2 font-semibold text-gray-900 border-gray-100">
                            <span>Monto Bruto Factura</span>
                            <span>{calculations.totalInvoice.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                        </div>

                        <div className="space-y-1 pt-2">
                            <div className="flex justify-between text-red-600 text-sm italic">
                                <span>(-) Retención IVA ({vatRetentionRate}%)</span>
                                <span>-{calculations.totalRetIVA.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                            </div>
                            <div className="flex justify-between text-red-600 text-sm italic">
                                <span>
                                    (-) Retención ISLR ({calculations.islrRate}%)
                                    {calculations.islrConceptName && ` - ${calculations.islrConceptName}`}
                                    {calculations.taxpayerTypeLabel && ` (${calculations.taxpayerTypeLabel})`}
                                </span>
                                <span>-{(calculations.totalRetISLR || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                            </div>
                        </div>

                        <div className="border-t-2 border-gray-900 pt-3 mt-4">
                            <div className="flex justify-between text-xl font-bold">
                                <span>Neto a Pagar</span>
                                <span className="text-[#2ca01c]">
                                    {calculations.totalPayable.toLocaleString('en-US', { minimumFractionDigits: 2 })}
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
