'use client'

import { useState } from 'react'
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
    Package,
    ChevronDown,
    ChevronRight
} from 'lucide-react'

export function Sidebar() {
    const pathname = usePathname()
    const [expandedItems, setExpandedItems] = useState<string[]>([])

    const isActive = (path: string) => {
        if (path === '/dashboard' && pathname === '/dashboard') return true
        return path !== '/dashboard' && pathname.startsWith(path)
    }

    const toggleExpand = (label: string) => {
        setExpandedItems(prev =>
            prev.includes(label)
                ? prev.filter(item => item !== label)
                : [...prev, label]
        )
    }

    const menuSections = [
        {
            title: 'MENÚ PRINCIPAL',
            items: [
                { label: 'Tablero', href: '/dashboard', icon: LayoutDashboard },
                { label: 'Empresas', href: '/dashboard/companies', icon: Building2 },
                {
                    label: 'Configuración',
                    href: '#',
                    icon: Settings,
                    subItems: [
                        { label: 'Impuestos', href: '/dashboard/configuration/taxes' }
                    ]
                },
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
                                const hasSubItems = 'subItems' in item
                                const isExpanded = expandedItems.includes(item.label)

                                if (hasSubItems) {
                                    return (
                                        <div key={item.label}>
                                            <button
                                                onClick={() => toggleExpand(item.label)}
                                                className={`w-full flex items-center justify-between px-6 py-3 text-base font-medium transition-colors border-l-4 border-transparent hover:bg-gray-200 text-gray-600`}
                                            >
                                                <div className="flex items-center">
                                                    <Icon className="w-5 h-5 mr-3 text-gray-400" />
                                                    {item.label}
                                                </div>
                                                <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                                            </button>
                                            {isExpanded && (
                                                <div className="bg-gray-50 py-1">
                                                    {item.subItems?.map((subItem) => {
                                                        const subActive = isActive(subItem.href)
                                                        return (
                                                            <Link
                                                                key={subItem.href}
                                                                href={subItem.href}
                                                                className={`block pl-14 pr-6 py-2 text-sm font-medium transition-colors border-l-4 ${subActive
                                                                    ? 'border-[#2ca01c] text-[#2ca01c] bg-white'
                                                                    : 'border-transparent text-gray-500 hover:text-gray-900'
                                                                    }`}
                                                            >
                                                                {subItem.label}
                                                            </Link>
                                                        )
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    )
                                }

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
