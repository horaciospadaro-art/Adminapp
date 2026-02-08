'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
    LayoutDashboard,
    Building2,
    Landmark,
    Users,
    Truck,
    BookOpen,
    ChartBar,
    Settings,
    Package
} from 'lucide-react'

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
                { label: 'Tablero', href: '/dashboard', icon: LayoutDashboard },
                { label: 'Empresas', href: '/dashboard/companies', icon: Building2 },
            ]
        },
        {
            title: 'ADMINISTRACIÓN',
            items: [
                { label: 'Bancos', href: '/dashboard/banks', icon: Landmark },
                { label: 'Inventario', href: '/dashboard/inventory', icon: Package },
                { label: 'Clientes', href: '/dashboard/operations/clients', icon: Users },
                { label: 'Proveedores', href: '/dashboard/operations/suppliers', icon: Truck },
            ]
        },
        {
            title: 'CONTABILIDAD',
            items: [
                { label: 'Plan de Cuentas', href: '/dashboard/accounting/chart-of-accounts', icon: BookOpen },
            ]
        },
        {
            title: 'REPORTES FINANCIEROS',
            items: [
                { label: 'Centro de Reportes', href: '/dashboard/reports', icon: ChartBar },
            ]
        },
        {
            title: 'CONFIGURACIÓN',
            items: [
                { label: 'Impuestos', href: '/dashboard/configuration/taxes', icon: Settings },
            ]
        }
    ]

    return (
        <div className="w-60 bg-[#f4f5f8] text-[#393a3d] h-full flex flex-col border-r border-gray-200">
            <nav className="flex-1 py-6 overflow-y-auto">
                {menuSections.map((section, idx) => (
                    <div key={idx} className="mb-8">
                        <h3 className="px-6 text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">
                            {section.title}
                        </h3>
                        <div className="space-y-1">
                            {section.items.map((item) => {
                                const active = isActive(item.href)
                                const Icon = item.icon
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className={`flex items-center px-6 py-3 text-base font-medium transition-colors border-l-4 ${active
                                            ? 'border-[#2ca01c] bg-white text-black'
                                            : 'border-transparent hover:bg-gray-200 text-gray-600'
                                            }`}
                                    >
                                        <Icon className={`w-5 h-5 mr-3 ${active ? 'text-[#2ca01c]' : 'text-gray-400'}`} />
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
