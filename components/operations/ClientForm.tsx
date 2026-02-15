'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AccountSelector } from '@/components/accounting/AccountSelector'

interface ClientFormProps {
    companyId: string
    initialData?: any
    onSuccess?: () => void
    onCancel?: () => void
}

export function ClientForm({ companyId, initialData, onSuccess, onCancel }: ClientFormProps) {
    const router = useRouter()
    const [name, setName] = useState('')
    const [rif, setRif] = useState('')
    const [email, setEmail] = useState('')
    const [phone, setPhone] = useState('')
    const [address, setAddress] = useState('')
    const [taxpayerType, setTaxpayerType] = useState('PJ_DOMICILIADA')
    const [accountId, setAccountId] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (initialData) {
            setName(initialData.name)
            setRif(initialData.rif)
            setEmail(initialData.email || '')
            setPhone(initialData.phone || '')
            setAddress(initialData.address || '')
            setTaxpayerType(initialData.taxpayer_type || 'PJ_DOMICILIADA')
            setAccountId(initialData.receivable_account_id || '')
        }
    }, [initialData])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!accountId?.trim()) {
            setError('La cuenta contable (Por Cobrar) es obligatoria para registrar facturas y cobros.')
            return
        }
        setLoading(true)
        setError(null)

        try {
            const isEdit = !!initialData
            const url = isEdit ? '/api/operations/third-parties' : '/api/operations/clients'
            const method = isEdit ? 'PUT' : 'POST'

            const body = {
                id: initialData?.id,
                companyId,
                name,
                rif,
                email,
                phone,
                address,
                taxpayer_type: taxpayerType,
                receivable_account_id: accountId
            }

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            })

            if (!res.ok) {
                const data = await res.json()
                throw new Error(data.error || 'Error al guardar cliente')
            }

            router.refresh()
            if (onSuccess) onSuccess()

            if (!isEdit) {
                setName('')
                setRif('')
                setEmail('')
                setPhone('')
                setAddress('')
                setTaxpayerType('PJ_DOMICILIADA')
                setAccountId('')
            }
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow border border-gray-100 mb-6">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold text-gray-800">
                    {initialData ? 'Editar Cliente' : 'Nuevo Cliente'}
                </h2>
                {onCancel && (
                    <button type="button" onClick={onCancel} className="text-gray-500 hover:text-gray-700 text-sm">
                        Cancelar
                    </button>
                )}
            </div>

            {error && <div className="bg-red-50 text-red-600 p-3 rounded mb-4 text-sm">{error}</div>}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="client-name" className="block text-sm font-medium text-gray-700 mb-1">Nombre / Razón Social</label>
                    <input id="client-name" type="text" value={name} onChange={e => setName(e.target.value)} className="w-full border border-gray-300 rounded px-3 py-2" required />
                </div>
                <div>
                    <label htmlFor="client-rif" className="block text-sm font-medium text-gray-700 mb-1">RIF</label>
                    <input id="client-rif" type="text" value={rif} onChange={e => setRif(e.target.value)} className="w-full border border-gray-300 rounded px-3 py-2" required />
                </div>
                <div>
                    <label htmlFor="client-email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input id="client-email" type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full border border-gray-300 rounded px-3 py-2" />
                </div>
                <div>
                    <label htmlFor="client-phone" className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                    <input id="client-phone" type="text" value={phone} onChange={e => setPhone(e.target.value)} className="w-full border border-gray-300 rounded px-3 py-2" />
                </div>
                <div>
                    <label htmlFor="client-type" className="block text-sm font-medium text-gray-700 mb-1">Tipo de Persona (ISLR)</label>
                    <select
                        id="client-type"
                        value={taxpayerType}
                        onChange={e => setTaxpayerType(e.target.value)}
                        className="w-full border border-gray-300 rounded px-3 py-2 bg-white"
                    >
                        <option value="PJ_DOMICILIADA">P. Jurídica Domiciliada</option>
                        <option value="PJ_NO_DOMICILIADA">P. Jurídica No Domiciliada</option>
                        <option value="PN_RESIDENTE">P. Natural Residente</option>
                        <option value="PN_NO_RESIDENTE">P. Natural No Residente</option>
                    </select>
                </div>
                <div className="md:col-span-2">
                    <label htmlFor="client-address" className="block text-sm font-medium text-gray-700 mb-1">Dirección Fiscal</label>
                    <input id="client-address" type="text" value={address} onChange={e => setAddress(e.target.value)} className="w-full border border-gray-300 rounded px-3 py-2" />
                </div>
                <div className="md:col-span-2 bg-blue-50 p-4 rounded border border-blue-100">
                    <AccountSelector
                        companyId={companyId}
                        label="Cuenta Contable (Por Cobrar)"
                        value={accountId}
                        onChange={setAccountId}
                        typeFilter="ASSET"
                        placeholder="Buscar cuenta por código o nombre..."
                        required
                    />
                    <p className="text-xs text-blue-600 mt-1">
                        Seleccione la cuenta de Activo donde se registrarán las deudas de este cliente.
                    </p>
                </div>
            </div>

            <div className="flex justify-end mt-4">
                <button type="submit" disabled={loading} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50">
                    {loading ? 'Guardando...' : (initialData ? 'Actualizar Cliente' : 'Crear Cliente')}
                </button>
            </div>
        </form>
    )
}
