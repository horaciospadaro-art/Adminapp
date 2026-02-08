'use client'

import { useEffect, useState } from 'react'

type Account = {
    id: string
    code: string
    name: string
    type: string
    parent_id: string | null
    balance: number
}

export function AccountTree({ companyId }: { companyId: string }) {
    const [accounts, setAccounts] = useState<Account[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!companyId) return
        fetch(`/api/accounting/accounts?companyId=${companyId}`)
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) setAccounts(data)
                setLoading(false)
            })
            .catch(err => {
                console.error(err)
                setLoading(false)
            })
    }, [companyId])

    if (loading) return <div className="text-gray-500">Cargando cuentas...</div>

    // Build tree
    const buildTree = (parentId: string | null = null, depth = 0) => {
        const nodes = accounts.filter(a => a.parent_id === parentId)
        if (nodes.length === 0) return null

        return (
            <ul className={`pl-${parentId ? '4' : '0'} space-y-1`}>
                {nodes.map(node => (
                    <li key={node.id}>
                        <div className="flex items-center justify-between p-2 hover:bg-gray-50 rounded border-b border-gray-50">
                            <div className="flex items-center gap-2">
                                <span className={`font-mono text-sm ${depth === 0 ? 'font-bold' : ''}`}>
                                    {node.code}
                                </span>
                                <span className={`${depth === 0 ? 'font-bold' : ''}`}>
                                    {node.name}
                                </span>
                            </div>
                            <div className="text-sm text-gray-600">
                                {Number(node.balance).toFixed(2)}
                            </div>
                        </div>
                        {buildTree(node.id, depth + 1)}
                    </li>
                ))}
            </ul>
        )
    }

    return (
        <div className="bg-white p-6 rounded shadow border border-gray-100">
            <h2 className="text-lg font-bold mb-4">Plan de Cuentas</h2>
            {accounts.length === 0 ? (
                <p className="text-gray-500">No hay cuentas registradas.</p>
            ) : (
                <div className="overflow-x-auto">
                    {buildTree()}
                </div>
            )}
        </div>
    )
}
