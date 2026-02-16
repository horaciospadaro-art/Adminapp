
'use server'

import prisma from '@/lib/db'
import { Prisma } from '@prisma/client'

export interface LedgerMovement {
    id: string
    date: string // ISO string for RSC serialization
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
    if (account.company_id !== companyId) throw new Error('Account not found for this company')

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
                    // @ts-ignore
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
        const date = m.entry?.date
        const dateStr = date instanceof Date ? date.toISOString() : (date ? String(date) : '')

        return {
            id: m.id,
            date: dateStr,
            description: (m.description || m.entry?.description) ?? '',
            reference: m.entry?.number ?? null,
            debit,
            credit,
            balance: runningBalance,
            entryNumber: m.entry?.number ?? null
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

/**
 * Mayor analítico para un rango de cuentas (en cascada por código).
 * Incluye todas las cuentas con code >= fromCode y code <= toCode, en orden jerárquico.
 */
export async function getAnalyticalLedgerRange({
    companyId,
    startDate,
    endDate,
    accountIdFrom,
    accountIdTo
}: {
    companyId: string
    startDate: Date
    endDate: Date
    accountIdFrom: string
    accountIdTo: string
}): Promise<LedgerResult[]> {
    const accountFrom = await prisma.chartOfAccount.findUnique({ where: { id: accountIdFrom } })
    const accountTo = await prisma.chartOfAccount.findUnique({ where: { id: accountIdTo } })

    if (!accountFrom || !accountTo) throw new Error('Cuenta no encontrada')
    if (accountFrom.company_id !== companyId || accountTo.company_id !== companyId) {
        throw new Error('Cuenta no pertenece a esta empresa')
    }

    const fromCode = accountFrom.code
    const toCode = accountTo.code
    if (fromCode > toCode) {
        throw new Error('La cuenta "Desde" debe tener código menor o igual que la cuenta "Hasta"')
    }

    const allAccounts = await prisma.chartOfAccount.findMany({
        where: { company_id: companyId },
        orderBy: { code: 'asc' }
    })

    const accountsInRange = allAccounts.filter(
        (a) => a.code >= fromCode && a.code <= toCode
    )

    if (accountsInRange.length === 0) return []

    const results: LedgerResult[] = []

    for (const account of accountsInRange) {
        const single = await getAnalyticalLedger({
            companyId,
            startDate,
            endDate,
            accountId: account.id
        })
        results.push(single)
    }

    return results
}

/** Serializable entry for RSC (dates as ISO strings, numbers not Decimal) */
export interface JournalEntryListItem {
    id: string
    date: string
    number: string | null
    description: string
    status: string
    lines: { id: string; debit: number; credit: number; account: { id: string; code: string; name: string } }[]
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
    const endOfDay = new Date(endDate)
    endOfDay.setHours(23, 59, 59, 999)

    const entries = await prisma.journalEntry.findMany({
        where: {
            company_id: companyId,
            date: {
                gte: startDate,
                lte: endOfDay
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

    return entries.map((entry): JournalEntryListItem => ({
        id: entry.id,
        date: entry.date instanceof Date ? entry.date.toISOString() : String(entry.date),
        number: entry.number,
        description: entry.description ?? '',
        status: entry.status,
        lines: entry.lines.map((line) => ({
            id: line.id,
            debit: Number(line.debit),
            credit: Number(line.credit),
            account: {
                id: line.account.id,
                code: line.account.code,
                name: line.account.name
            }
        }))
    }))
}

/** Serializable legal journal entry for RSC */
export interface LegalJournalEntry {
    id: string
    date: string
    number: string | null
    description: string
    status: string
    lines: { id: string; debit: number; credit: number; description: string | null; account: { id: string; code: string; name: string } }[]
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
    const start = new Date(year, month - 1, 1)
    const end = new Date(year, month, 0)
    end.setHours(23, 59, 59, 999)

    const entries = await prisma.journalEntry.findMany({
        where: {
            company_id: companyId,
            date: { gte: start, lte: end },
            status: 'POSTED'
        },
        include: {
            lines: {
                include: { account: true }
            }
        },
        orderBy: { date: 'asc' }
    })

    return entries.map((entry): LegalJournalEntry => ({
        id: entry.id,
        date: entry.date instanceof Date ? entry.date.toISOString() : String(entry.date),
        number: entry.number,
        description: entry.description ?? '',
        status: entry.status,
        lines: entry.lines.map((line) => ({
            id: line.id,
            debit: Number(line.debit),
            credit: Number(line.credit),
            description: line.description,
            account: {
                id: line.account.id,
                code: line.account.code,
                name: line.account.name
            }
        }))
    }))
}
