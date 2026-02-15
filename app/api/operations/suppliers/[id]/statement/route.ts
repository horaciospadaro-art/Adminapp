import { NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { DocumentType, WithholdingDirection } from '@prisma/client'

function docNumber(d: { number?: string; control_number?: string | null }) {
    return d?.number || d?.control_number || '—'
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { searchParams } = new URL(request.url)
        const { id: supplierId } = await params
        const startDateParam = searchParams.get('startDate')
        const endDateParam = searchParams.get('endDate')

        const endDate = endDateParam ? new Date(endDateParam) : new Date()
        endDate.setHours(23, 59, 59, 999)
        const startDate = startDateParam ? new Date(startDateParam) : new Date(new Date().setDate(endDate.getDate() - 30))

        if (!supplierId) {
            return NextResponse.json({ error: 'Supplier ID required' }, { status: 400 })
        }

        // 1. Initial balance (movements before startDate)
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
                initialBalance += amount
            } else {
                initialBalance -= amount
            }
        })
        prevRetentions.forEach((ret: any) => {
            initialBalance -= Number(ret.amount)
        })

        // 2. Documents in range with related_document for CREDIT_NOTE (factura afectada)
        const docs = await prisma.document.findMany({
            where: {
                third_party_id: supplierId,
                date: { gte: startDate, lte: endDate },
                type: { in: [DocumentType.BILL, DocumentType.PAYMENT, DocumentType.CREDIT_NOTE, DocumentType.DEBIT_NOTE] }
            },
            orderBy: [{ date: 'asc' }, { created_at: 'asc' }],
            include: {
                related_document: { select: { number: true, control_number: true } }
            }
        })

        // 3. Retentions in range with document (factura afectada) for ordering and description
        const retentions = await prisma.withholding.findMany({
            where: {
                third_party_id: supplierId,
                direction: WithholdingDirection.ISSUED,
                date: { gte: startDate, lte: endDate }
            },
            orderBy: { date: 'asc' },
            include: {
                document: { select: { id: true, number: true, control_number: true, date: true, created_at: true } }
            }
        })

        // 4. Build doc movements with description and related invoice number
        const docMovements = docs.map((d: any) => {
            let description = d.type === DocumentType.BILL ? 'Factura de Compra' : d.type === DocumentType.DEBIT_NOTE ? 'Nota de Débito' : d.type === DocumentType.CREDIT_NOTE ? 'Nota de Crédito (Devolución)' : d.type
            const relatedDocNumber = d.related_document ? docNumber(d.related_document) : null
            if (d.type === DocumentType.CREDIT_NOTE && relatedDocNumber) {
                description += ` - Factura afectada: ${relatedDocNumber}`
            }
            return {
                id: d.id,
                date: d.date,
                created_at: d.created_at,
                type: d.type,
                number: d.number,
                reference: d.reference,
                debit: (d.type === DocumentType.PAYMENT || d.type === DocumentType.CREDIT_NOTE) ? Number(d.total) : 0,
                credit: (d.type === DocumentType.BILL || d.type === DocumentType.DEBIT_NOTE) ? Number(d.total) : 0,
                description,
                relatedDocumentNumber: relatedDocNumber || undefined,
                sortKey: [new Date(d.date).getTime(), new Date(d.created_at).getTime(), 0]
            }
        })

        // 5. Build retention movements with factura afectada
        const retMovements = retentions.map((r: any) => {
            const invNum = r.document ? docNumber(r.document) : null
            const description = `Retención ${r.type === 'RETENCION_IVA' ? 'IVA' : 'ISLR'}${invNum ? ` - Factura: ${invNum}` : ''}`
            return {
                id: r.id,
                date: r.date,
                type: 'RETENTION',
                number: r.certificate_number,
                reference: '',
                debit: Number(r.amount),
                credit: 0,
                description,
                relatedDocumentNumber: invNum || undefined,
                document_id: r.document_id,
                docDate: r.document?.date,
                docCreatedAt: r.document?.created_at,
                sortKey: [
                    r.document ? new Date(r.document.date).getTime() : new Date(r.date).getTime(),
                    r.document?.created_at ? new Date(r.document.created_at).getTime() : 0,
                    1,
                    new Date(r.date).getTime()
                ]
            }
        })

        // 6. Order by entry: each invoice followed by its retentions (sortKey: doc first, then its retentions)
        const combined = [...docMovements, ...retMovements].sort((a: any, b: any) => {
            const [da, caa, ta] = a.sortKey
            const [db, cab, tb] = b.sortKey
            if (da !== db) return da - db
            if (caa !== cab) return caa - cab
            return (ta || 0) - (tb || 0)
        })

        const movements = combined.map(({ sortKey, document_id, docDate, docCreatedAt, ...m }: any) => m)

        // 7. Running balance
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
