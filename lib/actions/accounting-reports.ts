
'use server'

import prisma from '@/lib/db'
import { Prisma } from '@prisma/client'

export interface LedgerMovement {
    id: string
    date: Date
    description: string
    reference: string | null
    debit: number
    credit: number
    balance: number
    entryNumber: string | null
}

export interface LedgerResult {
    accountName: string
    accountCode: string
    initialBalance: number
    movements: LedgerMovement[]
    finalBalance: number
}

export async function getAnalyticalLedger({
    companyId,
    startDate,
    endDate,
    accountId
}: {
    companyId: string
    startDate: Date
    endDate: Date
    accountId: string
}) {
    // 1. Get Account Info
    const account = await prisma.chartOfAccount.findUnique({
        where: { id: accountId }
    })

    if (!account) throw new Error('Account not found')

    // 2. Calculate Initial Balance (Movements before startDate)
    // Note: This needs to respect fiscal year or be a running total from the beginning of time?
    // Usually running total from beginning of time or since last closed period. 
    // Assuming simple running total for now.

    const previousLines = await prisma.journalLine.aggregate({
        where: {
            account_id: accountId,
            entry: {
                company_id: companyId,
                date: { lt: startDate },
                status: 'POSTED'
            }
        },
        _sum: {
            debit: true,
            credit: true
        }
    })

    const initialAllocated = (Number(previousLines._sum.debit || 0) - Number(previousLines._sum.credit || 0))
    // Adjust based on account type? Assuming Assets/Expenses are +Debit, Liab/Income are +Credit?
    // For a ledger, usually we stick to Debit/Credit columns or a generic Balance = Debit - Credit.
    // Let's stick to standard DB storage: Debit is +, Credit is -.
    // But for display, Asset/Exp: Bal = Deb - Cred. Liab/Inc/Eq: Bal = Cred - Deb.

    // Actually, let's just return the raw running balance (Debit - Credit) and let UI handle display sign if needed.
    // Or simpler: Standard accounting systems often show Debit/Credit columns and a running balance column.
    // Let's assume Balance = Initial + Sum(Debit - Credit) so far.
    let runningBalance = initialAllocated

    // 3. Get Movements in Range
    const movements = await prisma.journalLine.findMany({
        where: {
            account_id: accountId,
            entry: {
                company_id: companyId,
                date: {
                    gte: startDate,
                    lte: endDate
                },
                status: 'POSTED'
            }
        },
        include: {
            entry: {
                select: {
                    date: true,
                    number: true,
                    description: true
                }
            }
        },
        orderBy: {
            entry: {
                date: 'asc'
            }
        }
    })

    const ledgerMovements: LedgerMovement[] = movements.map((m: any) => {
        const debit = Number(m.debit)
        const credit = Number(m.credit)
        runningBalance += (debit - credit)

        return {
            id: m.id,
            date: m.entry.date,
            description: m.description || m.entry.description,
            reference: m.entry.number,
            debit,
            credit,
            balance: runningBalance,
            entryNumber: m.entry.number
        }
    })

    return {
        accountName: account.name,
        accountCode: account.code,
        initialBalance: initialAllocated,
        movements: ledgerMovements,
        finalBalance: runningBalance
    } as LedgerResult
}

export async function getJournalEntryList({
    companyId,
    startDate,
    endDate
}: {
    companyId: string
    startDate: Date
    endDate: Date
}) {
    const entries = await prisma.journalEntry.findMany({
        where: {
            company_id: companyId,
            date: {
                gte: startDate,
                lte: endDate
            }
        },
        include: {
            lines: {
                include: {
                    account: true
                }
            }
        },
        orderBy: {
            date: 'asc'
        }
    })

    return entries
}

export async function getLegalJournal({
    companyId,
    month,
    year
}: {
    companyId: string
    month: number // 1-12
    year: number
}) {
    // Construct start and end of month
    const start = new Date(year, month - 1, 1)
    const end = new Date(year, month, 0) // Last day of month

    const entries = await prisma.journalEntry.findMany({
        where: {
            company_id: companyId,
            date: {
                gte: start,
                lte: end
            },
            status: 'POSTED' // Only Posted for Legal Journal
        },
        include: {
            lines: {
                include: {
                    account: true
                }
            }
        },
        orderBy: {
            number: 'asc' // Legal Journal usually ordered by correlative number
        }
    })

    return entries
}
