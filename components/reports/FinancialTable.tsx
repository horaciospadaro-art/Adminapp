export interface FinancialRow {
    id: string
    code: string
    name: string
    value: number
    level: number
    type: 'HEADER' | 'ACCOUNT' | 'TOTAL'
    isNegative?: boolean
}

interface FinancialTableProps {
    rows: FinancialRow[]
    title: string
}

const INDENT_CLASSES: Record<number, string> = {
    1: 'pl-0',
    2: 'pl-6',
    3: 'pl-12',
    4: 'pl-[4.5rem]',
    5: 'pl-24',
    6: 'pl-[7.5rem]',
}

export function FinancialTable({ rows, title }: FinancialTableProps) {
    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">{title}</h3>
            </div>
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                            Código
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Concepto
                        </th>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-40">
                            Saldo
                        </th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {rows.map((row) => (
                        <tr
                            key={row.id}
                            className={`
                                ${row.type === 'TOTAL' ? 'bg-gray-50 font-bold' : ''}
                                ${row.type === 'HEADER' ? 'font-semibold text-gray-700' : ''}
                                hover:bg-gray-50 transition-colors
                            `}
                        >
                            <td className="px-6 py-3 text-sm text-gray-500 font-mono">
                                {row.code}
                            </td>
                            <td className="px-6 py-3 text-sm text-gray-900">
                                <div className={INDENT_CLASSES[row.level] || 'pl-0'}>
                                    {row.name}
                                </div>
                            </td>
                            <td className={`px-6 py-3 text-sm text-right font-mono ${row.value < 0 ? 'text-red-600' : 'text-gray-900'}`}>
                                {row.value.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                        </tr>
                    ))}
                    {rows.length === 0 && (
                        <tr>
                            <td colSpan={3} className="px-6 py-8 text-center text-sm text-gray-500 italic">
                                No hay datos para mostrar en este período.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    )
}
