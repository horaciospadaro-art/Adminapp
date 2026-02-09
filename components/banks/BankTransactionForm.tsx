'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { BankTransactionTypeSelector, type TransactionSubtype } from './BankTransactionTypeSelector'
import { AccountSelector } from '@/components/accounting/AccountSelector'

type BankAccount = {
    id: string
    bank_name: string
    account_number: string
    currency: string
    balance: number
}

type BankTransactionFormProps = {
    bankAccount: BankAccount
}

export function BankTransactionForm({ bankAccount }: BankTransactionFormProps) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [subtype, setSubtype] = useState<TransactionSubtype>('DEPOSIT')
    const [amount, setAmount] = useState<number>(0)
    const [isIgtfApplied, setIsIgtfApplied] = useState(false)
    const [contraAccountId, setContraAccountId] = useState<string>('')
    const [targetBankId, setTargetBankId] = useState<string>('')
    const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([])

    // Auto-apply IGTF for USD accounts on CREDIT transactions
    useEffect(() => {
        if (bankAccount.currency === 'USD' && (subtype === 'WITHDRAWAL' || subtype === 'CREDIT_NOTE')) {
            setIsIgtfApplied(true)
        } else {
            setIsIgtfApplied(false)
        }
    }, [bankAccount.currency, subtype])

    // Load other bank accounts for transfers
    useEffect(() => {
        if (subtype === 'TRANSFER_OUT') {
            fetch('/api/banks')
                .then(res => res.json())
                .then(data => setBankAccounts(data.filter((b: BankAccount) => b.id !== bankAccount.id)))
                .catch(err => console.error('Error loading banks:', err))
        }
    }, [subtype, bankAccount.id])

    // Calculate IGTF amount
    const igtfAmount = useMemo(() => {
        if (!isIgtfApplied || amount <= 0) return 0
        return amount * 0.03
    }, [isIgtfApplied, amount])

    // Calculate total amount
    const totalAmount = useMemo(() => {
        if (subtype === 'WITHDRAWAL' || subtype === 'CREDIT_NOTE' || subtype === 'TRANSFER_OUT') {
            return amount + igtfAmount
        }
        return amount
    }, [subtype, amount, igtfAmount])

    // Determine transaction type (DEBIT/CREDIT)
    const transactionType = useMemo(() => {
        if (subtype === 'DEPOSIT' || subtype === 'DEBIT_NOTE' || subtype === 'TRANSFER_IN') {
            return 'DEBIT'
        }
        return 'CREDIT'
    }, [subtype])

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setLoading(true)
        const formData = new FormData(e.currentTarget)

        const data = {
            date: new Date().toISOString(),
            reference: formData.get('reference'),
            description: formData.get('description'),
            amount: amount,
            type: transactionType,
            subtype: subtype,
            isIgtfApplied: isIgtfApplied,
            contra_account_id: contraAccountId,
            related_bank_account_id: subtype === 'TRANSFER_OUT' ? targetBankId : null
        }

        try {
            const res = await fetch(`/api/banks/${bankAccount.id}/transactions`, {
                method: 'POST',
                body: JSON.stringify(data),
                headers: { 'Content-Type': 'application/json' }
            })

            if (res.ok) {
                router.refresh()
                const form = e.target as HTMLFormElement
                form.reset()
                setAmount(0)
                setContraAccountId('')
                setTargetBankId('')
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
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md space-y-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-lg text-gray-800">Registrar Nuevo Movimiento</h3>
                <div className="text-sm text-gray-600">
                    <span className="font-semibold">{bankAccount.bank_name}</span>
                    <span className="mx-2">•</span>
                    <span>{bankAccount.account_number}</span>
                    <span className="mx-2">•</span>
                    <span className="font-semibold">{bankAccount.currency}</span>
                </div>
            </div>

            <BankTransactionTypeSelector value={subtype} onChange={setSubtype} />

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">
                        Monto <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="number"
                        step="0.01"
                        min="0"
                        required
                        value={amount || ''}
                        onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                        className="w-full border rounded px-3 py-2 focus:border-blue-500 focus:outline-none"
                        placeholder="0.00"
                    />
                </div>
                <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">
                        Referencia <span className="text-red-500">*</span>
                    </label>
                    <input
                        name="reference"
                        required
                        className="w-full border rounded px-3 py-2 focus:border-blue-500 focus:outline-none"
                        placeholder="Nro. de referencia"
                    />
                </div>
            </div>

            <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                    Concepto <span className="text-red-500">*</span>
                </label>
                <input
                    name="description"
                    required
                    className="w-full border rounded px-3 py-2 focus:border-blue-500 focus:outline-none"
                    placeholder="Descripción del movimiento"
                />
            </div>

            {/* Transfer destination */}
            {subtype === 'TRANSFER_OUT' && (
                <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">
                        Cuenta Destino <span className="text-red-500">*</span>
                    </label>
                    <select
                        value={targetBankId}
                        onChange={(e) => setTargetBankId(e.target.value)}
                        required
                        className="w-full border rounded px-3 py-2 bg-gray-50 focus:bg-white focus:border-blue-500 focus:outline-none"
                    >
                        <option value="">Seleccione cuenta destino...</option>
                        {bankAccounts.map((bank) => (
                            <option key={bank.id} value={bank.id}>
                                {bank.bank_name} - {bank.account_number} ({bank.currency})
                            </option>
                        ))}
                    </select>
                </div>
            )}

            {/* Contra account selection */}
            {subtype !== 'TRANSFER_OUT' && (
                <AccountSelector
                    value={contraAccountId}
                    onChange={setContraAccountId}
                    label="Contrapartida (Cuenta Contable)"
                    required
                />
            )}

            {/* IGTF Display */}
            {bankAccount.currency === 'USD' && (subtype === 'WITHDRAWAL' || subtype === 'CREDIT_NOTE') && (
                <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <input
                            type="checkbox"
                            id="igtf"
                            checked={isIgtfApplied}
                            onChange={(e) => setIsIgtfApplied(e.target.checked)}
                            className="w-4 h-4"
                        />
                        <label htmlFor="igtf" className="text-sm font-semibold text-gray-700">
                            Aplicar IGTF (3% sobre transacciones en divisas)
                        </label>
                    </div>
                    {isIgtfApplied && amount > 0 && (
                        <div className="text-sm text-gray-700 space-y-1 ml-6">
                            <div>
                                <span className="text-gray-600">Monto base:</span>{' '}
                                <span className="font-semibold">${amount.toFixed(2)}</span>
                            </div>
                            <div>
                                <span className="text-gray-600">IGTF (3%):</span>{' '}
                                <span className="font-semibold text-yellow-700">${igtfAmount.toFixed(2)}</span>
                            </div>
                            <div className="pt-1 border-t border-yellow-300">
                                <span className="text-gray-600">Total a deducir:</span>{' '}
                                <span className="font-bold text-lg">${totalAmount.toFixed(2)}</span>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Summary */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="text-sm space-y-1">
                    <div className="flex justify-between">
                        <span className="text-gray-600">Tipo de movimiento:</span>
                        <span className="font-semibold">{transactionType === 'DEBIT' ? 'Ingreso' : 'Egreso'}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-600">Saldo actual:</span>
                        <span className="font-semibold">{bankAccount.currency} {bankAccount.balance.toLocaleString('es-VE', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-gray-300">
                        <span className="text-gray-600">Nuevo saldo:</span>
                        <span className={`font-bold ${transactionType === 'DEBIT' ? 'text-green-600' : 'text-red-600'}`}>
                            {bankAccount.currency} {(
                                transactionType === 'DEBIT'
                                    ? bankAccount.balance + amount
                                    : bankAccount.balance - totalAmount
                            ).toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                        </span>
                    </div>
                </div>
            </div>

            <button
                disabled={loading}
                className="w-full bg-slate-900 text-white py-3 rounded-lg font-semibold hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
                {loading ? 'Procesando...' : 'Registrar Transacción'}
            </button>
        </form>
    )
}
