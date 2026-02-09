import { Suspense } from 'react'
import { BillForm } from '@/components/operations/BillForm'

export default function NewBillPage() {
    return (
        <div className="max-w-6xl mx-auto py-8">
            <Suspense fallback={<div className="p-8 text-center">Cargando...</div>}>
                <BillForm />
            </Suspense>
        </div>
    )
}
