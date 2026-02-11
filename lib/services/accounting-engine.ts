import { AccountType } from '@prisma/client'
import prisma from '../db'

export type TransactionEvent = {
    companyId: string
    date: Date
    description: string
    lines: {
        accountCode: string // We use code to look up the ID dynamically
        debit: number
        credit: number
        description?: string // Line specific description
    }[]
}

export class AccountingEngine {

    /**
     * Creates a Journal Entry from a business event
     */
    async createJournalEntry(event: TransactionEvent, moduleCode: 'A' | 'B' | 'C' | 'I' | 'P' | 'F' = 'A') {
        // 1. Validate Balance
        const totalDebit = event.lines.reduce((sum, line) => sum + line.debit, 0)
        const totalCredit = event.lines.reduce((sum, line) => sum + line.credit, 0)

        if (Math.abs(totalDebit - totalCredit) > 0.01) {
            throw new Error(`Journal Entry is not balanced. Debit: ${totalDebit}, Credit: ${totalCredit}`)
        }

        // 2. Resolve Account IDs from Codes
        const linesWithIds = await Promise.all(event.lines.map(async (line) => {
            const account = await prisma.chartOfAccount.findUnique({
                where: {
                    company_id_code: {
                        company_id: event.companyId,
                        code: line.accountCode
                    }
                }
            })

            if (!account) {
                throw new Error(`Account code ${line.accountCode} not found for company ${event.companyId}`)
            }

            return {
                account_id: account.id,
                debit: line.debit,
                credit: line.credit,
                description: line.description || event.description
            }
        }))

        // 3. Create Entry in Database
        const entry = await prisma.journalEntry.create({
            data: {
                company_id: event.companyId,
                date: event.date,
                number: await this.generateCorrelative(event.companyId, event.date, moduleCode),
                description: event.description,
                status: 'POSTED', // Default to POSTED for auto-generated entries
                lines: {
                    create: linesWithIds
                }
            },
            include: {
                lines: true
            }
        })

        // 4. Update Account Balances (Primitive implementation, ideally this is aggregated or triggered)
        // for (const line of linesWithIds) {
        //   await this.updateAccountBalance(line.account_id, line.debit, line.credit)
        // }

        return entry
    }

    /**
     * Generates a correlative number: Xddmmaa-xxx
     * X: Module Code
     * ddmmaa: Date
     * xxx: Sequence (per day)
     */
    async generateCorrelative(companyId: string, date: Date, module: string): Promise<string> {
        // Format date: ddmmaa
        const d = new Date(date)
        const day = String(d.getDate()).padStart(2, '0')
        const month = String(d.getMonth() + 1).padStart(2, '0') // Month is 0-indexed
        const year = String(d.getFullYear()).slice(-2)

        const prefix = `${module}${day}${month}${year}-`

        // Find last entry for this prefix
        const lastEntry = await prisma.journalEntry.findFirst({
            where: {
                company_id: companyId,
                number: {
                    startsWith: prefix
                }
            },
            orderBy: {
                number: 'desc'
            },
            select: {
                number: true
            }
        })

        let sequence = 1
        if (lastEntry && lastEntry.number) {
            const parts = lastEntry.number.split('-')
            if (parts.length === 2) {
                const lastSeq = parseInt(parts[1], 10)
                if (!isNaN(lastSeq)) {
                    sequence = lastSeq + 1
                }
            }

        }

        const sequenceStr = String(sequence).padStart(3, '0')
        return `${prefix}${sequenceStr}`
    }
}
