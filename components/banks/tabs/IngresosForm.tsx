
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { BankAccount } from '../types'
import { AccountSelector } from '@/components/accounting/AccountSelector'

type Invoice = {
    id: string
    number: string
    date: string
    total: number
    balance: number
    third_party: {
        id: string
        name: string
        rif: string
    }
}

type IngresosFormProps = {
    bankAccount: BankAccount
}

export function IngresosForm({ bankAccount }: IngresosFormProps) {
    const router = useRouter()
    const [mode, setMode] = useState<'CUSTOMER' | 'OTHER'>('CUSTOMER')
    const [loading, setLoading] = useState(false)
    const [reference, setReference] = useState('')
    const [description, setDescription] = useState('')
    const [amount, setAmount] = useState<number>(0)

    // CUSTOMER PAYMENT
    const [clients, setClients] = useState<any[]>([])
    const [selectedClientIds, setSelectedClientIds] = useState<string[]>([])
    const [invoices, setInvoices] = useState<Invoice[]>([])
    const [allocations, setAllocations] = useState<Record<string, number>>({})
    const [arAccountId, setArAccountId] = useState('')

    // OTHER INCOME
    const [incomeAccountId, setIncomeAccountId] = useState('')

    // Load clients
    useEffect(() => {
        fetch('/api/operations/clients')
            .then(res => res.json())
            .then(data => setClients(data))
            .catch(err => console.error(err))
    }, [])

    // Load invoices
    useEffect(() => {
        if (mode === 'CUSTOMER' && selectedClientIds.length > 0) {
            const params = new URLSearchParams()
            params.set('clientIds', selectedClientIds.join(','))
            fetch(`/api/documents/receivables?${params.toString()}`)
                .then(res => res.json())
                .then(data => {
                    setInvoices(data)
                    // Reset allocations when invoices change? Maybe keep if id matches
                })
                .catch(err => console.error(err))
        } else {
            setInvoices([])
        }
    }, [mode, selectedClientIds])

    // Update total amount from allocations
    useEffect(() => {
        if (mode === 'CUSTOMER') {
            const total = Object.values(allocations).reduce((sum, val) => sum + val, 0)
            setAmount(total)
        }
    }, [allocations, mode])

    const handleClientToggle = (clientId: string) => {
        setSelectedClientIds(prev =>
            prev.includes(clientId)
                ? prev.filter(id => id !== clientId)
                : [...prev, clientId]
        )
    }

    const handleAllocationChange = (invoiceId: string, val: number, max: number) => {
        if (val < 0) val = 0
        if (val > max) val = max
        setAllocations(prev => ({ ...prev, [invoiceId]: val }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const allocationList = Object.entries(allocations)
                .filter(([_, amt]) => amt > 0)
                .map(([docId, amt]) => ({ documentId: docId, amount: amt }))

            const data = {
                date: new Date().toISOString(),
                reference,
                description,
                amount,
                type: 'DEBIT',
                subtype: 'DEPOSIT',
                contra_account_id: mode === 'CUSTOMER' ? arAccountId : incomeAccountId,
                isIgtfApplied: false,
                allocations: mode === 'CUSTOMER' ? allocationList : []
            }

            const res = await fetch(`/api/banks/${bankAccount.id}/transactions`, {
                method: 'POST',
                body: JSON.stringify(data),
                headers: { 'Content-Type': 'application/json' }
            })

            if (res.ok) {
                router.refresh()
                // Reset form
                setReference('')
                setDescription('')
                setAmount(0)
                setAllocations({})
                setSelectedClientIds([])
            } else {
                const err = await res.json()
                alert('Error: ' + err.error)
            }
        } catch (error) {
            console.error(error)
            alert('Error al registrar')
        } finally {
            setLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Mode Selector */}
            <div className="flex gap-4 border-b pb-4">
                <button
                    type="button"
                    onClick={() => setMode('CUSTOMER')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${mode === 'CUSTOMER'
                            ? 'bg-blue-100 text-blue-700'
                            : 'text-gray-600 hover:bg-gray-100'
                        }`}
                >
                    Cobro a Clientes
                </button>
                <button
                    type="button"
                    onClick={() => setMode('OTHER')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${mode === 'OTHER'
                            ? 'bg-blue-100 text-blue-700'
                            : 'text-gray-600 hover:bg-gray-100'
                        }`}
                >
                    Otro Ingreso
                </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">
                        Referencia <span className="text-red-500">*</span>
                    </label>
                    <input
                        required
                        value={reference}
                        onChange={e => setReference(e.target.value)}
                        className="w-full border rounded px-3 py-2"
                        placeholder="Nro. Referencia"
                    />
                </div>
                <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">
                        Descripción <span className="text-red-500">*</span>
                    </label>
                    <input
                        required
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                        className="w-full border rounded px-3 py-2"
                        placeholder="Descripción"
                    />
                </div>
            </div>

            {mode === 'OTHER' && (
                <>
                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">
                            Monto <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="number"
                            step="0.01"
                            required
                            value={amount}
                            onChange={e => setAmount(Number(e.target.value))}
                            className="w-full border rounded px-3 py-2"
                        />
                    </div>
                    <AccountSelector
                        label="Cuenta de Ingreso"
                        required
                        value={incomeAccountId}
                        onChange={setIncomeAccountId}
                    />
                </>
            )}

            {mode === 'CUSTOMER' && (
                <div className="space-y-4">
                    {/* Client Selector */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">
                            Seleccionar Clientes
                        </label>
                        <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto border p-2 rounded">
                            {clients.map(client => (
                                <button
                                    key={client.id}
                                    type="button"
                                    onClick={() => handleClientToggle(client.id)}
                                    className={`px-3 py-1 text-xs rounded-full border transition-colors ${selectedClientIds.includes(client.id)
                                            ? 'bg-blue-600 text-white border-blue-600'
                                            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                        }`}
                                >
                                    {client.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Account Selector for AR (Contra Account) */}
                    <AccountSelector
                        label="Cuenta Destino (Cuentas por Cobrar)"
                        required
                        value={arAccountId}
                        onChange={setArAccountId}
                    />

                    {/* Invoices Table */}
                    {invoices.length > 0 ? (
                        <div className="border rounded-lg overflow-hidden">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50 text-gray-600 font-medium border-b">
                                    <tr>
                                        <th className="px-4 py-2">Factura</th>
                                        <th className="px-4 py-2">Cliente</th>
                                        <th className="px-4 py-2">Fecha</th>
                                        <th className="px-4 py-2 text-right">Saldo</th>
                                        <th className="px-4 py-2 text-right" style={{ width: '150px' }}>Abonar</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {invoices.map(inv => (
                                        <tr key={inv.id} className={allocations[inv.id] > 0 ? 'bg-blue-50' : ''}>
                                            <td className="px-4 py-2">{inv.number}</td>
                                            <td className="px-4 py-2 text-xs text-gray-500">{inv.third_party.name}</td>
                                            <td className="px-4 py-2 text-xs text-gray-500">
                                                {new Date(inv.date).toLocaleDateString()}
                                            </td>
                                            <td className="px-4 py-2 text-right font-medium">
                                                {Number(inv.balance).toFixed(2)}
                                            </td>
                                            <td className="px-4 py-2">
                                                <input
                                                    type="number"
                                                    value={allocations[inv.id] || ''}
                                                    onChange={e => handleAllocationChange(inv.id, Number(e.target.value), Number(inv.balance))}
                                                    className="w-full border rounded px-2 py-1 text-right focus:border-blue-500 focus:outline-none"
                                                    placeholder="0.00"
                                                    max={Number(inv.balance)}
                                                />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot className="bg-gray-50 font-bold border-t">
                                    <tr>
                                        <td colSpan={4} className="px-4 py-2 text-right">Total a Depositar:</td>
                                        <td className="px-4 py-2 text-right text-green-600">
                                            {amount.toFixed(2)}
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    ) : (
                        <div className="text-center py-8 text-gray-500 bg-gray-50 rounded border border-dashed">
                            {selectedClientIds.length === 0
                                ? 'Seleccione clientes para ver facturas pendientes'
                                : 'No se encontraron facturas pendientes para los clientes seleccionados'}
                        </div>
                    )}
                </div>
            )}

            <button
                type="submit"
                disabled={loading || (mode === 'CUSTOMER' && amount <= 0)}
                className="w-full bg-slate-900 text-white py-3 rounded-lg font-semibold hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {loading ? 'Procesando...' : 'Registrar Ingreso'}
            </button>
        </form>
    )
}
