'use server'

import prisma from '@/lib/db'


export async function getDynamicReportData(module: string, fields: string[], startDate?: string, endDate?: string) {
    if (module === 'clients' || module === 'suppliers') {
        const type = module === 'clients' ? 'CLIENTE' : 'PROVEEDOR'

        // Basic date filter for entities (created_at) - optional, maybe user just wants list?
        // Let's only apply if both present
        const where: any = {
            OR: [
                { type: type as any },
                { type: 'AMBOS' }
            ]
        }

        if (startDate && endDate) {
            where.created_at = {
                gte: new Date(startDate),
                lte: new Date(endDate + 'T23:59:59')
            }
        }

        const parties = await prisma.thirdParty.findMany({
            where,
            include: {
                receivable_account: true,
                payable_account: true
            }
        })

        return parties.map((p: any) => {
            const row: any = {}
            if (fields.includes('name')) row.name = p.name
            if (fields.includes('rif')) row.rif = p.rif
            // Contact
            if (fields.includes('email')) row.email = p.email
            if (fields.includes('phone')) row.phone = p.phone
            if (fields.includes('address')) row.address = p.address
            // Fiscal
            if (fields.includes('type')) row.type = p.type
            if (fields.includes('is_tax_payer_special')) row.is_tax_payer_special = p.is_tax_payer_special ? 'Sí' : 'No'
            if (fields.includes('retention_agent_islr')) row.retention_agent_islr = p.retention_agent_islr ? 'Sí' : 'No'
            // Accounting
            const account = module === 'clients' ? p.receivable_account : p.payable_account
            if (fields.includes('account_code')) row.account_code = account ? `${account.code} - ${account.name}` : 'Sin Asignar'

            if (fields.includes('balance')) {
                const bal = account?.balance as any
                if (bal) {
                    const num = typeof bal.toNumber === 'function' ? bal.toNumber() : Number(bal)
                    row.balance = num.toLocaleString('es-VE', { minimumFractionDigits: 2 })
                } else {
                    row.balance = '0.00'
                }
            }
            return row
        })
    }

    if (module === 'invoices' || module === 'bills') {
        const type = module === 'invoices' ? 'INVOICE' : 'BILL'

        const where: any = { type }

        if (startDate && endDate) {
            where.date = {
                gte: new Date(startDate),
                lte: new Date(endDate + 'T23:59:59')
            }
        }

        const docs = await prisma.document.findMany({
            where,
            include: {
                third_party: true
            },
            orderBy: { date: 'desc' }
        })

        return docs.map((d: any) => {
            const row: any = {}
            // Basic mapping
            if (fields.includes('status')) row.status = d.status
            // Document Fields
            if (fields.includes('date')) row.date = new Date(d.date).toISOString().split('T')[0]
            if (fields.includes('due_date')) row.due_date = d.due_date ? new Date(d.due_date).toISOString().split('T')[0] : '-'
            if (fields.includes('number')) row.number = d.number
            if (fields.includes('reference')) row.reference = d.reference || '-'

            // ThirdParty Info in Document
            if (fields.includes('name')) row.name = d.third_party.name
            if (fields.includes('rif')) row.rif = d.third_party.rif

            // Financials
            const fmt = (val: any) => {
                const num = Number(val)
                return num.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
            }

            if (fields.includes('subtotal')) row.subtotal = fmt(d.subtotal)
            if (fields.includes('tax_amount')) row.tax_amount = fmt(d.tax_amount)
            if (fields.includes('total')) row.total = fmt(d.total)
            if (fields.includes('pending_balance')) row.pending_balance = fmt(d.balance)

            return row
        })
    }

    return []
}

