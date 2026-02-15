
'use client'

import { useState, useEffect } from 'react'
import { Search, Save, Loader2, ArrowLeft, Plus, Check } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { DateInput } from '@/components/common/DateInput'
import { formatDate } from '@/lib/date-utils'

interface ThirdParty {
    id: string
    name: string
    rif: string
}

interface BankAccount {
    id: string
    bank_name: string
    account_number: string
    currency: string
}

interface Invoice {
    id: string
    number: string
    date: string
    total: number
    balance: number // Current outstanding balance
}

interface Allocation {
    invoice_id: string
    amount: number
}

export function PaymentReceiptForm() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [pageLoading, setPageLoading] = useState(true)

    // Resources
    const [customers, setCustomers] = useState<ThirdParty[]>([])
    const [banks, setBanks] = useState<BankAccount[]>([])

    // Form State
    const [date, setDate] = useState(new Date().toISOString().split('T')[0])
    const [customerId, setCustomerId] = useState('')
    const [paymentMethod, setPaymentMethod] = useState('TRANSFERENCIA')
    const [reference, setReference] = useState('')
    const [bankAccountId, setBankAccountId] = useState('')
    const [notes, setNotes] = useState('')
    const [amount, setAmount] = useState('') // Total Payment Amount

    // Invoices & Allocations
    const [pendingInvoices, setPendingInvoices] = useState<Invoice[]>([])
    const [allocations, setAllocations] = useState<Allocation[]>([])
    const [invoicesLoading, setInvoicesLoading] = useState(false)

    // Initial Load
    useEffect(() => {
        async function loadResources() {
            try {
                const [custRes, bankRes] = await Promise.all([
                    fetch('/api/third-parties?type=CLIENTE'),
                    fetch('/api/banks')
                ])

                if (custRes.ok) setCustomers(await custRes.json())
                if (bankRes.ok) setBanks(await bankRes.json())
            } catch (error) {
                console.error(error)
            } finally {
                setPageLoading(false)
            }
        }
        loadResources()
    }, [])

    // Fetch Invoices when Customer Changes
    useEffect(() => {
        if (!customerId) {
            setPendingInvoices([])
            setAllocations([])
            return
        }

        async function fetchInvoices() {
            setInvoicesLoading(true)
            try {
                // Fetch PENDING and PARTIAL invoices
                const res = await fetch(`/api/documents?type=INVOICE&status=PENDING,PARTIAL&third_party_id=${customerId}`)
                if (res.ok) {
                    const docs = await res.json()
                    // Filter just in case API returns more
                    const validDocs = docs.filter((d: any) => Number(d.balance) > 0)
                    setPendingInvoices(validDocs)
                }
            } catch (error) {
                console.error(error)
            } finally {
                setInvoicesLoading(false)
            }
        }
        fetchInvoices()
    }, [customerId])

    // Helper to update allocation
    const updateAllocation = (invoiceId: string, val: number) => {
        const existing = allocations.find(a => a.invoice_id === invoiceId)
        let newAllocations = [...allocations]

        if (val <= 0) {
            newAllocations = newAllocations.filter(a => a.invoice_id !== invoiceId)
        } else {
            if (existing) {
                existing.amount = val
            } else {
                newAllocations.push({ invoice_id: invoiceId, amount: val })
            }
        }
        setAllocations(newAllocations)
    }

    const getAllocatedAmount = (invoiceId: string) => {
        return allocations.find(a => a.invoice_id === invoiceId)?.amount || 0
    }

    const totalAllocated = allocations.reduce((sum: number, a: any) => sum + a.amount, 0)
    const remainingAmount = (parseFloat(amount) || 0) - totalAllocated

    const autoDistribute = () => {
        let remaining = parseFloat(amount) || 0
        if (remaining <= 0) return

        const newAllocations: Allocation[] = []

        // Sort invoices by date (oldest first)
        const sorted = [...pendingInvoices].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

        for (const inv of sorted) {
            if (remaining <= 0) break
            const pay = Math.min(Number(inv.balance), remaining)
            if (pay > 0) {
                newAllocations.push({ invoice_id: inv.id, amount: pay })
                remaining -= pay
            }
        }
        setAllocations(newAllocations)
    }

    // Also update total allocated when user clicks auto distribute

    // Submit
    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (!customerId || !amount || parseFloat(amount) <= 0) {
            alert('Por favor complete cliente y monto')
            return
        }
        if (paymentMethod === 'TRANSFERENCIA' && !bankAccountId) {
            alert('Seleccione la cuenta bancaria destino')
            return
        }

        // Validate allocations? Assuming logical check (allocated <= amount)
        if (Math.abs(remainingAmount) > 0.01) {
            // Warn or Block? Warn is better.
            if (!confirm(`El monto total (${amount}) no coincide con el total distribuido (${totalAllocated.toFixed(2)}). ¿Desea continuar (el resto quedará como saldo a favor o pendiente)?`)) {
                return
            }
        }

        setLoading(true)
        try {
            const payload = {
                company_id: '',
                third_party_id: customerId,
                date,
                amount,
                reference,
                payment_method: paymentMethod,
                bank_account_id: bankAccountId || null,
                cash_account_id: null, // Add selector if needed
                notes,
                allocations
            }

            const res = await fetch('/api/receipts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })

            if (res.ok) {
                router.push('/dashboard/revenue/collections')
                router.refresh()
            } else {
                const err = await res.json()
                alert('Error: ' + (err.error || 'Unknown error'))
            }
        } catch (error) {
            console.error(error)
            alert('Error al registrar cobro')
        } finally {
            setLoading(false)
        }
    }

    if (pageLoading) return <div className="p-8"><Loader2 className="animate-spin" /></div>

    return (
        <form onSubmit={handleSubmit} className="space-y-6 pb-20">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-800">Registrar Cobro a Cliente</h1>
                <Link href="/dashboard/revenue/collections" className="text-sm text-blue-600 hover:underline">
                    &larr; Volver a Lista
                </Link>
            </div>

            {/* Header Data */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="md:col-span-2">
                        <label htmlFor="customer" className="block text-sm font-medium text-gray-700 mb-1">Cliente <span className="text-red-500">*</span></label>
                        <select
                            id="customer"
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
                        <DateInput
                            label="Fecha de Cobro"
                            value={date}
                            onChange={e => setDate(e.target.value)}
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="totalAmount" className="block text-sm font-medium text-gray-700 mb-1">Monto Total <span className="text-red-500">*</span></label>
                        <input
                            id="totalAmount"
                            type="number" step="0.01" min="0.01"
                            value={amount}
                            onChange={e => setAmount(e.target.value)}
                            className="w-full p-2 border rounded focus:ring-blue-500 font-bold text-right"
                            placeholder="0.00"
                            required
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
                    <div>
                        <label htmlFor="paymentMethod" className="block text-sm font-medium text-gray-700 mb-1">Método de Pago</label>
                        <select
                            id="paymentMethod"
                            value={paymentMethod}
                            onChange={e => setPaymentMethod(e.target.value)}
                            className="w-full p-2 border rounded focus:ring-blue-500"
                        >
                            <option value="EFECTIVO">Efectivo</option>
                            <option value="TRANSFERENCIA">Transferencia Bancaria</option>
                            <option value="CHEQUE">Cheque</option>
                            <option value="PAGO_MOVIL">Pago Móvil</option>
                        </select>
                    </div>
                    {paymentMethod !== 'EFECTIVO' && (
                        <>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Referencia / Nro.</label>
                                <input
                                    value={reference}
                                    onChange={e => setReference(e.target.value)}
                                    className="w-full p-2 border rounded focus:ring-blue-500"
                                    placeholder="Ej. 123456"
                                />
                            </div>
                            <div>
                                <label htmlFor="bankAccount" className="block text-sm font-medium text-gray-700 mb-1">Cuenta Destino</label>
                                <select
                                    id="bankAccount"
                                    value={bankAccountId}
                                    onChange={e => setBankAccountId(e.target.value)}
                                    className="w-full p-2 border rounded focus:ring-blue-500"
                                    required={paymentMethod === 'TRANSFERENCIA'}
                                >
                                    <option value="">Seleccionar Banco...</option>
                                    {banks.map(b => (
                                        <option key={b.id} value={b.id}>{b.bank_name} - {b.account_number} ({b.currency})</option>
                                    ))}
                                </select>
                            </div>
                        </>
                    )}
                </div>

                <div className="mt-4">
                    <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">Notas / Observaciones</label>
                    <textarea
                        id="notes"
                        value={notes}
                        onChange={e => setNotes(e.target.value)}
                        className="w-full p-2 border rounded focus:ring-blue-500 h-20"
                    />
                </div>
            </div>

            {/* Invoices Allocation */}
            {customerId && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-800">Facturas Pendientes</h3>
                        <button
                            type="button"
                            onClick={autoDistribute}
                            disabled={!amount || parseFloat(amount) <= 0}
                            className="text-sm bg-blue-50 text-blue-600 px-3 py-1 rounded hover:bg-blue-100 disabled:opacity-50"
                        >
                            Auto-Distribuir (Antiguas primero)
                        </button>
                    </div>

                    {invoicesLoading ? (
                        <div className="text-center py-8 text-gray-500">Cargando facturas...</div>
                    ) : pendingInvoices.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">El cliente no tiene facturas pendientes.</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50 text-gray-700 font-medium">
                                    <tr>
                                        <th className="p-3">Factura</th>
                                        <th className="p-3">Fecha</th>
                                        <th className="p-3 text-right">Total Orig.</th>
                                        <th className="p-3 text-right">Saldo Pend.</th>
                                        <th className="p-3 text-right w-40">Abonar</th>
                                        <th className="p-3 text-right">Nuevo Saldo</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {pendingInvoices.map(inv => {
                                        const alloc = getAllocatedAmount(inv.id)
                                        const newBal = Number(inv.balance) - alloc
                                        return (
                                            <tr key={inv.id} className="hover:bg-gray-50">
                                                <td className="p-3 font-medium">{inv.number}</td>
                                                <td className="p-3 text-gray-600">{formatDate(inv.date)}</td>
                                                <td className="p-3 text-right text-gray-600">{Number(inv.total).toFixed(2)}</td>
                                                <td className="p-3 text-right font-bold">{Number(inv.balance).toFixed(2)}</td>
                                                <td className="p-3 text-right">
                                                    <input
                                                        type="number" min="0" max={Number(inv.balance)} step="0.01"
                                                        value={alloc || ''}
                                                        onChange={e => updateAllocation(inv.id, parseFloat(e.target.value) || 0)}
                                                        className="w-full text-right p-1 border rounded focus:ring-blue-500 bg-white"
                                                        placeholder="0.00"
                                                    />
                                                </td>
                                                <td className={`p-3 text-right font-medium ${newBal <= 0.01 ? 'text-green-600' : 'text-gray-800'}`}>
                                                    {Math.max(0, newBal).toFixed(2)}
                                                    {newBal <= 0.01 && <Check className="inline w-4 h-4 ml-1" />}
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                                <tfoot className="bg-gray-50 font-bold">
                                    <tr>
                                        <td colSpan={4} className="p-3 text-right">Total Distribuido:</td>
                                        <td className="p-3 text-right text-blue-600">{totalAllocated.toFixed(2)}</td>
                                        <td className="p-3"></td>
                                    </tr>
                                    <tr>
                                        <td colSpan={4} className="p-3 text-right">Pendiente por Distribuir:</td>
                                        <td className={`p-3 text-right ${remainingAmount < 0 ? 'text-red-500' : 'text-gray-600'}`}>
                                            {remainingAmount.toFixed(2)}
                                        </td>
                                        <td className="p-3"></td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    )}
                </div>
            )}

            <div className="flex justify-end gap-4">
                <Link href="/dashboard/revenue/collections" className="px-6 py-3 text-gray-600 hover:bg-gray-50 rounded-lg">
                    Cancelar
                </Link>
                <button
                    type="submit"
                    disabled={loading}
                    className="bg-[#2ca01c] hover:bg-[#248217] text-white px-8 py-3 rounded-lg font-medium shadow-sm flex items-center gap-2"
                >
                    {loading ? <Loader2 className="animate-spin w-5 h-5" /> : <Save className="w-5 h-5" />}
                    Registrar Cobro
                </button>
            </div>
        </form>
    )
}
