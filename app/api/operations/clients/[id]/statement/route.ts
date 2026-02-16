import { NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { DocumentType } from '@prisma/client'

function docNumber(d: { number?: string; control_number?: string | null }) {
    return d?.number || d?.control_number || '—'
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { searchParams } = new URL(request.url)
        const { id: clientId } = await params
        const startDateParam = searchParams.get('startDate')
        const endDateParam = searchParams.get('endDate')

        const endDate = endDateParam ? new Date(endDateParam) : new Date()
        endDate.setHours(23, 59, 59, 999)
        const startDate = startDateParam ? new Date(startDateParam) : new Date(new Date().setDate(endDate.getDate() - 30))

        if (!clientId) {
            return NextResponse.json({ error: 'Client ID required' }, { status: 400 })
        }

        // Documentos de venta y cobros: INVOICE, DEBIT_NOTE aumentan cuentas por cobrar; CREDIT_NOTE y PAYMENT las disminuyen.
        const docTypes = [DocumentType.INVOICE, DocumentType.PAYMENT, DocumentType.CREDIT_NOTE, DocumentType.DEBIT_NOTE]

        // 1. Saldo inicial (movimientos antes de startDate)
        const prevDocs = await prisma.document.findMany({
            where: {
                third_party_id: clientId,
                date: { lt: startDate },
                type: { in: docTypes }
            },
            select: { type: true, total: true }
        })

        let initialBalance = 0
        prevDocs.forEach((doc: { type: string; total: unknown }) => {
            const amount = Number(doc.total)
            if (doc.type === DocumentType.INVOICE || doc.type === DocumentType.DEBIT_NOTE) {
                initialBalance += amount
            } else {
                initialBalance -= amount
            }
        })

        // 2. Documentos en el rango con related_document para CREDIT_NOTE (factura afectada)
        const docs = await prisma.document.findMany({
            where: {
                third_party_id: clientId,
                date: { gte: startDate, lte: endDate },
                type: { in: docTypes }
            },
            orderBy: [{ date: 'asc' }, { created_at: 'asc' }],
            include: {
                related_document: { select: { number: true, control_number: true } }
            }
        })

        // 3. Movimientos: para clientes, crédito = aumenta por cobrar (factura, nota débito), débito = disminuye (cobro, nota crédito)
        const movements = docs.map((d: any) => {
            let description = d.type === DocumentType.INVOICE ? 'Factura de Venta' : d.type === DocumentType.DEBIT_NOTE ? 'Nota de Débito' : d.type === DocumentType.CREDIT_NOTE ? 'Nota de Crédito (Devolución)' : 'Cobro'
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
                credit: (d.type === DocumentType.INVOICE || d.type === DocumentType.DEBIT_NOTE) ? Number(d.total) : 0,
                description,
                relatedDocumentNumber: relatedDocNumber || undefined
            }
        })

        // 4. Saldo corrido
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
        console.error('Error fetching client statement:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
