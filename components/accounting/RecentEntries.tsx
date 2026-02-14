
import prisma from '@/lib/db'
import Link from 'next/link'
import { Edit } from 'lucide-react'
import { DeleteEntryButton } from '@/components/accounting/DeleteEntryButton'

export async function RecentEntries({ companyId }: { companyId: string }) {
    const entries = await prisma.journalEntry.findMany({
        where: { company_id: companyId },
        orderBy: { created_at: 'desc' },
        take: 20, // Increased from 5 to 20
        include: {
            lines: {
                where: { debit: { gt: 0 } }, // Get debit lines to estimate amount
                select: { debit: true }
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

    return (
        <div className="bg-white p-6 rounded shadow border border-gray-100">
            <h2 className="text-lg font-bold mb-4">Asientos Recientes</h2>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Número</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fuente</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descripción</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Monto</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {entries.map((entry) => {
                            const totalAmount = entry.lines.reduce((sum, line) => sum + Number(line.debit), 0)

                            return (
                                <tr key={entry.id}>
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
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                                        {totalAmount.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${entry.status === 'POSTED' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                            }`}>
                                            {entry.status === 'POSTED' ? 'Publicado' : 'Borrador'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <div className="flex justify-end gap-2">
                                            <Link href={`/dashboard/accounting/entries/${entry.id}/edit`} className="text-blue-600 hover:text-blue-900 p-1 hover:bg-blue-50 rounded" title="Editar">
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
