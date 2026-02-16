'use client'

import { useState } from 'react'
import { formatDate } from '@/lib/date-utils'
import { jsPDF } from 'jspdf'

const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

const formatNum = (n: number) =>
    new Intl.NumberFormat('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n)

const LEY_IVA_ART11 = 'Ley IVA. Art. 11: Serán responsables del pago del impuesto en calidad de agentes de retención, los compradores o adquirientes de determinados bienes muebles y los receptores de ciertos servicios, a quienes la Administración Tributaria designe como tal.'

type Withholding = {
    id: string
    certificate_number: string
    date: Date | string
    base_amount: unknown
    tax_amount: unknown
    rate: number | unknown
    amount: unknown
    document: { number: string; date: Date | string; control_number?: string | null } | null
}

type Props = {
    company: { name: string | null; rif: string | null; address?: string | null } | null
    supplier: { name: string; rif: string; address: string | null }
    withholdings: Withholding[]
    start: Date
    end: Date
}

function addComprobantePage(
    pdf: jsPDF,
    company: Props['company'],
    supplier: Props['supplier'],
    w: Withholding,
    isFirstPage: boolean
) {
    if (!isFirstPage) pdf.addPage('letter', 'landscape')
    const pageW = 279.4
    const pageH = 215.9
    const margin = 12
    let y = 14

    pdf.setDrawColor(0, 0, 0)
    pdf.rect(margin, y, 22, 22)
    pdf.setFontSize(7)
    pdf.setFont('helvetica', 'normal')
    pdf.text('Logotipo', margin + 11, y + 12, { align: 'center' })

    pdf.setFontSize(12)
    pdf.setFont('helvetica', 'bold')
    pdf.text('COMPROBANTE DE RETENCIÓN DEL IMPUESTO AL VALOR AGREGADO', pageW / 2, y + 10, { align: 'center' })
    y += 16
    pdf.setFontSize(7)
    pdf.setFont('helvetica', 'normal')
    const leyLines = pdf.splitTextToSize(LEY_IVA_ART11, pageW - 2 * margin - 30)
    pdf.text(leyLines, pageW / 2, y, { align: 'center' })
    y += leyLines.length * 4 + 8

    const boxH = 6
    pdf.setFontSize(6)
    pdf.setFont('helvetica', 'bold')
    pdf.text('NOMBRE O RAZÓN SOCIAL AGENTE DE RETENCIÓN', margin, y)
    y += 4
    pdf.rect(margin, y, 95, boxH)
    pdf.setFont('helvetica', 'normal')
    pdf.text((company?.name ?? '—').substring(0, 55), margin + 2, y + 4)
    const xRif = margin + 98
    pdf.setFont('helvetica', 'bold')
    pdf.text('RIF DEL AGENTE DE RETENCIÓN', xRif, y - 4)
    pdf.rect(xRif, y, 38, boxH)
    pdf.setFont('helvetica', 'normal')
    pdf.text(company?.rif ?? '—', xRif + 2, y + 4)
    const xCert = xRif + 41
    pdf.setFont('helvetica', 'bold')
    pdf.text('Nº COMPROBANTE', xCert, y - 4)
    pdf.rect(xCert, y, 42, boxH)
    pdf.setFont('helvetica', 'normal')
    pdf.text(w.certificate_number, xCert + 2, y + 4)
    y += boxH + 8

    pdf.setFont('helvetica', 'bold')
    pdf.text('DIRECCION FISCAL DEL AGENTE DE RETENCIÓN', margin, y)
    y += 4
    pdf.rect(margin, y, 165, boxH)
    pdf.setFont('helvetica', 'normal')
    pdf.text((company?.address ?? '—').substring(0, 75), margin + 2, y + 4)
    const xEmi = margin + 168
    pdf.setFont('helvetica', 'bold')
    pdf.text('E. EMISION', xEmi, y - 4)
    pdf.rect(xEmi, y, 24, boxH)
    pdf.setFont('helvetica', 'normal')
    pdf.text(formatDate(w.date), xEmi + 2, y + 4)
    const xEnt = xEmi + 27
    pdf.setFont('helvetica', 'bold')
    pdf.text('F. ENTREGA', xEnt, y - 4)
    pdf.rect(xEnt, y, 24, boxH)
    pdf.setFont('helvetica', 'normal')
    pdf.text(formatDate(w.date), xEnt + 2, y + 4)
    y += boxH + 8

    pdf.setFont('helvetica', 'bold')
    pdf.text('NOMBRE O RAZÓN SOCIAL DEL SUJETO RETENIDO', margin, y)
    y += 4
    pdf.rect(margin, y, 95, boxH)
    pdf.setFont('helvetica', 'normal')
    pdf.text(supplier.name.substring(0, 55), margin + 2, y + 4)
    pdf.setFont('helvetica', 'bold')
    pdf.text('RIF DEL SUJETO RETENIDO', xRif, y - 4)
    pdf.rect(xRif, y, 38, boxH)
    pdf.setFont('helvetica', 'normal')
    pdf.text(supplier.rif, xRif + 2, y + 4)
    const d = new Date(w.date)
    const periodoAnio = d.getFullYear()
    const periodoMes = d.getMonth() + 1
    pdf.setFont('helvetica', 'bold')
    pdf.text('PERÍODO FISCAL', xCert, y - 4)
    pdf.text('AÑO:', xCert, y + 1)
    pdf.rect(xCert + 12, y, 15, boxH)
    pdf.setFont('helvetica', 'normal')
    pdf.text(String(periodoAnio), xCert + 14, y + 4)
    pdf.setFont('helvetica', 'bold')
    pdf.text('MES:', xCert + 30, y + 1)
    pdf.rect(xCert + 38, y, 15, boxH)
    pdf.setFont('helvetica', 'normal')
    pdf.text(String(periodoMes), xCert + 40, y + 4)
    y += boxH + 10

    const totalCompra = Number(w.base_amount) + Number(w.tax_amount)
    const headers = ['OPER', 'FECHA FACTURA', 'Nº FACTURA', 'Nº CONTROL', 'Nº NOTA DEBITO', 'Nº NOTA CREDITO', 'Nº FACT. AFECT.', 'TOTAL COMPRA INCL. IVA', 'COMPRAS SIN DER. CRED.', 'BASE IMPONIBLE', '% ALICUOTA', 'IMPUESTO IVA', 'IVA RETENIDO']
    const colW = [10, 18, 18, 16, 18, 18, 16, 24, 22, 20, 12, 18, 20]
    const row = [
        '1',
        formatDate(w.document?.date),
        w.document?.number ?? '—',
        (w.document as { control_number?: string })?.control_number ?? '—',
        '—',
        '—',
        '—',
        formatNum(totalCompra),
        '0,00',
        formatNum(Number(w.base_amount)),
        Number(w.rate) + '%',
        formatNum(Number(w.tax_amount)),
        formatNum(Number(w.amount))
    ]
    const rightCols = [7, 8, 9, 10, 11, 12]

    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(6)
    let x = margin
    headers.forEach((h, i) => {
        const ww = colW[i]
        pdf.rect(x, y, ww, 7)
        const label = pdf.splitTextToSize(h, ww - 2)
        pdf.text(label[0], x + ww / 2, y + 4.5, { align: 'center' })
        x += ww
    })
    y += 7
    pdf.setFont('helvetica', 'normal')
    x = margin
    row.forEach((cell, i) => {
        const ww = colW[i]
        pdf.rect(x, y, ww, 6)
        const align = rightCols.includes(i) ? 'right' : 'left'
        pdf.text(String(cell).substring(0, 14), x + (align === 'right' ? ww - 1 : 1), y + 4, { align })
        x += ww
    })
    y += 6
    pdf.setFont('helvetica', 'bold')
    x = margin
    const totalRow = ['', '', '', '', '', '', '', formatNum(totalCompra), '0,00', formatNum(Number(w.base_amount)), '', formatNum(Number(w.tax_amount)), formatNum(Number(w.amount))]
    totalRow.forEach((cell, i) => {
        const ww = colW[i]
        pdf.rect(x, y, ww, 6)
        const align = rightCols.includes(i) ? 'right' : 'left'
        if (cell) pdf.text(cell, x + (align === 'right' ? ww - 1 : 1), y + 4, { align })
        x += ww
    })
    y += 10

    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(6)
    pdf.text('Firma y sello de la empresa que emite el comprobante', margin, y)
    y += 5
    pdf.rect(margin, y, pageW - 2 * margin, 18)
    y += 20
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(9)
    pdf.text(company?.name ?? '—', margin, y)
    y += 5
    pdf.setFontSize(8)
    pdf.text('RIF: ' + (company?.rif ?? '—'), margin, y)
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
    const [downloading, setDownloading] = useState(false)

    function handleDownloadPDF() {
        if (withholdings.length === 0) return
        setDownloading(true)
        try {
            const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'letter' })
            withholdings.forEach((w, i) => {
                addComprobantePage(pdf, company, supplier, w, i === 0)
            })
            const safeName = (supplier.name || 'comprobantes').replace(/[^a-zA-Z0-9-_]/g, '_')
            pdf.save(`Comprobantes-IVA-${safeName}.pdf`)
        } catch (e) {
            console.error(e)
            alert('Error al generar el PDF.')
        } finally {
            setDownloading(false)
        }
    }

    if (withholdings.length === 0) {
        return (
            <div className="space-y-4">
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <p className="text-gray-500 text-center">No hay retenciones de IVA en el período {formatDate(start)} – {formatDate(end)}.</p>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6 print:space-y-0">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 print:hidden">
                <p className="text-sm text-gray-600">
                    {withholdings.length} comprobante{withholdings.length !== 1 ? 's' : ''} (una hoja por factura).
                </p>
                <button
                    type="button"
                    onClick={handleDownloadPDF}
                    disabled={downloading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                    {downloading ? 'Generando PDF…' : 'Descargar PDF'}
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
