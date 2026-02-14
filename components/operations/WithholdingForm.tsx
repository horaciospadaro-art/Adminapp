
'use client'

import { useState, useEffect } from 'react'
import { Save, Loader2, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { DateInput } from '@/components/common/DateInput'

interface ThirdParty {
    id: string
    name: string
    rif: string
}

interface Invoice {
    id: string
    number: string
    date: string
    total: number
    subtotal: number
    tax_amount: number
    balance: number
}

export function WithholdingForm() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [pageLoading, setPageLoading] = useState(true)

    // Resources
    const [customers, setCustomers] = useState<ThirdParty[]>([])

    // Form State
    const [customerId, setCustomerId] = useState('')
    const [invoiceId, setInvoiceId] = useState('')
    const [invoices, setInvoices] = useState<Invoice[]>([])

    // Withholding Data
    const [type, setType] = useState('RETENCION_IVA')
    const [date, setDate] = useState(new Date().toISOString().split('T')[0])
    const [certificateNumber, setCertificateNumber] = useState('')
    const [baseAmount, setBaseAmount] = useState('')
    const [rate, setRate] = useState('')
    const [amount, setAmount] = useState('')

    // Initial Load
    useEffect(() => {
        async function loadResources() {
            try {
                // Fetch Customers who are Special Taxpayers? 
                // For now fetch all clients, user decides.
                const res = await fetch('/api/third-parties?type=CLIENTE')
                if (res.ok) setCustomers(await res.json())
            } catch (error) {
                console.error(error)
            } finally {
                setPageLoading(false)
            }
        }
        loadResources()
    }, [])

    // Fetch Invoices
    useEffect(() => {
        if (!customerId) {
            setInvoices([])
            setInvoiceId('')
            return
        }

        async function fetchInvoices() {
            try {
                // Fetch PENDING, PARTIAL and PAID? 
                // Withholding can arrive late even if invoice is "Paid" (if we marked it paid but it was short paid pending retention).
                // Or usually we keep it open.
                // Fetch all active invoices for safety or just pending.
                const res = await fetch(`/api/documents?type=INVOICE&third_party_id=${customerId}&status=PENDING,PARTIAL`)
                if (res.ok) {
                    setInvoices(await res.json())
                }
            } catch (error) {
                console.error(error)
            }
        }
        fetchInvoices()
    }, [customerId])

    // Auto-fill Logic
    useEffect(() => {
        const inv = invoices.find(i => i.id === invoiceId)
        if (inv) {
            // Suggest Base Amount
            if (type === 'RETENCION_IVA') {
                setBaseAmount(Number(inv.tax_amount).toFixed(2))
                setRate('75') // Default usually 75% or 100%
                setAmount((Number(inv.tax_amount) * 0.75).toFixed(2))
            } else { // ISLR
                setBaseAmount(Number(inv.subtotal).toFixed(2))
                setRate('0')
                setAmount('0')
            }
        }
    }, [invoiceId, type, invoices])

    // Recalculate amount when base or rate changes
    const calculateAmount = (base: string, r: string) => {
        const b = parseFloat(base) || 0
        const rt = parseFloat(r) || 0
        return ((b * rt) / 100).toFixed(2)
    }

    const handleBaseChange = (val: string) => {
        setBaseAmount(val)
        setAmount(calculateAmount(val, rate))
    }

    const handleRateChange = (val: string) => {
        setRate(val)
        setAmount(calculateAmount(baseAmount, val))
    }

    // Submit
    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (!customerId || !invoiceId || !certificateNumber || !amount) {
            alert('Complete todos los campos obligatorios')
            return
        }

        setLoading(true)
        try {
            const payload = {
                company_id: '',
                document_id: invoiceId,
                third_party_id: customerId,
                type,
                date,
                certificate_number: certificateNumber,
                base_amount: baseAmount,
                rate,
                amount
            }

            const res = await fetch('/api/withholdings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })

            if (res.ok) {
                // Redirect to somewhere, maybe back to collections or list of withholdings (if we had one)
                router.push('/dashboard/revenue/collections')
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
        <form onSubmit={handleSubmit} className="w-full max-w-2xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-800">Registrar Comprobante de Retención</h1>
                <Link href="/dashboard/revenue/collections" className="text-sm text-blue-600 hover:underline">
                    &larr; Volver
                </Link>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-6">

                {/* Selection */}
                <div className="grid grid-cols-1 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Cliente <span className="text-red-500">*</span></label>
                        <select
                            value={customerId}
                            onChange={e => setCustomerId(e.target.value)}
                            className="w-full p-2 border rounded focus:ring-blue-500"
                            required
                        >
                            <option value="">Seleccionar...</option>
                            {customers.map(c => (
                                <option key={c.id} value={c.id}>{c.name} ({c.rif})</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Factura Relacionada <span className="text-red-500">*</span></label>
                        <select
                            value={invoiceId}
                            onChange={e => setInvoiceId(e.target.value)}
                            className="w-full p-2 border rounded focus:ring-blue-500"
                            required
                            disabled={!customerId}
                        >
                            <option value="">Seleccionar Factura...</option>
                            {invoices.map(inv => (
                                <option key={inv.id} value={inv.id}>
                                    {inv.number} - {new Date(inv.date).toLocaleDateString()} - Saldo: {Number(inv.balance).toFixed(2)}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="border-t pt-4">
                    <h3 className="text-sm font-semibold text-gray-900 mb-4">Detalle de la Retención</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Retención</label>
                            <select
                                value={type}
                                onChange={e => setType(e.target.value)}
                                className="w-full p-2 border rounded focus:ring-blue-500"
                            >
                                <option value="RETENCION_IVA">IVA (Impuesto al Valor Agregado)</option>
                                <option value="RETENCION_ISLR">ISLR (Impuesto Sobre la Renta)</option>
                            </select>
                        </div>
                        <div>
                            <DateInput
                                label="Fecha Comprobante"
                                value={date}
                                onChange={e => setDate(e.target.value)}
                                required
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Número de Comprobante <span className="text-red-500">*</span></label>
                            <input
                                value={certificateNumber}
                                onChange={e => setCertificateNumber(e.target.value)}
                                className="w-full p-2 border rounded focus:ring-blue-500"
                                placeholder="Ej. 20240200001234"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Base Imponible</label>
                            <input
                                type="number" step="0.01"
                                value={baseAmount}
                                onChange={e => handleBaseChange(e.target.value)}
                                className="w-full p-2 border rounded focus:ring-blue-500 text-right"
                            />
                            <p className="text-xs text-gray-500 mt-1">{type === 'RETENCION_IVA' ? 'Monto del Impuesto' : 'Monto de la Factura'}</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">% Porcentaje</label>
                            <input
                                type="number" step="0.01"
                                value={rate}
                                onChange={e => handleRateChange(e.target.value)}
                                className="w-full p-2 border rounded focus:ring-blue-500 text-right"
                            />
                        </div>
                        <div className="md:col-span-2 bg-gray-50 p-4 rounded border">
                            <label className="block text-sm font-bold text-gray-700 mb-1">Monto Retenido (A descontar)</label>
                            <input
                                type="number" step="0.01"
                                value={amount}
                                onChange={e => setAmount(e.target.value)}
                                className="w-full p-2 border rounded focus:ring-blue-500 text-right font-bold text-lg text-blue-700"
                                required
                            />
                        </div>

                    </div>
                </div>

            </div>

            <div className="flex justify-end gap-4">
                <Link href="/dashboard/revenue/collections" className="px-6 py-3 text-gray-600 hover:bg-gray-50 rounded-lg">
                    Cancelar
                </Link>
                <button
                    type="submit"
                    disabled={loading}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-medium shadow-sm flex items-center gap-2"
                >
                    {loading ? <Loader2 className="animate-spin w-5 h-5" /> : <Save className="w-5 h-5" />}
                    Registrar Retención
                </button>
            </div>
        </form>
    )
}
