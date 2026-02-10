
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { BankAccount } from '../types'

type TransferenciasFormProps = {
    bankAccount: BankAccount
}

export function TransferenciasForm({ bankAccount }: TransferenciasFormProps) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [reference, setReference] = useState('')
    const [description, setDescription] = useState('')
    const [amount, setAmount] = useState<number>(0)
    const [targetBankId, setTargetBankId] = useState('')
    const [otherBanks, setOtherBanks] = useState<BankAccount[]>([])

    useEffect(() => {
        fetch('/api/banks')
            .then(res => res.json())
            .then((data: BankAccount[]) => {
                setOtherBanks(data.filter(b => b.id !== bankAccount.id))
            })
            .catch(err => console.error(err))
    }, [bankAccount.id])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const data = {
                date: new Date().toISOString(),
                reference,
                description,
                amount,
                type: 'CREDIT',
                subtype: 'TRANSFER_OUT',
                related_bank_account_id: targetBankId,
                isIgtfApplied: bankAccount.currency === 'USD', // Auto-apply for USD transfers
                contra_account_id: 'TRANSFER' // Placeholder, handled by API transfer logic
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
                setTargetBankId('')
            } else {
                const err = await res.json()
                alert('Error: ' + err.error)
            }
        } catch (error) {
            console.error(error)
            alert('Error al registrar transferencia')
        } finally {
            setLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">
                        Cuenta Destino <span className="text-red-500">*</span>
                    </label>
                    <select
                        required
                        value={targetBankId}
                        onChange={e => setTargetBankId(e.target.value)}
                        className="w-full border rounded px-3 py-2 bg-white"
                    >
                        <option value="">Seleccionar cuenta...</option>
                        {otherBanks.map(bank => (
                            <option key={bank.id} value={bank.id}>
                                {bank.bank_name} - {bank.account_number} ({bank.currency})
                            </option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">
                        Monto <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="number"
                        step="0.01"
                        required
                        value={amount || ''}
                        onChange={e => setAmount(Number(e.target.value))}
                        className="w-full border rounded px-3 py-2"
                        placeholder="0.00"
                    />
                </div>
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

            <button
                type="submit"
                disabled={loading}
                className="w-full bg-slate-900 text-white py-3 rounded-lg font-semibold hover:bg-slate-800 disabled:opacity-50"
            >
                {loading ? 'Procesando...' : 'Realizar Transferencia'}
            </button>
        </form>
    )
}
