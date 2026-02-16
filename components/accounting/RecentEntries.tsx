
import prisma from '@/lib/db'
import Link from 'next/link'
import { Edit, CheckCircle, AlertTriangle } from 'lucide-react'
import { DeleteEntryButton } from '@/components/accounting/DeleteEntryButton'
import { formatDate } from '@/lib/date-utils'

export async function RecentEntries({ companyId }: { companyId: string }) {
    const entries = await prisma.journalEntry.findMany({
        where: { company_id: companyId },
        orderBy: { created_at: 'desc' },
        take: 20,
        include: {
            lines: {
                select: { debit: true, credit: true }
            },
            // Include relations to determine source
            bankTransaction: { select: { id: true, subtype: true } },
            document: { select: { id: true, type: true, number: true } },
            inventory_movement: { select: { id: true, type: true } }
        }
    })

    if (entries.length === 0) {
        return (
            <div className="bg-white p-6 rounded shadow border border-gray-100">
                <h2 className="text-lg font-bold mb-4">Asientos Recientes</h2>
                <p className="text-gray-500 text-sm">No hay asientos registrados aún.</p>
            </div>
        )
    }

    const unbalancedCount = entries.filter((e: any) => {
        const d = e.lines.reduce((s: number, l: any) => s + Number(l.debit), 0)
        const c = e.lines.reduce((s: number, l: any) => s + Number(l.credit), 0)
        return Math.abs(d - c) >= 0.01
    }).length

    return (
        <div className="bg-white p-6 rounded shadow border border-gray-100">
            <h2 className="text-lg font-bold mb-4">Asientos Recientes</h2>
            {unbalancedCount > 0 && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-sm mb-4">
                    <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                    <span>
                        Hay {unbalancedCount} asiento(s) descuadrado(s). Puede corregirlos editando el asiento (lápiz) o, si proviene de una factura de compra, usar &quot;Resincronizar con la factura de compra&quot; en la pantalla de edición.
                    </span>
                </div>
            )}
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Número</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fuente</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descripción</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Débito</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Crédito</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Cuadrado</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Diferencia</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {entries.map((entry: any) => {
                            const totalDebit = entry.lines.reduce((sum: number, line: any) => sum + Number(line.debit), 0)
                            const totalCredit = entry.lines.reduce((sum: number, line: any) => sum + Number(line.credit), 0)
                            const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01
                            const difference = totalDebit - totalCredit

                            return (
                                <tr key={entry.id} className={`hover:bg-gray-50 ${!isBalanced ? 'bg-amber-50/50' : ''}`}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {formatDate(entry.date)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        {/* @ts-ignore */}
                                        {entry.number || '-'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {/* @ts-ignore */}
                                        {entry.bankTransaction ? (
                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                                Banco
                                            </span>
                                        ) :
                                            /* @ts-ignore */
                                            entry.document ? (
                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                                                    {/* @ts-ignore */}
                                                    {entry.document.type === 'INVOICE' ? 'Factura' : 'Documento'}
                                                </span>
                                            ) :
                                                /* @ts-ignore */
                                                entry.inventory_movement ? (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800">
                                                        Inventario
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                                                        Manual
                                                    </span>
                                                )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {entry.description}
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
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-mono">
                                        {isBalanced ? (
                                            <span className="text-gray-400">—</span>
                                        ) : (
                                            <span className="text-amber-700" title="Débito − Crédito">
                                                {difference >= 0 ? '+' : ''}{difference.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${entry.status === 'POSTED' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                            }`}>
                                            {entry.status === 'POSTED' ? 'Publicado' : 'Borrador'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <div className="flex justify-end gap-2">
                                            <Link href={`/dashboard/accounting/entries/${entry.id}/edit`} className="text-blue-600 hover:text-blue-900 p-1 hover:bg-blue-50 rounded" title="Editar asiento o resincronizar con el documento origen">
                                                <Edit className="w-4 h-4" />
                                            </Link>
                                            {/* @ts-ignore */}
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
    )
}
