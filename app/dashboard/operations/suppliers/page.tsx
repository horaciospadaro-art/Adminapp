import prisma from '@/lib/db'
import { SuppliersManager } from '@/components/operations/SuppliersManager'
import { PageHeader } from '@/components/ui/PageHeader'
import { SummaryCards } from '@/components/ui/SummaryCards'

async function getDemoCompanyId() {
    const company = await prisma.company.findFirst()
    return company?.id || ''
}

export default async function SuppliersPage() {
    const companyId = await getDemoCompanyId()

    if (!companyId) {
        return (
            <div className="p-8 text-center">
                <h2 className="text-xl font-semibold text-gray-700">No se encontró una empresa activa</h2>
                <p className="text-gray-500 mt-2">Por favor, configure una empresa para comenzar.</p>
            </div>
        )
    }

    return (
        <div className="min-h-screen">
            <PageHeader
                title="Proveedores"
            />

            <SummaryCards cards={[
                { title: 'Órdenes Activas', amount: 'VEF 0,00', subtitle: 'Últimos 365 días', color: 'blue' },
                { title: 'Por Pagar', amount: 'VEF 0,00', subtitle: 'Últimos 365 días', color: 'orange' },
                { title: 'Pagado', amount: 'VEF 0,00', subtitle: 'Últimos 30 días', color: 'green' }
            ]} />

            <SuppliersManager companyId={companyId} />
        </div>
    )
}
