import { Suspense } from 'react'
import { DateRangeFilters } from '@/components/accounting/reports/DateRangeFilters'
import { getJournalEntryList, type JournalEntryListItem } from '@/lib/actions/accounting-reports'
import { UnifiedReportNavigation } from '@/components/reports/UnifiedReportNavigation'
import Link from 'next/link'
import { Edit, CheckCircle, AlertTriangle } from 'lucide-react'
import { DeleteEntryButton } from '@/components/accounting/DeleteEntryButton'

import { getPersistentCompanyId } from '@/lib/company-utils'
import { formatDate } from '@/lib/date-utils'
import { journalEntryStatusLabel } from '@/lib/labels'

export default async function EntriesListPage(props: {
    searchParams: Promise<{ startDate?: string; endDate?: string }> | { startDate?: string; endDate?: string }
}) {
    const searchParams = await Promise.resolve(props.searchParams)
    const companyId = await getPersistentCompanyId()
    const { startDate, endDate } = searchParams

    let entries: JournalEntryListItem[] = []
    let error: string | null = null

    if (companyId && startDate && endDate) {
        try {
            const start = new Date(startDate)
            const end = new Date(endDate)
            if (isNaN(start.getTime()) || isNaN(end.getTime())) {
                error = 'Rango de fechas inválido'
            } else {
                entries = await getJournalEntryList({
                    companyId,
                    startDate: start,
                    endDate: end
                })
            }
        } catch (e: unknown) {
            error = e instanceof Error ? e.message : 'Error al cargar el listado'
        }
    }

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-800">Listado de Asientos</h1>

            <UnifiedReportNavigation activeReport="entries" />

            <Suspense fallback={<div>Cargando filtros...</div>}>
                <DateRangeFilters />
            </Suspense>

            {error && (
                <div className="p-4 bg-red-50 text-red-700 rounded-md border border-red-200">
                    Error: {error}
                </div>
            )}

            {!entries.length && !error && (
                <div className="text-center py-12 text-gray-500 bg-white rounded-lg border border-dashed border-gray-300">
                    {startDate ? 'No se encontraron asientos en el rango seleccionado.' : 'Seleccione un rango de fechas para generar el reporte.'}
                </div>
            )}

            {entries.length > 0 && (() => {
                const unbalancedCount = entries.filter((e) => {
                    const d = e.lines.reduce((s, l) => s + l.debit, 0)
                    const c = e.lines.reduce((s, l) => s + l.credit, 0)
                    return Math.abs(d - c) >= 0.01
                }).length
                return (
                <div className="space-y-4">
                    {unbalancedCount > 0 && (
                        <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-sm">
                            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                            <span>
                                Hay {unbalancedCount} asiento(s) descuadrado(s). Puede corregirlos editando el asiento (lápiz) o, si proviene de una factura de compra, usar &quot;Resincronizar con la factura de compra&quot; en la pantalla de edición.
                            </span>
                        </div>
                    )}
                <div className="bg-white shadow rounded-lg overflow-hidden border border-gray-200">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Número</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descripción</th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Débito</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Crédito</th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Cuadrado</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {entries.map((entry) => {
                                    const totalDebit = entry.lines.reduce((sum, line) => sum + line.debit, 0)
                                    const totalCredit = entry.lines.reduce((sum, line) => sum + line.credit, 0)
                                    const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01
                                    const difference = totalDebit - totalCredit

                                    return (
                                        <tr key={entry.id} className={`hover:bg-gray-50 ${!isBalanced ? 'bg-amber-50/50' : ''}`}>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {entry.date ? formatDate(entry.date) : '-'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                                                {entry.number || '-'}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-900 max-w-md truncate" title={entry.description}>
                                                {entry.description}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${entry.status === 'POSTED' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                                    }`}>
                                                    {journalEntryStatusLabel(entry.status)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-mono">
                                                {totalDebit.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-mono">
                                                {totalCredit.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                {isBalanced ? (
                                                    <span className="inline-flex items-center gap-1 text-green-700 text-xs font-medium" title="Comprobante cuadrado">
                                                        <CheckCircle className="w-4 h-4" />
                                                        Sí
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 text-amber-700 text-xs font-medium" title={`Diferencia: ${difference.toFixed(2)}`}>
                                                        <AlertTriangle className="w-4 h-4" />
                                                        No
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <div className="flex justify-end gap-2">
                                                    <Link href={`/dashboard/accounting/entries/${entry.id}/edit`} className="text-blue-600 hover:text-blue-900 p-1 hover:bg-blue-50 rounded" title="Editar asiento o resincronizar con el documento origen">
                                                        <Edit className="w-4 h-4" />
                                                    </Link>
                                                    <DeleteEntryButton id={entry.id} entryNumber={entry.number || 'Sin Número'} />
                                                </div>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
                </div>
                )
            })()}
        </div>
    )
}
