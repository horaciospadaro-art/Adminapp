'use client'

import { formatDate } from '@/lib/date-utils'

const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

const formatNum = (n: number) =>
    new Intl.NumberFormat('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n)

type Withholding = {
    id: string
    certificate_number: string
    date: Date | string
    base_amount: unknown
    tax_amount: unknown
    rate: number | unknown
    amount: unknown
    document: { number: string; date: Date | string } | null
}

type Props = {
    company: { name: string | null; rif: string | null } | null
    supplier: { name: string; rif: string; address: string | null }
    withholdings: Withholding[]
    start: Date
    end: Date
}

function ComprobanteCard({
    company,
    supplier,
    w,
    isLast
}: {
    company: Props['company']
    supplier: Props['supplier']
    w: Withholding
    isLast: boolean
}) {
    const d = new Date(w.date)
    const periodoAnio = d.getFullYear()
    const periodoMes = d.getMonth() + 1
    return (
        <div
            className={`comprobante-iva-page bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden print:shadow-none print:border print:rounded ${!isLast ? 'print-break-after-page' : ''}`}
        >
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

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-4 border-y border-gray-200">
                    <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Nº COMPROBANTE</p>
                        <p className="font-mono font-medium text-gray-900">{w.certificate_number}</p>
                    </div>
                    <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase mb-1">E. EMISIÓN</p>
                        <p className="font-medium text-gray-900">{formatDate(w.date)}</p>
                    </div>
                    <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase mb-1">F. ENTREGA</p>
                        <p className="font-medium text-gray-900">{formatDate(w.date)}</p>
                    </div>
                    <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase mb-1">PERÍODO FISCAL</p>
                        <p className="text-sm text-gray-900"><strong>Año:</strong> {periodoAnio}</p>
                        <p className="text-sm text-gray-900"><strong>Mes:</strong> {periodoMes} ({MESES[periodoMes - 1]})</p>
                    </div>
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
                            <tr>
                                <td className="px-3 py-2">{formatDate(w.document?.date)}</td>
                                <td className="px-3 py-2">{w.document?.number ?? '—'}</td>
                                <td className="px-3 py-2 text-right">{formatNum(Number(w.base_amount))}</td>
                                <td className="px-3 py-2 text-right">{Number(w.rate)}%</td>
                                <td className="px-3 py-2 text-right">{formatNum(Number(w.tax_amount))}</td>
                                <td className="px-3 py-2 text-right font-medium">{formatNum(Number(w.amount))}</td>
                            </tr>
                        </tbody>
                        <tfoot className="bg-gray-50 font-medium">
                            <tr>
                                <td colSpan={2} className="px-3 py-2">Total</td>
                                <td className="px-3 py-2 text-right">{formatNum(Number(w.base_amount))}</td>
                                <td className="px-3 py-2" />
                                <td className="px-3 py-2 text-right">{formatNum(Number(w.tax_amount))}</td>
                                <td className="px-3 py-2 text-right">{formatNum(Number(w.amount))}</td>
                            </tr>
                        </tfoot>
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
    )
}

export function RetentionIVAPrintView({ company, supplier, withholdings, start, end }: Props) {
    if (withholdings.length === 0) {
        return (
            <div className="space-y-4">
                <div className="flex items-center justify-end print:hidden">
                    <button
                        type="button"
                        onClick={() => window.print()}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
                    >
                        Imprimir / Guardar PDF
                    </button>
                </div>
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <p className="text-gray-500 text-center">No hay retenciones de IVA en el período {formatDate(start)} – {formatDate(end)}.</p>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6 print:space-y-0">
                <div className="flex items-center justify-between gap-4 print:hidden">
                    <p className="text-sm text-gray-600">
                        {withholdings.length} comprobante{withholdings.length !== 1 ? 's' : ''} (una hoja por factura). Use el botón para imprimir o guardar como PDF.
                    </p>
                    <button
                        type="button"
                        onClick={() => window.print()}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
                    >
                        Imprimir / Guardar PDF
                    </button>
                </div>
                {withholdings.map((w, i) => (
                    <ComprobanteCard
                        key={w.id}
                        company={company}
                        supplier={supplier}
                        w={w}
                        isLast={i === withholdings.length - 1}
                    />
                ))}
            </div>
    )
}
