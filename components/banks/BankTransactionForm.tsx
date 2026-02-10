
'use client'

import { useState } from 'react'
import { BankAccount } from './types'
import { IngresosForm } from './tabs/IngresosForm'
import { EgresosForm } from './tabs/EgresosForm'
import { TransferenciasForm } from './tabs/TransferenciasForm'
import { NotasForm } from './tabs/NotasForm'

type BankTransactionFormProps = {
    bankAccount: BankAccount
}

type Tab = 'INGRESOS' | 'EGRESOS' | 'TRANSFERENCIAS' | 'NOTAS'

export function BankTransactionForm({ bankAccount }: BankTransactionFormProps) {
    const [activeTab, setActiveTab] = useState<Tab>('INGRESOS')

    return (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b bg-white">
                <div>
                    <h3 className="font-bold text-lg text-gray-800">Registrar Nuevo Movimiento</h3>
                    <div className="text-sm text-gray-600 mt-1">
                        <span className="font-semibold">{bankAccount.bank_name}</span>
                        <span className="mx-2">•</span>
                        <span>{bankAccount.account_number}</span>
                        <span className="mx-2">•</span>
                        <span className="font-semibold">{bankAccount.currency}</span>
                    </div>
                </div>
                <div className="text-right">
                    <span className="text-xs text-gray-500 uppercase tracking-wider">Saldo Disponible</span>
                    <div className={`text-xl font-bold ${bankAccount.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {bankAccount.currency} {bankAccount.balance.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b text-center">
                <TabButton
                    active={activeTab === 'INGRESOS'}
                    onClick={() => setActiveTab('INGRESOS')}
                    label="Ingresos"
                    activeClass="text-green-600 border-green-600 bg-green-50"
                />
                <TabButton
                    active={activeTab === 'EGRESOS'}
                    onClick={() => setActiveTab('EGRESOS')}
                    label="Egresos"
                    activeClass="text-red-600 border-red-600 bg-red-50"
                />
                <TabButton
                    active={activeTab === 'TRANSFERENCIAS'}
                    onClick={() => setActiveTab('TRANSFERENCIAS')}
                    label="Transferencias"
                    activeClass="text-blue-600 border-blue-600 bg-blue-50"
                />
                <TabButton
                    active={activeTab === 'NOTAS'}
                    onClick={() => setActiveTab('NOTAS')}
                    label="Notas DC/CC"
                    activeClass="text-purple-600 border-purple-600 bg-purple-50"
                />
            </div>

            <div className="p-6 bg-gray-50/50">
                {activeTab === 'INGRESOS' && <IngresosForm bankAccount={bankAccount} />}
                {activeTab === 'EGRESOS' && <EgresosForm bankAccount={bankAccount} />}
                {activeTab === 'TRANSFERENCIAS' && <TransferenciasForm bankAccount={bankAccount} />}
                {activeTab === 'NOTAS' && <NotasForm bankAccount={bankAccount} />}
            </div>
        </div>
    )
}

function TabButton({ active, onClick, label, activeClass }: { active: boolean, onClick: () => void, label: string, activeClass: string }) {
    return (
        <button
            onClick={onClick}
            className={`flex-1 py-3 text-sm font-semibold border-b-2 transition-all ${active
                    ? activeClass
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
        >
            {label}
        </button>
    )
}
