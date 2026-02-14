
import prisma from '@/lib/db'
import Link from 'next/link'
import { ArrowRight, DollarSign, Users, AlertCircle, FileText } from 'lucide-react'

async function getRevenueStats() {
    const receivables = await prisma.document.aggregate({
        where: {
            type: { in: ['INVOICE', 'DEBIT_NOTE'] },
            status: { in: ['PENDING', 'PARTIAL'] }
        },
        _sum: {
            balance: true
        }
    })

    const overdueCount = await prisma.document.count({
        where: {
            type: { in: ['INVOICE', 'DEBIT_NOTE'] },
            status: { in: ['PENDING', 'PARTIAL'] },
            due_date: { lt: new Date() }
        }
    })

    // Collections this month
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    const collections = await prisma.document.aggregate({
        where: {
            type: 'RECEIPT',
            date: { gte: startOfMonth }
        },
        _sum: {
            total: true
        }
    })

    return {
        totalReceivable: receivables._sum.balance || 0,
        overdueCount,
        monthlyCollections: collections._sum.total || 0
    }
}

export default async function RevenueDashboard() {
    const stats = await getRevenueStats()

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-800">Panel de Ingresos</h1>
                <div className="flex gap-4">
                    <Link href="/dashboard/revenue/invoices/new" className="bg-[#2ca01c] text-white px-4 py-2 rounded-lg hover:bg-[#248217] flex items-center gap-2">
                        <PlusIcon className="w-5 h-5" /> Nueva Venta
                    </Link>
                    <Link href="/dashboard/revenue/collections/new" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2">
                        <DollarIcon className="w-5 h-5" /> Nuevo Cobro
                    </Link>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <DashboardCard
                    title="Cuentas por Cobrar"
                    value={stats.totalReceivable}
                    icon={DollarSign}
                    color="text-blue-600"
                    bgColor="bg-blue-100"
                    formatter="currency"
                />
                <DashboardCard
                    title="Cobranzas del Mes"
                    value={stats.monthlyCollections}
                    icon={FileText}
                    color="text-green-600"
                    bgColor="bg-green-100"
                    formatter="currency"
                />
                <DashboardCard
                    title="Facturas Vencidas"
                    value={stats.overdueCount}
                    icon={AlertCircle}
                    color="text-red-600"
                    bgColor="bg-red-100"
                    formatter="number"
                    suffix=" Facturas"
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">Accesos Directos</h3>
                    <div className="space-y-4">
                        <Link href="/dashboard/revenue/invoices" className="block p-4 border rounded-lg hover:bg-gray-50 group">
                            <div className="flex justify-between items-center">
                                <span className="font-medium text-gray-700">Ver Facturas de Venta</span>
                                <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600" />
                            </div>
                        </Link>
                        <Link href="/dashboard/revenue/collections" className="block p-4 border rounded-lg hover:bg-gray-50 group">
                            <div className="flex justify-between items-center">
                                <span className="font-medium text-gray-700">Gestión de Cobranzas</span>
                                <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600" />
                            </div>
                        </Link>
                        <Link href="/dashboard/revenue/customers" className="block p-4 border rounded-lg hover:bg-gray-50 group">
                            <div className="flex justify-between items-center">
                                <span className="font-medium text-gray-700">Directorio de Clientes</span>
                                <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600" />
                            </div>
                        </Link>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-blue-600 to-blue-800 p-6 rounded-lg text-white">
                    <h3 className="text-xl font-bold mb-2">Estado de Cuenta</h3>
                    <p className="text-blue-100 mb-6">Consulte el saldo y movimientos detallados de sus clientes.</p>
                    <Link href="/dashboard/revenue/customers" className="inline-block bg-white text-blue-700 px-6 py-2 rounded-lg font-bold hover:bg-blue-50">
                        Buscar Cliente
                    </Link>
                </div>
            </div>
        </div>
    )
}

function DashboardCard({ title, value, icon: Icon, color, bgColor, formatter = 'number', suffix = '' }: any) {
    const formatted = formatter === 'currency'
        ? new Intl.NumberFormat('es-VE', { style: 'currency', currency: 'VES' }).format(Number(value))
        : value

    return (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 flex items-center justify-between">
            <div>
                <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
                <p className="text-2xl font-bold text-gray-800">{formatted}{suffix}</p>
            </div>
            <div className={`p-3 rounded-full ${bgColor}`}>
                <Icon className={`w-6 h-6 ${color}`} />
            </div>
        </div>
    )
}

function PlusIcon(props: any) {
    return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="M12 5v14" /></svg>
}

function DollarIcon(props: any) {
    return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 12h2a2 2 0 1 0 0-4h-3c-2.3 0-5 1.2-5 4" /><path d="M11 7v10" /><path d="M13 12h1" /><rect width="20" height="14" x="2" y="6" rx="2" /></svg>
}
