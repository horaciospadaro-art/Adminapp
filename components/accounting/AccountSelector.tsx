'use client'

import { useState, useEffect, useRef } from 'react'
import { Check, ChevronsUpDown, Loader2, Search } from 'lucide-react'

export interface Account {
    id: string
    code: string
    name: string
    type: string
    balance?: number
    _count?: {
        children: number
    }
}

interface AccountSelectorProps {
    companyId?: string
    value?: string
    onChange: (accountId: string) => void
    label?: string
    typeFilter?: string
    placeholder?: string
    required?: boolean
    preloadedAccounts?: Account[]
}

export function AccountSelector({
    companyId,
    value,
    onChange,
    label = "Cuenta Contable",
    typeFilter,
    placeholder = "Seleccione una cuenta...",
    required = false,
    preloadedAccounts
}: AccountSelectorProps) {
    const [accounts, setAccounts] = useState<Account[]>([])
    const [loading, setLoading] = useState(false)
    const [query, setQuery] = useState('')
    const [open, setOpen] = useState(false)
    const [selectedAccount, setSelectedAccount] = useState<Account | null>(null)
    const [fetchError, setFetchError] = useState<string | null>(null)

    const wrapperRef = useRef<HTMLDivElement>(null)

    // Load Accounts
    useEffect(() => {
        if (preloadedAccounts) {
            let filtered = preloadedAccounts
            if (typeFilter) {
                // Approximate client-side filtering if needed, but usually preloaded implies pre-filtered
                filtered = preloadedAccounts.filter(a => !typeFilter || a.type === typeFilter)
            }
            setAccounts(filtered)
            return
        }

        // Auto-fetch if no preloaded accounts
        const fetchAccounts = async () => {
            setLoading(true)
            setFetchError(null)
            try {
                // If companyId is not provided, we might rely on session or default API behavior (usually returns all allowed)
                // However, API usually requires companyId or infers it.
                // Current usage in some places passes companyId, others might not.
                let url = '/api/accounting/accounts'
                if (companyId) url += `?companyId=${companyId}`

                const res = await fetch(url)
                if (!res.ok) throw new Error('Failed to load accounts')

                const data = await res.json()
                let filtered = Array.isArray(data) ? data : []

                if (typeFilter) {
                    filtered = filtered.filter((a: any) => a.type === typeFilter)
                }

                // Sort by code for better UX
                filtered.sort((a, b) => a.code.localeCompare(b.code))

                setAccounts(filtered)
            } catch (err) {
                console.error("Error fetching accounts:", err)
                setFetchError("Error cargando cuentas")
                setAccounts([])
            } finally {
                setLoading(false)
            }
        }

        fetchAccounts()
    }, [companyId, typeFilter, preloadedAccounts])

    // Sync external value
    useEffect(() => {
        if (value) {
            const found = accounts.find(a => a.id === value)
            if (found) {
                setSelectedAccount(found)
            } else {
                // If value exists but not in list (e.g. loading or pagination), we might want to keep it?
                // For now, if we have accounts and value is not found, it might be a hidden account or type mismatch.
                // We won't clear selectedAccount to avoid UI flicker if it was set manually.
            }
        } else {
            setSelectedAccount(null)
            setQuery('')
        }
    }, [value, accounts])

    // Close on click outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setOpen(false)
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => {
            document.removeEventListener("mousedown", handleClickOutside)
        }
    }, [])

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let val = e.target.value

        // Smart input: detect if typing code or name
        // If starts with digit, apply simple masking for convenience (optional)
        if (/^\d/.test(val) && val.length > query.length) {
            // Logic: 1101 -> 1.1.01 (Example) - Keeping it simple for now, standard text input
            // Explicit masking can be annoying if not perfect. Let's stick to raw input for flexibility.
        }

        setQuery(val)
        if (!open) setOpen(true)

        if (val === '') {
            // Optional: Clear selection on empty? Or just filter?
            // onChange('') 
            // Better: Don't clear value just by clearing filter query, user might be correcting search.
        }
    }

    const handleSelect = (account: Account) => {
        setSelectedAccount(account)
        onChange(account.id)
        setQuery('')
        setOpen(false)
    }

    // Filter logic
    const filteredAccounts = query === ''
        ? accounts
        : accounts.filter((account) =>
            account.code.toLowerCase().includes(query.toLowerCase()) ||
            account.name.toLowerCase().includes(query.toLowerCase())
        )

    return (
        <div className="relative space-y-1" ref={wrapperRef}>
            {label && (
                <label className="block text-xs font-semibold text-gray-600">
                    {label} {required && <span className="text-red-500">*</span>}
                </label>
            )}

            <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    {loading ? <Loader2 className="h-4 w-4 animate-spin text-gray-400" /> : <Search className="h-4 w-4 text-gray-400" />}
                </div>

                <input
                    type="text"
                    className="w-full border border-gray-300 rounded-md py-2 pl-9 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow bg-white"
                    placeholder={selectedAccount ? `${selectedAccount.code} - ${selectedAccount.name}` : placeholder}
                    value={open ? query : (selectedAccount ? `${selectedAccount.code} - ${selectedAccount.name}` : '')}
                    onChange={handleInputChange}
                    onClick={() => {
                        setOpen(!open)
                        // If clicking to open and we have a selection, maybe we want to clear query to show all options?
                        // Or keep distinct "search mode" vs "display mode".
                        if (!open) setQuery('')
                    }}
                    disabled={loading || !!fetchError}
                />

                <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none text-gray-400">
                    <ChevronsUpDown className="h-4 w-4" />
                </div>
            </div>

            {fetchError && <p className="text-xs text-red-500">{fetchError}</p>}

            {open && (
                <div className="absolute z-50 w-full mt-1 bg-white rounded-md shadow-lg border border-gray-200 max-h-60 overflow-y-auto">
                    <ul className="py-1 text-sm">
                        {!loading && filteredAccounts.length === 0 && (
                            <li className="px-3 py-2 text-gray-500 text-center italic">
                                No se encontraron cuentas
                            </li>
                        )}

                        {filteredAccounts.map((account) => (
                            <li
                                key={account.id}
                                className={`
                                    px-3 py-2 flex items-center justify-between
                                    transition-colors
                                    ${(account._count?.children || 0) > 0
                                        ? 'text-gray-400 cursor-not-allowed bg-gray-50'
                                        : 'cursor-pointer hover:bg-blue-50 text-gray-700'
                                    }
                                    ${selectedAccount?.id === account.id ? 'bg-blue-50 text-blue-700 font-medium' : ''}
                                `}
                                onClick={() => {
                                    if ((account._count?.children || 0) > 0) return
                                    handleSelect(account)
                                }}
                            >
                                <span className="truncate flex items-center">
                                    <span className="font-mono text-xs mr-2 opacity-75">{account.code}</span>
                                    {account.name}
                                    {(account._count?.children || 0) > 0 && (
                                        <span className="ml-2 text-[10px] bg-gray-200 text-gray-600 px-1 rounded">Grupo</span>
                                    )}
                                </span>
                                {selectedAccount?.id === account.id && (
                                    <Check className="h-4 w-4 text-blue-600 flex-shrink-0 ml-2" />
                                )}
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Helper Text / Selected Value Feedback (optional) */}
            {selectedAccount && !open && (
                <div className="text-[10px] text-gray-400 text-right px-1">
                    Saldo: {Number(selectedAccount.balance || 0).toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                </div>
            )}
        </div>
    )
}
