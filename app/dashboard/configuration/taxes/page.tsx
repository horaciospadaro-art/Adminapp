'use client'

import { useState, useEffect } from 'react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Plus, Pencil, Trash2, Loader2, X, Save } from 'lucide-react'
import { useRouter } from 'next/navigation'

// --- INTERFACES ---
interface Tax {
    id: string
    name: string
    rate: string
    type: string
    description?: string
    gl_account_id?: string
    gl_account?: { id: string, code: string, name: string }
    debito_fiscal_account_id?: string
    debito_fiscal_account?: { id: string, code: string, name: string }
    credito_fiscal_account_id?: string
    credito_fiscal_account?: { id: string, code: string, name: string }
    is_active: boolean
}

interface ISLRConcept {
    id: string
    seniat_code?: string
    description: string
    pn_resident_rate?: string
    pj_domiciled_rate?: string
    pn_non_resident_rate?: string
    pj_non_domiciled_rate?: string
}

interface VATRetention {
    id: string
    seniat_code?: string
    description: string
    rate: string
    active: boolean
}

interface GlobalTaxConfiguration {
    id: string
    company_id: string
    iva_fiscal_debit_account_id?: string
    iva_fiscal_credit_account_id?: string
    iva_retention_account_id?: string
    islr_retention_account_id?: string
    igtf_account_id?: string
}

interface Account {
    id: string
    code: string
    name: string
}

