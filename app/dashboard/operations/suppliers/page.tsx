import prisma from '@/lib/db'
import { DocumentType, ThirdPartyType } from '@prisma/client'
import Link from 'next/link'
import { SuppliersManager } from '@/components/operations/SuppliersManager'
import { PageHeader } from '@/components/ui/PageHeader'
import { SummaryCards } from '@/components/ui/SummaryCards'
import { FileText } from 'lucide-react'

async function getDemoCompanyId() {
    const company = await prisma.company.findFirst()
    return company?.id || ''
}

async function getSuppliersSummary(companyId: string) {
    const supplierIds = await prisma.thirdParty.findMany({
        where: {
            company_id: companyId,
            type: { in: [ThirdPartyType.PROVEEDOR, ThirdPartyType.AMBOS] }
        },
        select: { id: true }
    }).then(r => r.map(x => x.id))

    if (supplierIds.length === 0) {
        return { ordersActive: 0, porPagar: 0, pagado: 0 }
    }

    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const [porPagarResult, pagadoResult] = await Promise.all([
        prisma.document.aggregate({
            where: {
                company_id: companyId,
                third_party_id: { in: supplierIds },
                type: { in: [DocumentType.BILL, DocumentType.DEBIT_NOTE] },
                status: { not: 'VOID' }
            },
            _sum: { balance: true }
        }),
        prisma.document.aggregate({
            where: {
                company_id: companyId,
                third_party_id: { in: supplierIds },
                type: DocumentType.PAYMENT,
                date: { gte: thirtyDaysAgo }
            },
            _sum: { total: true }
        })
    ])

    const porPagar = Number(porPagarResult._sum.balance ?? 0)
    const pagado = Number(pagadoResult._sum.total ?? 0)

    return { ordersActive: 0, porPagar, pagado }
}

function formatAmount(value: number) {
    return new Intl.NumberFormat('es-VE', { style: 'currency', currency: 'VES', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value)
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

    const summary = await getSuppliersSummary(companyId)

    return (
        <div className="min-h-screen">
            <PageHeader title="Proveedores" />

            <SummaryCards cards={[
                { title: 'Órdenes Activas', amount: formatAmount(summary.ordersActive), subtitle: 'Últimos 365 días', color: 'blue' },
                { title: 'Por Pagar', amount: formatAmount(summary.porPagar), subtitle: 'Últimos 365 días', color: 'orange', href: '/dashboard/operations/bills' },
                { title: 'Pagado', amount: formatAmount(summary.pagado), subtitle: 'Últimos 30 días', color: 'green' }
            ]} />

            <div className="mb-4 flex flex-wrap items-center gap-2">
                <Link
                    href="/dashboard/operations/bills"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-md border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                    <FileText className="w-4 h-4" />
                    Ver listado de facturas de compra (todos los proveedores)
                </Link>
            </div>

            <SuppliersManager companyId={companyId} />
        </div>
    )
}
