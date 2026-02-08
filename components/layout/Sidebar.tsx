'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export function Sidebar() {
    const pathname = usePathname()

    const isActive = (path: string) => {
        if (path === '/dashboard' && pathname === '/dashboard') return true
        return path !== '/dashboard' && pathname.startsWith(path)
    }

    const menuItems = [
        { label: 'Tablero', href: '/dashboard', icon: 'Tb' },
        { label: 'Bancos', href: '/dashboard/banks', icon: 'Bn' },
        { label: 'Ventas', href: '/dashboard/operations/clients', icon: 'Vt' },
        { label: 'Gastos', href: '/dashboard/operations/suppliers', icon: 'Gt' },
        { label: 'Contabilidad', href: '/dashboard/accounting', icon: 'Ct' },
        { label: 'Reportes', href: '/dashboard/reports', icon: 'Rp' },
        { label: 'Empresas', href: '/dashboard/companies', icon: 'Ep' },
        { label: 'Configuración', href: '/dashboard/settings', icon: 'Cf' },
    ]

    return (
        <div className="w-56 bg-[#f4f5f8] text-[#393a3d] h-full flex flex-col border-r border-gray-200">
            <nav className="flex-1 py-4 space-y-1">
                {menuItems.map((item) => {
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
            </nav>

            <div className="p-4 shrink-0">
                <div className="text-xs text-gray-400 text-center">
                    &copy; 2026 V-Ledge ERP
                </div>
            </div>
        </div>
    )
}

