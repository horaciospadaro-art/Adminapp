'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { AccountSelector } from '@/components/accounting/AccountSelector'
import { DateInput } from '@/components/common/DateInput'

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
    const [accountIdTo, setAccountIdTo] = useState(searchParams.get('accountIdTo') || '')

    const handleGenerate = () => {
        if (!accountId) {
            alert('Por favor seleccione al menos la cuenta "Desde".')
            return
        }
        if (accountIdTo && accountId === accountIdTo) {
            alert('Si usa rango, "Desde" y "Hasta" deben ser cuentas distintas, o deje "Hasta" vacío para una sola cuenta.')
            return
        }

        const params = new URLSearchParams()
        params.set('startDate', startDate)
        params.set('endDate', endDate)
        params.set('accountId', accountId)
        if (accountIdTo) params.set('accountIdTo', accountIdTo)

        router.push(`?${params.toString()}`)
    }

    return (
        <div className="bg-white p-4 rounded-lg shadow space-y-4 border border-gray-200">
            <div className="flex flex-wrap items-end gap-4">
                <div>
                    <DateInput
                        label="Desde (fecha)"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                    />
                </div>
                <div>
                    <DateInput
                        label="Hasta (fecha)"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                    />
                </div>
                <div className="flex-1 min-w-[260px]">
                    <AccountSelector
                        companyId={companyId}
                        value={accountId}
                        onChange={setAccountId}
                        label="Desde (cuenta)"
                        placeholder="Primera cuenta del rango..."
                    />
                </div>
                <div className="flex-1 min-w-[260px]">
                    <AccountSelector
                        companyId={companyId}
                        value={accountIdTo}
                        onChange={setAccountIdTo}
                        label="Hasta (cuenta, opcional)"
                        placeholder="Última cuenta del rango (cascada)..."
                    />
                </div>
                <button
                    onClick={handleGenerate}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors text-sm font-medium h-[38px]"
                >
                    Generar
                </button>
            </div>
            <p className="text-xs text-gray-500">
                Una sola cuenta: complete solo &quot;Desde (cuenta)&quot;. Varias en cascada: indique &quot;Desde&quot; y &quot;Hasta&quot;; se listarán todas las cuentas entre ambas por código.
            </p>
        </div>
    )
}
