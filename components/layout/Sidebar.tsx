'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export function Sidebar() {
    const pathname = usePathname()

    const isActive = (path: string) => {
        if (path === '/dashboard' && pathname === '/dashboard') return true
        return path !== '/dashboard' && pathname.startsWith(path)
    }

    const menuSections = [
        {
            title: 'MENÚ PRINCIPAL',
            items: [
                { label: 'Tablero', href: '/dashboard', icon: 'Tb' },
                { label: 'Empresas', href: '/dashboard/companies', icon: 'Em' },
            ]
        },
        {
            title: 'ADMINISTRACIÓN',
            items: [
                { label: 'Bancos', href: '/dashboard/banks', icon: 'Bn' },
                { label: 'Clientes', href: '/dashboard/operations/clients', icon: 'Cl' },
                { label: 'Proveedores', href: '/dashboard/operations/suppliers', icon: 'Pr' },
            ]
        },
        {
            title: 'CONTABILIDAD',
            items: [
                { label: 'Plan de Cuentas', href: '/dashboard/accounting/chart-of-accounts', icon: 'Pc' },
                { label: 'Reportes Contables', href: '/dashboard/reports', icon: 'Rp' },
            ]
        }
    ]

    return (
        <div className="w-56 bg-[#f4f5f8] text-[#393a3d] h-full flex flex-col border-r border-gray-200">
            <nav className="flex-1 py-4 overflow-y-auto">
                {menuSections.map((section, idx) => (
                    <div key={idx} className="mb-6">
                        <h3 className="px-4 text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                            {section.title}
                        </h3>
                        <div className="space-y-1">
                            {section.items.map((item) => {
                                const active = isActive(item.href)
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className={`flex items-center px-4 py-2 text-sm font-medium transition-colors border-l-4 ${active
                                            ? 'border-[#2ca01c] bg-white text-black'
                                            : 'border-transparent hover:bg-gray-200 text-gray-600'
                                            }`}
                                    >
                                        <span className={`w-6 text-center mr-3 font-mono text-xs ${active ? 'text-[#2ca01c]' : 'opacity-50'}`}>
                                            {item.icon}
                                        </span>
                                        {item.label}
                                    </Link>
                                )
                            })}
                        </div>
                    </div>
                ))}
            </nav>

            <div className="p-4 shrink-0">
                <div className="text-xs text-gray-400 text-center">
                    &copy; 2026 ABC AdminApp
                </div>
            </div>
        </div>
    )
}

