'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AccountSelector, Account } from '@/components/accounting/AccountSelector'

type JournalLine = {
    accountCode: string
    debit: string
    credit: string
    description: string
}

import { updateJournalEntry } from '@/lib/actions/journal-actions'
import { DateInput } from '@/components/common/DateInput'

export function JournalEntryForm({ companyId, initialData, entryId }: { companyId: string, initialData?: any, entryId?: string }) {
    const router = useRouter()
    const [accounts, setAccounts] = useState<Account[]>([])

    // Initialize state with initialData if provided
    const [date, setDate] = useState(initialData?.date ? new Date(initialData.date).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10))
    const [description, setDescription] = useState(initialData?.description || '')

    const [lines, setLines] = useState<any[]>(initialData?.lines ? initialData.lines.map((l: any) => ({
        accountId: l.account_id || l.accountId, // Handle both casing
        debit: l.debit?.toString() || '0',
        credit: l.credit?.toString() || '0',
        description: l.description || ''
    })) : [
        { accountId: '', debit: '0', credit: '0', description: '' },
        { accountId: '', debit: '0', credit: '0', description: '' }
    ])

    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    // Fetch accounts on mount
    useEffect(() => {
        if (!companyId) return
        fetch(`/api/accounting/accounts?companyId=${companyId}`)
            .then(res => res.json())
            .then(data => setAccounts(data))
            .catch(err => console.error('Error al cargar cuentas', err))
    }, [companyId])

    const addLine = () => {
        setLines([...lines, { accountId: '', debit: '0', credit: '0', description: '' }])
    }

    const updateLine = (index: number, field: string, value: string) => {
        const newLines = [...lines]
        newLines[index] = { ...newLines[index], [field]: value }
        setLines(newLines)
    }

    const totalDebit = lines.reduce((sum, line) => sum + (parseFloat(line.debit) || 0), 0)
    const totalCredit = lines.reduce((sum, line) => sum + (parseFloat(line.credit) || 0), 0)
    const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')

        if (!isBalanced) {
            setError(`El asiento no está cuadrado. Diferencia: ${(totalDebit - totalCredit).toFixed(2)}`)
            return
        }

        if (!description) {
            setError('La descripción es obligatoria')
            return
        }

        const invalidAllocations = lines.filter(l => !l.accountId && (parseFloat(l.debit) > 0 || parseFloat(l.credit) > 0))
        if (invalidAllocations.length > 0) {
            setError('Hay líneas con montos pero sin cuenta asignada.')
            return
        }

        setLoading(true)

        try {
            const payload = {
                companyId,
                date: new Date(date),
                description,
                lines: lines.map(l => {
                    const acc = accounts.find(a => a.id === l.accountId)
                    return {
                        accountId: l.accountId, // For update action
                        accountCode: acc ? acc.code : '', // For API create
                        debit: parseFloat(l.debit) || 0,
                        credit: parseFloat(l.credit) || 0,
                        description: l.description || description
                    }
                }).filter(l => (l.accountId || l.accountCode) && (l.debit > 0 || l.credit > 0))
            }

            if (entryId) {
                // UPDATE MODE
                const res = await updateJournalEntry(entryId, payload)
                if (!res.success) throw new Error(res.error)
                alert('¡Asiento actualizado con éxito!')
                router.push('/dashboard/accounting/reports/entries') // Redirect back to list
            } else {
                // CREATE MODE
                const res = await fetch('/api/transactions', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                })

                if (!res.ok) {
                    const err = await res.json()
                    throw new Error(err.error || 'Error al registrar la transacción')
                }

                // Reset Form
                setDescription('')
                setLines([
                    { accountId: '', debit: '0', credit: '0', description: '' },
                    { accountId: '', debit: '0', credit: '0', description: '' }
                ])
                alert('¡Asiento registrado con éxito!')
                router.refresh()
            }

        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow border border-gray-100">
            <h2 className="text-lg font-bold mb-4">{entryId ? 'Editar Asiento Contable' : 'Nuevo Asiento Contable'}</h2>

            {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded mb-4 text-sm">
                    {error}
                </div>
            )}

            <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                    <DateInput
                        label="Fecha"
                        value={date}
                        onChange={e => setDate(e.target.value)}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Descripción</label>
                    <input
                        type="text"
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                        placeholder="Ej. Saldo Inicial"
                    />
                </div>
            </div>

            <div className="space-y-2 mb-4">
                <div className="grid grid-cols-12 gap-2 text-xs font-medium text-gray-500 uppercase">
                    <div className="col-span-4">Cuenta</div>
                    <div className="col-span-3">Descripción de Línea</div>
                    <div className="col-span-2 text-right">Debe</div>
                    <div className="col-span-2 text-right">Haber</div>
                    <div className="col-span-1"></div>
                </div>

                {lines.map((line, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-2 items-start">
                        <div className="col-span-4">
                            <AccountSelector
                                companyId={companyId}
                                value={line.accountId}
                                onChange={(id) => updateLine(idx, 'accountId', id)}
                                placeholder="Buscar cuenta..."
                                label=""
                            />
                        </div>
                        <div className="col-span-3">
                            <input
                                type="text"
                                value={line.description}
                                onChange={e => updateLine(idx, 'description', e.target.value)}
                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                                placeholder="Opcional"
                            />
                        </div>
                        <div className="col-span-2">
                            <input
                                type="number"
                                step="0.01"
                                value={line.debit}
                                onChange={e => updateLine(idx, 'debit', e.target.value)}
                                className="block w-full text-right rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                            />
                        </div>
                        <div className="col-span-2">
                            <input
                                type="number"
                                step="0.01"
                                value={line.credit}
                                onChange={e => updateLine(idx, 'credit', e.target.value)}
                                className="block w-full text-right rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                            />
                        </div>
                        <div className="col-span-1 text-center pt-2">
                            <button
                                type="button"
                                onClick={() => {
                                    const newLines = lines.filter((_, i) => i !== idx)
                                    setLines(newLines)
                                }}
                                className="text-red-500 hover:text-red-700 font-bold"
                            >
                                &times;
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            <div className="flex justify-between items-center mb-6">
                <button
                    type="button"
                    onClick={addLine}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                    + Agregar Línea
                </button>
                <div className="flex space-x-4 text-sm font-bold">
                    <div className={totalDebit !== totalCredit ? 'text-red-600' : 'text-gray-700'}>
                        Total Debe: {totalDebit.toFixed(2)}
                    </div>
                    <div className={totalDebit !== totalCredit ? 'text-red-600' : 'text-gray-700'}>
                        Total Haber: {totalCredit.toFixed(2)}
                    </div>
                </div>
            </div>

            <div className="flex justify-end">
                <button
                    type="submit"
                    disabled={loading || !isBalanced}
                    className={`px-4 py-2 rounded text-white font-medium ${loading || !isBalanced ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
                >
                    {loading ? 'Procesando...' : (entryId ? 'Actualizar Asiento' : 'Registrar Asiento')}
                </button>
            </div>

        </form>
    )
}
