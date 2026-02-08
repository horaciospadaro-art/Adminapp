import prisma from '@/lib/db'
import { ClientsManager } from '@/components/operations/ClientsManager'
import { PageHeader } from '@/components/ui/PageHeader'
import { SummaryCards } from '@/components/ui/SummaryCards'

async function getDemoCompanyId() {
    const company = await prisma.company.findFirst()
    return company?.id || ''
}

export default async function ClientsPage() {
    const companyId = await getDemoCompanyId()

    return (
        <div className="min-h-screen">
            <PageHeader
                title="Clientes"
            // La acción de "Nuevo Cliente" la maneja el Manager internamente, 
            // pero podríamos elevarla aquí si quisiéramos. Por ahora mantenemos el header limpio.
            />

            <SummaryCards cards={[
                { title: 'Por Facturar', amount: 'VEF 0,00', subtitle: 'Últimos 365 días', color: 'blue' },
                { title: 'Vencido', amount: 'VEF 0,00', subtitle: 'Últimos 365 días', color: 'orange' },
                { title: 'Cobrado', amount: 'VEF 0,00', subtitle: 'Últimos 30 días', color: 'green' }
            ]} />

            <ClientsManager companyId={companyId} />
        </div>
    )
}
