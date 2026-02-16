import { PageHeader } from '@/components/ui/PageHeader'
import prisma from '@/lib/db'
import { TaxType } from '@prisma/client'
import { RetentionISLRView } from './RetentionISLRView'

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

    const fechaEmisionComprobante = new Date()
    const totalBase = withholdings.reduce((s, w) => s + Number(w.base_amount), 0)
    const totalAmount = withholdings.reduce((s, w) => s + Number(w.amount), 0)

    return (
        <div className="space-y-6">
            <PageHeader
                title={`Comprobante de retención ISLR - ${supplier.name}`}
                backHref="/dashboard/operations/suppliers"
            />

            <RetentionISLRView
                company={company}
                supplier={supplier}
                withholdings={withholdings}
                start={start}
                end={end}
                numeroComprobante={numeroComprobante}
                fechaEmisionComprobante={fechaEmisionComprobante}
                totalBase={totalBase}
                totalAmount={totalAmount}
            />
        </div>
    )
}
