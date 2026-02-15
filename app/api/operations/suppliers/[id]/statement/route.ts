
import { NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { DocumentType, WithholdingDirection } from '@prisma/client'

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { searchParams } = new URL(request.url)
        const { id: supplierId } = await params
        const startDateParam = searchParams.get('startDate')
        const endDateParam = searchParams.get('endDate')

        // Default range: Last 30 days if not specified, or start of time
        const endDate = endDateParam ? new Date(endDateParam) : new Date()
        // If no start date, we don't calculate "initial balance" in the traditional sense, just show all history?
        // Better to default to start of current month or year. Let's say 30 days.
        const startDate = startDateParam ? new Date(startDateParam) : new Date(new Date().setDate(endDate.getDate() - 30))

        if (!supplierId) {
            return NextResponse.json({ error: 'Supplier ID required' }, { status: 400 })
        }

        // 1. Calculate Initial Balance (All movements before startDate)
        // Balance = Bills (Credit) - Payments (Debit) - Retentions (Debit) - Credit Notes (Debit) + Debit Notes (Credit)

        // Fetch all documents before startDate
        const prevDocs = await prisma.document.findMany({
            where: {
                third_party_id: supplierId,
                date: { lt: startDate },
                type: { in: [DocumentType.BILL, DocumentType.PAYMENT, DocumentType.CREDIT_NOTE, DocumentType.DEBIT_NOTE] }
            },
            select: { type: true, total: true }
        })

        const prevRetentions = await prisma.withholding.findMany({
            where: {
                third_party_id: supplierId,
                direction: WithholdingDirection.ISSUED,
                date: { lt: startDate }
            },
            select: { amount: true }
        })

        let initialBalance = 0

        prevDocs.forEach((doc: any) => {
            const amount = Number(doc.total)
            if (doc.type === DocumentType.BILL || doc.type === DocumentType.DEBIT_NOTE) {
                initialBalance += amount // Increases Debt
            } else {
                initialBalance -= amount // Decreases Debt (Payment, Credit Note)
            }
        })

        prevRetentions.forEach((ret: any) => {
            initialBalance -= Number(ret.amount)
        })

        // 2. Fetch Movements within range
        const docs = await prisma.document.findMany({
            where: {
                third_party_id: supplierId,
                date: { gte: startDate, lte: endDate },
                type: { in: [DocumentType.BILL, DocumentType.PAYMENT, DocumentType.CREDIT_NOTE, DocumentType.DEBIT_NOTE] }
            },
            orderBy: { date: 'asc' }
        })

        const retentions = await prisma.withholding.findMany({
            where: {
                third_party_id: supplierId,
                direction: WithholdingDirection.ISSUED,
                date: { gte: startDate, lte: endDate }
            },
            orderBy: { date: 'asc' }
        })

        // Combine and Sort
        const movements = [
            ...docs.map((d: any) => ({
                id: d.id,
                date: d.date,
                type: d.type,
                number: d.number,
                reference: d.reference,
                debit: (d.type === DocumentType.PAYMENT || d.type === DocumentType.CREDIT_NOTE) ? Number(d.total) : 0,
                credit: (d.type === DocumentType.BILL || d.type === DocumentType.DEBIT_NOTE) ? Number(d.total) : 0,
                description: d.type === DocumentType.BILL ? 'Factura de Compra' : d.type
            })),
            ...retentions.map((r: any) => ({
                id: r.id,
                date: r.date,
                type: 'RETENTION',
                number: r.certificate_number,
                reference: '',
                debit: Number(r.amount), // Retention reduces debt
                credit: 0,
                description: `Retención ${r.type === 'RETENCION_IVA' ? 'IVA' : 'ISLR'}`
            }))
        ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

        // Calculate Running Balance
        let currentBalance = initialBalance
        const movementsWithBalance = movements.map((m: any) => {
            currentBalance = currentBalance + m.credit - m.debit
            return { ...m, balance: currentBalance }
        })

        return NextResponse.json({
            period: { start: startDate, end: endDate },
            initialBalance,
            movements: movementsWithBalance,
            finalBalance: currentBalance
        })

    } catch (error: any) {
        console.error('Error fetching statement:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
