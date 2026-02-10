
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

type EgresosFormProps = {
    bankAccount: BankAccount
}

export function EgresosForm({ bankAccount }: EgresosFormProps) {
    const router = useRouter()
    const [mode, setMode] = useState<'SUPPLIER' | 'OTHER'>('SUPPLIER')
    const [loading, setLoading] = useState(false)
    const [reference, setReference] = useState('')
    const [description, setDescription] = useState('')
    const [amount, setAmount] = useState<number>(0)

    // SUPPLIER PAYMENT
    const [suppliers, setSuppliers] = useState<any[]>([])
    const [selectedSupplierIds, setSelectedSupplierIds] = useState<string[]>([])
    const [bills, setBills] = useState<Invoice[]>([])
    const [allocations, setAllocations] = useState<Record<string, number>>({})
    const [apAccountId, setApAccountId] = useState('') // Cuentas por Pagar

    // OTHER EXPENSE
    const [expenseAccountId, setExpenseAccountId] = useState('')

    // Load suppliers
    useEffect(() => {
        const params = new URLSearchParams()
        params.set('companyId', bankAccount.company_id)

        fetch(`/api/operations/suppliers?${params.toString()}`) // Ensure this route exists or similar
            .then(res => res.json())
            .then(data => setSuppliers(data))
            .catch(err => console.error(err))
    }, [])

    // Load bills
    useEffect(() => {
        if (mode === 'SUPPLIER' && selectedSupplierIds.length > 0) {
            const params = new URLSearchParams()
            params.set('supplierIds', selectedSupplierIds.join(','))
            fetch(`/api/documents/payables?${params.toString()}`)
                .then(res => res.json())
                .then(data => {
                    setBills(data)
                })
                .catch(err => console.error(err))
        } else {
            setBills([])
        }
    }, [mode, selectedSupplierIds])

    // Update total amount from allocations
    useEffect(() => {
        if (mode === 'SUPPLIER') {
            const total = Object.values(allocations).reduce((sum, val) => sum + val, 0)
            setAmount(total)
        }
    }, [allocations, mode])

    const handleSupplierToggle = (supplierId: string) => {
        setSelectedSupplierIds(prev =>
            prev.includes(supplierId)
                ? prev.filter(id => id !== supplierId)
                : [...prev, supplierId]
        )
    }

    const handleAllocationChange = (billId: string, val: number, max: number) => {
        if (val < 0) val = 0
        if (val > max) val = max
        setAllocations(prev => ({ ...prev, [billId]: val }))
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
                type: 'CREDIT',
                subtype: 'WITHDRAWAL',
                contra_account_id: mode === 'SUPPLIER' ? apAccountId : expenseAccountId,
                isIgtfApplied: bankAccount.currency === 'USD', // Allow user to toggle this? Assuming auto-apply for now based on logic in original form
                allocations: mode === 'SUPPLIER' ? allocationList : []
            }

            const res = await fetch(`/api/banks/${bankAccount.id}/transactions`, {
                method: 'POST',
                body: JSON.stringify(data),
                headers: { 'Content-Type': 'application/json' }
            })

            if (res.ok) {
                router.refresh()
                setReference('')
                setDescription('')
                setAmount(0)
                setAllocations({})
                setSelectedSupplierIds([])
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
            <div className="flex gap-4 border-b pb-4">
                <button
                    type="button"
                    onClick={() => setMode('SUPPLIER')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${mode === 'SUPPLIER'
                        ? 'bg-red-100 text-red-700'
                        : 'text-gray-600 hover:bg-gray-100'
                        }`}
                >
                    Pago a Proveedores
                </button>
                <button
                    type="button"
                    onClick={() => setMode('OTHER')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${mode === 'OTHER'
                        ? 'bg-red-100 text-red-700'
                        : 'text-gray-600 hover:bg-gray-100'
                        }`}
                >
                    Gasto / Otro Egreso
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
                        label="Cuenta de Gasto / Pasivo"
                        required
                        value={expenseAccountId}
                        onChange={setExpenseAccountId}
                    />
                </>
            )}

            {mode === 'SUPPLIER' && (
                <div className="space-y-4">
                    {/* Supplier Selector */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">
                            Seleccionar Proveedores
                        </label>
                        <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto border p-2 rounded">
                            {suppliers.map(supplier => (
                                <button
                                    key={supplier.id}
                                    type="button"
                                    onClick={() => handleSupplierToggle(supplier.id)}
                                    className={`px-3 py-1 text-xs rounded-full border transition-colors ${selectedSupplierIds.includes(supplier.id)
                                        ? 'bg-red-600 text-white border-red-600'
                                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                        }`}
                                >
                                    {supplier.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Account Selector for AP (Contra Account) */}
                    <AccountSelector
                        label="Cuenta Destino (Cuentas por Pagar)"
                        required
                        value={apAccountId}
                        onChange={setApAccountId}
                    />

                    {/* Bills Table */}
                    {bills.length > 0 ? (
                        <div className="border rounded-lg overflow-hidden">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50 text-gray-600 font-medium border-b">
                                    <tr>
                                        <th className="px-4 py-2">Factura</th>
                                        <th className="px-4 py-2">Proveedor</th>
                                        <th className="px-4 py-2">Fecha</th>
                                        <th className="px-4 py-2 text-right">Saldo</th>
                                        <th className="px-4 py-2 text-right" style={{ width: '150px' }}>Pagar</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {bills.map(bill => (
                                        <tr key={bill.id} className={allocations[bill.id] > 0 ? 'bg-red-50' : ''}>
                                            <td className="px-4 py-2">{bill.number}</td>
                                            <td className="px-4 py-2 text-xs text-gray-500">{bill.third_party.name}</td>
                                            <td className="px-4 py-2 text-xs text-gray-500">
                                                {new Date(bill.date).toLocaleDateString()}
                                            </td>
                                            <td className="px-4 py-2 text-right font-medium">
                                                {Number(bill.balance).toFixed(2)}
                                            </td>
                                            <td className="px-4 py-2">
                                                <input
                                                    type="number"
                                                    value={allocations[bill.id] || ''}
                                                    onChange={e => handleAllocationChange(bill.id, Number(e.target.value), Number(bill.balance))}
                                                    className="w-full border rounded px-2 py-1 text-right focus:border-red-500 focus:outline-none"
                                                    placeholder="0.00"
                                                    max={Number(bill.balance)}
                                                />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot className="bg-gray-50 font-bold border-t">
                                    <tr>
                                        <td colSpan={4} className="px-4 py-2 text-right">Total a Pagar:</td>
                                        <td className="px-4 py-2 text-right text-red-600">
                                            {amount.toFixed(2)}
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    ) : (
                        <div className="text-center py-8 text-gray-500 bg-gray-50 rounded border border-dashed">
                            {selectedSupplierIds.length === 0
                                ? 'Seleccione proveedores para ver facturas pendientes'
                                : 'No se encontraron facturas pendientes para los proveedores seleccionados'}
                        </div>
                    )}
                </div>
            )}

            <button
                type="submit"
                disabled={loading || (mode === 'SUPPLIER' && amount <= 0)}
                className="w-full bg-slate-900 text-white py-3 rounded-lg font-semibold hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {loading ? 'Procesando...' : 'Registrar Egreso'}
            </button>
        </form>
    )
}
