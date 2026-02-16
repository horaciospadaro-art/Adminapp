'use server'

import prisma from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { resyncJournalEntryFromDocument } from '@/lib/accounting-helpers'

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
 * Indica si el asiento puede resincronizarse con la transacción que lo originó (p. ej. factura de compra).
 */
export async function getJournalEntryResyncInfo(entryId: string) {
    const entry = await prisma.journalEntry.findUnique({ where: { id: entryId } })
    if (!entry) return { canResync: false, error: 'Asiento no encontrado' }

    const document = await prisma.document.findFirst({
        where: { journal_entry_id: entryId },
        include: { third_party: true }
    })
    if (!document) return { canResync: false }

    const isBill = document.type === 'BILL' || document.type === 'CREDIT_NOTE'
    if (!isBill) return { canResync: false }

    const sourceDescription = `${document.type} #${document.number ?? document.id} - ${document.third_party?.name ?? 'Proveedor'}`
    return { canResync: true, sourceDescription }
}

/**
 * Resincroniza el asiento con la factura/documento que lo originó.
 * Recalcula todas las líneas desde el documento para que el asiento sea un reflejo fiel.
 */
export async function resyncJournalEntryWithSource(entryId: string) {
    try {
        await prisma.$transaction(async (tx) => {
            await resyncJournalEntryFromDocument(tx, entryId)
        })
        revalidatePath('/dashboard/accounting')
        revalidatePath('/dashboard/accounting/reports/entries')
        return { success: true }
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Error al resincronizar'
        return { success: false, error: message }
    }
}
