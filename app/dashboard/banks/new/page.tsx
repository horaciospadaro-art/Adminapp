'use client'

import { PageHeader } from '@/components/ui/PageHeader'
import { BankForm } from '@/components/banks/BankForm'

export default function NewBankAccountPage() {
    return (
        <div className="max-w-3xl mx-auto">
            <PageHeader title="Nueva Cuenta Bancaria" />
            <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-8">
                <BankForm />
            </div>
        </div>
    )
}
