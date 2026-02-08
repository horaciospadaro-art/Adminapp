'use client'

import { useState, useEffect, useRef } from 'react'
import { Check, ChevronsUpDown } from 'lucide-react'
import { AccountService } from '@/lib/services/account-service'

export interface Account {
    id: string
    code: string
    name: string
    type: string
}

interface AccountComboboxProps {
    companyId: string
    value?: string
    onChange: (accountId: string) => void
    label?: string
    typeFilter?: string
    placeholder?: string
    preloadedAccounts?: Account[]
}

export function AccountCombobox({
    companyId,
    value,
    onChange,
    label,
    typeFilter,
    placeholder = "Seleccione una cuenta...",
    preloadedAccounts
}: AccountComboboxProps) {
    const [accounts, setAccounts] = useState<Account[]>([])
    const [loading, setLoading] = useState(false)
    const [query, setQuery] = useState('')
    const [open, setOpen] = useState(false)
    const [selectedAccount, setSelectedAccount] = useState<Account | null>(null)

    const wrapperRef = useRef<HTMLDivElement>(null)

    // Cargar cuentas
    useEffect(() => {
        if (preloadedAccounts) {
            let filtered = preloadedAccounts
            if (typeFilter) {
                filtered = preloadedAccounts.filter(a => a.type === typeFilter)
            }
            setAccounts(filtered)
            return
        }

        if (!companyId) return

        setLoading(true)
        fetch(`/api/accounting/accounts?companyId=${companyId}`)
            .then(res => res.json())
            .then(data => {
                let filtered = data
                if (typeFilter && Array.isArray(data)) {
                    filtered = data.filter((a: any) => a.type === typeFilter)
                }
                setAccounts(Array.isArray(filtered) ? filtered : [])
                setLoading(false)
            })
            .catch(err => {
                console.error(err)
                setAccounts([])
                setLoading(false)
            })
    }, [companyId, typeFilter, preloadedAccounts])

    // Sincronizar valor externo
    useEffect(() => {
        if (value && accounts.length > 0) {
            const found = accounts.find(a => a.id === value)
            if (found) {
                setSelectedAccount(found)
                // No sobreescribimos query si está abierto para no molestar,
                // pero si cambia externamente el value, quizás sí deberíamos.
                // Por simplicidad, solo actualizamos el selectedAccount.
            }
        } else if (!value) {
            setSelectedAccount(null)
        }
    }, [value, accounts])

    // Manejo de clicks fuera para cerrar
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
    }, [wrapperRef])

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let val = e.target.value

        // Estrategia híbrida:
        // Si el valor comienza con un número, asumimos que está escribiendo un código y aplicamos máscara.
        // Si comienza con letra, asumimos búsqueda por nombre y dejamos texto libre.
        if (/^\d/.test(val)) {
            // Inline mask logic to ensure consistency
            const digits = val.replace(/\D/g, '')
            const limited = digits.slice(0, 9)
            let masked = ''
            if (limited.length > 0) masked += limited.substring(0, 1)
            if (limited.length > 1) masked += '.' + limited.substring(1, 2)
            if (limited.length > 2) masked += '.' + limited.substring(2, 4)
            if (limited.length > 4) masked += '.' + limited.substring(4, 9)
            val = masked
        }

        setQuery(val)
        setOpen(true)

        // Si borra todo, reseteamos selección?
        if (val === '') {
            onChange('')
            setSelectedAccount(null)
        }
    }

    const filteredAccounts = query === ''
        ? accounts
        : accounts.filter((account) =>
            account.code.toLowerCase().includes(query.toLowerCase()) ||
            account.name.toLowerCase().includes(query.toLowerCase())
        )

    const handleSelect = (account: Account) => {
        setSelectedAccount(account)
        onChange(account.id)
        setQuery('')
        setOpen(false)
    }

    return (
        <div className="relative" ref={wrapperRef}>
            {label && <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>}

            <div className="relative">
                <input
                    type="text"
                    className="w-full border border-gray-300 rounded px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    placeholder={selectedAccount ? `${selectedAccount.code} - ${selectedAccount.name}` : placeholder}
                    value={open ? query : (selectedAccount ? `${selectedAccount.code} - ${selectedAccount.name}` : '')}
                    onChange={handleInputChange}
                    onClick={() => setOpen(!open)}
                    maxLength={100} // Allow search by name but limit excessively long inputs
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none text-gray-400">
                    <ChevronsUpDown className="h-4 w-4" />
                </div>
            </div>

            {open && (
                <ul className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto focus:outline-none py-1 text-sm">
                    {loading && <li className="px-3 py-2 text-gray-500">Cargando...</li>}

                    {!loading && filteredAccounts.length === 0 && (
                        <li className="px-3 py-2 text-gray-500">No se encontraron cuentas.</li>
                    )}

                    {!loading && filteredAccounts.map((account) => (
                        <li
                            key={account.id}
                            className={`cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-blue-50 ${selectedAccount?.id === account.id ? 'bg-blue-100 text-blue-900' : 'text-gray-900'}`}
                            onClick={() => handleSelect(account)}
                        >
                            <span className="block truncate font-medium">
                                {account.code} - {account.name}
                            </span>
                            {selectedAccount?.id === account.id && (
                                <span className="absolute inset-y-0 right-0 flex items-center pr-4 text-blue-600">
                                    <Check className="h-4 w-4" />
                                </span>
                            )}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    )
}
