import { PageHeader } from '@/components/ui/PageHeader'
import prisma from '@/lib/db'
import { DocumentType } from '@prisma/client'
import { formatDate } from '@/lib/date-utils'
import { documentTypeLabel } from '@/lib/labels'
import Link from 'next/link'

const DOC_TYPES_RECEIVABLES = [DocumentType.INVOICE, DocumentType.CREDIT_NOTE, DocumentType.DEBIT_NOTE]

export default async function ClientReceivablesPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const client = await prisma.thirdParty.findUnique({
        where: { id },
        select: { name: true }
    })

    const allDocs = await prisma.document.findMany({
        where: {
            third_party_id: id,
            type: { in: DOC_TYPES_RECEIVABLES },
            status: { not: 'VOID' }
        },
        orderBy: { date: 'asc' }
    })
    const documents = allDocs.filter(d => Number(d.balance) !== 0)

    const formatAmount = (value: number) =>
        new Intl.NumberFormat('es-VE', { style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value)

    return (
        <div className="space-y-6">
            <PageHeader
                title={`Cuentas por cobrar - ${client?.name || 'Cliente'}`}
                backHref="/dashboard/operations/clients"
            />
            <p className="text-sm text-gray-600">
                Documentos con saldo pendiente (facturas de venta, notas de crédito y notas de débito).
            </p>
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Número</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Monto</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Saldo pendiente</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acción</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {documents.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                                    No hay documentos con saldo pendiente para este cliente.
                                </td>
                            </tr>
                        ) : (
                            documents.map((doc) => {
                                const total = Number(doc.total)
                                const balance = Number(doc.balance)
                                return (
                                    <tr key={doc.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {formatDate(doc.date)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {doc.number || doc.control_number || '—'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                            {documentTypeLabel(doc.type)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-mono">
                                            {formatAmount(total)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-mono font-medium">
                                            {formatAmount(balance)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right">
                                            <Link
                                                href={`/dashboard/operations/invoices/new?id=${doc.id}`}
                                                className="text-blue-600 hover:underline text-sm"
                                            >
                                                Ver
                                            </Link>
                                        </td>
                                    </tr>
                                )
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
