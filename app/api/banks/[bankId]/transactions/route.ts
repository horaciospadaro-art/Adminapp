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
            subtype, // DEPOSIT, WITHDRAWAL, TRANSFER_OUT, etc.
            contra_account_id, // Account to offset (e.g. Sales Income, Expense)
            isIgtfApplied,
            related_bank_account_id // For transfers
        } = body

        if (!date || !description || !amount || !type || !subtype) {
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

        // Handle Transfer logic separately
        if (subtype === 'TRANSFER_OUT') {
            if (!related_bank_account_id) {
                return NextResponse.json({ error: 'Target bank account required for transfers' }, { status: 400 })
            }

            const result = await handleTransfer(bankAccount, {
                targetBankId: related_bank_account_id,
                date: new Date(date),
                reference,
                description,
                amount: Number(amount),
                isIgtfApplied: bankAccount.currency === 'USD' && isIgtfApplied
            })

            return NextResponse.json(result)
        }

        // Handle regular transaction (Deposit, Withdrawal, Debit/Credit Note)
        if (!contra_account_id) {
            return NextResponse.json({ error: 'Contra account required' }, { status: 400 })
        }

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
                    subtype: subtype,
                    status: 'RECONCILED',
                    is_igtf_applied: isIgtfApplied || false,
                    igtf_amount: 0 // Will be set by IGTF logic if applicable
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
                // INGRESO (Deposit, Debit Note)
                debitAccountId = bankAccount.gl_account_id
                creditAccountId = contra_account_id
            } else {
                // EGRESO (Withdrawal, Credit Note)
                debitAccountId = contra_account_id
                creditAccountId = bankAccount.gl_account_id
            }

            const mainJournal = await tx.journalEntry.create({
                data: {
                    company_id: bankAccount.company_id,
                    date: new Date(date),
                    description: `${getSubtypeLabel(subtype)}: ${description}`,
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

            // ---------------------------------------------------------
            // IGTF LOGIC (Only for CREDIT/Payments in USD if checked)
            // ---------------------------------------------------------
            if (type === 'CREDIT' && bankAccount.currency === 'USD' && isIgtfApplied) {
                // Find IGTF Tax Configuration
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
                    // Try to find an IGTF account by name
                    const igtfAccount = await tx.chartOfAccount.findFirst({
                        where: {
                            company_id: bankAccount.company_id,
                            name: { contains: 'IGTF', mode: 'insensitive' }
                        }
                    })

                    if (igtfAccount) {
                        taxAccountId = igtfAccount.id
                    } else {
                        console.warn('No IGTF tax or account configured. Skipping IGTF.')
                        return mainTransaction
                    }
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
                        subtype: 'OTHER',
                        status: 'RECONCILED',
                        is_igtf_applied: true,
                        igtf_amount: igtfAmount
                    }
                })

                // 2. Update Balance (Deduct IGTF)
                await tx.bankAccount.update({
                    where: { id: bankId },
                    data: { balance: { decrement: igtfAmount } }
                })

                // 3. Create IGTF Journal Entry
                const igtfJournal = await tx.journalEntry.create({
                    data: {
                        company_id: bankAccount.company_id,
                        date: new Date(date),
                        description: `IGTF ${rate}% s/ ${description}`,
                        status: 'POSTED',
                        lines: {
                            create: [
                                {
                                    account_id: taxAccountId,
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

                // Update main transaction with IGTF amount
                await tx.bankTransaction.update({
                    where: { id: mainTransaction.id },
                    data: { igtf_amount: igtfAmount }
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

// Helper function to handle bank-to-bank transfers
async function handleTransfer(
    sourceBankAccount: any,
    data: {
        targetBankId: string
        date: Date
        reference: string
        description: string
        amount: number
        isIgtfApplied: boolean
    }
) {
    return await prisma.$transaction(async (tx) => {
        // Get target bank account
        const targetBankAccount = await tx.bankAccount.findUnique({
            where: { id: data.targetBankId },
            include: { gl_account: true }
        })

        if (!targetBankAccount) {
            throw new Error('Target bank account not found')
        }

        // 1. Create TRANSFER_OUT transaction
        const transferOut = await tx.bankTransaction.create({
            data: {
                bank_account_id: sourceBankAccount.id,
                date: data.date,
                reference: data.reference,
                description: `Transferencia a ${targetBankAccount.bank_name}: ${data.description}`,
                amount: data.amount,
                type: 'CREDIT',
                subtype: 'TRANSFER_OUT',
                status: 'RECONCILED',
                related_bank_account_id: data.targetBankId,
                is_igtf_applied: data.isIgtfApplied,
                igtf_amount: 0
            }
        })

        // 2. Create TRANSFER_IN transaction
        const transferIn = await tx.bankTransaction.create({
            data: {
                bank_account_id: data.targetBankId,
                date: data.date,
                reference: data.reference,
                description: `Transferencia desde ${sourceBankAccount.bank_name}: ${data.description}`,
                amount: data.amount,
                type: 'DEBIT',
                subtype: 'TRANSFER_IN',
                status: 'RECONCILED',
                related_bank_account_id: sourceBankAccount.id
            }
        })

        // 3. Update balances
        await tx.bankAccount.update({
            where: { id: sourceBankAccount.id },
            data: { balance: { decrement: data.amount } }
        })

        await tx.bankAccount.update({
            where: { id: data.targetBankId },
            data: { balance: { increment: data.amount } }
        })

        // 4. Create journal entry
        const journalEntry = await tx.journalEntry.create({
            data: {
                company_id: sourceBankAccount.company_id,
                date: data.date,
                description: `Transferencia: ${sourceBankAccount.bank_name} → ${targetBankAccount.bank_name}`,
                status: 'POSTED',
                lines: {
                    create: [
                        {
                            account_id: targetBankAccount.gl_account_id,
                            debit: data.amount,
                            credit: 0,
                            description: `Entrada ${targetBankAccount.bank_name}`
                        },
                        {
                            account_id: sourceBankAccount.gl_account_id,
                            debit: 0,
                            credit: data.amount,
                            description: `Salida ${sourceBankAccount.bank_name}`
                        }
                    ]
                }
            }
        })

        // Link transactions to journal entry
        await tx.bankTransaction.update({
            where: { id: transferOut.id },
            data: { journal_entry_id: journalEntry.id }
        })

        // Handle IGTF if applicable (on USD transfers)
        if (data.isIgtfApplied && sourceBankAccount.currency === 'USD') {
            const igtfTax = await tx.tax.findFirst({
                where: {
                    company_id: sourceBankAccount.company_id,
                    type: 'IGTF',
                    is_active: true
                }
            })

            const rate = igtfTax ? Number(igtfTax.rate) : 3.00
            const igtfAmount = data.amount * (rate / 100)

            const taxAccountId = igtfTax?.gl_account_id || (await tx.chartOfAccount.findFirst({
                where: {
                    company_id: sourceBankAccount.company_id,
                    name: { contains: 'IGTF', mode: 'insensitive' }
                }
            }))?.id

            if (taxAccountId) {
                // Create IGTF transaction
                const igtfTransaction = await tx.bankTransaction.create({
                    data: {
                        bank_account_id: sourceBankAccount.id,
                        date: data.date,
                        reference: data.reference + '-IGTF',
                        description: `IGTF (${rate}%) s/ transferencia`,
                        amount: igtfAmount,
                        type: 'CREDIT',
                        subtype: 'OTHER',
                        status: 'RECONCILED',
                        is_igtf_applied: true,
                        igtf_amount: igtfAmount
                    }
                })

                // Update balance
                await tx.bankAccount.update({
                    where: { id: sourceBankAccount.id },
                    data: { balance: { decrement: igtfAmount } }
                })

                // Create IGTF journal
                const igtfJournal = await tx.journalEntry.create({
                    data: {
                        company_id: sourceBankAccount.company_id,
                        date: data.date,
                        description: `IGTF ${rate}% s/ transferencia`,
                        status: 'POSTED',
                        lines: {
                            create: [
                                {
                                    account_id: taxAccountId,
                                    debit: igtfAmount,
                                    credit: 0,
                                    description: `Gasto IGTF`
                                },
                                {
                                    account_id: sourceBankAccount.gl_account_id,
                                    debit: 0,
                                    credit: igtfAmount,
                                    description: `Salida Banco IGTF`
                                }
                            ]
                        }
                    }
                })

                await tx.bankTransaction.update({
                    where: { id: igtfTransaction.id },
                    data: { journal_entry_id: igtfJournal.id }
                })

                // Update transferOut with IGTF amount
                await tx.bankTransaction.update({
                    where: { id: transferOut.id },
                    data: { igtf_amount: igtfAmount }
                })
            }
        }

        return { transferOut, transferIn }
    })
}

// Helper function to get subtype label
function getSubtypeLabel(subtype: string): string {
    const labels: Record<string, string> = {
        'DEPOSIT': 'Depósito',
        'WITHDRAWAL': 'Retiro',
        'TRANSFER_OUT': 'Transferencia Enviada',
        'TRANSFER_IN': 'Transferencia Recibida',
        'DEBIT_NOTE': 'Nota de Débito',
        'CREDIT_NOTE': 'Nota de Crédito',
        'OTHER': 'Otro'
    }
    return labels[subtype] || subtype
}
