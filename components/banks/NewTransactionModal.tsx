import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AccountSelector, Account } from '@/components/accounting/AccountSelector'
import { DateInput } from '@/components/common/DateInput'

export function NewTransactionModal({
    bankId,
    isOpen,
    onClose,
    accounts,
    taxes
}: {
    bankId: string
    isOpen: boolean
    onClose: () => void
    accounts: Account[]
    taxes: any[]
}) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [type, setType] = useState<'DEBIT' | 'CREDIT'>('CREDIT')
    const [subtype, setSubtype] = useState('')
    const [contraAccountId, setContraAccountId] = useState('')
    const [applyIgtf, setApplyIgtf] = useState(false)

    // Derived IGTF Info
    const igtfTax = taxes.find(t => t.type === 'IGTF')
    const igtfRate = igtfTax ? igtfTax.rate : 0

    // Reset when modal opens or type changes
    useEffect(() => {
        setSubtype('')
        setApplyIgtf(false)
    }, [isOpen, type])

    if (!isOpen) return null

    const subtypes = type === 'CREDIT'
        ? ['Transferencia Enviada', 'Nota de Débito', 'Retiro / Cheque', 'Pago de Tarjeta', 'Comisión Bancaria', 'Otro Egreso']
        : ['Depósito', 'Transferencia Recibida', 'Nota de Crédito', 'Intereses Ganados', 'Otro Ingreso']

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setLoading(true)

        const formData = new FormData(e.currentTarget)
        const rawDescription = formData.get('description') as string
        const fullDescription = subtype ? `${subtype}: ${rawDescription}` : rawDescription

        const data = {
            date: formData.get('date'),
            description: fullDescription,
            reference: formData.get('reference'),
            amount: formData.get('amount'),
            type: type,
            contra_account_id: contraAccountId,
            isIgtfApplied: applyIgtf
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
                    {/* TYPE SELECTION */}
                    <div className="flex gap-4 mb-4">
                        <button
                            type="button"
                            onClick={() => setType('CREDIT')}
                            className={`flex-1 py-2 rounded-full font-medium transition-colors ${type === 'CREDIT' ? 'bg-orange-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                        >
                            Egreso (Salida)
                        </button>
                        <button
                            type="button"
                            onClick={() => setType('DEBIT')}
                            className={`flex-1 py-2 rounded-full font-medium transition-colors ${type === 'DEBIT' ? 'bg-[#2ca01c] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                        >
                            Ingreso (Entrada)
                        </button>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
                            <DateInput name="date" required defaultValue={new Date().toISOString().split('T')[0]} className="focus:ring-[#2ca01c] focus:border-[#2ca01c]" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Operación</label>
                            <select
                                value={subtype}
                                onChange={(e) => setSubtype(e.target.value)}
                                className="w-full border-gray-300 rounded-md focus:ring-[#2ca01c] focus:border-[#2ca01c]"
                                required
                            >
                                <option value="" disabled>Seleccione...</option>
                                {subtypes.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Referencia</label>
                            <input name="reference" className="w-full border-gray-300 rounded-md focus:ring-[#2ca01c] focus:border-[#2ca01c]" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Monto ({type === 'CREDIT' ? 'Salida' : 'Entrada'})</label>
                            <input type="number" step="0.01" name="amount" required className="w-full border-gray-300 rounded-md focus:ring-[#2ca01c] focus:border-[#2ca01c] font-mono text-lg" />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Descripción / Beneficiario</label>
                        <input name="description" required className="w-full border-gray-300 rounded-md focus:ring-[#2ca01c] focus:border-[#2ca01c]" />
                    </div>

                    <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Cuenta Contable (Contrapartida)</label>
                        <AccountSelector
                            companyId="" // Assuming companyId is not directly available or needed for preloaded accounts
                            value={contraAccountId}
                            onChange={setContraAccountId}
                            label="Cuenta Contable del Movimiento"
                            preloadedAccounts={accounts}
                            placeholder="Buscar cuenta..."
                            required
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            {type === 'CREDIT' ? 'Gasto, Pasivo (quien recibe el pago)' : 'Ingreso, Cuentas por Cobrar (origen del dinero)'}
                        </p>
                    </div>

                    {/* IGTF Checkbox - Only for Credits */}
                    {type === 'CREDIT' && (
                        <div className="flex items-center gap-2 p-3 bg-orange-50 rounded-md border border-orange-100">
                            <input
                                id="igtf"
                                type="checkbox"
                                checked={applyIgtf}
                                onChange={(e) => setApplyIgtf(e.target.checked)}
                                className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                            />
                            <label htmlFor="igtf" className="text-sm text-gray-700 font-medium">
                                Aplicar Impuesto IGTF ({igtfRate}%)
                            </label>
                        </div>
                    )}

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
