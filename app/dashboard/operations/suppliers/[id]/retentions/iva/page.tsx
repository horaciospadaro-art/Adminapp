import { PageHeader } from '@/components/ui/PageHeader'
import prisma from '@/lib/db'

export default async function SupplierRetentionIVAPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const supplier = await prisma.thirdParty.findUnique({
        where: { id },
        select: { name: true }
    })

    return (
        <div className="space-y-6">
            <PageHeader
                title={`Comprobante de retención IVA - ${supplier?.name || 'Proveedor'}`}
                backHref="/dashboard/operations/suppliers"
            />
            <div className="bg-white rounded-lg border border-gray-200 p-8 text-center text-gray-500">
                <p className="text-lg">El comprobante de retención de IVA estará disponible próximamente.</p>
                <p className="text-sm mt-2">Desde aquí se podrá generar y descargar el comprobante de retención IVA por proveedor.</p>
            </div>
        </div>
    )
}
