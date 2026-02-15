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
        const company = await prisma.company.findFirst()
        if (!company) {
            return NextResponse.json({ error: 'No company found' }, { status: 404 })
        }
        companyId = company.id
    }

    const service = new AccountService()
    const accounts = await service.getAccountTree(companyId!)

    // Saldos desde JournalLine (solo asientos POSTED)
    const aggregates = await prisma.$queryRaw<{ account_id: string; debit: number; credit: number }[]>`
        SELECT jl.account_id,
               COALESCE(SUM(jl.debit), 0)::float AS debit,
               COALESCE(SUM(jl.credit), 0)::float AS credit
        FROM "JournalLine" jl
        INNER JOIN "JournalEntry" je ON je.id = jl.entry_id
        WHERE je.company_id = ${companyId!}
          AND je.status = 'POSTED'
        GROUP BY jl.account_id
    `
    const ledgerBalanceByAccount = new Map<string, number>()
    for (const row of aggregates) {
        ledgerBalanceByAccount.set(row.account_id, Number(row.debit) - Number(row.credit))
    }

    // Cuentas con hijos (parent_id -> hijos)
    const childrenByParent = new Map<string | null, typeof accounts>()
    for (const acc of accounts) {
        const pid = acc.parent_id
        if (!childrenByParent.has(pid)) childrenByParent.set(pid, [])
        childrenByParent.get(pid)!.push(acc)
    }

    // Saldo computado: hoja = saldo ledger; madre = suma de hijos (procesar de más profundo a raíz)
    const codeDepth = (code: string) => code.split('.').length
    const sortedByDepth = [...accounts].sort((a, b) => {
        const d = codeDepth(b.code) - codeDepth(a.code)
        return d !== 0 ? d : a.code.localeCompare(b.code)
    })
    const computedBalance = new Map<string, number>()
    for (const acc of sortedByDepth) {
        const children = childrenByParent.get(acc.id) || []
        if (children.length === 0) {
            computedBalance.set(acc.id, ledgerBalanceByAccount.get(acc.id) ?? 0)
        } else {
            const sum = children.reduce((s, c) => s + (computedBalance.get(c.id) ?? 0), 0)
            computedBalance.set(acc.id, sum)
        }
    }

    const result = accounts.map((acc) => ({
        ...acc,
        balance: computedBalance.get(acc.id) ?? 0
    }))

    return NextResponse.json(result)
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
