
import prisma from '@/lib/db'

export async function RecentEntries({ companyId }: { companyId: string }) {
    const entries = await prisma.journalEntry.findMany({
        where: { company_id: companyId },
        orderBy: { created_at: 'desc' },
        take: 5,
        include: {
            lines: {
                where: { debit: { gt: 0 } }, // Get debit lines to estimate amount
                select: { debit: true }
            }
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
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descripción</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Monto</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {entries.map((entry) => {
                            const totalAmount = entry.lines.reduce((sum, line) => sum + Number(line.debit), 0)

                            return (
                                <tr key={entry.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {new Intl.DateTimeFormat('es-VE', { dateStyle: 'medium' }).format(new Date(entry.date))}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        {entry.number || '-'}
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
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
