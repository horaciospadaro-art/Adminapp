'use client'

import { useRouter } from 'next/navigation'

interface UnifiedReportNavigationProps {
    activeReport: string
}

export function UnifiedReportNavigation({ activeReport }: UnifiedReportNavigationProps) {
    const router = useRouter()

    const reports = [
        // Accounting Reports
        { id: 'entries', label: 'Listado de Asientos', href: '/dashboard/accounting/reports/entries' },
        { id: 'journal', label: 'Diario Legal', href: '/dashboard/accounting/reports/journal' },
        { id: 'ledger', label: 'Mayor Analítico', href: '/dashboard/accounting/reports/ledger' },
        // Financial Reports
        { id: 'trial_balance', label: 'Balance de Comprobación', href: '/dashboard/reports/financial?report=trial_balance' },
        { id: 'income_statement', label: 'Estado de Resultados', href: '/dashboard/reports/financial?report=income_statement' },
        { id: 'balance_sheet', label: 'Balance General', href: '/dashboard/reports/financial?report=balance_sheet' },
    ]

    return (
        <div className="flex flex-wrap gap-2 bg-gray-100 p-1 rounded-lg mb-6 overflow-x-auto">
            {reports.map((report) => (
                <button
                    key={report.id}
                    onClick={() => router.push(report.href)}
                    className={`px-4 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap ${activeReport === report.id
                            ? 'bg-white text-blue-600 shadow-sm'
                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200'
                        }`}
                >
                    {report.label}
                </button>
            ))}
        </div>
    )
}
