import { Suspense } from 'react'
import { MonthYearFilters } from '@/components/accounting/reports/MonthYearFilters'
import { getLegalJournal, type LegalJournalEntry } from '@/lib/actions/accounting-reports'
import { UnifiedReportNavigation } from '@/components/reports/UnifiedReportNavigation'

import { getPersistentCompanyId } from '@/lib/company-utils'
import { formatDate } from '@/lib/date-utils'

export default async function LegalJournalPage(props: {
    searchParams: Promise<{ month?: string; year?: string }> | { month?: string; year?: string }
}) {
    const searchParams = await Promise.resolve(props.searchParams)
    const companyId = await getPersistentCompanyId()
    const { month, year } = searchParams

    let entries: LegalJournalEntry[] = []
    let error: string | null = null

    if (companyId && month && year) {
        try {
            const m = parseInt(month, 10)
            const y = parseInt(year, 10)
            if (isNaN(m) || isNaN(y) || m < 1 || m > 12 || y < 1900 || y > 2100) {
                error = 'Mes o año inválido'
            } else {
                entries = await getLegalJournal({ companyId, month: m, year: y })
            }
        } catch (e: unknown) {
            error = e instanceof Error ? e.message : 'Error al cargar el diario'
        }
    }

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-800">Diario Legal</h1>

            <UnifiedReportNavigation activeReport="journal" />

            <Suspense fallback={<div>Cargando filtros...</div>}>
                <MonthYearFilters />
            </Suspense>

            {error && (
                <div className="p-4 bg-red-50 text-red-700 rounded-md border border-red-200">
                    Error: {error}
                </div>
            )}

            {!entries.length && !error && (
                <div className="text-center py-12 text-gray-500 bg-white rounded-lg border border-dashed border-gray-300">
                    {month ? 'No se encontraron asientos para el periodo seleccionado.' : 'Seleccione mes y año para generar el reporte.'}
                </div>
            )}

            {entries.length > 0 && (
                <div className="bg-white shadow rounded-lg overflow-hidden border border-gray-200">
                    <div className="p-6 border-b border-gray-200 bg-gray-50">
                        <h2 className="text-lg font-semibold text-gray-700">
                            Periodo: {month}/{year}
                        </h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">Fecha</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">Asiento</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cuenta / Descripción</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-32">Debe</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-32">Haber</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {entries.map((entry) => (
                                    <>
                                        {/* Entry Header/Description Row */}
                                        <tr key={`h-${entry.id}`} className="bg-gray-50">
                                            <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-900 font-medium">
                                                {entry.date ? formatDate(entry.date) : '-'}
                                            </td>
                                            <td className="px-6 py-2 whitespace-nowrap text-sm text-blue-800 font-bold">
                                                {entry.number}
                                            </td>
                                            <td colSpan={3} className="px-6 py-2 text-sm text-gray-700 font-medium uppercase">
                                                {entry.description}
                                            </td>
                                        </tr>
                                        {/* Entry Lines */}
                                        {entry.lines.map((line) => (
                                            <tr key={line.id} className="hover:bg-gray-50">
                                                <td className="px-6 py-1"></td>
                                                <td className="px-6 py-1 text-xs text-gray-500 text-right pr-4">
                                                    {line.account.code}
                                                </td>
                                                <td className="px-6 py-1 text-sm text-gray-600">
                                                    {line.account.name}
                                                    {line.description && line.description !== entry.description && (
                                                        <span className="text-gray-400 text-xs ml-2">- {line.description}</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-1 whitespace-nowrap text-sm text-gray-700 text-right font-mono">
                                                    {line.debit > 0 ? line.debit.toLocaleString('es-VE', { minimumFractionDigits: 2 }) : ''}
                                                </td>
                                                <td className="px-6 py-1 whitespace-nowrap text-sm text-gray-700 text-right font-mono">
                                                    {line.credit > 0 ? line.credit.toLocaleString('es-VE', { minimumFractionDigits: 2 }) : ''}
                                                </td>
                                            </tr>
                                        ))}
                                        {/* Separator */}
                                        <tr key={`sep-${entry.id}`}>
                                            <td colSpan={5} className="h-4 border-b border-gray-100"></td>
                                        </tr>
                                    </>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    )
}
