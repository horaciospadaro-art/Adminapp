import Link from 'next/link'

const menuItems = [
    { name: 'Tablero', href: '/dashboard', icon: 'Ow' },
    { name: 'Contabilidad', href: '/dashboard/accounting', icon: 'Acc' },
    { name: 'Operaciones', href: '/dashboard/operations', icon: 'Ops' },
    { name: 'Reportes', href: '/dashboard/reports', icon: 'Rpt' },
    { name: 'Configuración', href: '/dashboard/settings', icon: 'Set' },
]

export function Sidebar() {
    return (
        <div className="w-64 bg-slate-900 text-white h-full flex flex-col">
            <div className="h-16 flex items-center justify-center border-b border-slate-800">
                <h1 className="text-xl font-bold tracking-wider">V-LEDGE</h1>
            </div>
            <nav className="flex-1 py-6">
                <ul className="space-y-1">
                    {menuItems.map((item) => (
                        <li key={item.name}>
                            <Link
                                href={item.href}
                                className="flex items-center px-6 py-3 text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
                            >
                                <span className="w-6 text-center mr-3 text-sm font-mono opacity-50">{item.icon}</span>
                                {item.name}
                            </Link>
                        </li>
                    ))}
                </ul>
            </nav>
            <div className="p-4 border-t border-slate-800">
                <div className="text-xs text-slate-500 text-center">
                    &copy; 2026 V-Ledge ERP
                </div>
            </div>
        </div>
    )
}
