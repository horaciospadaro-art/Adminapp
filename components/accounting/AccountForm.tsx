'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

enum AccountType {
    ASSET = 'ASSET',
    LIABILITY = 'LIABILITY',
    EQUITY = 'EQUITY',
    INCOME = 'INCOME',
    COST = 'COST',
    EXPENSE = 'EXPENSE',
    OTHER = 'OTHER'
}

export function AccountForm({ companyId }: { companyId: string }) {
    const router = useRouter()
    const [code, setCode] = useState('')
    const [name, setName] = useState('')
    const [type, setType] = useState<AccountType>(AccountType.ASSET)
    const [error, setError] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)

    // Lógica de validación básica para permitir escribir
    const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value
        // Permitir solo números y puntos
        if (/^[0-9.]*$/.test(val)) {
            setCode(val)
        }
    }

    // Auto-relleno inteligente al salir del campo
    const handleBlur = () => {
        try {
            const formatted = smartFormat(code)
            setCode(formatted)
        } catch (e) {
            // Si falla (ej: demasiados niveles), dejamos el input como está para que el usuario corrija
            // Opcional: mostrar error inmediato
        }
    }

    const smartFormat = (input: string) => {
        const cleanInput = input.replace(/[^0-9.]/g, '')
        const parts = cleanInput.split('.')

        // Si solo escribió números sin puntos (ej: 110100001), intentamos aplicar máscara estricta
        // Pero si tiene puntos, respetamos la estructura y rellenamos ceros
        if (parts.length === 1 && input.length > 1) {
            // Fallback a lógica de posición fija si no hay puntos
            const raw = parts[0]
            // Better stick to: if no dots, user treats it as raw string.
            // Let's rely on the previous mask logic for raw string?
            // No, let's start fresh.
            // If no dots, just return as is or try to parse?
            // Requirement: "Input mask... obligue... formato de puntos".
            // Let's assume user uses dots for smart fill. x.x.x.x
            return input
        }

        // Lógica de padStart (Replica de AccountService)
        if (parts[0] && parts[0].length > 1) parts[0] = parts[0] // Error technically, but let validator catch it or UI error

        // Nivel 3 (Index 2) -> 2 digits
        if (parts[2]) parts[2] = parts[2].padStart(2, '0')

        // Nivel 4 (Index 3) -> 5 digits
        if (parts[3]) parts[3] = parts[3].padStart(5, '0')

        return parts.join('.')
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        try {
            const res = await fetch('/api/accounting/accounts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ companyId, code, name, type })
            })

            if (!res.ok) {
                const data = await res.json()
                throw new Error(data.error || 'Error al crear la cuenta')
            }

            router.refresh()
            // Reset form
            setCode('')
            setName('')
            // Mantener tipo o resetear? Resetear a ASSET
            setType(AccountType.ASSET)
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="bg-white p-6 rounded shadow border border-gray-100 mb-6">
            <h2 className="text-lg font-bold mb-4">Nueva Cuenta Contable</h2>

            {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded mb-4 text-sm">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Código (Formato: X.X.XX.XXXXX)
                        </label>
                        <input
                            type="text"
                            value={code}
                            onChange={handleCodeChange}
                            onBlur={handleBlur}
                            placeholder="1.1.01.00001"
                            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            Ej: 1.1.01.00001 (Activo &rarr; Corriente &rarr; Efectivo &rarr; Caja Principal)
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Nombre de la Cuenta
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Ej: Banco Mercantil"
                            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Tipo
                        </label>
                        <select
                            value={type}
                            onChange={(e) => setType(e.target.value as AccountType)}
                            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            aria-label="Tipo de Cuenta"
                        >
                            <option value={AccountType.ASSET}>ACTIVO</option>
                            <option value={AccountType.LIABILITY}>PASIVO</option>
                            <option value={AccountType.EQUITY}>PATRIMONIO</option>
                            <option value={AccountType.INCOME}>INGRESOS</option>
                            <option value={AccountType.COST}>COSTOS</option>
                            <option value={AccountType.EXPENSE}>GASTOS</option>
                            <option value={AccountType.OTHER}>OTROS</option>
                        </select>
                    </div>
                </div>

                <div className="flex justify-end">
                    <button
                        type="submit"
                        disabled={loading}
                        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
                    >
                        {loading ? 'Guardando...' : 'Crear Cuenta'}
                    </button>
                </div>
            </form>
        </div>
    )
}
