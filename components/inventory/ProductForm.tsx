'use client'

import { useState, useEffect } from 'react'
import { Save, Loader2, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface Tax {
    id: string
    name: string
    rate: string
}

interface Account {
    id: string
    code: string
    name: string
}

interface ProductFormProps {
    initialData?: any
    isService?: boolean
}

export function ProductForm({ initialData, isService = false }: ProductFormProps) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [taxes, setTaxes] = useState<Tax[]>([])
    const [accounts, setAccounts] = useState<Account[]>([])

    // Form State
    const [formData, setFormData] = useState({
        name: initialData?.name || '',
        sku: initialData?.sku || '',
        description: initialData?.description || '',
        type: isService ? 'SERVICE' : 'GOODS',
        sales_price: initialData?.sales_price || '',
        tax_id: initialData?.tax_id || '',

        // Inventory
        track_inventory: initialData?.track_inventory || false,
        quantity_on_hand: initialData?.quantity_on_hand || 0,
        avg_cost: initialData?.avg_cost || 0,

        // Accounts
        income_account_id: initialData?.income_account_id || '',
        cogs_account_id: initialData?.cogs_account_id || '',
        asset_account_id: initialData?.asset_account_id || ''
    })

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [taxRes, accRes] = await Promise.all([
                    fetch('/api/configuration/taxes'),
                    fetch('/api/accounting/accounts')
                ])
                if (taxRes.ok) setTaxes(await taxRes.json())
                if (accRes.ok) setAccounts(await accRes.json())
            } catch (error) {
                console.error("Error loading resources", error)
            }
        }
        fetchData()
    }, [])

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setLoading(true)

        try {
            const url = initialData ? `/api/inventory/products/${initialData.id}` : '/api/inventory/products'
            const method = initialData ? 'PUT' : 'POST'

            const res = await fetch(url, {
                method,
                body: JSON.stringify({
                    ...formData,
                    sales_price: parseFloat(formData.sales_price) || 0,
                }),
                headers: { 'Content-Type': 'application/json' }
            })

            if (res.ok) {
                router.push(isService ? '/dashboard/inventory/services' : '/dashboard/inventory/products')
                router.refresh()
            } else {
                alert('Error guardando producto')
            }
        } catch (error) {
            console.error(error)
            alert('Error al procesar')
        } finally {
            setLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold mb-4 text-gray-800 border-b pb-2">Información General</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                        <input
                            required
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            className="w-full border p-2 rounded focus:ring-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">SKU / Código</label>
                        <input
                            value={formData.sku}
                            onChange={e => setFormData({ ...formData, sku: e.target.value })}
                            className="w-full border p-2 rounded focus:ring-blue-500"
                        />
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                        <textarea
                            value={formData.description}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                            className="w-full border p-2 rounded focus:ring-blue-500"
                            rows={2}
                        />
                    </div>
                </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold mb-4 text-gray-800 border-b pb-2">Precio y Contabilidad</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Precio de Venta</label>
                        <input
                            type="number"
                            step="0.01"
                            value={formData.sales_price}
                            onChange={e => setFormData({ ...formData, sales_price: e.target.value })}
                            className="w-full border p-2 rounded focus:ring-blue-500 font-mono"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Impuesto (IVA)</label>
                        <select
                            value={formData.tax_id}
                            onChange={e => setFormData({ ...formData, tax_id: e.target.value })}
                            className="w-full border p-2 rounded focus:ring-blue-500"
                        >
                            <option value="">Exento / Sin Impuesto</option>
                            {taxes.map(t => (
                                <option key={t.id} value={t.id}>{t.name} ({Number(t.rate)}%)</option>
                            ))}
                        </select>
                    </div>

                    <div className="md:col-span-2 border-t pt-4 mt-2">
                        <h4 className="text-sm font-semibold text-gray-600 mb-2">Cuentas Contables</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Cuenta de Ingresos (Ventas)</label>
                                <select
                                    value={formData.income_account_id}
                                    onChange={e => setFormData({ ...formData, income_account_id: e.target.value })}
                                    className="w-full border p-2 rounded text-sm bg-gray-50"
                                >
                                    <option value="">Seleccionar...</option>
                                    {accounts.map(a => <option key={a.id} value={a.id}>{a.code} - {a.name}</option>)}
                                </select>
                            </div>

                            {!isService && (
                                <>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 mb-1">Cuenta de Activo (Inventario)</label>
                                        <select
                                            value={formData.asset_account_id}
                                            onChange={e => setFormData({ ...formData, asset_account_id: e.target.value })}
                                            className="w-full border p-2 rounded text-sm bg-gray-50"
                                        >
                                            <option value="">Seleccionar...</option>
                                            {accounts.map(a => <option key={a.id} value={a.id}>{a.code} - {a.name}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 mb-1">Cuenta de Costos (COGS)</label>
                                        <select
                                            value={formData.cogs_account_id}
                                            onChange={e => setFormData({ ...formData, cogs_account_id: e.target.value })}
                                            className="w-full border p-2 rounded text-sm bg-gray-50"
                                        >
                                            <option value="">Seleccionar...</option>
                                            {accounts.map(a => <option key={a.id} value={a.id}>{a.code} - {a.name}</option>)}
                                        </select>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex justify-end gap-4">
                <Link
                    href={isService ? '/dashboard/inventory/services' : '/dashboard/inventory/products'}
                    className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 font-medium"
                >
                    Cancelar
                </Link>
                <button
                    type="submit"
                    disabled={loading}
                    className="bg-[#2ca01c] hover:bg-[#248217] text-white px-6 py-2 rounded-md font-medium shadow-sm flex items-center gap-2 disabled:opacity-50"
                >
                    {loading ? <Loader2 className="animate-spin w-4 h-4" /> : <Save className="w-4 h-4" />}
                    Guardar {isService ? 'Servicio' : 'Producto'}
                </button>
            </div>
        </form>
    )
}
