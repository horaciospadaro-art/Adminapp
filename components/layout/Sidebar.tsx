import Link from 'next/link'

export function Sidebar() {
    return (
        <div className="w-64 bg-slate-900 text-white h-full flex flex-col overflow-y-auto">
            <div className="h-16 flex items-center justify-center border-b border-slate-800 shrink-0">
                <h1 className="text-xl font-bold tracking-wider">V-LEDGE</h1>
            </div>

            <nav className="flex-1 py-6 space-y-8">
                {/* Section: ADMINISTRACIÓN */}
                <div>
                    <h3 className="px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                        Administración
                    </h3>
                    <ul className="space-y-1">
                        <li>
                            <Link href="/dashboard" className="flex items-center px-6 py-2 text-slate-300 hover:bg-slate-800 hover:text-white transition-colors">
                                <span className="w-6 text-center mr-3 text-sm font-mono opacity-50">Tb</span>
                                Tablero
                            </Link>
                        </li>
                        <li>
                            <Link href="/dashboard/companies" className="flex items-center px-6 py-2 text-slate-300 hover:bg-slate-800 hover:text-white transition-colors">
                                <span className="w-6 text-center mr-3 text-sm font-mono opacity-50">Em</span>
                                Empresas
                            </Link>
                        </li>
                        <li>
                            <Link href="/dashboard/operations" className="flex items-center px-6 py-2 text-slate-300 hover:bg-slate-800 hover:text-white transition-colors">
                                <span className="w-6 text-center mr-3 text-sm font-mono opacity-50">Op</span>
                                Operaciones
                            </Link>
                        </li>
                        <li>
                            <Link href="/dashboard/banks" className="flex items-center px-6 py-2 text-slate-300 hover:bg-slate-800 hover:text-white transition-colors">
                                <span className="w-6 text-center mr-3 text-sm font-mono opacity-50">Bn</span>
                                Bancos
                            </Link>
                        </li>
                        <li>
                            <Link href="/dashboard/settings" className="flex items-center px-6 py-2 text-slate-300 hover:bg-slate-800 hover:text-white transition-colors">
                                <span className="w-6 text-center mr-3 text-sm font-mono opacity-50">Cf</span>
                                Configuración
                            </Link>
                        </li>
                    </ul>
                </div>

                {/* Section: CONTABILIDAD */}
                <div>
                    <h3 className="px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                        Contabilidad
                    </h3>
                    <ul className="space-y-1">
                        <li>
                            <Link href="/dashboard/accounting/chart-of-accounts" className="flex items-center px-6 py-2 text-slate-300 hover:bg-slate-800 hover:text-white transition-colors">
                                <span className="w-6 text-center mr-3 text-sm font-mono opacity-50">Pc</span>
                                Plan de Cuentas
                            </Link>
                        </li>
                        <li>
                            <Link href="/dashboard/accounting" className="flex items-center px-6 py-2 text-slate-300 hover:bg-slate-800 hover:text-white transition-colors">
                                <span className="w-6 text-center mr-3 text-sm font-mono opacity-50">As</span>
                                Asientos
                            </Link>
                        </li>
                        <li>
                            <Link href="/dashboard/reports" className="flex items-center px-6 py-2 text-slate-300 hover:bg-slate-800 hover:text-white transition-colors">
                                <span className="w-6 text-center mr-3 text-sm font-mono opacity-50">Rp</span>
                                Reportes
                            </Link>
                        </li>
                    </ul>
                </div>
            </nav>

            <div className="p-4 border-t border-slate-800 shrink-0">
                <div className="text-xs text-slate-500 text-center">
                    &copy; 2026 V-Ledge ERP
                </div>
            </div>
        </div>
    )
}
