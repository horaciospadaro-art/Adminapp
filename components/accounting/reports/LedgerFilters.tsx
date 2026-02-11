'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { AccountSelector } from '@/components/accounting/AccountSelector'

export function LedgerFilters({ companyId }: { companyId: string }) {
    const router = useRouter()
    const searchParams = useSearchParams()

    // Default: Start of current month, End of today
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    const formatDate = (d: Date) => d.toISOString().split('T')[0]

    const [startDate, setStartDate] = useState(searchParams.get('startDate') || formatDate(startOfMonth))
    const [endDate, setEndDate] = useState(searchParams.get('endDate') || formatDate(now))
    const [accountId, setAccountId] = useState(searchParams.get('accountId') || '')

    const handleGenerate = () => {
        if (!accountId) {
            alert('Por favor seleccione una cuenta contable.')
            return
        }

        const params = new URLSearchParams()
        params.set('startDate', startDate)
        params.set('endDate', endDate)
        params.set('accountId', accountId)

        router.push(`?${params.toString()}`)
    }

    return (
        <div className="bg-white p-4 rounded-lg shadow space-y-4 md:space-y-0 md:flex md:items-end md:space-x-4 border border-gray-200">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Desde</label>
                <input
                    type="date"
                    title="Fecha Desde"
                    placeholder="Desde"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hasta</label>
                <input
                    type="date"
                    title="Fecha Hasta"
                    placeholder="Hasta"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
            </div>
            <div className="flex-1 min-w-[300px]">
                <AccountSelector
                    companyId={companyId}
                    value={accountId}
                    onChange={setAccountId}
                    label="Cuenta Contable"
                    placeholder="Busque por código o nombre..."
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
