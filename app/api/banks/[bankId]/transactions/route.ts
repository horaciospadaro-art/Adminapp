import { NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { generateJournalEntryNumber } from '@/lib/services/accounting-engine'

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
            related_bank_account_id, // For transfers
            allocations // Array of { documentId: string, amount: number }
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

        const result = await prisma.$transaction(async (tx: any) => {
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

            const txDate = new Date(date)
            const mainJournal = await tx.journalEntry.create({
                data: {
                    company_id: bankAccount.company_id,
                    date: txDate,
                    number: await generateJournalEntryNumber(tx, bankAccount.company_id, txDate, 'B'),
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
            // PAYMENT ALLOCATION (Allocating to Invoices/Bills)
            // ---------------------------------------------------------
            if (allocations && Array.isArray(allocations) && allocations.length > 0) {
                // Create a Payment Document (Receipt) to track these allocations?
                // For simplicity, we will link the allocations directly to the transaction's journal entry?
                // The schema requires a `payment_id` which is a Document.

                // Strategy: Create a Document of type RECEIPT (for DEBIT) or PAYMENT (for CREDIT)
                // This document represents the bank transaction in the documents module.

                const docType = type === 'DEBIT' ? 'RECEIPT' : 'PAYMENT'

                // Get third party from first allocation (assuming single customer/supplier per transaction for now, or mix?)
                // Ideally we should group by third party, but let's take the first one found or create a generic one?
                // Actually, if we selected multiple customers, we might need multiple Receipts.
                // Simplified approach: One Receipt per Transaction (if possible), but Receipt needs a single `third_party_id`.

                // New Approach: Iterate allocations and group by document's third_party_id.
                // But we don't have document details here.
                // We'd need to fetch them.

                for (const allocation of allocations) {
                    const { documentId, amount } = allocation
                    const allocAmount = Number(amount)

                    if (allocAmount <= 0) continue

                    // Fetch Invoice/Bill
                    const invoice = await tx.document.findUnique({
                        where: { id: documentId }
                    })

                    if (!invoice) continue

                    // Update Invoice Balance
                    const newBalance = Number(invoice.balance) - allocAmount
                    const newStatus = newBalance <= 0.01 ? 'PAID' : 'PARTIAL' // Tolerance for float errors

                    await tx.document.update({
                        where: { id: documentId },
                        data: {
                            balance: newBalance,
                            status: newStatus
                        }
                    })

                    // Create Payment Document (Receipt) if it doesn't exist for this flow?
                    // We need a Document to satisfy `PaymentAllocation.payment_id`.
                    // We can create a "Ghost" payment document linked to the Journal Entry.
                    // But we can't create multiple documents for one JE easily if valid constraints exist (JE 1:1 Doc?).
                    // Checking schema: `Document.journal_entry_id` is @unique.
                    // So we can only have ONE document linked to this JE.
                    // This implies 1 BankTransaction = 1 JournalEntry = 1 Document (Receipt/Payment).

                    // IF there are multiple customers, this breaks the 1 Document = 1 Third Party rule.
                    // Unless we create a "Various" third party?
                    // OR we create multiple Journal Entries?

                    // For now, let's assume 1 Bank Transaction -> 1 Payment Document -> Allocations.
                    // If multiple customers, we'd need to handle that complexity.
                    // Let's create the Payment Document linked to the Invoice's third party.

                    // Check if we already created a Payment Document for this transaction/JE?
                    // We can try to upsert a collection of payment documents? 
                    // No, `PaymentAllocation` needs `payment_id`.

                    // Let's create a Payment Document for EACH allocation? 
                    // No, that would mean multiple documents. Can they all point to the same JE? No.
                    // So they can't point to the JE.

                    // Can we create a Payment Document WITHOUT a JE?
                    // Yes, `journal_entry_id` is nullable on Document.
                    // So we can create Payment Documents that are just wrappers for the allocation, 
                    // while the GL impact is handled by the Bank Transaction's JE.

                    // This seems the most flexible way. The Bank Transaction handles the GL.
                    // The Payment Documents track the "Receipt" and link to the Invoice.

                    const paymentDoc = await tx.document.create({
                        data: {
                            company_id: bankAccount.company_id,
                            third_party_id: invoice.third_party_id,
                            type: docType, // RECEIPT or PAYMENT
                            date: new Date(date),
                            number: reference + '-' + documentId.slice(0, 4), // Unique-ish number
                            reference: reference,
                            subtotal: allocAmount,
                            tax_amount: 0,
                            total: allocAmount,
                            balance: 0,
                            status: 'PAID',
                            notes: `Allocated from Bank Transaction: ${description}`,
                            currency_code: bankAccount.currency
                            // No journal_entry_id, as the bank tx holds it.
                        }
                    })

                    // Create Allocation Record
                    await tx.paymentAllocation.create({
                        data: {
                            payment_id: paymentDoc.id,
                            invoice_id: invoice.id,
                            amount: allocAmount
                        }
                    })
                }
            }

            // ---------------------------------------------------------
            // IGTF LOGIC (Only for CREDIT/Payments in USD if checked)
            // ---------------------------------------------------------
            if (type === 'CREDIT' && bankAccount.currency === 'USD' && isIgtfApplied) {
                // Find IGTF Tax Configuration
                let rate = 3.00
                const taxAccountId = await getIgtfAccountId(tx, bankAccount.company_id)

                // If we want the specific rate from the Tax table, we can fetch it, 
                // but usually IGTF is fixed or we can trust the default 3% if not found.
                // However, to be precise, let's try to get the rate from a Tax record if it exists.
                const igtfTax = await tx.tax.findFirst({
                    where: { company_id: bankAccount.company_id, type: 'IGTF', is_active: true }
                })
                if (igtfTax) rate = Number(igtfTax.rate)

                if (!taxAccountId) {
                    console.warn('No IGTF tax account configured. Skipping IGTF.')
                    return mainTransaction
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
                const igtfDate = new Date(date)
                const igtfJournal = await tx.journalEntry.create({
                    data: {
                        company_id: bankAccount.company_id,
                        date: igtfDate,
                        number: await generateJournalEntryNumber(tx, bankAccount.company_id, igtfDate, 'B'),
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
    return await prisma.$transaction(async (tx: any) => {
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
                number: await generateJournalEntryNumber(tx, sourceBankAccount.company_id, data.date, 'B'),
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
                where: { company_id: sourceBankAccount.company_id, type: 'IGTF', is_active: true }
            })
            const rate = igtfTax ? Number(igtfTax.rate) : 3.00

            const taxAccountId = await getIgtfAccountId(tx, sourceBankAccount.company_id)
            const igtfAmount = data.amount * (rate / 100)

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
                        number: await generateJournalEntryNumber(tx, sourceBankAccount.company_id, data.date, 'B'),
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

// Helper: Resolve IGTF Account ID with fallback priority
async function getIgtfAccountId(tx: any, companyId: string): Promise<string | null> {
    // 1. Check Global Configuration
    const globalConfig = await tx.globalTaxConfiguration.findUnique({
        where: { company_id: companyId }
    })
    if (globalConfig?.igtf_account_id) return globalConfig.igtf_account_id

    // 2. Check existing Tax definition (legacy fallback)
    const igtfTax = await tx.tax.findFirst({
        where: { company_id: companyId, type: 'IGTF', is_active: true }
    })
    if (igtfTax?.gl_account_id) return igtfTax.gl_account_id

    // 3. Last resort: Search by name
    const account = await tx.chartOfAccount.findFirst({
        where: { company_id: companyId, name: { contains: 'IGTF', mode: 'insensitive' } }
    })
    return account?.id || null
}
