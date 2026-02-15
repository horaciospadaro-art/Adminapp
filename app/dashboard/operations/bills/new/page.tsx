import { Suspense } from 'react'
import { BillForm } from '@/components/operations/BillForm'
import prisma from '@/lib/db'

async function getActiveCompany() {
    return await prisma.company.findFirst()
}

export default async function NewBillPage() {
    const company = await getActiveCompany()

    return (
        <div className="max-w-[98%] mx-auto py-8">
            <Suspense fallback={<div className="p-8 text-center">Cargando...</div>}>
                <BillForm companyId={company?.id} />
            </Suspense>
        </div>
    )
}
