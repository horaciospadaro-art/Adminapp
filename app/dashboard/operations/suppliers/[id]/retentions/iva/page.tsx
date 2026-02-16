import { PageHeader } from '@/components/ui/PageHeader'
import prisma from '@/lib/db'
import { TaxType } from '@prisma/client'
import { RetentionIVAPrintView } from './RetentionIVAPrintView'

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

    return (
        <div className="space-y-6" data-retention-iva-page>
            <PageHeader
                title={`Comprobantes de retención IVA - ${supplier.name}`}
                backHref="/dashboard/operations/suppliers"
            />

            <RetentionIVAPrintView
                company={company}
                supplier={supplier}
                withholdings={withholdings}
                start={start}
                end={end}
            />
        </div>
    )
}
