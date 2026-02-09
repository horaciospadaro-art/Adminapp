'use client'

import { useState, useEffect } from 'react'

type Account = {
    id: string
    code: string
    name: string
    type: string
    balance: number
}

type AccountSelectorProps = {
    value?: string
    onChange: (accountId: string) => void
    accountType?: string // Filter by account type (ASSET, EXPENSE, INCOME, etc.)
    required?: boolean
    label?: string
    companyId?: string
}

export function AccountSelector({
    value,
    onChange,
    accountType,
    required = false,
    label = 'Cuenta Contable',
    companyId
}: AccountSelectorProps) {
    const [accounts, setAccounts] = useState<Account[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')

    useEffect(() => {
        fetchAccounts()
    }, [companyId, accountType])

    async function fetchAccounts() {
        try {
            let url = '/api/accounting/accounts'
            if (companyId) url += `?companyId=${companyId}`

            const res = await fetch(url)
            const data = await res.json()

            // Filter by type if specified
            let filtered = data
            if (accountType) {
                filtered = data.filter((acc: Account) => acc.type === accountType)
            }

            setAccounts(filtered)
        } catch (error) {
            console.error('Error loading accounts:', error)
        } finally {
            setLoading(false)
        }
    }

    const filteredAccounts = accounts.filter(acc =>
        acc.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        acc.name.toLowerCase().includes(searchTerm.toLowerCase())
    )

    if (loading) {
        return (
            <div className="space-y-2">
                <label className="block text-xs font-semibold text-gray-600">{label}</label>
                <div className="w-full border rounded px-2 py-1 bg-gray-50 text-gray-500">
                    Cargando cuentas...
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-2">
            <label className="block text-xs font-semibold text-gray-600">
                {label} {required && <span className="text-red-500">*</span>}
            </label>

            {accounts.length > 10 && (
                <input
                    type="text"
                    placeholder="Buscar por código o nombre..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full border rounded px-2 py-1 text-sm bg-gray-50"
                />
            )}

            <select
                value={value || ''}
                onChange={(e) => onChange(e.target.value)}
                required={required}
                className="w-full border rounded px-2 py-1 bg-gray-50 focus:bg-white focus:border-blue-500 focus:outline-none"
            >
                <option value="">Seleccione una cuenta...</option>
                {filteredAccounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                        {acc.code} - {acc.name}
                    </option>
                ))}
            </select>

            {value && (
                <div className="text-xs text-gray-500">
                    {accounts.find(a => a.id === value)?.code} - {accounts.find(a => a.id === value)?.name}
                </div>
            )}
        </div>
    )
}
