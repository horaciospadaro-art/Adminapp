'use client'

import { useState, useEffect } from 'react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Plus, Pencil, Trash2, Loader2, X } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface Tax {
    id: string
    name: string
    rate: string
    type: string
    description?: string
    gl_account_id: string
    gl_account?: { id: string, code: string, name: string }
    is_active: boolean
}

interface ISLRConcept {
    id: string
    seniat_code?: string
    description: string
    rate: string
    base_percentage: string
}

interface Account {
    id: string
    code: string
    name: string
}

export default function TaxesPage() {
    const router = useRouter()

    // Data State
    const [taxes, setTaxes] = useState<Tax[]>([])
    const [islrConcepts, setIslrConcepts] = useState<ISLRConcept[]>([])
    const [accounts, setAccounts] = useState<Account[]>([])

    // UI State
    const [loading, setLoading] = useState(true)
    const [isTaxModalOpen, setIsTaxModalOpen] = useState(false)
    const [isIslrModalOpen, setIsIslrModalOpen] = useState(false)
    const [editingTax, setEditingTax] = useState<Tax | null>(null)
    const [editingIslr, setEditingIslr] = useState<ISLRConcept | null>(null)

    // Forms State
    const [taxForm, setTaxForm] = useState({
        name: '',
        rate: '',
        type: 'IVA',
        description: '',
        gl_account_id: ''
    })

    const [islrForm, setIslrForm] = useState({
        seniat_code: '',
        description: '',
        rate: '',
        base_percentage: '100'
    })

    useEffect(() => {
        Promise.all([fetchTaxes(), fetchIslrConcepts(), fetchAccounts()])
            .finally(() => setLoading(false))
    }, [])

    async function fetchTaxes() {
        try {
            const res = await fetch('/api/configuration/taxes')
            if (res.ok) setTaxes(await res.json())
        } catch (error) { console.error(error) }
    }

    async function fetchIslrConcepts() {
        try {
            const res = await fetch('/api/configuration/islr-concepts')
            if (res.ok) setIslrConcepts(await res.json())
        } catch (error) { console.error(error) }
    }

    async function fetchAccounts() {
        try {
            const res = await fetch('/api/accounting/accounts')
            if (res.ok) setAccounts(await res.json())
        } catch (error) { console.error(error) }
    }

    // --- TAX HANDLERS ---
    function openTaxModal(tax?: Tax) {
        if (tax) {
            setEditingTax(tax)
            setTaxForm({
                name: tax.name,
                rate: tax.rate.toString(),
                type: tax.type,
                description: tax.description || '',
                gl_account_id: tax.gl_account_id
            })
        } else {
            setEditingTax(null)
            setTaxForm({ name: '', rate: '', type: 'IVA', description: '', gl_account_id: '' })
        }
        setIsTaxModalOpen(true)
    }

    async function handleTaxSubmit(e: React.FormEvent) {
        e.preventDefault()
        setLoading(true)
        try {
            const url = editingTax ? `/api/configuration/taxes/${editingTax.id}` : '/api/configuration/taxes'
            const method = editingTax ? 'PUT' : 'POST'
            const res = await fetch(url, {
                method,
                body: JSON.stringify({ ...taxForm, rate: parseFloat(taxForm.rate) }),
                headers: { 'Content-Type': 'application/json' }
            })
            if (res.ok) {
                setIsTaxModalOpen(false)
                fetchTaxes()
                router.refresh()
            }
        } catch (error) { console.error(error) }
        setLoading(false)
    }

    async function deleteTax(id: string) {
        if (!confirm('¿Estás seguro de eliminar este impuesto?')) return
        try {
            await fetch(`/api/configuration/taxes/${id}`, { method: 'DELETE' })
            fetchTaxes()
        } catch (error) { console.error(error) }
    }

    // --- ISLR HANDLERS ---
    function openIslrModal(concept?: ISLRConcept) {
        if (concept) {
            setEditingIslr(concept)
            setIslrForm({
                seniat_code: concept.seniat_code || '',
                description: concept.description,
                rate: concept.rate.toString(),
                base_percentage: concept.base_percentage.toString()
            })
        } else {
            setEditingIslr(null)
            setIslrForm({ seniat_code: '', description: '', rate: '', base_percentage: '100' })
        }
        setIsIslrModalOpen(true)
    }

    async function handleIslrSubmit(e: React.FormEvent) {
        e.preventDefault()
        setLoading(true)
        try {
            const url = editingIslr ? `/api/configuration/islr-concepts/${editingIslr.id}` : '/api/configuration/islr-concepts'
            const method = editingIslr ? 'PUT' : 'POST'
            const res = await fetch(url, {
                method,
                body: JSON.stringify({
                    ...islrForm,
                    rate: parseFloat(islrForm.rate),
                    base_percentage: parseFloat(islrForm.base_percentage)
                }),
                headers: { 'Content-Type': 'application/json' }
            })
            if (res.ok) {
                setIsIslrModalOpen(false)
                fetchIslrConcepts()
                router.refresh()
            }
        } catch (error) { console.error(error) }
        setLoading(false)
    }

    async function deleteIslr(id: string) {
        if (!confirm('¿Estás seguro de eliminar este concepto?')) return
        try {
            await fetch(`/api/configuration/islr-concepts/${id}`, { method: 'DELETE' })
            fetchIslrConcepts()
        } catch (error) { console.error(error) }
    }

    // --- RENDER HELPERS ---
    const renderTaxTable = (title: string, data: Tax[], emptyMsg: string) => (
        <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-700 mb-3">{title}</h3>
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
                        {data.map(tax => (
                            <tr key={tax.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 font-medium text-gray-900">{tax.name}</td>
                                <td className="px-6 py-4 text-gray-500">
                                    <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded-full text-xs font-mono">{tax.type}</span>
                                </td>
                                <td className="px-6 py-4 text-gray-900 text-right font-mono">{Number(tax.rate).toFixed(2)}%</td>
                                <td className="px-6 py-4 text-gray-500">
                                    {tax.gl_account ? `${tax.gl_account.code} - ${tax.gl_account.name}` : '-'}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex justify-end gap-2">
                                        <button onClick={() => openTaxModal(tax)} className="text-gray-400 hover:text-blue-600"><Pencil className="w-4 h-4" /></button>
                                        <button onClick={() => deleteTax(tax.id)} className="text-gray-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {data.length === 0 && <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-500">{emptyMsg}</td></tr>}
                    </tbody>
                </table>
            </div>
        </div>
    )

    return (
        <div className="max-w-6xl mx-auto pb-20">
            <div className="flex justify-between items-center mb-6">
                <PageHeader title="Configuración de Impuestos" />
                <div className="flex gap-2">
                    <button onClick={() => openIslrModal()} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm">
                        <Plus className="w-4 h-4" /> Nuevo Concepto ISLR
                    </button>
                    <button onClick={() => openTaxModal()} className="flex items-center gap-2 bg-[#2ca01c] text-white px-4 py-2 rounded-md hover:bg-[#248217] text-sm">
                        <Plus className="w-4 h-4" /> Nuevo Impuesto
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-gray-400" /></div>
            ) : (
                <>
                    {/* Tax Tables */}
                    {renderTaxTable('Impuesto al Valor Agregado (IVA)', taxes.filter(t => t.type === 'IVA'), 'No hay impuestos de IVA configurados.')}
                    {renderTaxTable('Impuesto a Grandes Transacciones Financieras (IGTF)', taxes.filter(t => t.type === 'IGTF'), 'No hay impuestos IGTF configurados.')}

                    {/* ISLR Concepts Table */}
                    <div className="mb-8">
                        <h3 className="text-lg font-semibold text-gray-700 mb-3">Conceptos de Retención ISLR</h3>
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="px-6 py-3 font-medium text-gray-700 w-24">Cód.</th>
                                        <th className="px-6 py-3 font-medium text-gray-700">Descripción</th>
                                        <th className="px-6 py-3 font-medium text-gray-700 text-right w-32">% Base</th>
                                        <th className="px-6 py-3 font-medium text-gray-700 text-right w-32">% Retención</th>
                                        <th className="px-6 py-3 font-medium text-gray-700 text-right w-24">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {islrConcepts.map(item => (
                                        <tr key={item.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 font-mono text-gray-600">{item.seniat_code || '-'}</td>
                                            <td className="px-6 py-4 text-gray-900">{item.description}</td>
                                            <td className="px-6 py-4 text-gray-900 text-right font-mono">{Number(item.base_percentage).toFixed(2)}%</td>
                                            <td className="px-6 py-4 text-gray-900 text-right font-mono font-bold">{Number(item.rate).toFixed(2)}%</td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <button onClick={() => openIslrModal(item)} className="text-gray-400 hover:text-blue-600"><Pencil className="w-4 h-4" /></button>
                                                    <button onClick={() => deleteIslr(item.id)} className="text-gray-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {islrConcepts.length === 0 && <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-500">No hay conceptos de retención ISLR configurados.</td></tr>}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}

            {/* Tax Modal */}
            {isTaxModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex justify-center items-center p-4">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
                        <div className="flex justify-between items-center p-4 border-b">
                            <h3 className="font-bold text-lg">{editingTax ? 'Editar Impuesto' : 'Nuevo Impuesto'}</h3>
                            <button onClick={() => setIsTaxModalOpen(false)}><X className="w-5 h-5 text-gray-400" /></button>
                        </div>
                        <form onSubmit={handleTaxSubmit} className="p-4 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                                <input required value={taxForm.name} onChange={e => setTaxForm({ ...taxForm, name: e.target.value })} className="w-full border rounded p-2" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Tasa (%)</label>
                                    <input type="number" step="0.01" required value={taxForm.rate} onChange={e => setTaxForm({ ...taxForm, rate: e.target.value })} className="w-full border rounded p-2" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                                    <select value={taxForm.type} onChange={e => setTaxForm({ ...taxForm, type: e.target.value })} className="w-full border rounded p-2">
                                        <option value="IVA">IVA</option>
                                        <option value="IGTF">IGTF</option>
                                        <option value="OTRO">Otro</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Cuenta Contable</label>
                                <select required value={taxForm.gl_account_id} onChange={e => setTaxForm({ ...taxForm, gl_account_id: e.target.value })} className="w-full border rounded p-2">
                                    <option value="">Seleccionar...</option>
                                    {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.code} - {acc.name}</option>)}
                                </select>
                            </div>
                            <div className="flex justify-end gap-2 pt-4">
                                <button type="button" onClick={() => setIsTaxModalOpen(false)} className="px-4 py-2 border rounded">Cancelar</button>
                                <button type="submit" className="px-4 py-2 bg-[#2ca01c] text-white rounded">Guardar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ISLR Modal */}
            {isIslrModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex justify-center items-center p-4">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
                        <div className="flex justify-between items-center p-4 border-b">
                            <h3 className="font-bold text-lg">{editingIslr ? 'Editar Concepto ISLR' : 'Nuevo Concepto ISLR'}</h3>
                            <button onClick={() => setIsIslrModalOpen(false)}><X className="w-5 h-5 text-gray-400" /></button>
                        </div>
                        <form onSubmit={handleIslrSubmit} className="p-4 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Código SENIAT</label>
                                <input value={islrForm.seniat_code} onChange={e => setIslrForm({ ...islrForm, seniat_code: e.target.value })} className="w-full border rounded p-2 font-mono" placeholder="Ej. 001" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                                <textarea required value={islrForm.description} onChange={e => setIslrForm({ ...islrForm, description: e.target.value })} className="w-full border rounded p-2" rows={2} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">% Base Imponible</label>
                                    <input type="number" step="0.01" required value={islrForm.base_percentage} onChange={e => setIslrForm({ ...islrForm, base_percentage: e.target.value })} className="w-full border rounded p-2" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">% Retención</label>
                                    <input type="number" step="0.01" required value={islrForm.rate} onChange={e => setIslrForm({ ...islrForm, rate: e.target.value })} className="w-full border rounded p-2" />
                                </div>
                            </div>
                            <div className="flex justify-end gap-2 pt-4">
                                <button type="button" onClick={() => setIsIslrModalOpen(false)} className="px-4 py-2 border rounded">Cancelar</button>
                                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Guardar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
