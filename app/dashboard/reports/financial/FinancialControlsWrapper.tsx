'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { ReportSelector } from '@/components/reports/ReportSelector'
import { DateRangePicker } from '@/components/reports/DateRangePicker'

interface ControlsWrapperProps {
    currentReport: string
    startDate: string
    endDate: string
}

export function FinancialControlsWrapper({ currentReport, startDate, endDate }: ControlsWrapperProps) {
    const router = useRouter()

    const updateParams = (newParams: Record<string, string>) => {
        const params = new URLSearchParams()
        params.set('report', currentReport)
        params.set('start', startDate)
        params.set('end', endDate)

        Object.entries(newParams).forEach(([key, value]) => {
            params.set(key, value)
        })

        // Update to new path
        router.push(`/dashboard/reports/financial?${params.toString()}`)
    }

    return (
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <ReportSelector
                currentReport={currentReport}
                onSelect={(r) => updateParams({ report: r })}
            />
            <DateRangePicker
                startDate={startDate}
                endDate={endDate}
                onChange={(s, e) => updateParams({ start: s, end: e })}
            />
        </div>
    )
}
