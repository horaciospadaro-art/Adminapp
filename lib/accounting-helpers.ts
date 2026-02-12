
import { Prisma, DocumentType, JournalStatus } from '@prisma/client'

/**
 * Creates a Journal Entry for a Document (Invoice, Credit Note, Bill, etc.)
 * This handles the automatic accounting for the Revenue (Sales) and Expense (Purchases) cycles.
 */
export async function createDocumentJournalEntry(
    tx: Prisma.TransactionClient,
    documentId: string,
    companyId: string
) {
    const doc = await tx.document.findUnique({
        where: { id: documentId },
        include: {
            third_party: true,
            items: true
        }
    })

    if (!doc) throw new Error(`Document not found: ${documentId}`)
    if (doc.total.toNumber() === 0) return // No entry for zero amount? Maybe valid for tracking, but skipping for now.

    const isClient = doc.third_party.type === 'CLIENTE' || doc.third_party.type === 'AMBOS'
    const isSupplier = doc.third_party.type === 'PROVEEDOR' || doc.third_party.type === 'AMBOS'

    let lines: any[] = []
    const description = `${doc.type} #${doc.number} - ${doc.third_party.name}`

    // >>> REVENUE CYCLE (Sales) <<<
    if (doc.type === 'INVOICE' && isClient) {
        // 1. Debit Accounts Receivable (Customer)
        if (!doc.third_party.receivable_account_id) throw new Error('Client missing Receivable Account')

        lines.push({
            account_id: doc.third_party.receivable_account_id,
            debit: doc.total,
            credit: 0,
            description: `CxC: ${doc.number}`
        })

        // 2. Credit Sales Income (Subtotal)
        // Group by account to avoid multiple lines for same account if desired, or detailed.
        // Detailed is better for granular tracking.
        for (const item of doc.items) {
            if (!item.gl_account_id) throw new Error(`Item ${item.description} missing GL Account`)
            lines.push({
                account_id: item.gl_account_id,
                debit: 0,
                credit: item.total.sub(item.tax_amount), // Net amount
                description: `Venta: ${item.description}`
            })
        }

        // 3. Credit VAT Payable (Tax)
        if (doc.tax_amount.toNumber() > 0) {
            // Find Tax Account. Usually standardized. 
            // For now, assuming the items have tax_id, need to fetch Tax account.
            // We'll aggregate taxes by tax_id
            const taxGroups = new Map<string, Prisma.Decimal>()

            for (const item of doc.items) {
                if (item.tax_id && item.tax_amount.toNumber() > 0) {
                    const current = taxGroups.get(item.tax_id) || new Prisma.Decimal(0)
                    taxGroups.set(item.tax_id, current.add(item.tax_amount))
                }
            }

            for (const [taxId, amount] of taxGroups.entries()) {
                const tax = await tx.tax.findUnique({ where: { id: taxId } })
                if (!tax) throw new Error(`Tax not found: ${taxId}`)

                lines.push({
                    account_id: tax.gl_account_id,
                    debit: 0,
                    credit: amount,
                    description: `IVA Débito Fiscal`
                })
            }
        }

    } else if (doc.type === 'CREDIT_NOTE' && isClient) {
        // 1. Credit Accounts Receivable (Decrease Debt)
        if (!doc.third_party.receivable_account_id) throw new Error('Client missing Receivable Account')

        lines.push({
            account_id: doc.third_party.receivable_account_id,
            debit: 0,
            credit: doc.total,
            description: `Anul/Dev CxC: ${doc.number}`
        })

        // 2. Debit Sales Returns (or standard Income reversed)
        // If we have a specific "Sales Returns" account, we should use it. 
        // Ideally Product or Category has "Recall/Return Account". 
        // For now, we will Debit the SAME Income account to reverse it (Contra-Revenue).
        for (const item of doc.items) {
            if (!item.gl_account_id) throw new Error(`Item missing GL Account`)
            lines.push({
                account_id: item.gl_account_id,
                debit: item.total.sub(item.tax_amount),
                credit: 0,
                description: `Devolución: ${item.description}`
            })
        }

        // 3. Debit VAT Payable (Reverse Tax Liability)
        if (doc.tax_amount.toNumber() > 0) {
            const taxGroups = new Map<string, Prisma.Decimal>()

            for (const item of doc.items) {
                if (item.tax_id && item.tax_amount.toNumber() > 0) {
                    const current = taxGroups.get(item.tax_id) || new Prisma.Decimal(0)
                    taxGroups.set(item.tax_id, current.add(item.tax_amount))
                }
            }

            for (const [taxId, amount] of taxGroups.entries()) {
                const tax = await tx.tax.findUnique({ where: { id: taxId } })
                if (tax) {
                    lines.push({
                        account_id: tax.gl_account_id,
                        debit: amount,
                        credit: 0,
                        description: `Reverso IVA Débito Fiscal`
                    })
                }
            }
        }
    }

    // Create Header and Lines
    if (lines.length > 0) {
        const journal = await tx.journalEntry.create({
            data: {
                company_id: companyId,
                date: doc.accounting_date || doc.date,
                description: description,
                status: JournalStatus.POSTED, // Auto-post automated entries
                lines: {
                    create: lines
                }
            }
        })

        // Link to Document
        await tx.document.update({
            where: { id: documentId },
            data: { journal_entry_id: journal.id }
        })

        return journal
    }
}

