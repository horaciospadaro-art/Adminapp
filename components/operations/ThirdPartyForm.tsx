'use client'

import { useState } from 'react'

export function ThirdPartyForm({ companyId }: { companyId: string }) {
    const [name, setName] = useState('')
    const [rif, setRif] = useState('')
    const [isSpecial, setIsSpecial] = useState(false)

    // In a real app, this would post to an API
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        alert(`Creando Tercero: ${name} (${rif})`)
        // TODO: Implement API call
    }

    return (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow border border-gray-100">
            <h2 className="text-lg font-bold mb-4">Nuevo Tercero</h2>
            <div className="grid grid-cols-1 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Nombre / Razón Social</label>
                    <input
                        type="text"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">RIF</label>
                    <input
                        type="text"
                        value={rif}
                        onChange={e => setRif(e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                        placeholder="J-12345678-0"
                    />
                </div>
                <div className="flex items-center">
                    <input
                        id="isSpecial"
                        type="checkbox"
                        checked={isSpecial}
                        onChange={e => setIsSpecial(e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="isSpecial" className="ml-2 block text-sm text-gray-900">
                        Contribuyente Especial
                    </label>
                </div>
                <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                    Crear Cliente/Proveedor
                </button>
            </div>
        </form>
    )
}
