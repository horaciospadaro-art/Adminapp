import { PageHeader } from '@/components/ui/PageHeader'
import prisma from '@/lib/db'

export default async function SupplierAgingPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const supplier = await prisma.thirdParty.findUnique({
        where: { id },
        select: { name: true }
    })

    return (
        <div className="space-y-6">
            <PageHeader
                title={`Análisis de vencimiento - ${supplier?.name || 'Proveedor'}`}
                backHref="/dashboard/operations/suppliers"
            />
            <div className="bg-white rounded-lg border border-gray-200 p-8 text-center text-gray-500">
                <p className="text-lg">El reporte de análisis de vencimiento por proveedor estará disponible próximamente.</p>
                <p className="text-sm mt-2">Desde aquí se mostrará el detalle de documentos por rangos de vencimiento (corriente, 30, 60, 90+ días).</p>
            </div>
        </div>
    )
}
