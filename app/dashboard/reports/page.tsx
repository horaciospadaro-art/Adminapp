import Link from 'next/link'
import { FileBarChart, Calculator, ChevronRight, PieChart, FileText, BookOpen, ScrollText } from 'lucide-react'

export default function ReportsLandingPage() {
    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-gray-800">Centro de Reportes</h1>
                <p className="text-gray-500 mt-1">Seleccione el tipo de reporte que desea generar.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Opción 1: Reportes Administrativos (Dinámicos) */}
                <Link href="/dashboard/reports/builder" className="group">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md hover:border-blue-300 transition-all h-full cursor-pointer">
                        <div className="flex items-start justify-between">
                            <div className="bg-blue-100 p-3 rounded-lg text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                <FileBarChart className="w-8 h-8" />
                            </div>
                            <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-500" />
                        </div>
                        <h2 className="text-xl font-semibold text-gray-800 mt-4 group-hover:text-blue-700">
                            Reportes Administrativos
                        </h2>
                        <p className="text-gray-500 mt-2 text-sm">
                            Construya reportes a medida seleccionando campos específicos de Clientes, Proveedores, Bancos e Inventario. Ideal para gestión operativa.
                        </p>
                        <div className="mt-4 flex gap-2">
                            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">Dinámicos</span>
                            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">Personalizables</span>
                        </div>
                    </div>
                </Link>

                {/* Opción 2: Reportes Contables (Estáticos) */}
                <Link href="/dashboard/reports/financial" className="group">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md hover:border-green-300 transition-all h-full cursor-pointer">
                        <div className="flex items-start justify-between">
                            <div className="bg-green-100 p-3 rounded-lg text-green-600 group-hover:bg-green-600 group-hover:text-white transition-colors">
                                <Calculator className="w-8 h-8" />
                            </div>
                            <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-green-500" />
                        </div>
                        <h2 className="text-xl font-semibold text-gray-800 mt-4 group-hover:text-green-700">
                            Reportes Contables
                        </h2>
                        <p className="text-gray-500 mt-2 text-sm">
                            Estados financieros estandarizados y libros legales. Cumplimiento de normas contables internacionales y locales.
                        </p>
                        <div className="mt-4 flex gap-2">
                            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">Normativa</span>
                            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">Fiscal</span>
                        </div>
                    </div>
                </Link>
            </div>

            {/* Accesos Rápidos */}
            <div className="mt-8">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Accesos Directos</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                    <QuickLink
                        href="/dashboard/reports/financial?report=trial_balance"
                        icon={<FileText className="w-4 h-4" />}
                        title="Balance de Comprobación"
                    />
                    <QuickLink
                        href="/dashboard/reports/financial?report=income_statement"
                        icon={<PieChart className="w-4 h-4" />}
                        title="Estado de Resultados"
                    />
                    <QuickLink
                        href="/dashboard/reports/financial?report=balance_sheet"
                        icon={<Calculator className="w-4 h-4" />}
                        title="Balance General"
                    />
                    <QuickLink
                        href="/dashboard/accounting/reports/journal"
                        icon={<BookOpen className="w-4 h-4" />}
                        title="Diario Legal"
                    />
                    <QuickLink
                        href="/dashboard/accounting/reports/ledger"
                        icon={<FileBarChart className="w-4 h-4" />}
                        title="Mayor Analítico"
                    />
                    <QuickLink
                        href="/dashboard/accounting/reports/entries"
                        icon={<ScrollText className="w-4 h-4" />}
                        title="Listado de Asientos"
                    />
                </div>
            </div>
        </div>
    )
}

function QuickLink({ href, icon, title }: { href: string, icon: React.ReactNode, title: string }) {
    return (
        <Link href={href} className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg hover:border-blue-400 hover:text-blue-600 transition-all shadow-sm">
            <div className="text-gray-400">
                {icon}
            </div>
            <span className="text-sm font-medium text-gray-700">{title}</span>
        </Link>
    )
}
