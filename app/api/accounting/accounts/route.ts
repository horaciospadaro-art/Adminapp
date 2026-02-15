export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { AccountService } from '@/lib/services/account-service'
import { AccountType } from '@prisma/client'
import prisma from '@/lib/db'

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
    let companyId = searchParams.get('companyId')

    if (!companyId) {
        // Default to first company
        const company = await prisma.company.findFirst()
        if (!company) {
            return NextResponse.json({ error: 'No company found' }, { status: 404 })
        }
        companyId = company.id
    }

    const service = new AccountService()
    const accounts = await service.getAccountTree(companyId!)

    return NextResponse.json(accounts)
}

export async function PUT(req: NextRequest) {
    try {
        const body = await req.json()
        const { id, name, code, companyId } = body

        if (!id || !companyId) { // Code is optional if not changing? No, let's require it to validate format.
            return NextResponse.json({ error: 'ID y CompanyID requeridos' }, { status: 400 })
        }

        // 1. Get current account
        const current = await prisma.chartOfAccount.findUnique({
            where: { id }
        })

        if (!current) {
            return NextResponse.json({ error: 'Cuenta no encontrada' }, { status: 404 })
        }

        // 2. Validate Code Change
        let newCode = current.code
        let parentId = current.parent_id

        if (code && code !== current.code) {
            // Check if it has children
            const childrenCount = await prisma.chartOfAccount.count({
                where: { parent_id: id }
            })

            if (childrenCount > 0) {
                return NextResponse.json({ error: 'No se puede modificar el código de una cuenta que tiene sub-cuentas. Elimine o mueva las sub-cuentas primero.' }, { status: 400 })
            }

            // Validate new format
            newCode = AccountService.formatCode(code)

            // Check uniqueness
            const exists = await prisma.chartOfAccount.findUnique({
                where: { company_id_code: { company_id: companyId, code: newCode } }
            })
            if (exists && exists.id !== id) {
                return NextResponse.json({ error: 'El código ya existe en otra cuenta.' }, { status: 400 })
            }

            // Validate Parent
            const parentCode = AccountService.getParentCode(newCode)
            if (parentCode) {
                const parent = await prisma.chartOfAccount.findUnique({
                    where: { company_id_code: { company_id: companyId, code: parentCode } }
                })
                if (!parent) {
                    return NextResponse.json({ error: `La cuenta madre ${parentCode} no existe.` }, { status: 400 })
                }
                parentId = parent.id
            } else {
                parentId = null
            }
        }

        // 3. Update
        const updated = await prisma.chartOfAccount.update({
            where: { id },
            data: {
                name: name || current.name,
                code: newCode,
                parent_id: parentId
                // Type usually doesn't change easily, let's ignore it for now or require strict check
            }
        })

        return NextResponse.json(updated)

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 400 })
    }
}
