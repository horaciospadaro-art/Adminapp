'use server'

import prisma from '@/lib/db'

export async function getDynamicReportData(module: string, fields: string[]) {
    if (module !== 'clients' && module !== 'suppliers') {
        return []
    }

    const type = module === 'clients' ? 'CLIENTE' : 'PROVEEDOR'

    // Fetch Third Parties
    const parties = await prisma.thirdParty.findMany({
        where: {
            OR: [
                { type: type as any },
                { type: 'AMBOS' }
            ]
        },
        include: {
            receivable_account: true,
            payable_account: true
        }
    })

    // Map to flat object based on requested fields
    const results = parties.map(p => {
        const row: any = {}

        // Basic
        if (fields.includes('name')) row.name = p.name
        if (fields.includes('rif')) row.rif = p.rif
        if (fields.includes('status')) row.status = 'Activo' // Mock status for now, or based on logic

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

        if (fields.includes('account_code')) {
            row.account_code = account ? `${account.code} - ${account.name}` : 'Sin Asignar'
        }

        if (fields.includes('balance')) {
            // Check if account exists
            if (account) {
                // Format currency safely managing Prisma Decimal
                const bal = account.balance as any
                const num = typeof bal.toNumber === 'function' ? bal.toNumber() : Number(bal)
                row.balance = num.toLocaleString('es-VE', { minimumFractionDigits: 2 })
            } else {
                row.balance = '0.00'
            }
        }

        return row
    })

    return results
}
