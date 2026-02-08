'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { PageHeader } from '@/components/ui/PageHeader'

export default function NewBankAccountPage() {
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
            initial_balance: formData.get('initialBalance'),
            // For now, we are NOT sending gl_account_id, assuming backend might handle it 
            // OR we need to let user creating it. 
            // To make this work with minimal friction, we will auto-generate a GL Account in the backend if not provided.
            // But my API implementation EXPECTS gl_account_id.
            // I will modify this to include a request to create one.
            create_gl_account: true,
            gl_account_name: formData.get('bankName') // Use bank name for account name
        }

        try {
            // We need to update API to handle this 'create_gl_account' flag or similar.
            // For this iteration, let's assume I will update the API.
            const res = await fetch('/api/banks', {
                method: 'POST',
                body: JSON.stringify(data),
                headers: { 'Content-Type': 'application/json' }
            })

            if (res.ok) {
                router.push('/dashboard/banks')
                router.refresh()
            } else {
                const err = await res.json()
                alert(err.error || 'Error al crear cuenta bancaria')
            }
        } catch (error) {
            console.error(error)
            alert('Error al crear cuenta')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="max-w-3xl mx-auto">
            <PageHeader title="Nueva Cuenta Bancaria" />

            <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del Banco / Caja</label>
                            <input name="bankName" required placeholder="Ej. Banco Mercantil" className="w-full border-gray-300 rounded-md shadow-sm focus:ring-[#2ca01c] focus:border-[#2ca01c] px-3 py-2 border" />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Número de Cuenta</label>
                            <input name="accountNumber" required placeholder="0105-..." className="w-full border-gray-300 rounded-md shadow-sm focus:ring-[#2ca01c] focus:border-[#2ca01c] px-3 py-2 border" />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Cuenta</label>
                            <select name="type" className="w-full border-gray-300 rounded-md shadow-sm focus:ring-[#2ca01c] focus:border-[#2ca01c] px-3 py-2 border">
                                <option value="CORRIENTE">Corriente</option>
                                <option value="AHORRO">Ahorro</option>
                                <option value="CAJA_CHICA">Caja Chica</option>
                                <option value="OTRO">Otro</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Moneda</label>
                            <select name="currency" className="w-full border-gray-300 rounded-md shadow-sm focus:ring-[#2ca01c] focus:border-[#2ca01c] px-3 py-2 border">
                                <option value="VES">Bolívares (VES)</option>
                                <option value="USD">Dólares (USD)</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Saldo Inicial (Libros)</label>
                            <input type="number" step="0.01" name="initialBalance" placeholder="0.00" className="w-full border-gray-300 rounded-md shadow-sm focus:ring-[#2ca01c] focus:border-[#2ca01c] px-3 py-2 border" />
                        </div>
                    </div>

                    <div className="pt-6 border-t border-gray-200 flex justify-end gap-3">
                        <button type="button" onClick={() => router.back()} className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
                            Cancelar
                        </button>
                        <button type="submit" disabled={loading} className="px-4 py-2 text-white bg-[#2ca01c] rounded-md hover:bg-[#248217] disabled:opacity-50">
                            {loading ? 'Guardando...' : 'Guardar Cuenta'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
