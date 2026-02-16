'use client'

import { useState, useEffect, ReactNode } from 'react'
import Link from 'next/link'
import { AlertTriangle, Settings } from 'lucide-react'

/** Comprueba que exista al menos un impuesto IVA con Débito y Crédito Fiscal configurados. */
function isTaxConfigReady(taxes: unknown): boolean {
    if (!Array.isArray(taxes)) return false
    return taxes.some(
        (t: { type?: string; debito_fiscal_account_id?: string | null; credito_fiscal_account_id?: string | null }) =>
            t.type === 'IVA' &&
            !!t.debito_fiscal_account_id &&
            !!t.credito_fiscal_account_id
    )
}

interface TaxConfigGuardProps {
    children: ReactNode
    /** Contexto para el mensaje: "ventas" o "compras" */
    context?: 'ventas' | 'compras'
}

export function TaxConfigGuard({ children, context = 'ventas' }: TaxConfigGuardProps) {
    const [ready, setReady] = useState<boolean | null>(null)

    useEffect(() => {
        fetch('/api/configuration/taxes')
            .then((r) => r.json())
            .then((data) => setReady(isTaxConfigReady(data)))
            .catch(() => setReady(false))
    }, [])

    if (ready === null) {
        return (
            <div className="flex justify-center items-center py-16">
                <p className="text-gray-500">Verificando configuración de impuestos...</p>
            </div>
        )
    }

    if (!ready) {
        const isVentas = context === 'ventas'
        return (
            <div className="max-w-2xl mx-auto py-12 px-6">
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-8 shadow-sm">
                    <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
                            <AlertTriangle className="w-6 h-6 text-amber-600" />
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold text-amber-900 mb-2">
                                Configure primero las cuentas de impuestos
                            </h2>
                            <p className="text-amber-800 mb-4">
                                Para registrar {isVentas ? 'facturas de venta (clientes)' : 'facturas de compra (proveedores)'}, debe existir al menos un impuesto IVA con las cuentas <strong>Débito Fiscal</strong> (ventas) y <strong>Crédito Fiscal</strong> (compras) configuradas en la tabla de impuestos.
                            </p>
                            <p className="text-amber-700 text-sm mb-6">
                                Sin esta configuración no se puede contabilizar correctamente el IVA en las facturas.
                            </p>
                            <Link
                                href="/dashboard/configuration/taxes"
                                className="inline-flex items-center gap-2 bg-amber-600 text-white px-5 py-2.5 rounded-lg hover:bg-amber-700 font-medium text-sm"
                            >
                                <Settings className="w-4 h-4" />
                                Ir a Configuración de Impuestos
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    return <>{children}</>
}
