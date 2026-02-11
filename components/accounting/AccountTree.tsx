'use client'

import { useEffect, useState, useMemo } from 'react'
import { ChevronRight, ChevronDown, Edit, Plus, Folder, FileText, Search } from 'lucide-react'

// Define stricter types matching Prisma
type AccountType = 'ASSET' | 'LIABILITY' | 'EQUITY' | 'INCOME' | 'EXPENSE' | 'COST' | 'OTHER'

type Account = {
    id: string
    code: string
    name: string
    type: AccountType
    parent_id: string | null
    balance: number
    level: number // Helper for indentation
    children?: Account[]
}

export function AccountTree({ companyId, onEdit, refreshKey }: { companyId: string, onEdit?: (account: any) => void, refreshKey?: number }) {
    const [accounts, setAccounts] = useState<Account[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set())

    useEffect(() => {
        if (!companyId) return
        setLoading(true)
        fetch(`/api/accounting/accounts?companyId=${companyId}`)
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    // Sort by code to ensure proper order
                    const sorted = data.sort((a, b) => a.code.localeCompare(b.code))
                    setAccounts(sorted)

                    // Auto-expand top level nodes
                    const topLevelIds = sorted.filter(a => !a.parent_id).map(a => a.id)
                    setExpandedNodes(new Set(topLevelIds))
                }
                setLoading(false)
            })
            .catch(err => {
                console.error(err)
                setLoading(false)
            })
    }, [companyId, refreshKey])

    const toggleExpand = (id: string) => {
        const newExpanded = new Set(expandedNodes)
        if (newExpanded.has(id)) {
            newExpanded.delete(id)
        } else {
            newExpanded.add(id)
        }
        setExpandedNodes(newExpanded)
    }

    // Transform flat list to tree structure for rendering
    // But for a table, we often want a flattened list with depth info
    // Filtering logic: If a child matches search, show parents too.
    const visibleAccounts = useMemo(() => {
        if (!searchTerm) {
            // Standard tree traversal to generate flat list respecting expansion
            const result: Account[] = []

            // Helper to create hierarchy map
            const childrenMap = new Map<string, Account[]>()
            accounts.forEach(acc => {
                if (acc.parent_id) {
                    const children = childrenMap.get(acc.parent_id) || []
                    children.push(acc)
                    childrenMap.set(acc.parent_id, children)
                }
            })

            const traverse = (parentId: string | null, level: number) => {
                // Find direct children
                const nodes = accounts.filter(a => a.parent_id === parentId)

                nodes.forEach(node => {
                    result.push({ ...node, level })
                    if (expandedNodes.has(node.id)) {
                        traverse(node.id, level + 1)
                    }
                })
            }

            traverse(null, 0)
            return result
        } else {
            // Search mode: Filter list and maybe show path?
            // Simple filter: name or code matches
            const lowerTerm = searchTerm.toLowerCase()
            return accounts.filter(a =>
                a.name.toLowerCase().includes(lowerTerm) ||
                a.code.toLowerCase().includes(lowerTerm)
            ).map(a => ({ ...a, level: 0 })) // Flatten hierarchy in search
        }
    }, [accounts, searchTerm, expandedNodes])


    if (loading) return (
        <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
    )

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col h-[calc(100vh-220px)]">
            {/* Toolbar */}
            <div className="p-4 border-b border-gray-100 flex items-center gap-4 bg-gray-50/50">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Buscar cuenta por código o nombre..."
                        className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex-1 text-right text-xs text-gray-500">
                    {accounts.length} cuentas registradas
                </div>
            </div>

            {/* Table Header */}
            <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <div className="col-span-4 md:col-span-3">Código</div>
                <div className="col-span-4 md:col-span-4">Descripción</div>
                <div className="col-span-2 hidden md:block">Tipo</div>
                <div className="col-span-2 text-right">Saldo</div>
                <div className="col-span-1 text-right">Acciones</div>
            </div>

            {/* Scrollable Body */}
            <div className="overflow-y-auto flex-1">
                {visibleAccounts.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                        {searchTerm ? 'No se encontraron cuentas que coincidan con la búsqueda.' : 'No hay cuentas registradas.'}
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {visibleAccounts.map(account => {
                            const hasChildren = accounts.some(a => a.parent_id === account.id)
                            const isGroup = hasChildren // Simplified logic: if it has children, treat as group

                            return (
                                <div
                                    key={account.id}
                                    className={`grid grid-cols-12 gap-4 px-6 py-2 items-center hover:bg-[#f8f9fa] transition-colors group ${searchTerm ? '' : 'cursor-pointer'}`}
                                    onClick={() => !searchTerm && hasChildren && toggleExpand(account.id)}
                                >
                                    {/* Code Column (Strictly Left Aligned) */}
                                    <div className="col-span-4 md:col-span-3 flex items-center overflow-hidden">
                                        <span className="font-mono text-xs font-bold text-gray-600 truncate">{account.code}</span>
                                    </div>

                                    {/* Description Column (With Indentation & Hierarchy) */}
                                    <div className="col-span-4 md:col-span-4 flex items-center overflow-hidden">
                                        {/* Indentation */}
                                        <div style={{ paddingLeft: `${account.level * 20}px` }} className="flex-shrink-0" />

                                        {/* Expand Toggle */}
                                        <div className="mr-2 w-5 h-5 flex items-center justify-center flex-shrink-0 text-gray-400">
                                            {!searchTerm && hasChildren && (
                                                expandedNodes.has(account.id) ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />
                                            )}
                                        </div>

                                        {/* Icon */}
                                        <div className={`mr-2 flex-shrink-0 ${isGroup ? 'text-blue-500' : 'text-gray-400'}`}>
                                            {isGroup ? <Folder className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                                        </div>

                                        <span className={`text-sm truncate ${isGroup ? 'font-semibold text-gray-800' : 'text-gray-700'}`}>
                                            {account.name}
                                        </span>
                                    </div>

                                    {/* Type Column */}
                                    <div className="col-span-2 hidden md:flex items-center">
                                        <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-medium border border-gray-200">
                                            {
                                                {
                                                    'ASSET': 'ACTIVO',
                                                    'LIABILITY': 'PASIVO',
                                                    'EQUITY': 'PATRIMONIO',
                                                    'INCOME': 'INGRESOS',
                                                    'EXPENSE': 'GASTOS',
                                                    'COST': 'COSTOS',
                                                    'OTHER': 'OTROS'
                                                }[account.type] || account.type
                                            }
                                        </span>
                                    </div>

                                    {/* Balance Column */}
                                    <div className={`col-span-2 text-right font-mono text-sm ${account.balance < 0 ? 'text-red-600' : 'text-gray-700'}`}>
                                        {Number(account.balance).toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                                    </div>

                                    {/* Actions Column */}
                                    <div className="col-span-1 flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); onEdit && onEdit(account); }}
                                            className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
                                            title="Editar cuenta"
                                        >
                                            <Edit className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>
        </div>
    )
}
