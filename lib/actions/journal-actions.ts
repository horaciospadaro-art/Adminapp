'use server'

import prisma from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function getJournalEntryById(id: string) {
    const entry = await prisma.journalEntry.findUnique({
        where: { id },
        include: {
            lines: {
                orderBy: {
                    debit: 'desc' // Debits first usually
                }
            }
        }
    })
    return entry
}

export async function deleteJournalEntry(id: string) {
    try {
        await prisma.journalEntry.delete({
            where: { id }
        })
        revalidatePath('/dashboard/accounting')
        revalidatePath('/dashboard/accounting/reports/entries')
        return { success: true }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

export async function updateJournalEntry(id: string, data: any) {
    try {
        // Transaction to ensure atomicity
        await prisma.$transaction(async (tx) => {
            // 1. Delete existing lines
            await tx.journalLine.deleteMany({
                where: { entry_id: id }
            })

            // 2. Update Entry Header
            await tx.journalEntry.update({
                where: { id },
                data: {
                    date: data.date,
                    description: data.description,
                    // Lines are re-created below
                    lines: {
                        create: await Promise.all(data.lines.map(async (l: any) => {
                            // Check for leaf account
                            const account = await tx.chartOfAccount.findUnique({
                                where: { id: l.accountId },
                                include: { _count: { select: { children: true } } }
                            })

                            if (account && account._count.children > 0) {
                                throw new Error(`Cannot post to parent account ${account.code} (${account.name})`)
                            }

                            return {
                                account_id: l.accountId,
                                debit: l.debit,
                                credit: l.credit,
                                description: l.description
                            }
                        }))
                    }
                }
            })
        })

        revalidatePath('/dashboard/accounting')
        revalidatePath('/dashboard/accounting/reports/entries')
        return { success: true }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

/**
 * Indica si un asiento de factura de compra puede repararse agregando la línea de IVA Crédito Fiscal faltante.
 */
export async function getJournalEntryRepairIvaInfo(entryId: string) {
    const entry = await prisma.journalEntry.findUnique({
        where: { id: entryId },
        include: { lines: true }
    })
    if (!entry) return { canRepair: false, error: 'Asiento no encontrado' }

    const document = await prisma.document.findFirst({
        where: { journal_entry_id: entryId }
    })
    if (!document || document.tax_amount.toNumber() <= 0) {
        return { canRepair: false }
    }

    const ivaTax = await prisma.tax.findFirst({
        where: { company_id: entry.company_id, type: 'IVA' }
    })
    const creditoAccountId = ivaTax?.credito_fiscal_account_id ?? ivaTax?.gl_account_id
    if (!creditoAccountId) {
        return { canRepair: false, error: 'No hay impuesto IVA con cuenta Crédito Fiscal configurada' }
    }

    const hasIvaLine = entry.lines.some((l) => l.account_id === creditoAccountId)
    if (hasIvaLine) return { canRepair: false }

    const amount = document.tax_amount.toNumber()
    return { canRepair: true, amount, accountId: creditoAccountId }
}

/**
 * Agrega la línea de IVA Crédito Fiscal faltante a un asiento de factura de compra (reparación).
 */
export async function repairBillEntryAddMissingIvaLine(entryId: string) {
    const info = await getJournalEntryRepairIvaInfo(entryId)
    if (!info.canRepair || info.amount == null || !info.accountId) {
        return { success: false, error: info.error ?? 'No se puede reparar este asiento' }
    }

    await prisma.journalLine.create({
        data: {
            entry_id: entryId,
            account_id: info.accountId,
            debit: info.amount,
            credit: 0,
            description: 'IVA Crédito Fiscal (reparado)'
        }
    })

    revalidatePath('/dashboard/accounting')
    revalidatePath('/dashboard/accounting/reports/entries')
    return { success: true }
}
