
import { Suspense } from 'react'
import { InvoiceForm } from '@/components/operations/InvoiceForm'

export default function NewInvoicePage() {
    return (
        <Suspense fallback={<div className="p-8 text-center">Cargando...</div>}>
            <InvoiceForm />
        </Suspense>
    )
}
