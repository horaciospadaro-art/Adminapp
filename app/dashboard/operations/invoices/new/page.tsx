import { Suspense } from 'react'
import { InvoiceForm } from '@/components/operations/InvoiceForm'
import { TaxConfigGuard } from '@/components/accounting/TaxConfigGuard'

export default function NewInvoicePage() {
    return (
        <div className="max-w-6xl mx-auto py-8">
            <TaxConfigGuard context="ventas">
                <Suspense fallback={<div className="p-8 text-center">Cargando...</div>}>
                    <InvoiceForm />
                </Suspense>
            </TaxConfigGuard>
        </div>
    )
}
