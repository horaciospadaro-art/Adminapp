'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Save, Loader2, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export function CustomerForm() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)

    // State
    const [name, setName] = useState('')
    const [rif, setRif] = useState('')
    const [email, setEmail] = useState('')
    const [phone, setPhone] = useState('')
    const [address, setAddress] = useState('')
    const [taxpayerType, setTaxpayerType] = useState('PJ_DOMICILIADA') // Default

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setLoading(true)

        try {
            const res = await fetch('/api/operations/clients', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    companyId: '1', // TODO: Fetch from context/session
                    name,
                    rif,
                    email,
                    phone,
                    address,
                    taxpayer_type: taxpayerType
                })
            })

            if (res.ok) {
                router.push('/dashboard/revenue/customers')
                router.refresh()
            } else {
                const data = await res.json()
                alert('Error: ' + data.error)
            }
        } catch (error) {
            console.error(error)
            alert('Error de conexión')
        } finally {
            setLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-6">
            <div className="flex items-center gap-4 mb-6">
                <Link href="/dashboard/revenue/customers" className="text-gray-500 hover:text-gray-700">
                    <ArrowLeft className="w-6 h-6" />
                </Link>
                <h1 className="text-2xl font-bold text-gray-800">Nuevo Cliente</h1>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="col-span-2">
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Nombre o Razón Social <span className="text-red-500">*</span></label>
                        <input
                            id="name"
                            required
                            value={name}
                            onChange={e => setName(e.target.value)}
                            className="w-full p-2 border rounded focus:ring-blue-500"
                            placeholder="Ej. Distribuidora XYZ, C.A."
                        />
                    </div>

                    <div>
                        <label htmlFor="rif" className="block text-sm font-medium text-gray-700 mb-1">RIF <span className="text-red-500">*</span></label>
                        <input
                            id="rif"
                            required
                            value={rif}
                            onChange={e => setRif(e.target.value)}
                            className="w-full p-2 border rounded focus:ring-blue-500"
                            placeholder="J-12345678-9"
                        />
                    </div>

                    <div>
                        <label htmlFor="taxpayerType" className="block text-sm font-medium text-gray-700 mb-1">Tipo de Contribuyente</label>
                        <select
                            id="taxpayerType"
                            value={taxpayerType}
                            onChange={e => setTaxpayerType(e.target.value)}
                            className="w-full p-2 border rounded focus:ring-blue-500"
                            title="Tipo de Contribuyente"
                        >
                            <option value="PJ_DOMICILIADA">Persona Jurídica Domiciliada</option>
                            <option value="PN_RESIDENTE">Persona Natural Residente</option>
                            <option value="PJ_NO_DOMICILIADA">Persona Jurídica No Domiciliada</option>
                            <option value="PN_NO_RESIDENTE">Persona Natural No Residente</option>
                        </select>
                    </div>

                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            className="w-full p-2 border rounded focus:ring-blue-500"
                            title="Email"
                            placeholder="correo@ejemplo.com"
                        />
                    </div>

                    <div>
                        <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                        <input
                            id="phone"
                            type="tel"
                            value={phone}
                            onChange={e => setPhone(e.target.value)}
                            className="w-full p-2 border rounded focus:ring-blue-500"
                            title="Teléfono"
                            placeholder="+58 414 1234567"
                        />
                    </div>

                    <div className="col-span-2">
                        <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">Dirección Fiscal</label>
                        <textarea
                            id="address"
                            value={address}
                            onChange={e => setAddress(e.target.value)}
                            className="w-full p-2 border rounded focus:ring-blue-500"
                            rows={3}
                            title="Dirección Fiscal"
                            placeholder="Dirección completa"
                        />
                    </div>
                </div>

                <div className="pt-4 flex justify-end">
                    <button
                        type="submit"
                        disabled={loading}
                        className="bg-[#2ca01c] hover:bg-[#248217] text-white px-6 py-2 rounded-lg font-medium shadow-sm flex items-center gap-2"
                    >
                        {loading ? <Loader2 className="animate-spin w-5 h-5" /> : <Save className="w-5 h-5" />}
                        Guardar Cliente
                    </button>
                </div>
            </div>
        </form>
    )
}
