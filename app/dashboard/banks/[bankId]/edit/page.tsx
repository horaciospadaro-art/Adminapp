import prisma from '@/lib/db'
import { PageHeader } from '@/components/ui/PageHeader'
import { BankForm } from '@/components/banks/BankForm'
import { notFound } from 'next/navigation'

interface EditBankPageProps {
    params: Promise<{ bankId: string }>
}

export default async function EditBankPage({ params }: EditBankPageProps) {
    const { bankId } = await params

    const bank = await prisma.bankAccount.findUnique({
        where: { id: bankId }
    })

    if (!bank) {
        notFound()
    }

    return (
        <div className="max-w-3xl mx-auto">
            <PageHeader title={`Editar ${bank.bank_name}`} />
            <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-8">
                <BankForm
                    initialData={{
                        id: bank.id,
                        bank_name: bank.bank_name,
                        account_number: bank.account_number,
                        type: bank.type,
                        currency: bank.currency,
                        balance: Number(bank.balance)
                    }}
                    isEdit={true}
                />
            </div>
        </div>
    )
}
