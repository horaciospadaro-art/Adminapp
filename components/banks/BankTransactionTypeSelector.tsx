'use client'

import { useState } from 'react'
import {
    ArrowDownCircle,
    ArrowUpCircle,
    ArrowLeftRight,
    FileText,
    PlusCircle,
    MinusCircle
} from 'lucide-react'

export type TransactionSubtype =
    | 'DEPOSIT'
    | 'WITHDRAWAL'
    | 'TRANSFER_OUT'
    | 'DEBIT_NOTE'
    | 'CREDIT_NOTE'
    | 'OTHER'

type TransactionOption = {
    value: TransactionSubtype
    label: string
    icon: React.ReactNode
    description: string
    color: string
}

const transactionOptions: TransactionOption[] = [
    {
        value: 'DEPOSIT',
        label: 'Depósito',
        icon: <ArrowDownCircle className="w-5 h-5" />,
        description: 'Ingreso de dinero a la cuenta',
        color: 'text-green-600 bg-green-50 border-green-200'
    },
    {
        value: 'WITHDRAWAL',
        label: 'Retiro',
        icon: <ArrowUpCircle className="w-5 h-5" />,
        description: 'Salida de dinero de la cuenta',
        color: 'text-red-600 bg-red-50 border-red-200'
    },
    {
        value: 'TRANSFER_OUT',
        label: 'Transferencia',
        icon: <ArrowLeftRight className="w-5 h-5" />,
        description: 'Transferir entre cuentas bancarias',
        color: 'text-blue-600 bg-blue-50 border-blue-200'
    },
    {
        value: 'DEBIT_NOTE',
        label: 'Nota de Débito',
        icon: <PlusCircle className="w-5 h-5" />,
        description: 'Cargo bancario o ajuste positivo',
        color: 'text-purple-600 bg-purple-50 border-purple-200'
    },
    {
        value: 'CREDIT_NOTE',
        label: 'Nota de Crédito',
        icon: <MinusCircle className="w-5 h-5" />,
        description: 'Abono bancario o ajuste negativo',
        color: 'text-orange-600 bg-orange-50 border-orange-200'
    }
]

type BankTransactionTypeSelectorProps = {
    value: TransactionSubtype
    onChange: (value: TransactionSubtype) => void
}

export function BankTransactionTypeSelector({ value, onChange }: BankTransactionTypeSelectorProps) {
    return (
        <div className="space-y-3">
            <label className="block text-xs font-semibold text-gray-700">
                Tipo de Movimiento <span className="text-red-500">*</span>
            </label>

            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                {transactionOptions.map((option) => {
                    const isSelected = value === option.value
                    return (
                        <button
                            key={option.value}
                            type="button"
                            onClick={() => onChange(option.value)}
                            className={`
                                p-3 rounded-lg border-2 transition-all
                                ${isSelected
                                    ? `${option.color} border-current shadow-md scale-105`
                                    : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300 hover:shadow-sm'
                                }
                            `}
                        >
                            <div className="flex flex-col items-center gap-2">
                                <div className={isSelected ? '' : 'opacity-60'}>
                                    {option.icon}
                                </div>
                                <div className="text-sm font-semibold">
                                    {option.label}
                                </div>
                                <div className="text-xs opacity-75 text-center">
                                    {option.description}
                                </div>
                            </div>
                        </button>
                    )
                })}
            </div>
        </div>
    )
}
