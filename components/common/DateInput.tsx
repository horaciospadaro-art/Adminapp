'use client'

import { forwardRef, useEffect, useState, useImperativeHandle, useRef } from 'react'
import { inputDateToDisplay, parseDisplayDateToInput } from '@/lib/date-utils'

interface DateInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'value' | 'onChange'> {
    label?: string
    error?: string
    value?: string
    defaultValue?: string
    onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
}

export const DateInput = forwardRef<HTMLInputElement, DateInputProps>(
    ({ className, label, error, value, defaultValue = '', onChange, name, ...props }, ref) => {
        const internalRef = useRef<HTMLInputElement>(null)
        useImperativeHandle(ref, () => internalRef.current as HTMLInputElement)

        const effectiveValue = value ?? defaultValue
        const [displayValue, setDisplayValue] = useState('')
        const [submittedValue, setSubmittedValue] = useState(() => value ?? defaultValue ?? '')

        useEffect(() => {
            const next = effectiveValue ? inputDateToDisplay(effectiveValue) : ''
            setDisplayValue(next)
            if (effectiveValue) setSubmittedValue(effectiveValue)
        }, [effectiveValue])

        const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            const raw = e.target.value
            setDisplayValue(raw)
            const parsed = parseDisplayDateToInput(raw)
            if (parsed) setSubmittedValue(parsed)
            if (onChange && parsed) {
                const syntheticEvent = {
                    ...e,
                    target: { ...e.target, value: parsed }
                } as React.ChangeEvent<HTMLInputElement>
                onChange(syntheticEvent)
            }
        }

        const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
            const parsed = parseDisplayDateToInput(displayValue)
            if (parsed) {
                setDisplayValue(inputDateToDisplay(parsed))
                setSubmittedValue(parsed)
                if (onChange) {
                    const syntheticEvent = {
                        ...e,
                        target: { ...e.target, value: parsed }
                    } as React.ChangeEvent<HTMLInputElement>
                    onChange(syntheticEvent)
                }
            }
            props.onBlur?.(e)
        }

        return (
            <div className="w-full">
                {label && (
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        {label}
                    </label>
                )}
                {name && <input type="hidden" name={name} value={submittedValue} />}
                <input
                    type="text"
                    ref={internalRef}
                    inputMode="numeric"
                    placeholder="dd/mm/aaaa"
                    value={displayValue}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    maxLength={10}
                    className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border ${error ? 'border-red-300' : ''
                        } ${className ?? ''}`}
                    {...props}
                />
                {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
            </div>
        )
    }
)

DateInput.displayName = 'DateInput'
