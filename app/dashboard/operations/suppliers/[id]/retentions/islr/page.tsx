import { PageHeader } from '@/components/ui/PageHeader'
import prisma from '@/lib/db'
import { TaxType } from '@prisma/client'
import { formatDate } from '@/lib/date-utils'

export default async function SupplierRetentionISLRPage({
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
                <PageHeader title="Comprobante de retención ISLR" backHref="/dashboard/operations/suppliers" />
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
            type: TaxType.RETENCION_ISLR,
            date: { gte: start, lte: end }
        },
        include: { document: true },
        orderBy: { date: 'asc' }
    })

    // Nº comprobante: si hay retenciones en el período usamos la del primer asiento; si no, calculamos el siguiente correlativo (5 dígitos)
    let numeroComprobante: string
    if (withholdings.length > 0) {
        numeroComprobante = withholdings[0].certificate_number
    } else {
        const allISLR = await prisma.withholding.findMany({
            where: { company_id: supplier.company_id, type: TaxType.RETENCION_ISLR },
            select: { certificate_number: true }
        })
        let maxSeq = 0
        for (const w of allISLR) {
            if (/^\d{5}$/.test(w.certificate_number)) {
                const n = parseInt(w.certificate_number, 10)
                if (n > maxSeq) maxSeq = n
            }
        }
        numeroComprobante = (maxSeq + 1).toString().padStart(5, '0')
    }

    // Fecha de emisión del comprobante = día en que se emite el reporte (hoy)
    const fechaEmisionComprobante = new Date()

    const formatNum = (n: number) => new Intl.NumberFormat('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n)
    const totalBase = withholdings.reduce((s, w) => s + Number(w.base_amount), 0)
    const totalAmount = withholdings.reduce((s, w) => s + Number(w.amount), 0)

    return (
        <div className="space-y-6 p-4 md:p-6">
            <PageHeader
                title={`Comprobante de retención ISLR - ${supplier.name}`}
                backHref="/dashboard/operations/suppliers"
            />

            <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden print:shadow-none print:break-inside-avoid">
                <div className="p-6 space-y-4">
                    <h1 className="text-center text-lg font-bold uppercase text-gray-800">
                        Comprobante de retención de impuesto sobre la renta
                    </h1>
                    <p className="text-center text-xs text-gray-500">Decreto 1.808. Gaceta Oficial Nº 36.203</p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Datos del agente de retención</p>
                            <p className="font-medium">{company?.name ?? '—'}</p>
                            <p className="text-sm text-gray-600">RIF: {company?.rif ?? '—'}</p>
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Datos del sujeto retenido (proveedor)</p>
                            <p className="font-medium">{supplier.name}</p>
                            <p className="text-sm text-gray-600">RIF: {supplier.rif}</p>
                            {supplier.address && (
                                <p className="text-sm text-gray-600 mt-1">Dirección fiscal: {supplier.address}</p>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4 border-y border-gray-200">
                        <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Nº COMPROBANTE</p>
                            <p className="font-mono font-medium text-gray-900">{numeroComprobante}</p>
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Fecha de emisión del comprobante</p>
                            <p className="font-medium text-gray-900">{formatDate(fechaEmisionComprobante)}</p>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-4 text-sm">
                        <span><strong>Período:</strong> {formatDate(start)} - {formatDate(end)}</span>
                    </div>

                    <div className="border border-gray-200 rounded overflow-hidden">
                        <table className="min-w-full text-sm">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-3 py-2 text-left font-medium text-gray-700">Fecha emisión</th>
                                    <th className="px-3 py-2 text-left font-medium text-gray-700">Nº factura</th>
                                    <th className="px-3 py-2 text-left font-medium text-gray-700">Concepto</th>
                                    <th className="px-3 py-2 text-right font-medium text-gray-700">Base retención</th>
                                    <th className="px-3 py-2 text-right font-medium text-gray-700">% retención</th>
                                    <th className="px-3 py-2 text-right font-medium text-gray-700">Valor retención</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {withholdings.length === 0 ? (
                                    <tr><td colSpan={6} className="px-3 py-4 text-center text-gray-500">No hay retenciones ISLR en el período.</td></tr>
                                ) : (
                                    withholdings.map((w) => (
                                        <tr key={w.id}>
                                            <td className="px-3 py-2">{formatDate(w.document?.date)}</td>
                                            <td className="px-3 py-2">{w.document?.number ?? '—'}</td>
                                            <td className="px-3 py-2">{w.islr_concept_name ?? '—'}</td>
                                            <td className="px-3 py-2 text-right">{formatNum(Number(w.base_amount))}</td>
                                            <td className="px-3 py-2 text-right">{Number(w.rate)}%</td>
                                            <td className="px-3 py-2 text-right font-medium">{formatNum(Number(w.amount))}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                            {withholdings.length > 0 && (
                                <tfoot className="bg-gray-50 font-medium">
                                    <tr>
                                        <td colSpan={3} className="px-3 py-2">Total</td>
                                        <td className="px-3 py-2 text-right">{formatNum(totalBase)}</td>
                                        <td className="px-3 py-2" />
                                        <td className="px-3 py-2 text-right">{formatNum(totalAmount)}</td>
                                    </tr>
                                </tfoot>
                            )}
                        </table>
                    </div>

                    <div className="mt-6 p-3 bg-gray-50 rounded border border-gray-200">
                        <p className="font-semibold text-gray-800">Total del impuesto retenido: {formatNum(totalAmount)}</p>
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
