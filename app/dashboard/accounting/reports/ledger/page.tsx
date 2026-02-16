import { Suspense } from 'react'
import { LedgerFilters } from '@/components/accounting/reports/LedgerFilters'
import { getAnalyticalLedger, getAnalyticalLedgerRange } from '@/lib/actions/accounting-reports'
import { getPersistentCompanyId } from '@/lib/company-utils'
import { formatDate } from '@/lib/date-utils'
import type { LedgerResult, LedgerMovement } from '@/lib/actions/accounting-reports'

function LedgerBlock({ data, startDate, endDate }: { data: LedgerResult; startDate: string; endDate: string }) {
    return (
        <div className="bg-white shadow rounded-lg overflow-hidden border border-gray-200 print:shadow-none print:border-none">
            <div className="p-6 border-b border-gray-200 bg-gray-50 print:bg-white">
                <div className="flex justify-between items-start">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">{data.accountCode} - {data.accountName}</h2>
                        <p className="text-sm text-gray-500 mt-1">
                            Del {formatDate(startDate)} al {formatDate(endDate)}
                        </p>
                    </div>
                    <div className="text-right">
                        <p className="text-sm text-gray-500">Saldo Inicial</p>
                        <p className="text-lg font-mono font-medium">
                            {data.initialBalance.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                        </p>
                    </div>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ref</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descripción</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Debe</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Haber</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Saldo</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        <tr className="bg-gray-50 italic">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(startDate)}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">-</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Saldo Inicial</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">-</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">-</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-right font-mono">
                                {data.initialBalance.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                            </td>
                        </tr>

                        {data.movements.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-8 text-center text-gray-500 text-sm">
                                    No hay movimientos en este periodo.
                                </td>
                            </tr>
                        ) : (
                            data.movements.map((move: LedgerMovement) => (
                                <tr key={move.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {move.date ? formatDate(move.date) : '-'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 hover:underline cursor-pointer">
                                        {move.reference || move.entryNumber || '-'}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-900 max-w-md truncate" title={move.description}>
                                        {move.description}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 text-right font-mono">
                                        {move.debit > 0 ? move.debit.toLocaleString('es-VE', { minimumFractionDigits: 2 }) : '-'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 text-right font-mono">
                                        {move.credit > 0 ? move.credit.toLocaleString('es-VE', { minimumFractionDigits: 2 }) : '-'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-right font-mono">
                                        {move.balance.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                                    </td>
                                </tr>
                            ))
                        )}

                        <tr className="bg-gray-100 font-bold border-t-2 border-gray-300">
                            <td colSpan={5} className="px-6 py-4 text-right text-sm text-gray-900 uppercase">Saldo Final</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-mono">
                                {data.finalBalance.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    )
}

export default async function AnalyticalLedgerPage(props: {
    searchParams: Promise<{ startDate?: string; endDate?: string; accountId?: string; accountIdTo?: string }> | { startDate?: string; endDate?: string; accountId?: string; accountIdTo?: string }
}) {
    const searchParams = await Promise.resolve(props.searchParams)
    const companyId = await getPersistentCompanyId()
    const { startDate, endDate, accountId, accountIdTo } = searchParams

    let reportData: LedgerResult | null = null
    let reportDataRange: LedgerResult[] | null = null
    let error: string | null = null

    if (companyId && startDate && endDate && accountId) {
        try {
            const start = new Date(startDate)
            const end = new Date(endDate)
            if (isNaN(start.getTime()) || isNaN(end.getTime())) {
                error = 'Rango de fechas inválido'
            } else if (accountIdTo) {
                reportDataRange = await getAnalyticalLedgerRange({
                    companyId,
                    startDate: start,
                    endDate: end,
                    accountIdFrom: accountId,
                    accountIdTo
                })
            } else {
                reportData = await getAnalyticalLedger({
                    companyId,
                    startDate: start,
                    endDate: end,
                    accountId
                })
            }
        } catch (e: unknown) {
            error = e instanceof Error ? e.message : 'Error al cargar el mayor'
        }
    }

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-800">Mayor Analítico</h1>

            <Suspense fallback={<div>Cargando filtros...</div>}>
                <LedgerFilters companyId={companyId} />
            </Suspense>

            {error && (
                <div className="p-4 bg-red-50 text-red-700 rounded-md border border-red-200">
                    Error: {error}
                </div>
            )}

            {!reportData && !reportDataRange?.length && !error && (
                <div className="text-center py-12 text-gray-500 bg-white rounded-lg border border-dashed border-gray-300">
                    Seleccione un rango de fechas y una cuenta (o desde/hasta para varias cuentas en cascada) para generar el reporte.
                </div>
            )}

            {reportDataRange && reportDataRange.length > 0 && (
                <div className="space-y-8">
                    {reportDataRange.map((data) => (
                        <LedgerBlock key={data.accountCode} data={data} startDate={startDate!} endDate={endDate!} />
                    ))}
                </div>
            )}

            {reportData && (
                <LedgerBlock data={reportData} startDate={startDate!} endDate={endDate!} />
            )}
        </div>
    )
}
