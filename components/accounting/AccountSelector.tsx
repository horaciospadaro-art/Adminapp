'use client'

import { useState, useEffect } from 'react'

interface Account {
    id: string
    code: string
    name: string
}

interface AccountSelectorProps {
    companyId: string
    value?: string
    onChange: (accountId: string) => void
    label: string
    typeFilter?: string // 'ASSET', 'LIABILITY', etc.
}

export function AccountSelector({ companyId, value, onChange, label, typeFilter }: AccountSelectorProps) {
    const [accounts, setAccounts] = useState<Account[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!companyId) return

        // We need an API to list accounts simply for selection.
        // Existing /api/accounting/accounts returns a tree or list?
        // Let's check or assume it returns list. 
        // Logic in AccountTree component suggests it fetches hierarchy or list.
        // Let's assume we can fetch all and filter client side or add query param.

        fetch(`/api/accounting/accounts?companyId=${companyId}`)
            .then(res => res.json())
            .then(data => {
                let filtered = data
                if (typeFilter) {
                    filtered = data.filter((a: any) => a.type === typeFilter)
                }
                // Filter only mostly level 4 accounts? Or allow any?
                // Usually only transactional accounts (Level 4).
                // Let's filter by checking if it has formatted code length? 
                // Or just show all and let user pick.
                setAccounts(filtered)
                setLoading(false)
            })
            .catch(err => {
                console.error(err)
                setLoading(false)
            })
    }, [companyId, typeFilter])

    return (
        <div>
            <label htmlFor={`account-selector-${typeFilter || 'any'}`} className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
            <select
                id={`account-selector-${typeFilter || 'any'}`}
                value={value || ''}
                onChange={e => onChange(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 bg-white"
                disabled={loading}
            >
                <option value="">-- Seleccionar Cuenta --</option>
                {accounts.map(account => (
                    <option key={account.id} value={account.id}>
                        {account.code} - {account.name}
                    </option>
                ))}
            </select>
        </div>
    )
}
