'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface CompanyFormProps {
    initialData?: any
    onSuccess?: () => void
    onCancel?: () => void
}

export function CompanyForm({ initialData, onSuccess, onCancel }: CompanyFormProps) {
    const router = useRouter()
    const [name, setName] = useState('')
    const [rif, setRif] = useState('')
    const [fiscalYearStart, setFiscalYearStart] = useState('')
    const [currency, setCurrency] = useState('VES')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (initialData) {
            setName(initialData.name)
            setRif(initialData.rif)
            // Format date for input date
            const date = new Date(initialData.fiscal_year_start)
            setFiscalYearStart(date.toISOString().slice(0, 10))
            setCurrency(initialData.currency)
        }
    }, [initialData])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        try {
            const isEdit = !!initialData
            const method = isEdit ? 'PUT' : 'POST'
            const body = {
                id: initialData?.id,
                name,
                rif,
                fiscal_year_start: fiscalYearStart,
                currency
            }

            const res = await fetch('/api/companies', {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            })

            if (!res.ok) {
                const data = await res.json()
                throw new Error(data.error || 'Error al guardar empresa')
            }

            router.refresh()
            if (onSuccess) onSuccess()

            if (!isEdit) {
                setName('')
                setRif('')
                setFiscalYearStart('')
                setCurrency('VES')
            }

        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow border border-gray-100 mb-6">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold">
                    {initialData ? 'Editar Empresa' : 'Nueva Empresa'}
                </h2>
                {onCancel && (
                    <button type="button" onClick={onCancel} className="text-gray-500 hover:text-gray-700 text-sm">
                        Cancelar
                    </button>
                )}
            </div>

            {error && <div className="bg-red-50 text-red-600 p-3 rounded mb-4 text-sm">{error}</div>}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="company-name" className="block text-sm font-medium text-gray-700 mb-1">Nombre / Razón Social</label>
                    <input
                        id="company-name"
                        type="text"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        className="w-full border border-gray-300 rounded px-3 py-2"
                        required
                    />
                </div>
                <div>
                    <label htmlFor="company-rif" className="block text-sm font-medium text-gray-700 mb-1">RIF</label>
                    <input
                        id="company-rif"
                        type="text"
                        value={rif}
                        onChange={e => setRif(e.target.value)}
                        placeholder="J-00000000-0"
                        className="w-full border border-gray-300 rounded px-3 py-2"
                        required
                    />
                </div>
                <div>
                    <label htmlFor="fiscal-year" className="block text-sm font-medium text-gray-700 mb-1">Inicio Año Fiscal</label>
                    <input
                        id="fiscal-year"
                        type="date"
                        value={fiscalYearStart}
                        onChange={e => setFiscalYearStart(e.target.value)}
                        className="w-full border border-gray-300 rounded px-3 py-2"
                        required
                    />
                </div>
                <div>
                    <label htmlFor="currency" className="block text-sm font-medium text-gray-700 mb-1">Moneda Base</label>
                    <select
                        id="currency"
                        value={currency}
                        onChange={e => setCurrency(e.target.value)}
                        className="w-full border border-gray-300 rounded px-3 py-2"
                    >
                        <option value="VES">Bolívares (VES)</option>
                        <option value="USD">Dólares (USD)</option>
                    </select>
                </div>
            </div>

            <div className="flex justify-end mt-4">
                <button
                    type="submit"
                    disabled={loading}
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
                >
                    {loading ? 'Guardando...' : (initialData ? 'Actualizar' : 'Crear Empresa')}
                </button>
            </div>
        </form>
    )
}
