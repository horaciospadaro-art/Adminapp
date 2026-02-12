'use client'

import { useState } from 'react'
import { DateInput } from '@/components/common/DateInput'

interface DateRangePickerProps {
    startDate: string
    endDate: string
    onChange: (start: string, end: string) => void
}

export function DateRangePicker({ startDate, endDate, onChange }: DateRangePickerProps) {
    return (
        <div className="flex items-center space-x-2">
            <DateInput
                value={startDate}
                onChange={(e) => onChange(e.target.value, endDate)}
            />
            <span className="text-gray-500">-</span>
            <DateInput
                value={endDate}
                onChange={(e) => onChange(startDate, e.target.value)}
            />
        </div>
    )
}
