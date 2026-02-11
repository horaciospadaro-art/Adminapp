import { NextResponse } from 'next/server'
import { AccountingEngine } from '@/lib/services/accounting-engine'

const accountingEngine = new AccountingEngine()

export async function POST(request: Request) {
    try {
        const json = await request.json()
        // Expected payload: TransactionEvent
        const entry = await accountingEngine.createJournalEntry(json, 'A')
        return NextResponse.json(entry)
    } catch (error: any) {
        return NextResponse.json({ error: error.message || 'Failed to create transaction' }, { status: 500 })
    }
}
