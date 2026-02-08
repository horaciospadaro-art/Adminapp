import { NextResponse } from 'next/server'
import prisma from '@/lib/db'

// POST: Create a new bank transaction AND update accounting
export async function POST(
    request: Request,
    { params }: { params: Promise<{ bankId: string }> }
) {
    try {
        const { bankId } = await params
        const body = await request.json()
        const {
            date,
            reference,
            description,
            amount,
            type, // DEBIT or CREDIT
            contra_account_id // Account to offset (e.g. Sales Income, Expense)
        } = body

        if (!date || !description || !amount || !type || !contra_account_id) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        // Get Bank Details to find its GL Account
        const bankAccount = await prisma.bankAccount.findUnique({
            where: { id: bankId },
            include: { gl_account: true }
        })

        if (!bankAccount) {
            return NextResponse.json({ error: 'Bank account not found' }, { status: 404 })
        }

        // Transaction Logic
        const result = await prisma.$transaction(async (tx) => {
            // 1. Create Bank Transaction Record
            const bankIdx = await tx.bankTransaction.create({
                data: {
                    bank_account_id: bankId,
                    date: new Date(date),
                    reference,
                    description,
                    amount: amount,
                    type: type, // DEBIT (Increase Asset) or CREDIT (Decrease Asset) ??? 
                    // WAIT. Standard Banking: Credit = Increase, Debit = Decrease? 
                    // OR Accounting: Asset Debit = Increase.
                    // Let's assume 'type' here refers to ACCOUNTING terms for consistency since this is an ERP.
                    // DEBIT = Ingreso (Aumento de Activo)
                    // CREDIT = Egreso (Disminución de Activo)
                    status: 'RECONCILED'
                }
            })

            // 2. Update Bank Balance
            // If DEBIT (Ingreso), add amount. If CREDIT (Egreso), subtract.
            const balanceChange = type === 'DEBIT' ? Number(amount) : -Number(amount)
            await tx.bankAccount.update({
                where: { id: bankId },
                data: {
                    balance: { increment: balanceChange }
                }
            })

            // 3. Create Accounting Journal Entry
            // We need to know which one is Debit and which is Credit based on transaction type.

            let debitAccountId = ''
            let creditAccountId = ''

            if (type === 'DEBIT') {
                // INGRESO: Banco (Activo) aumenta al Debe. Contra cuenta al Haber.
                debitAccountId = bankAccount.gl_account_id
                creditAccountId = contra_account_id
            } else {
                // EGRESO: Banco (Activo) disminuye al Haber. Contra cuenta al Debe.
                debitAccountId = contra_account_id
                creditAccountId = bankAccount.gl_account_id
            }

            const journal = await tx.journalEntry.create({
                data: {
                    company_id: bankAccount.company_id,
                    date: new Date(date),
                    description: `Movimiento Bancario: ${description}`,
                    status: 'POSTED',
                    lines: {
                        create: [
                            {
                                account_id: debitAccountId,
                                debit: amount,
                                credit: 0
                            },
                            {
                                account_id: creditAccountId,
                                debit: 0,
                                credit: amount
                            }
                        ]
                    }
                }
            })

            // 4. Link Transaction to Journal
            await tx.bankTransaction.update({
                where: { id: bankIdx.id },
                data: { journal_entry_id: journal.id }
            })

            return bankIdx
        })

        return NextResponse.json(result)

    } catch (error) {
        console.error('Error creating transaction:', error)
        return NextResponse.json({ error: 'Error creating transaction' }, { status: 500 })
    }
}

// GET: List transactions for this bank
export async function GET(
    request: Request,
    { params }: { params: Promise<{ bankId: string }> }
) {
    try {
        const { bankId } = await params
        const transactions = await prisma.bankTransaction.findMany({
            where: { bank_account_id: bankId },
            orderBy: { date: 'desc' },
            include: { journal_entry: true }
        })
        return NextResponse.json(transactions)
    } catch (error) {
        return NextResponse.json({ error: 'Error fetching transactions' }, { status: 500 })
    }
}
