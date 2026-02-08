'use client'

import { useState, useEffect } from 'react'

interface CompanyListProps {
    onEdit: (company: any) => void
}

export function CompanyList({ onEdit }: CompanyListProps) {
    const [companies, setCompanies] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    const fetchCompanies = () => {
        setLoading(true)
        fetch('/api/companies')
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) setCompanies(data)
                setLoading(false)
            })
            .catch(err => {
                console.error(err)
                setLoading(false)
            })
    }

    useEffect(() => {
        fetchCompanies()
    }, [])

    // Refresh exposed via forwardRef or context?
    // For simplicity, let's just use effect for now. Use router refresh on parent to re-trigger this if needed?
    // Or simpler: pass a refresh trigger prop.
    // Actually, let's just expose a refresh button or auto-refresh if parent says so.

    // BETTER: The parent PAGE should handle data fetching in Server Component, 
    // but here we are doing client side fetch for simplicity in this "Client Component" architecture we are building.
    // Let's add a refresh method or simple poll? No.
    // Just listen to parent updates? 
    // Let's keep it simple: initial load. Parent can force remount with key to refresh.

    if (loading) return <div>Cargando empresas...</div>

    return (
        <div className="bg-white rounded shadow border border-gray-100 overflow-hidden">
            <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-700 font-medium border-b">
                    <tr>
                        <th className="px-6 py-3">Nombre</th>
                        <th className="px-6 py-3">RIF</th>
                        <th className="px-6 py-3">Moneda</th>
                        <th className="px-6 py-3">Acciones</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {companies.map(company => (
                        <tr key={company.id} className="hover:bg-gray-50">
                            <td className="px-6 py-3 font-medium">{company.name}</td>
                            <td className="px-6 py-3">{company.rif}</td>
                            <td className="px-6 py-3">{company.currency}</td>
                            <td className="px-6 py-3">
                                <button
                                    onClick={() => onEdit(company)}
                                    className="text-blue-600 hover:text-blue-800 font-medium"
                                >
                                    Editar
                                </button>
                            </td>
                        </tr>
                    ))}
                    {companies.length === 0 && (
                        <tr>
                            <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                                No hay empresas registradas.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    )
}
