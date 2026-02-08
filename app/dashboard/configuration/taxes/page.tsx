'use client'

import { useState, useEffect } from 'react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Plus, Pencil, Trash2, Loader2, X } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface Tax {
    id: string
    name: string
    rate: string // Decimal comes as string from JSON usually
    type: string
    description?: string
    gl_account_id: string
    gl_account?: { id: string, code: string, name: string }
    is_active: boolean
}

interface Account {
    id: string
    code: string
    name: string
}

export default function TaxesPage() {
    const router = useRouter()
    const [taxes, setTaxes] = useState<Tax[]>([])
    const [loading, setLoading] = useState(true)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingTax, setEditingTax] = useState<Tax | null>(null)

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        rate: '',
        type: 'IVA',
        description: '',
        gl_account_id: ''
    })

    // Accounts for dropdown
    const [accounts, setAccounts] = useState<Account[]>([])

    useEffect(() => {
        fetchTaxes()
        fetchAccounts()
    }, [])

    async function fetchTaxes() {
        try {
            const res = await fetch('/api/configuration/taxes')
            if (res.ok) {
                const data = await res.json()
                setTaxes(data)
            }
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    async function fetchAccounts() {
        try {
            // Fetch LIABILITY or ASSET accounts ideally, but for now fetch all and filter client side or let user pick
            // Better to refine this endpoint filter later
            const res = await fetch('/api/accounting/accounts')
            if (res.ok) {
                const data = await res.json()
                setAccounts(data)
            }
        } catch (error) {
            console.error(error)
        }
    }

    function handleOpenModal(tax?: Tax) {
        if (tax) {
            setEditingTax(tax)
            setFormData({
                name: tax.name,
                rate: tax.rate.toString(),
                type: tax.type,
                description: tax.description || '',
                gl_account_id: tax.gl_account_id
            })
        } else {
            setEditingTax(null)
            setFormData({
                name: '',
                rate: '',
                type: 'IVA',
                description: '',
                gl_account_id: ''
            })
        }
        setIsModalOpen(true)
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setLoading(true)

        try {
            const url = editingTax
                ? `/api/configuration/taxes/${editingTax.id}`
                : '/api/configuration/taxes'

            const method = editingTax ? 'PUT' : 'POST'

            const res = await fetch(url, {
                method,
                body: JSON.stringify({
                    ...formData,
                    rate: parseFloat(formData.rate)
                }),
                headers: { 'Content-Type': 'application/json' }
            })

            if (res.ok) {
                setIsModalOpen(false)
                fetchTaxes()
                router.refresh()
            } else {
                alert('Error al guardar impuesto')
            }
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    async function handleDelete(id: string) {
        if (!confirm('¿Estás seguro de desactivar este impuesto?')) return

        try {
            const res = await fetch(`/api/configuration/taxes/${id}`, {
                method: 'DELETE'
            })
            if (res.ok) fetchTaxes()
        } catch (error) {
            console.error(error)
        }
    }

    return (
        <div className="max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <PageHeader title="Configuración de Impuestos" />
                <button
                    onClick={() => handleOpenModal()}
                    className="flex items-center gap-2 bg-[#2ca01c] text-white px-4 py-2 rounded-md hover:bg-[#248217]"
                >
                    <Plus className="w-4 h-4" /> Nuevo Impuesto
                </button>
            </div>

            {loading && taxes.length === 0 ? (
                <div className="flex justify-center p-12">
                    <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                </div>
            ) : (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-3 font-medium text-gray-700">Nombre</th>
                                <th className="px-6 py-3 font-medium text-gray-700">Tipo</th>
                                <th className="px-6 py-3 font-medium text-gray-700 text-right">Tasa (%)</th>
                                <th className="px-6 py-3 font-medium text-gray-700">Cuenta Contable</th>
                                <th className="px-6 py-3 font-medium text-gray-700 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {taxes.map(tax => (
                                <tr key={tax.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 font-medium text-gray-900">{tax.name}</td>
                                    <td className="px-6 py-4 text-gray-500">
                                        <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded-full text-xs font-mono">
                                            {tax.type}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-gray-900 text-right font-mono">{Number(tax.rate).toFixed(2)}%</td>
                                    <td className="px-6 py-4 text-gray-500">
                                        {tax.gl_account ? `${tax.gl_account.code} - ${tax.gl_account.name}` : '-'}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button
                                                onClick={() => handleOpenModal(tax)}
                                                className="text-gray-400 hover:text-blue-600"
                                            >
                                                <Pencil className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(tax.id)}
                                                className="text-gray-400 hover:text-red-600"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {taxes.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                                        No hay impuestos configurados.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex justify-center items-center p-4">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
                        <div className="flex justify-between items-center p-4 border-b">
                            <h3 className="font-bold text-lg">
                                {editingTax ? 'Editar Impuesto' : 'Nuevo Impuesto'}
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-4 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                                <input
                                    required
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="Ej. IVA General"
                                    className="w-full border rounded-md p-2 focus:ring-[#2ca01c] focus:border-[#2ca01c]"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Tasa (%)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        required
                                        value={formData.rate}
                                        onChange={e => setFormData({ ...formData, rate: e.target.value })}
                                        className="w-full border rounded-md p-2 focus:ring-[#2ca01c] focus:border-[#2ca01c]"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                                    <select
                                        value={formData.type}
                                        onChange={e => setFormData({ ...formData, type: e.target.value })}
                                        className="w-full border rounded-md p-2 focus:ring-[#2ca01c] focus:border-[#2ca01c]"
                                    >
                                        <option value="IVA">IVA</option>
                                        <option value="ISLR">ISLR</option>
                                        <option value="IGTF">IGTF</option>
                                        <option value="OTRO">Otro</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Cuenta Contable</label>
                                <select
                                    required
                                    value={formData.gl_account_id}
                                    onChange={e => setFormData({ ...formData, gl_account_id: e.target.value })}
                                    className="w-full border rounded-md p-2 focus:ring-[#2ca01c] focus:border-[#2ca01c]"
                                >
                                    <option value="">Seleccionar Cuenta...</option>
                                    {accounts.map(acc => (
                                        <option key={acc.id} value={acc.id}>
                                            {acc.code} - {acc.name}
                                        </option>
                                    ))}
                                </select>
                                <p className="text-xs text-gray-500 mt-1">Cuenta donde se registrará el pasivo/activo del impuesto.</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción (Opcional)</label>
                                <textarea
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full border rounded-md p-2 focus:ring-[#2ca01c] focus:border-[#2ca01c]"
                                    rows={2}
                                />
                            </div>

                            <div className="flex justify-end gap-2 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 border rounded-md text-gray-700 hover:bg-gray-50"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-[#2ca01c] text-white rounded-md hover:bg-[#248217]"
                                >
                                    Guardar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
