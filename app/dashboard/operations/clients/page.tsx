import prisma from '@/lib/db'
import { DocumentType, ThirdPartyType } from '@prisma/client'
import Link from 'next/link'
import { ClientsManager } from '@/components/operations/ClientsManager'
import { PageHeader } from '@/components/ui/PageHeader'
import { SummaryCards } from '@/components/ui/SummaryCards'
import { FileText } from 'lucide-react'

async function getDemoCompanyId() {
    const company = await prisma.company.findFirst()
    return company?.id || ''
}

async function getClientsSummary(companyId: string) {
    const clientIds = await prisma.thirdParty.findMany({
        where: {
            company_id: companyId,
            type: { in: [ThirdPartyType.CLIENTE, ThirdPartyType.AMBOS] }
        },
        select: { id: true }
    }).then(r => r.map(x => x.id))

    if (clientIds.length === 0) {
        return { porCobrar: 0, cobrado: 0 }
    }

    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const [porCobrarResult, cobradoResult] = await Promise.all([
        prisma.document.aggregate({
            where: {
                company_id: companyId,
                third_party_id: { in: clientIds },
                type: { in: [DocumentType.INVOICE, DocumentType.CREDIT_NOTE, DocumentType.DEBIT_NOTE] },
                status: { not: 'VOID' }
            },
            _sum: { balance: true }
        }),
        prisma.document.aggregate({
            where: {
                company_id: companyId,
                third_party_id: { in: clientIds },
                type: DocumentType.PAYMENT,
                date: { gte: thirtyDaysAgo }
            },
            _sum: { total: true }
        })
    ])

    const porCobrar = Number(porCobrarResult._sum.balance ?? 0)
    const cobrado = Number(cobradoResult._sum.total ?? 0)

    return { porCobrar, cobrado }
}

function formatAmount(value: number) {
    return new Intl.NumberFormat('es-VE', { style: 'currency', currency: 'VES', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value)
}

export default async function ClientsPage() {
    const companyId = await getDemoCompanyId()

    if (!companyId) {
        return (
            <div className="p-8 text-center">
                <h2 className="text-xl font-semibold text-gray-700">No se encontró una empresa activa</h2>
                <p className="text-gray-500 mt-2">Por favor, configure una empresa para comenzar.</p>
            </div>
        )
    }

    const summary = await getClientsSummary(companyId)

    return (
        <div className="min-h-screen">
            <PageHeader title="Clientes" />

            <SummaryCards cards={[
                { title: 'Por Cobrar', amount: formatAmount(summary.porCobrar), subtitle: 'Saldo pendiente', color: 'orange', href: '/dashboard/operations/invoices' },
                { title: 'Cobrado', amount: formatAmount(summary.cobrado), subtitle: 'Últimos 30 días', color: 'green' }
            ]} />

            <div className="mb-4 flex flex-wrap items-center gap-2">
                <Link
                    href="/dashboard/operations/invoices"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-md border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                    <FileText className="w-4 h-4" />
                    Ver listado de documentos de venta (todos los clientes)
                </Link>
            </div>

            <ClientsManager companyId={companyId} />
        </div>
    )
}
