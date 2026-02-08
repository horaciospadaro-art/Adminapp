'use client'

import Link from 'next/link'
import { Pencil, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

interface BankAccount {
    id: string
    bank_name: string
    account_number: string
    currency: string
    balance: number | any
    type: string
}

export function BankCard({ bank }: { bank: BankAccount }) {
    const router = useRouter()
    const [deleting, setDeleting] = useState(false)

    const isPositive = Number(bank.balance) >= 0
    const formattedBalance = new Intl.NumberFormat('es-VE', {
        style: 'currency',
        currency: bank.currency
    }).format(Number(bank.balance))

    const handleDelete = async () => {
        if (!confirm('¿Estás seguro de eliminar esta cuenta bancaria? Esta acción no se puede deshacer.')) return

        setDeleting(true)
        try {
            const res = await fetch(`/api/banks/${bank.id}`, {
                method: 'DELETE'
            })

            if (res.ok) {
                router.refresh()
            } else {
                const data = await res.json()
                alert(data.error || 'Error al eliminar cuenta')
            }
        } catch (error) {
            console.error(error)
            alert('Error al procesar solicitud')
        } finally {
            setDeleting(false)
        }
    }

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow relative group">
            <div className={`h-2 w-full ${isPositive ? 'bg-[#2ca01c]' : 'bg-red-500'}`}></div>
            <div className="p-5">
                <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-lg text-[#393a3d] truncate" title={bank.bank_name}>
                        {bank.bank_name}
                    </h3>
                    <div className="flex gap-2">
                        <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded text-gray-600">
                            {bank.currency}
                        </span>
                        <Link
                            href={`/dashboard/banks/${bank.id}/edit`}
                            className="text-gray-400 hover:text-blue-600 transition-colors"
                            title="Editar"
                        >
                            <Pencil className="w-4 h-4" />
                        </Link>
                        <button
                            onClick={handleDelete}
                            disabled={deleting}
                            className="text-gray-400 hover:text-red-600 transition-colors disabled:opacity-50"
                            title="Eliminar"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                <p className="text-sm text-gray-500 mb-4">{bank.type} • {bank.account_number}</p>

                <div className="mb-4">
                    <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Saldo Disponible</p>
                    <p className={`text-2xl font-bold truncate ${isPositive ? 'text-[#393a3d]' : 'text-red-600'}`}>
                        {formattedBalance}
                    </p>
                </div>

                <div className="flex gap-2 mt-4">
                    <Link
                        href={`/dashboard/banks/${bank.id}`}
                        className="flex-1 text-center py-2 px-4 rounded-full bg-[#2ca01c] text-white font-medium text-sm hover:bg-[#248217] transition-colors"
                    >
                        Ver Movimientos
                    </Link>
                </div>
            </div>
        </div>
    )
}
