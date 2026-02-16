import { ClientStatement } from '@/components/operations/ClientStatement'
import { PageHeader } from '@/components/ui/PageHeader'
import prisma from '@/lib/db'

export default async function ClientStatementPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const client = await prisma.thirdParty.findUnique({
        where: { id },
        select: { name: true }
    })

    return (
        <div className="space-y-6">
            <PageHeader
                title={`Estado de Cuenta - ${client?.name || 'Cliente'}`}
                backHref="/dashboard/operations/clients"
            />
            <ClientStatement clientId={id} />
        </div>
    )
}
