import { AccountForm } from '@/components/accounting/AccountForm'
import { AccountTree } from '@/components/accounting/AccountTree'
import prisma from '@/lib/db'

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

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                    <AccountForm companyId={companyId} />
                </div>
                <div>
                    <AccountTree companyId={companyId} />
                </div>
            </div>
        </div>
    )
}
