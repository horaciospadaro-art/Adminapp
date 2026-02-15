import { SupplierStatement } from '@/components/operations/SupplierStatement'
import { PageHeader } from '@/components/ui/PageHeader'
import prisma from '@/lib/db'

export default async function SupplierStatementPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const supplier = await prisma.thirdParty.findUnique({
        where: { id },
        select: { name: true }
    })

    return (
        <div className="space-y-6">
            <PageHeader
                title={`Estado de Cuenta - ${supplier?.name || 'Proveedor'}`}
                backHref="/dashboard/operations/suppliers"
            />
            <SupplierStatement supplierId={id} />
        </div>
    )
}
