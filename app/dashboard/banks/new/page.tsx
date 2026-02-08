'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function NewBankAccountPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setLoading(true)

        const formData = new FormData(e.currentTarget)
        const data = {
            bankName: formData.get('bankName'),
            accountNumber: formData.get('accountNumber'),
            currency: formData.get('currency'),
            glAccountCode: formData.get('glAccountCode'), // We might need to select from existing accounts or create one
            glAccountName: formData.get('glAccountName')
        }

        try {
            const res = await fetch('/api/banks', {
                method: 'POST',
                body: JSON.stringify(data),
                headers: { 'Content-Type': 'application/json' }
            })

            if (res.ok) {
                router.push('/dashboard/banks')
                router.refresh()
            } else {
                alert('Error al crear cuenta bancaria')
            }
        } catch (error) {
            console.error(error)
            alert('Error al crear cuenta')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="max-w-2xl mx-auto">
            <h1 className="text-2xl font-bold text-gray-800 mb-6">Nueva Cuenta Bancaria</h1>

            <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow border border-gray-100 space-y-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del Banco</label>
                    <input name="bankName" required placeholder="Ej. Banco Mercantil" className="w-full border rounded px-3 py-2" />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Número de Cuenta</label>
                    <input name="accountNumber" required placeholder="0105-..." className="w-full border rounded px-3 py-2" />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Moneda</label>
                    <select name="currency" className="w-full border rounded px-3 py-2">
                        <option value="VES">Bolívares (VES)</option>
                        <option value="USD">Dólares (USD)</option>
                    </select>
                </div>

                <div className="border-t pt-4">
                    <h3 className="font-semibold text-gray-800 mb-2">Vinculación Contable (Plan de Cuentas)</h3>
                    <p className="text-sm text-gray-500 mb-4">Se creará automáticamente una cuenta auxiliar en el Activo (1.1.01...)</p>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de la Cuenta Contable</label>
                        <input name="glAccountName" required placeholder="Ej. Banco Mercantil Principal" className="w-full border rounded px-3 py-2" />
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                    <button type="button" onClick={() => router.back()} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
                    >
                        {loading ? 'Guardando...' : 'Guardar Cuenta'}
                    </button>
                </div>
            </form>
        </div>
    )
}
