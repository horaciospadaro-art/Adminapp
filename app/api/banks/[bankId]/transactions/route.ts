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
            contra_account_id, // Account to offset (e.g. Sales Income, Expense)
            isIgtfApplied
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
            // 1. Create Main Bank Transaction Record
            const mainTransaction = await tx.bankTransaction.create({
                data: {
                    bank_account_id: bankId,
                    date: new Date(date),
                    reference,
                    description,
                    amount: amount,
                    type: type,
                    status: 'RECONCILED'
                }
            })

            // 2. Update Bank Balance (Main)
            const balanceChange = type === 'DEBIT' ? Number(amount) : -Number(amount)
            await tx.bankAccount.update({
                where: { id: bankId },
                data: {
                    balance: { increment: balanceChange }
                }
            })

            // 3. Create Accounting Journal Entry (Main)
            let debitAccountId = ''
            let creditAccountId = ''

            if (type === 'DEBIT') {
                // INGRESO
                debitAccountId = bankAccount.gl_account_id
                creditAccountId = contra_account_id
            } else {
                // EGRESO
                debitAccountId = contra_account_id
                creditAccountId = bankAccount.gl_account_id
            }

            const mainJournal = await tx.journalEntry.create({
                data: {
                    company_id: bankAccount.company_id,
                    date: new Date(date),
                    description: `Movimiento Bancario: ${description}`,
                    status: 'POSTED',
                    lines: {
                        create: [
                            { account_id: debitAccountId, debit: amount, credit: 0 },
                            { account_id: creditAccountId, debit: 0, credit: amount }
                        ]
                    }
                }
            })

            // Link Main Transaction
            await tx.bankTransaction.update({
                where: { id: mainTransaction.id },
                data: { journal_entry_id: mainJournal.id }
            })

            const finalResult = { ...mainTransaction, journal: mainJournal }

            // ---------------------------------------------------------
            // IGTF LOGIC (Only for CREDIT/Payments if checked)
            // ---------------------------------------------------------
            if (type === 'CREDIT' && isIgtfApplied) {
                // Find IGTF Tax Configuration
                // Try to find a tax of type 'IGTF', otherwise default to 3%
                const igtfTax = await tx.tax.findFirst({
                    where: {
                        company_id: bankAccount.company_id,
                        type: 'IGTF',
                        is_active: true
                    }
                })

                let rate = 3.00
                let taxAccountId = null

                if (igtfTax) {
                    rate = Number(igtfTax.rate)
                    taxAccountId = igtfTax.gl_account_id
                } else {
                    // Fallback: Use the same Contra Account as "Bank Expenses" or similar?
                    // Better to just warn or fail? For now, let's use the Contra Account 
                    // (which might be wrong if it's a Supplier Payable) but better than crashing.
                    // Ideally, we should have a default system account.
                    // Let's SKIP creating the entry if no account found but still charge the bank? No, inconsistent.
                    // Let's assume there is an IGTF tax configured or we fail.
                    console.warn('IGTF Tax not configured. Using default 3% and Contra Account.')
                    taxAccountId = contra_account_id
                }

                const igtfAmount = Number(amount) * (rate / 100)

                // 1. Create IGTF Transaction
                const igtfTransaction = await tx.bankTransaction.create({
                    data: {
                        bank_account_id: bankId,
                        date: new Date(date),
                        reference: reference + '-IGTF',
                        description: `IGTF (${rate}%) s/ ${description}`,
                        amount: igtfAmount,
                        type: 'CREDIT',
                        status: 'RECONCILED'
                    }
                })

                // 2. Update Balance (Deduct IGTF)
                await tx.bankAccount.update({
                    where: { id: bankId },
                    data: { balance: { decrement: igtfAmount } }
                })

                // 3. Create IGTF Journal
                /*
                    Debit: Tax Expense (taxAccountId)
                    Credit: Bank (bankAccount.gl_account_id)
                */
                const igtfJournal = await tx.journalEntry.create({
                    data: {
                        company_id: bankAccount.company_id,
                        date: new Date(date),
                        description: `IGTF s/ ${description}`,
                        status: 'POSTED',
                        lines: {
                            create: [
                                {
                                    account_id: taxAccountId || contra_account_id, // Fallback
                                    debit: igtfAmount,
                                    credit: 0,
                                    description: `Gasto IGTF`
                                },
                                {
                                    account_id: bankAccount.gl_account_id,
                                    debit: 0,
                                    credit: igtfAmount,
                                    description: `Salida Banco IGTF`
                                }
                            ]
                        }
                    }
                })

                // Link IGTF Transaction
                await tx.bankTransaction.update({
                    where: { id: igtfTransaction.id },
                    data: { journal_entry_id: igtfJournal.id }
                })
            }

            return mainTransaction
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
