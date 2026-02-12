
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { BankAccount } from '../types'
import { AccountSelector } from '@/components/accounting/AccountSelector'
import { DateInput } from '@/components/common/DateInput'

type NotasFormProps = {
    bankAccount: BankAccount
}

type NotaType = 'DEBIT_NOTE' | 'CREDIT_NOTE'

export function NotasForm({ bankAccount }: NotasFormProps) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [type, setType] = useState<NotaType>('DEBIT_NOTE')
    const [reference, setReference] = useState('')
    const [description, setDescription] = useState('')
    const [date, setDate] = useState(new Date().toISOString().split('T')[0])
    const [amount, setAmount] = useState<number>(0)
    const [contraAccountId, setContraAccountId] = useState('')
    const [isIgtfApplied, setIsIgtfApplied] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            // DEBIT_NOTE = Charge (Bank Fee) -> Money OUT? 
            // WAIT!
            // Standard accounting:
            // Debit Note from Bank: They charged us. Money leaves the account. (Create Credit on Bank asset).
            // Credit Note from Bank: They paid us interest/correction. Money enters the account. (Create Debit on Bank asset).

            // However, in some systems "Debit Memorandum" means Increase AR?
            // In Banking config (Bank Statement), Debit = Withdrawal, Credit = Deposit.
            // So:
            // Debit Note = Withdrawal (Gasto bancario).
            // Credit Note = Deposit (Intereses ganados).

            // BUT `BankTransactionType` enum has `DEBIT` and `CREDIT`.
            // My previous code mapped:
            // subtype === 'DEBIT_NOTE' -> type 'DEBIT' (Ingreso?)
            // subtype === 'CREDIT_NOTE' -> type 'CREDIT' (Egreso?)

            // Let's check `BankTransactionForm.tsx` original logic:
            /*
            if (subtype === 'DEPOSIT' || subtype === 'DEBIT_NOTE' || subtype === 'TRANSFER_IN') {
                return 'DEBIT' // INGRESO
            }
            return 'CREDIT' // EGRESO
            */
            // So originally: Debit Note -> DEBIT (Ingreso). Credit Note -> CREDIT (Egreso).
            // This is confusing phrasing.
            // Usually "Nota de Debito" ON A BANK STATEMENT means a charge (Egreso).
            // "Nota de Credito" ON A BANK STATEMENT means a deposit (Ingreso).

            // IF the user considers "Nota de Debito" as "Bank sends me a Debit Note", it means they debited my account (Decreased balance).
            // So it should be a WITHDRAWAL (Credit to Bank Asset).

            // I should clarify this or stick to previous logic?
            // "Nota de Debito: Cargo bancario o ajuste positivo" -> Description in `BankTransactionTypeSelector` said "ajuste positivo" (Positive adjustment).
            // "Nota de Credito: Abono bancario o ajuste negativo" -> "ajuste negativo".

            // This seems INVERTED from standard banking terms, but consistent with "WE issue a Debit Note to Increase Receivable".
            // But this is BANK module.

            // Let's look at the Selector description again (Step 54):
            /*
            value: 'DEBIT_NOTE',
            label: 'Nota de Débito',
            description: 'Cargo bancario o ajuste positivo', // "Cargo bancario" usually means charge (decrease), but "ajuste positivo" means increase?
            color: 'text-purple-600'
            */

            // If the previous code mapped DEBIT_NOTE to 'DEBIT' (Increase in Asset), then it treats it as an Increase.
            // This is non-standard for "Bank Debit Note".
            // BUT, maybe the user means "Nota de Debito QUE NOSOTROS HACEMOS"?
            // No, it's a bank transaction.

            // I will stick to the previous logic to avoiding breaking existing assumptions, BUT I will add a toggle or clear labels.
            // Actually, I will follow the standard:
            // Nota de Débito (Bancaria) -> Egreso (Comisiones).
            // Nota de Crédito (Bancaria) -> Ingreso (Intereses).

            // Let's check `BankTransactionForm` again (Step 53).
            // Lines 65-69:
            // if (subtype === 'DEPOSIT' || subtype === 'DEBIT_NOTE' || subtype === 'TRANSFER_IN') return 'DEBIT'
            // else return 'CREDIT'

            // So DEBIT_NOTE was 'DEBIT' (Increase Balance).
            // CREDIT_NOTE was 'CREDIT' (Decrease Balance).

            // This is indeed inverted from "Bank Statement" terminology.
            // It treats "Debit Note" as "We Debit our Bank Account" (Increase).
            // And "Credit Note" as "We Credit our Bank Account" (Decrease).

            // I will label them clearly in the UI to avoid confusion.
            // "Nota de Débito (Aumento de Saldo / Corrección a favor)"
            // "Nota de Crédito (Disminución de Saldo / Corrección en contra / Error bancario)"

            // Wait, usually users get confused.
            // I will use "Ingreso (ND)" and "Egreso (NC)"?
            // Or just "Ajuste Positivo" and "Ajuste Negativo"?

            // Let's stick to the mapping:
            // DEBIT_NOTE -> DEBIT (Increase)
            // CREDIT_NOTE -> CREDIT (Decrease)

            const transactionType = type === 'DEBIT_NOTE' ? 'DEBIT' : 'CREDIT'

            const data = {
                date: new Date(date).toISOString(),
                reference,
                description,
                amount,
                type: transactionType,
                subtype: type,
                contra_account_id: contraAccountId,
                isIgtfApplied: bankAccount.currency === 'USD' && type === 'CREDIT_NOTE' && isIgtfApplied
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
                setContraAccountId('')
            } else {
                const err = await res.json()
                alert('Error: ' + err.error)
            }
        } catch (error) {
            console.error(error)
            alert('Error al registrar nota')
        } finally {
            setLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex gap-4 border-b pb-4">
                <button
                    type="button"
                    onClick={() => setType('DEBIT_NOTE')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${type === 'DEBIT_NOTE'
                        ? 'bg-purple-100 text-purple-700'
                        : 'text-gray-600 hover:bg-gray-100'
                        }`}
                >
                    Nota de Débito (Aumento/Positivo)
                </button>
                <button
                    type="button"
                    onClick={() => setType('CREDIT_NOTE')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${type === 'CREDIT_NOTE'
                        ? 'bg-orange-100 text-orange-700'
                        : 'text-gray-600 hover:bg-gray-100'
                        }`}
                >
                    Nota de Crédito (Disminución/Negativo)
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                    <DateInput
                        label="Fecha"
                        value={date}
                        onChange={e => setDate(e.target.value)}
                        required
                    />
                </div>
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
                label="Cuenta Contable (Contrapartida)"
                required
                value={contraAccountId}
                onChange={setContraAccountId}
            />

            {bankAccount.currency === 'USD' && type === 'CREDIT_NOTE' && (
                <div className="flex items-center gap-2 mt-4 bg-yellow-50 p-2 rounded">
                    <input
                        type="checkbox"
                        id="igtf"
                        checked={isIgtfApplied}
                        onChange={e => setIsIgtfApplied(e.target.checked)}
                        className="w-4 h-4"
                    />
                    <label htmlFor="igtf" className="text-sm font-semibold text-gray-700">
                        Aplicar IGTF (3%)
                    </label>
                </div>
            )}

            <button
                type="submit"
                disabled={loading}
                className="w-full bg-slate-900 text-white py-3 rounded-lg font-semibold hover:bg-slate-800 disabled:opacity-50"
            >
                {loading ? 'Procesando...' : 'Registrar Nota'}
            </button>
        </form>
    )
}
