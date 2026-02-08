import { NextRequest, NextResponse } from 'next/server'
import { AccountService } from '@/lib/services/account-service'
import { AccountType } from '@prisma/client'

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const { companyId, code, name, type } = body

        if (!companyId || !code || !name || !type) {
            return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 })
        }

        // Validar tipo
        if (!Object.values(AccountType).includes(type)) {
            return NextResponse.json({ error: 'Tipo de cuenta inválido' }, { status: 400 })
        }

        const service = new AccountService()
        const account = await service.createAccount({
            companyId,
            rawCode: code,
            name,
            type: type as AccountType
        })

        return NextResponse.json(account)
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 400 })
    }
}

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url)
    const companyId = searchParams.get('companyId')

    if (!companyId) {
        return NextResponse.json({ error: 'Company ID required' }, { status: 400 })
    }

    const service = new AccountService()
    const accounts = await service.getAccountTree(companyId)

    return NextResponse.json(accounts)
}
