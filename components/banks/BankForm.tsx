'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface BankFormProps {
    initialData?: {
        id?: string
        bank_name: string
        account_number: string
        type: string
        currency: string
        balance: number
        gl_account_id?: string
    }
    isEdit?: boolean
}

export function BankForm({ initialData, isEdit = false }: BankFormProps) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setLoading(true)

        const formData = new FormData(e.currentTarget)
        const data = {
            name: formData.get('bankName'),
            account_number: formData.get('accountNumber'),
            currency: formData.get('currency'),
            type: formData.get('type'),
            // Only send balance if creating, or creating logic handles it differently. 
            // Usually balance is not editable directly without a transaction, but for initial setup it is.
            // In edit mode, we might disable balance editing or treat it as an adjustment?
            // For now, let's treat balance as read-only in Edit mode to ensure accounting integrity.
            ...(isEdit ? {} : { initial_balance: formData.get('initialBalance') }),

            // For CREATE:
            create_gl_account: !isEdit,
            gl_account_name: formData.get('bankName')
        }

        try {
            const url = isEdit ? `/api/banks/${initialData?.id}` : '/api/banks'
            const method = isEdit ? 'PUT' : 'POST'

            const res = await fetch(url, {
                method,
                body: JSON.stringify(data),
                headers: { 'Content-Type': 'application/json' }
            })

            if (res.ok) {
                router.push('/dashboard/banks')
                router.refresh()
            } else {
                const err = await res.json()
                alert(err.error || 'Error al guardar cuenta bancaria')
            }
        } catch (error) {
            console.error(error)
            alert('Error al procesar solicitud')
        } finally {
            setLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del Banco / Caja</label>
                    <input
                        name="bankName"
                        defaultValue={initialData?.bank_name}
                        required
                        placeholder="Ej. Banco Mercantil"
                        className="w-full border-gray-300 rounded-md shadow-sm focus:ring-[#2ca01c] focus:border-[#2ca01c] px-3 py-2 border"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Número de Cuenta</label>
                    <input
                        name="accountNumber"
                        defaultValue={initialData?.account_number}
                        required
                        placeholder="0105-..."
                        className="w-full border-gray-300 rounded-md shadow-sm focus:ring-[#2ca01c] focus:border-[#2ca01c] px-3 py-2 border"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Cuenta</label>
                    <select
                        name="type"
                        defaultValue={initialData?.type}
                        className="w-full border-gray-300 rounded-md shadow-sm focus:ring-[#2ca01c] focus:border-[#2ca01c] px-3 py-2 border"
                    >
                        <option value="CORRIENTE">Corriente</option>
                        <option value="AHORRO">Ahorro</option>
                        <option value="CAJA_CHICA">Caja Chica</option>
                        <option value="OTRO">Otro</option>
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Moneda</label>
                    <select
                        name="currency"
                        defaultValue={initialData?.currency || 'VES'}
                        className="w-full border-gray-300 rounded-md shadow-sm focus:ring-[#2ca01c] focus:border-[#2ca01c] px-3 py-2 border"
                    >
                        <option value="VES">Bolívares (VES)</option>
                        <option value="USD">Dólares (USD)</option>
                    </select>
                </div>

                {!isEdit && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Saldo Inicial (Libros)</label>
                        <input
                            type="number"
                            step="0.01"
                            name="initialBalance"
                            defaultValue={initialData?.balance}
                            placeholder="0.00"
                            className="w-full border-gray-300 rounded-md shadow-sm focus:ring-[#2ca01c] focus:border-[#2ca01c] px-3 py-2 border"
                        />
                    </div>
                )}
            </div>

            <div className="pt-6 border-t border-gray-200 flex justify-end gap-3">
                <button
                    type="button"
                    onClick={() => router.back()}
                    className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                    Cancelar
                </button>
                <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 text-white bg-[#2ca01c] rounded-md hover:bg-[#248217] disabled:opacity-50"
                >
                    {loading ? 'Guardando...' : (isEdit ? 'Actualizar Cuenta' : 'Guardar Cuenta')}
                </button>
            </div>
        </form>
    )
}
