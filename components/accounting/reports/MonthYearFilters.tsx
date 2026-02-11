
'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

export function MonthYearFilters() {
    const router = useRouter()
    const searchParams = useSearchParams()

    const now = new Date()
    const [month, setMonth] = useState(searchParams.get('month') || String(now.getMonth() + 1))
    const [year, setYear] = useState(searchParams.get('year') || String(now.getFullYear()))

    const handleGenerate = () => {
        const params = new URLSearchParams()
        params.set('month', month)
        params.set('year', year)
        router.push(`?${params.toString()}`)
    }

    return (
        <div className="bg-white p-4 rounded-lg shadow space-y-4 md:space-y-0 md:flex md:items-end md:space-x-4 border border-gray-200">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mes</label>
                <select
                    title="Mes"
                    value={month}
                    onChange={(e) => setMonth(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[150px]"
                >
                    <option value="1">Enero</option>
                    <option value="2">Febrero</option>
                    <option value="3">Marzo</option>
                    <option value="4">Abril</option>
                    <option value="5">Mayo</option>
                    <option value="6">Junio</option>
                    <option value="7">Julio</option>
                    <option value="8">Agosto</option>
                    <option value="9">Septiembre</option>
                    <option value="10">Octubre</option>
                    <option value="11">Noviembre</option>
                    <option value="12">Diciembre</option>
                </select>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Año</label>
                <input
                    type="number"
                    title="Año"
                    placeholder="Año"
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-[100px]"
                />
            </div>
            <button
                onClick={handleGenerate}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors text-sm font-medium h-[38px]"
            >
                Generar
            </button>
        </div>
    )
}
