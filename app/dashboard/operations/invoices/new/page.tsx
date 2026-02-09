import { Suspense } from 'react'
import { InvoiceForm } from '@/components/operations/InvoiceForm'

export default function NewInvoicePage() {
    return (
        <div className="max-w-6xl mx-auto py-8">
            <Suspense fallback={<div className="p-8 text-center">Cargando...</div>}>
                <InvoiceForm />
            </Suspense>
        </div>
    )
}
