import prisma from '@/lib/db'
import { notFound } from 'next/navigation'
import { BankDetailsClient } from '@/components/banks/BankDetailsClient'

export const dynamic = 'force-dynamic'

async function getBankDetails(bankId: string) {
    const bank = await prisma.bankAccount.findUnique({
        where: { id: bankId },
        include: {
            // We use 'balance' field from BankAccount directly now, but we can also check gl_account
            transactions: {
                orderBy: { date: 'desc' },
                include: { journal_entry: true }
            }
        }
    })
    return bank
}

async function getAccounts(companyId: string) {
    // Fetch accounts that can be used as contra-accounts (Income, Expense, Liability, etc.)
    // For simplicity we fetch all non-root accounts
    // We should exclude the bank account itself ideally to avoid circular reference, but logic handles that via type check maybe.
    return await prisma.chartOfAccount.findMany({
        where: { company_id: companyId },
        orderBy: { code: 'asc' }
    })
}

export default async function BankDetailsPage(props: { params: Promise<{ bankId: string }> }) {
    const params = await props.params
    const bankRaw = await getBankDetails(params.bankId)

    if (!bankRaw) return notFound()

    const accounts = await getAccounts(bankRaw.company_id)

    const b = bankRaw as any

    // Serialize Decimal to number/string for Client Component
    const bank = {
        ...b,
        balance: Number(b.balance),
        transactions: b.transactions.map((tx: any) => ({
            ...tx,
            amount: Number(tx.amount),
            igtf_amount: Number(tx.igtf_amount)
        }))
    }

    return <BankDetailsClient bank={bank} accounts={accounts} />
}

