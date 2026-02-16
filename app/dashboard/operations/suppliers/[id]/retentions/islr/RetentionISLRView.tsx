'use client'

import { useState } from 'react'
import { formatDate } from '@/lib/date-utils'
import { jsPDF } from 'jspdf'

const formatNum = (n: number) =>
    new Intl.NumberFormat('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n)

type Withholding = {
    id: string
    certificate_number: string
    date: Date | string
    base_amount: unknown
    rate: number | unknown
    amount: unknown
    islr_concept_name: string | null
    document: { number: string; date: Date | string } | null
}

type Props = {
    company: { name: string | null; rif: string | null } | null
    supplier: { name: string; rif: string; address: string | null }
    withholdings: Withholding[]
    start: Date | string
    end: Date | string
    numeroComprobante: string
    fechaEmisionComprobante: Date | string
    totalBase: number
    totalAmount: number
}

export function RetentionISLRView({
    company,
    supplier,
    withholdings,
    start,
    end,
    numeroComprobante,
    fechaEmisionComprobante,
    totalBase,
    totalAmount
}: Props) {
    const [downloading, setDownloading] = useState(false)

    function handleDownloadPDF() {
        setDownloading(true)
        try {
            const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' })
            const margin = 15
            const pageW = 215.9
            let y = 18

            pdf.setFontSize(14)
            pdf.setFont('helvetica', 'bold')
            pdf.text('COMPROBANTE DE RETENCIÓN DE IMPUESTO SOBRE LA RENTA', pageW / 2, y, { align: 'center' })
            y += 7
            pdf.setFontSize(8)
            pdf.setFont('helvetica', 'normal')
            pdf.text('Decreto 1.808. Gaceta Oficial Nº 36.203', pageW / 2, y, { align: 'center' })
            y += 10

            pdf.setFont('helvetica', 'bold')
            pdf.setFontSize(7)
            pdf.text('Datos del agente de retención', margin, y)
            y += 5
            pdf.setFont('helvetica', 'normal')
            pdf.text(company?.name ?? '—', margin, y)
            y += 5
            pdf.text('RIF: ' + (company?.rif ?? '—'), margin, y)
            y += 8

            pdf.setFont('helvetica', 'bold')
            pdf.text('Datos del sujeto retenido (proveedor)', margin + 100, y - 13)
            pdf.setFont('helvetica', 'normal')
            pdf.text(supplier.name, margin + 100, y - 8)
            pdf.text('RIF: ' + supplier.rif, margin + 100, y - 3)
            if (supplier.address) pdf.text('Dirección fiscal: ' + supplier.address, margin + 100, y + 2)
            y += 5

            pdf.setFont('helvetica', 'bold')
            pdf.text('Nº COMPROBANTE', margin, y)
            pdf.text('Fecha de emisión del comprobante', margin + 55, y)
            y += 5
            pdf.setFont('helvetica', 'normal')
            pdf.text(numeroComprobante, margin, y)
            pdf.text(formatDate(fechaEmisionComprobante), margin + 55, y)
            y += 8

            pdf.setFont('helvetica', 'normal')
            pdf.text('Período: ' + formatDate(start) + ' - ' + formatDate(end), margin, y)
            y += 10

            const colW = [28, 28, 50, 28, 22, 28]
            const headers = ['Fecha emisión', 'Nº factura', 'Concepto', 'Base retención', '% retención', 'Valor retención']
            pdf.setFont('helvetica', 'bold')
            pdf.setFontSize(7)
            let x = margin
            headers.forEach((h, i) => {
                pdf.rect(x, y, colW[i], 7)
                pdf.text(h, x + colW[i] / 2, y + 4.5, { align: 'center' })
                x += colW[i]
            })
            y += 7
            pdf.setFont('helvetica', 'normal')
            pdf.setFontSize(7)

            withholdings.forEach((w) => {
                if (y > 250) return
                x = margin
                const row = [
                    formatDate(w.document?.date),
                    (w.document?.number ?? '—').toString().substring(0, 12),
                    (w.islr_concept_name ?? '—').toString().substring(0, 22),
                    formatNum(Number(w.base_amount)),
                    Number(w.rate) + '%',
                    formatNum(Number(w.amount))
                ]
                row.forEach((cell, i) => {
                    pdf.rect(x, y, colW[i], 6)
                    const align = i >= 3 ? 'right' : 'left'
                    pdf.text(String(cell), x + (align === 'right' ? colW[i] - 1 : 1), y + 4, { align })
                    x += colW[i]
                })
                y += 6
            })

            pdf.setFont('helvetica', 'bold')
            x = margin
            const totalRow = ['Total', '', '', formatNum(totalBase), '', formatNum(totalAmount)]
            totalRow.forEach((cell, i) => {
                pdf.rect(x, y, colW[i], 6)
                const align = i >= 3 ? 'right' : 'left'
                if (cell) pdf.text(cell, x + (align === 'right' ? colW[i] - 1 : 1), y + 4, { align })
                x += colW[i]
            })
            y += 10

            pdf.setFont('helvetica', 'bold')
            pdf.text('Total del impuesto retenido: ' + formatNum(totalAmount), margin, y)
            y += 12

            pdf.setFont('helvetica', 'bold')
            pdf.setFontSize(6)
            pdf.text('Firma y sello de la empresa que emite el comprobante', margin, y)
            y += 5
            pdf.rect(margin, y, pageW - 2 * margin, 20)
            y += 22
            pdf.setFont('helvetica', 'normal')
            pdf.setFontSize(9)
            pdf.text(company?.name ?? '—', margin, y)
            y += 5
            pdf.setFontSize(8)
            pdf.text('RIF: ' + (company?.rif ?? '—'), margin, y)

            const safeName = (supplier.name || 'comprobante-islr').replace(/[^a-zA-Z0-9-_]/g, '_')
            pdf.save(`Comprobante-ISLR-${safeName}.pdf`)
        } catch (e) {
            console.error(e)
            alert('Error al generar el PDF.')
        } finally {
            setDownloading(false)
        }
    }

    return (
        <div className="space-y-6 p-4 md:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 print:hidden">
                <p className="text-sm text-gray-600">
                    {withholdings.length} retención{withholdings.length !== 1 ? 'es' : ''} en el período.
                </p>
                <button
                    type="button"
                    onClick={handleDownloadPDF}
                    disabled={downloading || withholdings.length === 0}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                    {downloading ? 'Generando PDF…' : 'Descargar PDF'}
                </button>
            </div>

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
