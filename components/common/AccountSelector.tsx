'use client'

import { useState, useEffect, useRef } from 'react'
import { Search, ChevronDown } from 'lucide-react'

interface ChartOfAccount {
    id: string
    code: string
    name: string
    type: string
    parent_id: string | null
}

interface AccountSelectorProps {
    value: string
    onChange: (accountId: string) => void
    placeholder?: string
    filter?: (account: ChartOfAccount) => boolean
    required?: boolean
    className?: string
}

export function AccountSelector({
    value,
    onChange,
    placeholder = "Buscar cuenta...",
    filter,
    required = false,
    className = ""
}: AccountSelectorProps) {
    const [accounts, setAccounts] = useState<ChartOfAccount[]>([])
    const [filteredAccounts, setFilteredAccounts] = useState<ChartOfAccount[]>([])
    const [search, setSearch] = useState('')
    const [isOpen, setIsOpen] = useState(false)
    const [selectedIndex, setSelectedIndex] = useState(-1)
    const [loading, setLoading] = useState(true)

    const dropdownRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)
    const listRef = useRef<HTMLDivElement>(null)

    // Fetch accounts on mount
    useEffect(() => {
        async function fetchAccounts() {
            try {
                const res = await fetch('/api/accounting/chart-of-accounts')
                if (res.ok) {
                    const data = await res.json()
                    const allAccounts = filter ? data.filter(filter) : data
                    setAccounts(allAccounts)
                    setFilteredAccounts(allAccounts)
                }
            } catch (error) {
                console.error('Error fetching accounts:', error)
            } finally {
                setLoading(false)
            }
        }
        fetchAccounts()
    }, [filter])

    // Filter accounts based on search
    useEffect(() => {
        if (!search) {
            setFilteredAccounts(accounts)
            setSelectedIndex(-1)
            return
        }

        const searchLower = search.toLowerCase()
        const filtered = accounts.filter(acc =>
            acc.code.toLowerCase().includes(searchLower) ||
            acc.name.toLowerCase().includes(searchLower)
        )
        setFilteredAccounts(filtered)
        setSelectedIndex(-1)
    }, [search, accounts])

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside)
            return () => document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [isOpen])

    // Scroll selected item into view
    useEffect(() => {
        if (selectedIndex >= 0 && listRef.current) {
            const selectedElement = listRef.current.children[selectedIndex] as HTMLElement
            if (selectedElement) {
                selectedElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
            }
        }
    }, [selectedIndex])

    // Keyboard navigation
    function handleKeyDown(e: React.KeyboardEvent) {
        if (!isOpen) {
            if (e.key === 'Enter' || e.key === 'ArrowDown') {
                e.preventDefault()
                setIsOpen(true)
            }
            return
        }

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault()
                setSelectedIndex(prev =>
                    prev < filteredAccounts.length - 1 ? prev + 1 : prev
                )
                break
            case 'ArrowUp':
                e.preventDefault()
                setSelectedIndex(prev => prev > 0 ? prev - 1 : 0)
                break
            case 'Enter':
                e.preventDefault()
                if (selectedIndex >= 0 && filteredAccounts[selectedIndex]) {
                    selectAccount(filteredAccounts[selectedIndex])
                }
                break
            case 'Escape':
                e.preventDefault()
                setIsOpen(false)
                setSearch('')
                break
        }
    }

    function selectAccount(account: ChartOfAccount) {
        onChange(account.id)
        setSearch('')
        setIsOpen(false)
        setSelectedIndex(-1)
    }

    // Get selected account display
    const selectedAccount = accounts.find(acc => acc.id === value)
    const displayValue = selectedAccount
        ? `${selectedAccount.code} - ${selectedAccount.name}`
        : ''

    return (
        <div ref={dropdownRef} className={`relative ${className}`}>
            <div className="relative">
                <input
                    ref={inputRef}
                    type="text"
                    value={isOpen ? search : displayValue}
                    onChange={e => setSearch(e.target.value)}
                    onFocus={() => setIsOpen(true)}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    required={required}
                    className="w-full p-2 pr-8 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
                    {loading ? (
                        <div className="animate-spin h-4 w-4 border-2 border-gray-300 border-t-blue-600 rounded-full" />
                    ) : (
                        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                    )}
                </div>
            </div>

            {isOpen && !loading && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-64 overflow-hidden">
                    <div ref={listRef} className="overflow-y-auto max-h-64">
                        {filteredAccounts.length === 0 ? (
                            <div className="p-3 text-center text-gray-500 text-sm">
                                No se encontraron cuentas
                            </div>
                        ) : (
                            filteredAccounts.map((account, index) => (
                                <div
                                    key={account.id}
                                    onClick={() => selectAccount(account)}
                                    className={`
                                        px-3 py-2 cursor-pointer transition-colors
                                        ${index === selectedIndex ? 'bg-blue-100' : 'hover:bg-gray-100'}
                                        ${account.id === value ? 'bg-blue-50 font-medium' : ''}
                                    `}
                                >
                                    <div className="flex items-center gap-2">
                                        <span className="font-mono text-xs text-gray-600 min-w-[100px]">
                                            {account.code}
                                        </span>
                                        <span className="text-sm text-gray-800 flex-1">
                                            {account.name}
                                        </span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
