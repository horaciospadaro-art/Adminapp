
'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { DateInput } from '@/components/common/DateInput'

export function DateRangeFilters() {
    const router = useRouter()
    const searchParams = useSearchParams()

    // Default: Start of current month, End of today
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    const formatDate = (d: Date) => d.toISOString().split('T')[0]

    const [startDate, setStartDate] = useState(searchParams.get('startDate') || formatDate(startOfMonth))
    const [endDate, setEndDate] = useState(searchParams.get('endDate') || formatDate(now))

    const handleGenerate = () => {
        const params = new URLSearchParams()
        params.set('startDate', startDate)
        params.set('endDate', endDate)
        router.push(`?${params.toString()}`)
    }

    return (
        <div className="bg-white p-4 rounded-lg shadow space-y-4 md:space-y-0 md:flex md:items-end md:space-x-4 border border-gray-200">
            <div>
                <div>
                    <DateInput
                        label="Desde"
                        title="Fecha Desde"
                        placeholder="Desde"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                    />
                </div>
                <div>
                    <DateInput
                        label="Hasta"
                        title="Fecha Hasta"
                        placeholder="Hasta"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                    />
                </div>
                <button
                    onClick={handleGenerate}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors text-sm font-medium h-[38px]"
                >
                    Generar
                </button>
            </div>
        </div>
    )
}
