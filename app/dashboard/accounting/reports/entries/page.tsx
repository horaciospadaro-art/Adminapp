
import prisma from '@/lib/db'
import { DateRangeFilters } from '@/components/accounting/reports/DateRangeFilters'
import { getJournalEntryList } from '@/lib/actions/accounting-reports'

async function getDemoCompanyId() {
    const company = await prisma.company.findFirst()
    return company?.id || ''
}

export default async function EntriesListPage({
    searchParams
}: {
    searchParams: { startDate?: string; endDate?: string }
}) {
    const companyId = await getDemoCompanyId()
    const { startDate, endDate } = searchParams

    let entries: any[] = []
    let error = null

    if (startDate && endDate) {
        try {
            entries = await getJournalEntryList({
                companyId,
                startDate: new Date(startDate),
                endDate: new Date(endDate)
            })
        } catch (e: any) {
            error = e.message
        }
    }

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-800">Listado de Asientos</h1>

            <DateRangeFilters />

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

            {entries.length > 0 && (
                <div className="bg-white shadow rounded-lg overflow-hidden border border-gray-200">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Número</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descripción</th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {entries.map((entry: any) => {
                                    const total = entry.lines.reduce((sum: number, line: any) => sum + Number(line.debit), 0)

                                    return (
                                        <tr key={entry.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {new Intl.DateTimeFormat('es-VE').format(entry.date)}
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
                                                    {entry.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-mono">
                                                {total.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    )
}
