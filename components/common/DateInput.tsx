
import { forwardRef } from 'react'

interface DateInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string
    error?: string
}

export const DateInput = forwardRef<HTMLInputElement, DateInputProps>(
    ({ className, label, error, ...props }, ref) => {
        return (
            <div className="w-full">
                {label && (
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        {label}
                    </label>
                )}
                <input
                    type="date"
                    ref={ref}
                    lang="es-VE" // Forces DD/MM/YYYY format in Spanish-speaking locales
                    className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border ${error ? 'border-red-300' : ''
                        } ${className}`}
                    {...props}
                />
                {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
            </div>
        )
    }
)

DateInput.displayName = 'DateInput'