/**
 * Creates Journal Entry for Payment Receipt (Collection)
 */
export async function createPaymentJournalEntry(
    tx: Prisma.TransactionClient,
    receiptId: string,
    bankAccountId: string | null, // If paying to bank
    cashAccountId: string | null, // If paying to cash
    companyId: string
) {
    const receipt = await tx.document.findUnique({
        where: { id: receiptId },
        include: { third_party: true }
    })
    if (!receipt) throw new Error('Receipt not found')

    // Debit Asset (Bank or Cash)
    let assetAccountId = null
    if (bankAccountId) {
        const bank = await tx.bankAccount.findUnique({ where: { id: bankAccountId } })
        assetAccountId = bank?.gl_account_id
    } else if (cashAccountId) {
        assetAccountId = cashAccountId
    }

    if (!assetAccountId) throw new Error('No Bank/Cash Account identified for payment')
    if (!receipt.third_party.receivable_account_id) throw new Error('Client missing Receivable Account')

    const journal = await tx.journalEntry.create({
        data: {
            company_id: companyId,
            date: receipt.date,
            description: `Cobro Recibo #${receipt.number}`,
            status: JournalStatus.POSTED,
            lines: {
                create: [
                    {
                        account_id: assetAccountId,
                        debit: receipt.total,
                        credit: 0,
                        description: `Ingreso Bancario/Caja`
                    },
                    {
                        account_id: receipt.third_party.receivable_account_id,
                        debit: 0,
                        credit: receipt.total,
                        description: `Abono a Cuenta Cliente`
                    }
                ]
            }
        }
    })

    await tx.document.update({
        where: { id: receiptId },
        data: { journal_entry_id: journal.id }
    })

    return journal
}

/**
 * Creates Journal Entry for Withholding
 */
export async function createWithholdingJournalEntry(
    tx: Prisma.TransactionClient,
    withholdingId: string,
    companyId: string
) {
    const w = await tx.withholding.findUnique({
        where: { id: withholdingId },
        include: { third_party: true, document: true }
    })
    if (!w) throw new Error('Withholding not found')

    // Debit: Withholding Tax Asset (We have credit against tax authority)
    // We need to look up the Tax account for this type. 
    // Assumption: The 'Tax' definition for RETENCION_IVA or similar should have the asset account.
    // Or we find a Tax record matching the type.
    const taxDef = await tx.tax.findFirst({
        where: {
            company_id: companyId,
            type: w.type // e.g. RETENCION_IVA
        }
    })

    if (!taxDef) throw new Error(`No Tax Definition found for ${w.type}`)

    if (!w.third_party.receivable_account_id) throw new Error('Client missing Receivable Account')

    const journal = await tx.journalEntry.create({
        data: {
            company_id: companyId,
            date: w.date,
            description: `Comp. Retención ${w.certificate_number} - ${w.third_party.name}`,
            status: JournalStatus.POSTED,
            lines: {
                create: [
                    {
                        account_id: taxDef.gl_account_id, // Asset Account
                        debit: w.amount,
                        credit: 0,
                        description: `Crédito Fiscal Retenido (${w.type})`
                    },
                    {
                        account_id: w.third_party.receivable_account_id, // Reduce Invoice Receivable
                        debit: 0,
                        credit: w.amount,
                        description: `Cruce con Retención Fact ${w.document.number}`
                    }
                ]
            }
        }
    })

    await tx.withholding.update({
        where: { id: withholdingId },
        data: { journal_entry_id: journal.id }
    })

    return journal
}
