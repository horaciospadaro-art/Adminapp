'use client'

interface ReportSelectorProps {
    currentReport: string
    onSelect: (report: string) => void
}

export function ReportSelector({ currentReport, onSelect }: ReportSelectorProps) {
    const reports = [
        { id: 'trial_balance', label: 'Balance de Comprobación' },
        { id: 'income_statement', label: 'Estado de Resultados (P&L)' },
        { id: 'balance_sheet', label: 'Balance General' },
    ]

    return (
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
            {reports.map((report) => (
                <button
                    key={report.id}
                    onClick={() => onSelect(report.id)}
                    className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${currentReport === report.id
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
