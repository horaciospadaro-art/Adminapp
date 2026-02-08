'use client'

import { useState } from 'react'

interface DateRangePickerProps {
    startDate: string
    endDate: string
    onChange: (start: string, end: string) => void
}

export function DateRangePicker({ startDate, endDate, onChange }: DateRangePickerProps) {
    return (
        <div className="flex items-center space-x-2">
            <input
                type="date"
                value={startDate}
                onChange={(e) => onChange(e.target.value, endDate)}
                className="block rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
            <span className="text-gray-500">-</span>
            <input
                type="date"
                value={endDate}
                onChange={(e) => onChange(startDate, e.target.value)}
                className="block rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
        </div>
    )
}
