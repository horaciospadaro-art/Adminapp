import prisma from '@/lib/db'
import { ChartOfAccountsManager } from '@/components/accounting/ChartOfAccountsManager'

async function getDemoCompanyId() {
    const company = await prisma.company.findFirst()
    return company?.id || ''
}

export default async function ChartOfAccountsPage() {
    const companyId = await getDemoCompanyId()

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-800">Plan de Cuentas</h1>
            <p className="text-gray-500">Gestione la estructura de cuentas contables de la empresa.</p>

            <ChartOfAccountsManager companyId={companyId} />
        </div>
    )
}
