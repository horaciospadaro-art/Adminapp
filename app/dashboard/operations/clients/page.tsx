import prisma from '@/lib/db'
import { ClientsManager } from '@/components/operations/ClientsManager'

async function getDemoCompanyId() {
    const company = await prisma.company.findFirst()
    return company?.id || ''
}

export default async function ClientsPage() {
    const companyId = await getDemoCompanyId()

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-800">Gestión de Clientes</h1>
            <p className="text-gray-500">Administre la base de datos de sus clientes y asigne cuentas por cobrar.</p>

            <ClientsManager companyId={companyId} />
        </div>
    )
}
