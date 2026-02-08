import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AccountCombobox, Account } from '@/components/accounting/AccountCombobox'

export function NewTransactionModal({
    bankId,
    isOpen,
    onClose,
    accounts
}: {
    bankId: string
    isOpen: boolean
    onClose: () => void
    accounts: Account[]
}) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [type, setType] = useState<'DEBIT' | 'CREDIT'>('CREDIT') // Egreso por defecto
    const [contraAccountId, setContraAccountId] = useState('')

    if (!isOpen) return null

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setLoading(true)

        const formData = new FormData(e.currentTarget)
        const data = {
            date: formData.get('date'),
            description: formData.get('description'),
            reference: formData.get('reference'),
            amount: formData.get('amount'),
            type: type,
            contra_account_id: contraAccountId // Use state
        }

        try {
            const res = await fetch(`/api/banks/${bankId}/transactions`, {
                method: 'POST',
                body: JSON.stringify(data),
                headers: { 'Content-Type': 'application/json' }
            })

            if (res.ok) {
                router.refresh()
                onClose()
            } else {
                alert('Error al registrar movimiento')
            }
        } catch (error) {
            console.error(error)
            alert('Error al registrar movimiento')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center p-6 border-b border-gray-100">
                    <h2 className="text-xl font-bold text-[#393a3d]">Registrar Movimiento</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">×</button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="flex gap-4 mb-4">
                        <button
                            type="button"
                            onClick={() => setType('CREDIT')}
                            className={`flex-1 py-2 rounded-full font-medium transition-colors ${type === 'CREDIT' ? 'bg-orange-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                        >
                            Egreso (Pago)
                        </button>
                        <button
                            type="button"
                            onClick={() => setType('DEBIT')}
                            className={`flex-1 py-2 rounded-full font-medium transition-colors ${type === 'DEBIT' ? 'bg-[#2ca01c] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                        >
                            Ingreso (Depósito)
                        </button>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
                            <input type="date" name="date" required defaultValue={new Date().toISOString().split('T')[0]} className="w-full border-gray-300 rounded-md focus:ring-[#2ca01c] focus:border-[#2ca01c]" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Referencia</label>
                            <input name="reference" className="w-full border-gray-300 rounded-md focus:ring-[#2ca01c] focus:border-[#2ca01c]" />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Descripción / Beneficiario</label>
                        <input name="description" required className="w-full border-gray-300 rounded-md focus:ring-[#2ca01c] focus:border-[#2ca01c]" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Monto ({type === 'CREDIT' ? 'Salida' : 'Entrada'})</label>
                            <input type="number" step="0.01" name="amount" required className="w-full border-gray-300 rounded-md focus:ring-[#2ca01c] focus:border-[#2ca01c] font-mono text-lg" />
                        </div>

                        <div>
                            {/* Hidden input not needed technically if we override data construction, but good practice if using FormData fully */}
                            <input type="hidden" name="contraAccountId" value={contraAccountId} />

                            <AccountCombobox
                                companyId="" // Not needed if preloadedAccounts provided
                                label="Cuenta Contable (Contrapartida)"
                                value={contraAccountId}
                                onChange={setContraAccountId}
                                preloadedAccounts={accounts}
                                placeholder="Buscar cuenta..."
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                {type === 'CREDIT' ? 'Gasto, Pasivo (quien recibe el pago)' : 'Ingreso, Cuentas por Cobrar (origen del dinero)'}
                            </p>
                        </div>
                    </div>

                    <div className="pt-6 flex justify-end gap-3">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
                            Cancelar
                        </button>
                        <button type="submit" disabled={loading} className={`px-6 py-2 text-white rounded-md transition-colors ${type === 'CREDIT' ? 'bg-orange-600 hover:bg-orange-700' : 'bg-[#2ca01c] hover:bg-[#248217]'
                            }`}>
                            {loading ? 'Guardando...' : 'Registrar Movimiento'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
