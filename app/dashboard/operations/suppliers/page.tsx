import prisma from '@/lib/db'
import { SuppliersManager } from '@/components/operations/SuppliersManager'

async function getDemoCompanyId() {
    const company = await prisma.company.findFirst()
    return company?.id || ''
}

export default async function SuppliersPage() {
    const companyId = await getDemoCompanyId()

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-800">Gestión de Proveedores</h1>
            <p className="text-gray-500">Administre la base de datos de sus proveedores y asigne cuentas por pagar.</p>

            <SuppliersManager companyId={companyId} />
        </div>
    )
}
