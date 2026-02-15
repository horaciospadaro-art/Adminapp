'use client'

import { useState, useEffect } from 'react'
import { Save, Loader2, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AccountSelector } from '@/components/accounting/AccountSelector'

interface Tax {
    id: string
    name: string
    rate: string
}

interface Account {
    id: string
    code: string
    name: string
    type: string
    _count?: {
        children: number
    }
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
        minimum_stock: initialData?.minimum_stock || 0,
        reorder_point: initialData?.reorder_point || '',

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
                        <label htmlFor="prodName" className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                        <input
                            id="prodName"
                            required
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            className="w-full border p-2 rounded focus:ring-blue-500"
                        />
                    </div>
                    <div>
                        <label htmlFor="prodSku" className="block text-sm font-medium text-gray-700 mb-1">SKU / Código</label>
                        <input
                            id="prodSku"
                            value={formData.sku}
                            onChange={e => setFormData({ ...formData, sku: e.target.value })}
                            className="w-full border p-2 rounded focus:ring-blue-500"
                        />
                    </div>
                    <div className="md:col-span-2">
                        <label htmlFor="prodDesc" className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                        <textarea
                            id="prodDesc"
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
                        <label htmlFor="prodPrice" className="block text-sm font-medium text-gray-700 mb-1">Precio de Venta</label>
                        <input
                            id="prodPrice"
                            type="number"
                            step="0.01"
                            value={formData.sales_price}
                            onChange={e => setFormData({ ...formData, sales_price: e.target.value })}
                            className="w-full border p-2 rounded focus:ring-blue-500 font-mono"
                        />
                    </div>
                    <div>
                        <label htmlFor="prodTax" className="block text-sm font-medium text-gray-700 mb-1">Impuesto (IVA)</label>
                        <select
                            id="prodTax"
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
                                <AccountSelector
                                    value={formData.income_account_id}
                                    onChange={(val) => setFormData({ ...formData, income_account_id: val })}
                                    preloadedAccounts={accounts}
                                    placeholder="Seleccionar cuenta de ingresos..."
                                />
                            </div>

                            {!isService && (
                                <>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 mb-1">Cuenta de Activo (Inventario)</label>
                                        <AccountSelector
                                            value={formData.asset_account_id}
                                            onChange={(val) => setFormData({ ...formData, asset_account_id: val })}
                                            preloadedAccounts={accounts}
                                            placeholder="Seleccionar cuenta de activo..."
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 mb-1">Cuenta de Costos (COGS)</label>
                                        <AccountSelector
                                            value={formData.cogs_account_id}
                                            onChange={(val) => setFormData({ ...formData, cogs_account_id: val })}
                                            preloadedAccounts={accounts}
                                            placeholder="Seleccionar cuenta de costos..."
                                        />
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {!isService && (
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <h3 className="text-lg font-semibold mb-4 text-gray-800 border-b pb-2">Control de Stock</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="minStock" className="block text-sm font-medium text-gray-700 mb-1">Stock Mínimo</label>
                            <input
                                id="minStock"
                                type="number"
                                step="0.01"
                                value={formData.minimum_stock}
                                onChange={e => setFormData({ ...formData, minimum_stock: parseFloat(e.target.value) || 0 })}
                                className="w-full border p-2 rounded focus:ring-blue-500 font-mono"
                                placeholder="0.00"
                            />
                            <p className="text-xs text-gray-500 mt-1">Se generará alerta cuando el stock esté por debajo de este valor</p>
                        </div>
                        <div>
                            <label htmlFor="reorderPoint" className="block text-sm font-medium text-gray-700 mb-1">Punto de Reorden (Opcional)</label>
                            <input
                                id="reorderPoint"
                                type="number"
                                step="0.01"
                                value={formData.reorder_point}
                                onChange={e => setFormData({ ...formData, reorder_point: e.target.value })}
                                className="w-full border p-2 rounded focus:ring-blue-500 font-mono"
                                placeholder="0.00"
                            />
                            <p className="text-xs text-gray-500 mt-1">Nivel sugerido para realizar un nuevo pedido</p>
                        </div>
                    </div>
                </div>
            )}

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
