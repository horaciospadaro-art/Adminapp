import { ThirdPartyForm } from '@/components/operations/ThirdPartyForm'
import prisma from '@/lib/db'

async function getDemoCompanyId() {
    const company = await prisma.company.findFirst()
    return company?.id || ''
}

export default async function OperationsPage() {
    const companyId = await getDemoCompanyId()

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-800">Operaciones</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <ThirdPartyForm companyId={companyId} />

                <div className="bg-white p-6 rounded shadow border border-gray-100">
                    <h2 className="text-lg font-bold mb-4">Lista de Clientes/Proveedores</h2>
                    <p className="text-gray-500 text-sm">No se encontraron terceros.</p>
                </div>
            </div>
        </div>
    )
}
