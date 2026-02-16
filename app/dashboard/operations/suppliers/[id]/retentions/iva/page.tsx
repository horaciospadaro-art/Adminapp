import { PageHeader } from '@/components/ui/PageHeader'
import prisma from '@/lib/db'
import { TaxType } from '@prisma/client'
import { formatDate } from '@/lib/date-utils'

export default async function SupplierRetentionIVAPage({
    params,
    searchParams
}: {
    params: Promise<{ id: string }>
    searchParams: Promise<{ startDate?: string; endDate?: string }>
}) {
    const { id: supplierId } = await params
    const { startDate: startStr, endDate: endStr } = await searchParams

    const supplier = await prisma.thirdParty.findUnique({
        where: { id: supplierId },
        select: { name: true, rif: true, address: true, company_id: true }
    })
    if (!supplier) {
        return (
            <div className="p-8">
                <PageHeader title="Comprobante de retención IVA" backHref="/dashboard/operations/suppliers" />
                <p className="text-red-600">Proveedor no encontrado.</p>
            </div>
        )
    }

    const company = await prisma.company.findUnique({
        where: { id: supplier.company_id },
        select: { name: true, rif: true }
    })

    const start = startStr ? new Date(startStr) : new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    const end = endStr ? new Date(endStr) : new Date()
    end.setHours(23, 59, 59, 999)

    const withholdings = await prisma.withholding.findMany({
        where: {
            third_party_id: supplierId,
            company_id: supplier.company_id,
            type: TaxType.RETENCION_IVA,
            date: { gte: start, lte: end }
        },
        include: { document: true },
        orderBy: { date: 'asc' }
    })

    const formatNum = (n: number) => new Intl.NumberFormat('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n)
    const totalBase = withholdings.reduce((s, w) => s + Number(w.base_amount), 0)
    const totalTax = withholdings.reduce((s, w) => s + Number(w.tax_amount), 0)
    const totalRetained = withholdings.reduce((s, w) => s + Number(w.amount), 0)

    return (
        <div className="space-y-6">
            <PageHeader
                title={`Comprobante de retención IVA - ${supplier.name}`}
                backHref="/dashboard/operations/suppliers"
            />

            <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden print:shadow-none">
                <div className="p-6 space-y-4">
                    <h1 className="text-center text-lg font-bold uppercase text-gray-800">
                        Comprobante de retención del impuesto al valor agregado
                    </h1>
                    <p className="text-center text-xs text-gray-500">Ley IVA. Art. 11</p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Agente de retención</p>
                            <p className="font-medium">{company?.name ?? '—'}</p>
                            <p className="text-sm text-gray-600">{company?.rif ?? '—'}</p>
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Sujeto retenido (proveedor)</p>
                            <p className="font-medium">{supplier.name}</p>
                            <p className="text-sm text-gray-600">RIF: {supplier.rif}</p>
                            {supplier.address && (
                                <p className="text-sm text-gray-600 mt-1">Dirección fiscal: {supplier.address}</p>
                            )}
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-4 text-sm">
                        <span><strong>Período:</strong> {formatDate(start)} - {formatDate(end)}</span>
                    </div>

                    <div className="border border-gray-200 rounded overflow-hidden">
                        <table className="min-w-full text-sm">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-3 py-2 text-left font-medium text-gray-700">Fecha factura</th>
                                    <th className="px-3 py-2 text-left font-medium text-gray-700">Nº factura</th>
                                    <th className="px-3 py-2 text-right font-medium text-gray-700">Base imponible</th>
                                    <th className="px-3 py-2 text-right font-medium text-gray-700">% alícuota</th>
                                    <th className="px-3 py-2 text-right font-medium text-gray-700">IVA</th>
                                    <th className="px-3 py-2 text-right font-medium text-gray-700">IVA retenido</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {withholdings.length === 0 ? (
                                    <tr><td colSpan={6} className="px-3 py-4 text-center text-gray-500">No hay retenciones IVA en el período.</td></tr>
                                ) : (
                                    withholdings.map((w) => (
                                        <tr key={w.id}>
                                            <td className="px-3 py-2">{formatDate(w.document?.date)}</td>
                                            <td className="px-3 py-2">{w.document?.number ?? w.certificate_number}</td>
                                            <td className="px-3 py-2 text-right">{formatNum(Number(w.base_amount))}</td>
                                            <td className="px-3 py-2 text-right">{Number(w.rate)}%</td>
                                            <td className="px-3 py-2 text-right">{formatNum(Number(w.tax_amount))}</td>
                                            <td className="px-3 py-2 text-right font-medium">{formatNum(Number(w.amount))}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                            {withholdings.length > 0 && (
                                <tfoot className="bg-gray-50 font-medium">
                                    <tr>
                                        <td colSpan={2} className="px-3 py-2">Total</td>
                                        <td className="px-3 py-2 text-right">{formatNum(totalBase)}</td>
                                        <td className="px-3 py-2" />
                                        <td className="px-3 py-2 text-right">{formatNum(totalTax)}</td>
                                        <td className="px-3 py-2 text-right">{formatNum(totalRetained)}</td>
                                    </tr>
                                </tfoot>
                            )}
                        </table>
                    </div>

                    <div className="mt-8 pt-6 border-t border-gray-200">
                        <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Firma y sello de la empresa que emite el comprobante</p>
                        <div className="h-20 border border-dashed border-gray-300 rounded flex items-center justify-center text-gray-400 text-sm">
                            Espacio para firma y sello
                        </div>
                        <p className="mt-2 font-medium text-gray-800">{company?.name ?? '—'}</p>
                        <p className="text-sm text-gray-600">RIF: {company?.rif ?? '—'}</p>
                    </div>
                </div>
            </div>
        </div>
    )
}
