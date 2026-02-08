'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

type BankTransactionFormProps = {
    bankAccountId: string
}

export function BankTransactionForm({ bankAccountId }: BankTransactionFormProps) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [accounts, setAccounts] = useState<any[]>([])

    // Load chart of accounts for "Contrapartida"
    useEffect(() => {
        fetch('/api/accounting/accounts')
            .then(res => res.json())
            .then(data => setAccounts(data))
    }, [])

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setLoading(true)
        const formData = new FormData(e.currentTarget)

        const data = {
            bankAccountId,
            date: new Date().toISOString(),
            reference: formData.get('reference'),
            description: formData.get('description'),
            amount: parseFloat(formData.get('amount') as string),
            type: formData.get('type'), // DEBIT | CREDIT
            isIgtfApplied: formData.get('isIgtfApplied') === 'on',
            contrapartidaId: formData.get('contrapartidaId')
        }

        try {
            const res = await fetch(`/api/banks/${bankAccountId}/transactions`, {
                method: 'POST',
                body: JSON.stringify(data),
                headers: { 'Content-Type': 'application/json' }
            })

            if (res.ok) {
                router.refresh() // Refresh server components to show new transaction
                const form = e.target as HTMLFormElement
                form.reset()
            } else {
                const err = await res.json()
                alert('Error: ' + err.error)
            }
        } catch (e) {
            console.error(e)
            alert('Error al registrar transacción')
        } finally {
            setLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="bg-white p-4 rounded shadow space-y-4">
            <h3 className="font-bold text-gray-700">Registrar Nuevo Movimiento</h3>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Tipo</label>
                    <select name="type" className="w-full border rounded px-2 py-1 bg-gray-50">
                        <option value="DEBIT">Ingreso (DEBIT)</option>
                        <option value="CREDIT">Egreso (CREDIT)</option>
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Monto</label>
                    <input name="amount" type="number" step="0.01" required className="w-full border rounded px-2 py-1" />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Carga IGTF (3%)</label>
                    <div className="flex items-center gap-2">
                        <input type="checkbox" name="isIgtfApplied" id="igtf" />
                        <label htmlFor="igtf" className="text-sm">Aplicar</label>
                    </div>
                </div>
                <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Referencia</label>
                    <input name="reference" required className="w-full border rounded px-2 py-1" />
                </div>
            </div>

            <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Concepto</label>
                <input name="description" required className="w-full border rounded px-2 py-1" />
            </div>

            <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Contrapartida (Cuenta Contable)</label>
                <select name="contrapartidaId" required className="w-full border rounded px-2 py-1">
                    <option value="">Seleccione cuenta...</option>
                    {accounts.map(acc => (
                        <option key={acc.id} value={acc.id}>{acc.code} - {acc.name}</option>
                    ))}
                </select>
            </div>

            <button disabled={loading} className="w-full bg-slate-900 text-white py-2 rounded hover:bg-slate-800 disabled:opacity-50">
                {loading ? 'Procesando...' : 'Registrar'}
            </button>
        </form>
    )
}