export default function TaxesPage() {
    const router = useRouter()

    // --- STATE ---
    const [taxes, setTaxes] = useState<Tax[]>([])
    const [islrConcepts, setIslrConcepts] = useState<ISLRConcept[]>([])
    const [vatRetentions, setVatRetentions] = useState<VATRetention[]>([])
    const [globalConfig, setGlobalConfig] = useState<GlobalTaxConfiguration | null>(null)
    const [accounts, setAccounts] = useState<Account[]>([])

    const [loading, setLoading] = useState(true)
    const [savingGlobal, setSavingGlobal] = useState(false)

    // Modals
    const [isTaxModalOpen, setIsTaxModalOpen] = useState(false)
    const [isIslrModalOpen, setIsIslrModalOpen] = useState(false)
    const [isVatRetModalOpen, setIsVatRetModalOpen] = useState(false)

    // Editing State
    const [editingTax, setEditingTax] = useState<Tax | null>(null)
    const [editingIslr, setEditingIslr] = useState<ISLRConcept | null>(null)
    const [editingVatRet, setEditingVatRet] = useState<VATRetention | null>(null)

    // Forms
    const [taxForm, setTaxForm] = useState({
        name: '',
        rate: '',
        type: 'OTRO',
        description: '',
        gl_account_id: '',
        debito_fiscal_account_id: '',
        credito_fiscal_account_id: ''
    })
    const [islrForm, setIslrForm] = useState({ seniat_code: '', description: '', pn_resident_rate: '', pj_domiciled_rate: '', pn_non_resident_rate: '', pj_non_domiciled_rate: '' })
    const [vatRetForm, setVatRetForm] = useState({ description: '', rate: '', active: true })
    const [globalForm, setGlobalForm] = useState<GlobalTaxConfiguration>({ id: '', company_id: '' })

    const toArray = (x: unknown): unknown[] => (Array.isArray(x) ? x : [])

    // --- FETCH DATA ---
    useEffect(() => {
        Promise.all([
            fetch('/api/configuration/taxes').then(r => r.json()),
            fetch('/api/configuration/islr-concepts').then(r => r.json()),
            fetch('/api/configuration/vat-retentions').then(r => r.json()),
            fetch('/api/configuration/tax-globals').then(r => r.json()),
            fetch('/api/accounting/accounts').then(r => r.json())
        ]).then(([taxesData, islrData, vatRetData, globalData, accountsData]) => {
            setTaxes(toArray(taxesData) as Tax[])
            setIslrConcepts(toArray(islrData) as ISLRConcept[])
            setVatRetentions(toArray(vatRetData) as VATRetention[])
            setGlobalConfig(globalData && typeof globalData === 'object' && !Array.isArray(globalData) ? globalData as GlobalTaxConfiguration : null)
            setGlobalForm(globalData && typeof globalData === 'object' && !Array.isArray(globalData) ? globalData as GlobalTaxConfiguration : { id: '', company_id: '' })
            setAccounts(toArray(accountsData) as Account[])
        }).catch(err => console.error(err))
            .finally(() => setLoading(false))
    }, [])

    const refreshData = () => {
        Promise.all([
            fetch('/api/configuration/taxes').then(r => r.json()),
            fetch('/api/configuration/islr-concepts').then(r => r.json()),
            fetch('/api/configuration/vat-retentions').then(r => r.json())
        ]).then(([taxesData, islrData, vatRetData]) => {
            setTaxes(toArray(taxesData) as Tax[])
            setIslrConcepts(toArray(islrData) as ISLRConcept[])
            setVatRetentions(toArray(vatRetData) as VATRetention[])
        })
    }

    // --- HANDLERS ---

    // Global Config
    async function handleGlobalSubmit(e: React.FormEvent) {
        e.preventDefault()
        setSavingGlobal(true)
        try {
            const res = await fetch('/api/configuration/tax-globals', {
                method: 'POST',
                body: JSON.stringify(globalForm),
                headers: { 'Content-Type': 'application/json' }
            })
            if (res.ok) {
                setGlobalConfig(await res.json())
                alert('Configuración guardada exitosamente')
            }
        } catch (error) { console.error(error) }
        setSavingGlobal(false)
    }

    // VAT Retention
    function openVatRetModal(ret?: VATRetention) {
        if (ret) {
            setEditingVatRet(ret)
            setVatRetForm({ description: ret.description, rate: ret.rate.toString(), active: ret.active })
        } else {
            setEditingVatRet(null)
            setVatRetForm({ description: '', rate: '', active: true })
        }
        setIsVatRetModalOpen(true)
    }

    async function handleVatRetSubmit(e: React.FormEvent) {
        e.preventDefault()
        try {
            const url = editingVatRet ? `/api/configuration/vat-retentions/${editingVatRet.id}` : '/api/configuration/vat-retentions'
            const method = editingVatRet ? 'PUT' : 'POST'
            const res = await fetch(url, {
                method,
                body: JSON.stringify({ ...vatRetForm, rate: parseFloat(vatRetForm.rate) }),
                headers: { 'Content-Type': 'application/json' }
            })
            if (res.ok) {
                setIsVatRetModalOpen(false)
                refreshData()
            }
        } catch (error) { console.error(error) }
    }

    async function deleteVatRet(id: string) {
        if (!confirm('¿Eliminar esta retención?')) return
        await fetch(`/api/configuration/vat-retentions/${id}`, { method: 'DELETE' })
        refreshData()
    }

    // Tax
    function openTaxModal(tax?: Tax) {
        if (tax) {
            setEditingTax(tax)
            setTaxForm({
                name: tax.name,
                rate: tax.rate.toString(),
                type: tax.type,
                description: tax.description || '',
                gl_account_id: tax.gl_account_id || '',
                debito_fiscal_account_id: tax.debito_fiscal_account_id || '',
                credito_fiscal_account_id: tax.credito_fiscal_account_id || ''
            })
        } else {
            setEditingTax(null)
            setTaxForm({ name: '', rate: '', type: 'OTRO', description: '', gl_account_id: '', debito_fiscal_account_id: '', credito_fiscal_account_id: '' })
        }
        setIsTaxModalOpen(true)
    }

    async function handleTaxSubmit(e: React.FormEvent) {
        e.preventDefault()
        try {
            const url = editingTax ? `/api/configuration/taxes/${editingTax.id}` : '/api/configuration/taxes'
            const method = editingTax ? 'PUT' : 'POST'
            const body: Record<string, unknown> = {
                ...taxForm,
                rate: parseFloat(taxForm.rate),
                debito_fiscal_account_id: taxForm.debito_fiscal_account_id || undefined,
                credito_fiscal_account_id: taxForm.credito_fiscal_account_id || undefined
            }
            if (taxForm.type === 'IGTF') body.gl_account_id = ''

            const res = await fetch(url, {
                method,
                body: JSON.stringify(body),
                headers: { 'Content-Type': 'application/json' }
            })
            if (res.ok) {
                setIsTaxModalOpen(false)
                refreshData()
            } else {
                const err = await res.json().catch(() => ({}))
                alert(err?.error || 'Error al guardar')
            }
        } catch (error) {
            console.error(error)
            alert('Error de conexión. Revise la consola.')
        }
    }

    async function deleteTax(id: string) {
        if (!confirm('¿Eliminar este impuesto?')) return
        await fetch(`/api/configuration/taxes/${id}`, { method: 'DELETE' })
        refreshData()
    }

    // ISLR
    function openIslrModal(concept?: ISLRConcept) {
        if (concept) {
            setEditingIslr(concept)
            setIslrForm({
                seniat_code: concept.seniat_code || '',
                description: concept.description,
                pn_resident_rate: concept.pn_resident_rate || '',
                pj_domiciled_rate: concept.pj_domiciled_rate || '',
                pn_non_resident_rate: concept.pn_non_resident_rate || '',
                pj_non_domiciled_rate: concept.pj_non_domiciled_rate || ''
            })
        } else {
            setEditingIslr(null)
            setIslrForm({ seniat_code: '', description: '', pn_resident_rate: '', pj_domiciled_rate: '', pn_non_resident_rate: '', pj_non_domiciled_rate: '' })
        }
        setIsIslrModalOpen(true)
    }

    async function handleIslrSubmit(e: React.FormEvent) {
        e.preventDefault()
        try {
            const url = editingIslr ? `/api/configuration/islr-concepts/${editingIslr.id}` : '/api/configuration/islr-concepts'
            const method = editingIslr ? 'PUT' : 'POST'
            const res = await fetch(url, {
                method,
                body: JSON.stringify(islrForm),
                headers: { 'Content-Type': 'application/json' }
            })
            if (res.ok) {
                setIsIslrModalOpen(false)
                refreshData()
            }
        } catch (error) { console.error(error) }
    }

    async function deleteIslr(id: string) {
        if (!confirm('¿Eliminar este concepto?')) return
        await fetch(`/api/configuration/islr-concepts/${id}`, { method: 'DELETE' })
        refreshData()
    }

    // --- RENDER ---
    const renderAccountSelect = (label: string, field: keyof GlobalTaxConfiguration) => (
        <div className="flex flex-col">
            <label htmlFor={field} className="text-xs font-medium text-gray-500 mb-1">{label}</label>
            <select
                id={field}
                value={globalForm[field] as string || ''}
                onChange={e => setGlobalForm({ ...globalForm, [field]: e.target.value })}
                className="border border-gray-300 rounded text-sm p-2 w-full"
            >
                <option value="">Seleccionar Cuenta...</option>
                {(Array.isArray(accounts) ? accounts : []).map(acc => (
                    <option key={acc.id} value={acc.id}>{acc.code} - {acc.name}</option>
                ))}
            </select>
        </div>
    )

    if (loading) return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-gray-400" /></div>

    return (
        <div className="max-w-[98%] mx-auto pb-20">
            <PageHeader title="Configuración de Impuestos" />

            {/* GLOBAL CONFIGURATION SECTION */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-semibold text-gray-800">Cuentas Contables Globales de Impuestos</h2>
                    <button onClick={handleGlobalSubmit} disabled={savingGlobal} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 disabled:opacity-50">
                        {savingGlobal ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Guardar Configuración
                    </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {renderAccountSelect('IVA Débito Fiscal (Ventas)', 'iva_fiscal_debit_account_id')}
                    {renderAccountSelect('IVA Crédito Fiscal (Compras)', 'iva_fiscal_credit_account_id')}
                    {renderAccountSelect('Retenciones de IVA', 'iva_retention_account_id')}
                    {renderAccountSelect('Retenciones de ISLR', 'islr_retention_account_id')}
                    {renderAccountSelect('IGTF (Impuesto Grandes Transacciones)', 'igtf_account_id')}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                {/* TAX TABLE (IVA/IGTF/OTHER) */}
                <div>
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-gray-700">Tasas de Impuestos (IVA / IGTF)</h3>
                        <button onClick={() => openTaxModal()} className="flex items-center gap-2 bg-[#2ca01c] text-white px-3 py-1.5 rounded text-xs hover:bg-[#248217]">
                            <Plus className="w-3 h-3" /> Nuevo
                        </button>
                    </div>
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-4 py-2 font-medium">Nombre</th>
                                    <th className="px-4 py-2 font-medium">Tipo</th>
                                    <th className="px-4 py-2 font-medium text-right">Tasa</th>
                                    <th className="px-4 py-2 font-medium text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(Array.isArray(taxes) ? taxes : []).map(tax => (
                                    <tr key={tax.id} className="border-b last:border-0 hover:bg-gray-50">
                                        <td className="px-4 py-3">{tax.name}</td>
                                        <td className="px-4 py-3"><span className="bg-gray-100 px-2 py-0.5 rounded text-xs">{tax.type}</span></td>
                                        <td className="px-4 py-3 text-right font-mono">{Number(tax.rate).toFixed(2)}%</td>
                                        <td className="px-4 py-3 text-right">
                                            <button onClick={() => openTaxModal(tax)} className="text-gray-400 hover:text-blue-600 mr-2" aria-label="Editar impuesto"><Pencil className="w-4 h-4" /></button>
                                            <button onClick={() => deleteTax(tax.id)} className="text-gray-400 hover:text-red-600" aria-label="Eliminar impuesto"><Trash2 className="w-4 h-4" /></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* VAT RETENTIONS TABLE */}
                <div>
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-gray-700">Retenciones de IVA</h3>
                        <button onClick={() => openVatRetModal()} className="flex items-center gap-2 bg-[#2ca01c] text-white px-3 py-1.5 rounded text-xs hover:bg-[#248217]">
                            <Plus className="w-3 h-3" /> Nueva
                        </button>
                    </div>
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-4 py-2 font-medium">Descripción</th>
                                    <th className="px-4 py-2 font-medium text-right">Porcentaje</th>
                                    <th className="px-4 py-2 font-medium text-right">Estado</th>
                                    <th className="px-4 py-2 font-medium text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(Array.isArray(vatRetentions) ? vatRetentions : []).map(ret => (
                                    <tr key={ret.id} className="border-b last:border-0 hover:bg-gray-50">
                                        <td className="px-4 py-3">{ret.description}</td>
                                        <td className="px-4 py-3 text-right font-mono">{Number(ret.rate).toFixed(2)}%</td>
                                        <td className="px-4 py-3 text-right">
                                            <span className={`px-2 py-0.5 rounded text-xs ${ret.active ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                                {ret.active ? 'Activo' : 'Inactivo'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <button onClick={() => openVatRetModal(ret)} className="text-gray-400 hover:text-blue-600 mr-2" aria-label="Editar retención"><Pencil className="w-4 h-4" /></button>
                                            <button onClick={() => deleteVatRet(ret.id)} className="text-gray-400 hover:text-red-600" aria-label="Eliminar retención"><Trash2 className="w-4 h-4" /></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* ISLR CONCEPTS TABLE */}
            <div className="mb-8">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-700">Conceptos de Retención ISLR</h3>
                    <button onClick={() => openIslrModal()} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700">
                        <Plus className="w-4 h-4" /> Nuevo Concepto ISLR
                    </button>
                </div>
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-4 py-3 font-medium w-24">Cód.</th>
                                <th className="px-4 py-3 font-medium">Concepto</th>
                                <th className="px-4 py-3 font-medium w-32">PN Res.</th>
                                <th className="px-4 py-3 font-medium w-32">PJ Dom.</th>
                                <th className="px-4 py-3 font-medium w-32">PN No Res.</th>
                                <th className="px-4 py-3 font-medium w-32">PJ No Dom.</th>
                                <th className="px-4 py-3 font-medium text-right w-24">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {(Array.isArray(islrConcepts) ? islrConcepts : []).map(item => (
                                <tr key={item.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 font-mono text-gray-600 text-xs">{item.seniat_code || '-'}</td>
                                    <td className="px-4 py-3">{item.description}</td>
                                    <td className="px-4 py-3 text-xs">{item.pn_resident_rate || '-'}</td>
                                    <td className="px-4 py-3 text-xs">{item.pj_domiciled_rate || '-'}</td>
                                    <td className="px-4 py-3 text-xs">{item.pn_non_resident_rate || '-'}</td>
                                    <td className="px-4 py-3 text-xs">{item.pj_non_domiciled_rate || '-'}</td>
                                    <td className="px-4 py-3 text-right">
                                        <button onClick={() => openIslrModal(item)} className="text-gray-400 hover:text-blue-600 mr-2" aria-label="Editar concepto"><Pencil className="w-4 h-4" /></button>
                                        <button onClick={() => deleteIslr(item.id)} className="text-gray-400 hover:text-red-600" aria-label="Eliminar concepto"><Trash2 className="w-4 h-4" /></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* MODALS */}

            {/* Tax Modal */}
            {isTaxModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex justify-center items-center p-4">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-sm">
                        <div className="flex justify-between items-center p-4 border-b">
                            <h3 className="font-bold">{editingTax ? 'Editar Impuesto' : 'Nuevo Impuesto'}</h3>
                            <button onClick={() => setIsTaxModalOpen(false)} aria-label="Cerrar modal"><X className="w-5 h-5 text-gray-400" /></button>
                        </div>
                        <form onSubmit={handleTaxSubmit} className="p-4 space-y-4">
                            <div>
                                <label htmlFor="taxName" className="block text-sm font-medium mb-1">Nombre</label>
                                <input id="taxName" required value={taxForm.name} onChange={e => setTaxForm({ ...taxForm, name: e.target.value })} className="w-full border rounded p-2" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="taxRate" className="block text-sm font-medium mb-1">Tasa (%)</label>
                                    <input id="taxRate" type="number" step="0.01" required value={taxForm.rate} onChange={e => setTaxForm({ ...taxForm, rate: e.target.value })} className="w-full border rounded p-2" />
                                </div>
                                <div>
                                    <label htmlFor="taxType" className="block text-sm font-medium mb-1">Tipo</label>
                                    <select id="taxType" value={taxForm.type} onChange={e => setTaxForm({ ...taxForm, type: e.target.value })} className="w-full border rounded p-2">
                                        <option value="IVA">IVA</option>
                                        <option value="IGTF">IGTF</option>
                                        <option value="OTRO">Otro</option>
                                    </select>
                                </div>
                            </div>
                            {taxForm.type === 'OTRO' && (
                                <div>
                                    <label htmlFor="taxAccount" className="block text-sm font-medium mb-1">Cuenta Contable</label>
                                    <select id="taxAccount" required value={taxForm.gl_account_id} onChange={e => setTaxForm({ ...taxForm, gl_account_id: e.target.value })} className="w-full border rounded p-2">
                                        <option value="">Seleccionar...</option>
                                        {(Array.isArray(accounts) ? accounts : []).map(acc => <option key={acc.id} value={acc.id}>{acc.code} - {acc.name}</option>)}
                                    </select>
                                </div>
                            )}
                            {taxForm.type === 'IVA' && (
                                <>
                                    <div>
                                        <label htmlFor="taxDebitoFiscal" className="block text-sm font-medium mb-1">Cuenta Débito Fiscal IVA (ventas / clientes)</label>
                                        <select id="taxDebitoFiscal" value={taxForm.debito_fiscal_account_id} onChange={e => setTaxForm({ ...taxForm, debito_fiscal_account_id: e.target.value })} className="w-full border rounded p-2">
                                            <option value="">Seleccionar cuenta...</option>
                                        {(Array.isArray(accounts) ? accounts : []).map(acc => <option key={acc.id} value={acc.id}>{acc.code} - {acc.name}</option>)}
                                    </select>
                                    <p className="text-xs text-gray-500 mt-0.5">IVA cobrado en ventas. Cuenta del pasivo (obligación con el fisco).</p>
                                </div>
                                <div>
                                    <label htmlFor="taxCreditoFiscal" className="block text-sm font-medium mb-1">Cuenta Crédito Fiscal IVA (compras / proveedores)</label>
                                    <select id="taxCreditoFiscal" value={taxForm.credito_fiscal_account_id} onChange={e => setTaxForm({ ...taxForm, credito_fiscal_account_id: e.target.value })} className="w-full border rounded p-2">
                                        <option value="">Seleccionar cuenta...</option>
                                        {(Array.isArray(accounts) ? accounts : []).map(acc => <option key={acc.id} value={acc.id}>{acc.code} - {acc.name}</option>)}
                                        </select>
                                        <p className="text-xs text-gray-500 mt-0.5">IVA recuperable en compras y facturas de proveedor. Cuenta del activo.</p>
                                    </div>
                                </>
                            )}
                            {taxForm.type === 'IGTF' && (
                                <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded">
                                    La cuenta contable para IGTF se define en la configuración global.
                                </div>
                            )}
                            <div className="flex justify-end gap-2 pt-4">
                                <button type="button" onClick={() => setIsTaxModalOpen(false)} className="px-4 py-2 border rounded">Cancelar</button>
                                <button type="submit" className="px-4 py-2 bg-[#2ca01c] text-white rounded">Guardar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* VAT Retention Modal */}
            {isVatRetModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex justify-center items-center p-4">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-sm">
                        <div className="flex justify-between items-center p-4 border-b">
                            <h3 className="font-bold">{editingVatRet ? 'Editar Retención IVA' : 'Nueva Retención IVA'}</h3>
                            <button onClick={() => setIsVatRetModalOpen(false)} aria-label="Cerrar modal"><X className="w-5 h-5 text-gray-400" /></button>
                        </div>
                        <form onSubmit={handleVatRetSubmit} className="p-4 space-y-4">
                            <div>
                                <label htmlFor="vatRetDesc" className="block text-sm font-medium mb-1">Descripción</label>
                                <input id="vatRetDesc" required value={vatRetForm.description} onChange={e => setVatRetForm({ ...vatRetForm, description: e.target.value })} className="w-full border rounded p-2" placeholder="ej. Retención 75%" />
                            </div>
                            <div>
                                <label htmlFor="vatRetRate" className="block text-sm font-medium mb-1">Porcentaje de Retención (%)</label>
                                <input id="vatRetRate" type="number" step="0.01" required value={vatRetForm.rate} onChange={e => setVatRetForm({ ...vatRetForm, rate: e.target.value })} className="w-full border rounded p-2" />
                            </div>
                            <div className="flex items-center gap-2">
                                <input type="checkbox" checked={vatRetForm.active} onChange={e => setVatRetForm({ ...vatRetForm, active: e.target.checked })} id="retActive" />
                                <label htmlFor="retActive" className="text-sm">Activo</label>
                            </div>
                            <div className="flex justify-end gap-2 pt-4">
                                <button type="button" onClick={() => setIsVatRetModalOpen(false)} className="px-4 py-2 border rounded">Cancelar</button>
                                <button type="submit" className="px-4 py-2 bg-[#2ca01c] text-white rounded">Guardar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ISLR Modal */}
            {isIslrModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex justify-center items-center p-4">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
                        <div className="flex justify-between items-center p-4 border-b">
                            <h3 className="font-bold">{editingIslr ? 'Concepto ISLR' : 'Nuevo Concepto ISLR'}</h3>
                            <button onClick={() => setIsIslrModalOpen(false)} aria-label="Cerrar modal"><X className="w-5 h-5 text-gray-400" /></button>
                        </div>
                        <form onSubmit={handleIslrSubmit} className="p-4 space-y-4">
                            <div className="grid grid-cols-4 gap-4">
                                <div className="col-span-1">
                                    <label htmlFor="islrCode" className="block text-xs font-medium text-gray-700 mb-1">Cód.</label>
                                    <input id="islrCode" value={islrForm.seniat_code} onChange={e => setIslrForm({ ...islrForm, seniat_code: e.target.value })} className="w-full border rounded p-2 font-mono text-sm" placeholder="001" />
                                </div>
                                <div className="col-span-3">
                                    <label htmlFor="islrDesc" className="block text-xs font-medium text-gray-700 mb-1">Concepto</label>
                                    <input id="islrDesc" required value={islrForm.description} onChange={e => setIslrForm({ ...islrForm, description: e.target.value })} className="w-full border rounded p-2 text-sm" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4 bg-gray-50 p-3 rounded-md border border-gray-100">
                                <div><label htmlFor="pnRes" className="text-xs mb-1 block">PN Residente</label><input id="pnRes" value={islrForm.pn_resident_rate} onChange={e => setIslrForm({ ...islrForm, pn_resident_rate: e.target.value })} className="w-full border text-sm p-1.5 rounded" /></div>
                                <div><label htmlFor="pjDom" className="text-xs mb-1 block">PJ Domiciliada</label><input id="pjDom" value={islrForm.pj_domiciled_rate} onChange={e => setIslrForm({ ...islrForm, pj_domiciled_rate: e.target.value })} className="w-full border text-sm p-1.5 rounded" /></div>
                                <div><label htmlFor="pnNonRes" className="text-xs mb-1 block">PN No Residente</label><input id="pnNonRes" value={islrForm.pn_non_resident_rate} onChange={e => setIslrForm({ ...islrForm, pn_non_resident_rate: e.target.value })} className="w-full border text-sm p-1.5 rounded" /></div>
                                <div><label htmlFor="pjNonDom" className="text-xs mb-1 block">PJ No Domiciliada</label><input id="pjNonDom" value={islrForm.pj_non_domiciled_rate} onChange={e => setIslrForm({ ...islrForm, pj_non_domiciled_rate: e.target.value })} className="w-full border text-sm p-1.5 rounded" /></div>
                            </div>
                            <div className="flex justify-end gap-2 pt-4">
                                <button type="button" onClick={() => setIsIslrModalOpen(false)} className="px-4 py-2 border rounded">Cancelar</button>
                                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">Guardar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
