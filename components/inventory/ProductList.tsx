'use client'

import { useState, useEffect } from 'react'
import { Plus, Search, Pencil, Trash2, Package } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface Product {
    id: string
    sku: string
    name: string
    sales_price: string
    quantity_on_hand: string
    is_active: boolean
}

interface ProductListProps {
    type: 'GOODS' | 'SERVICE'
    title: string
    basePath: string
}

export function ProductList({ type, title, basePath }: ProductListProps) {
    const [products, setProducts] = useState<Product[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const router = useRouter()

    useEffect(() => {
        fetchProducts()
    }, [type])

    async function fetchProducts() {
        try {
            const res = await fetch(`/api/inventory/products?type=${type}`)
            if (res.ok) {
                setProducts(await res.json())
            }
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    async function handleDelete(id: string) {
        if (!confirm('¿Estás seguro de eliminar este ítem?')) return

        try {
            const res = await fetch(`/api/inventory/products/${id}`, {
                method: 'DELETE'
            })
            if (res.ok) fetchProducts()
        } catch (error) {
            console.error(error)
        }
    }

    const filtered = products.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        (p.sku && p.sku.toLowerCase().includes(search.toLowerCase()))
    )

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <Package className="w-6 h-6 text-gray-600" />
                    {title}
                </h1>
                <Link
                    href={`${basePath}/new`}
                    className="bg-[#2ca01c] hover:bg-[#248217] text-white px-4 py-2 rounded-md flex items-center gap-2 font-medium"
                >
                    <Plus className="w-5 h-5" /> Nuevo
                </Link>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <div className="relative max-w-md">
                    <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                    <input
                        placeholder="Buscar por nombre o código..."
                        aria-label="Buscar producto"
                        className="pl-10 w-full border rounded-md p-2 focus:ring-blue-500"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 border-b">
                        <tr>
                            <th className="px-6 py-3 font-medium text-gray-700">Código / SKU</th>
                            <th className="px-6 py-3 font-medium text-gray-700">Nombre</th>
                            <th className="px-6 py-3 font-medium text-gray-700 text-right">Precio Venta</th>
                            {type === 'GOODS' && (
                                <th className="px-6 py-3 font-medium text-gray-700 text-right">Existencia</th>
                            )}
                            <th className="px-6 py-3 text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {loading ? (
                            <tr><td colSpan={5} className="p-8 text-center">Cargando...</td></tr>
                        ) : filtered.length === 0 ? (
                            <tr><td colSpan={5} className="p-8 text-center text-gray-500">No se encontraron registros.</td></tr>
                        ) : (
                            filtered.map(product => (
                                <tr key={product.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 font-mono text-gray-600">{product.sku || '-'}</td>
                                    <td className="px-6 py-4 font-medium text-gray-900">{product.name}</td>
                                    <td className="px-6 py-4 text-right">{parseFloat(product.sales_price).toFixed(2)}</td>
                                    {type === 'GOODS' && (
                                        <td className="px-6 py-4 text-right">
                                            {parseFloat(product.quantity_on_hand).toFixed(2)}
                                        </td>
                                    )}
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <Link
                                                href={`${basePath}/${product.id}/edit`}
                                                className="text-gray-400 hover:text-blue-600"
                                                aria-label={`Editar ${product.name}`}
                                            >
                                                <Pencil className="w-4 h-4" />
                                            </Link>
                                            <button
                                                onClick={() => handleDelete(product.id)}
                                                className="text-gray-400 hover:text-red-600"
                                                aria-label={`Eliminar ${product.name}`}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
