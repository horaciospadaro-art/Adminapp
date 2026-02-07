import 'dotenv/config'
import { AccountType } from '@prisma/client'
import prisma from '../lib/db'

async function main() {
    // Create default company
    const company = await prisma.company.upsert({
        where: { rif: 'J-00000000-0' },
        update: {},
        create: {
            name: 'Empresa Demo C.A.',
            rif: 'J-00000000-0',
            fiscal_year_start: new Date(new Date().getFullYear(), 0, 1),
            currency: 'VES',
        },
    })

    console.log({ company })

    // Basic Venezuelan Chart of Accounts (Plan de Cuentas)
    const accounts = [
        { code: '1', name: 'ACTIVO', type: AccountType.ASSET },
        { code: '1.1', name: 'ACTIVO CORRIENTE', type: AccountType.ASSET, parentCode: '1' },
        { code: '1.1.01', name: 'EFECTIVO Y EQUIVALENTES', type: AccountType.ASSET, parentCode: '1.1' },
        { code: '1.1.01.01', name: 'CAJA CHICA', type: AccountType.ASSET, parentCode: '1.1.01' },
        { code: '1.1.01.02', name: 'BANCO MERCANTIL', type: AccountType.ASSET, parentCode: '1.1.01' },
        { code: '1.1.02', name: 'CREDITO FISCAL IVA', type: AccountType.ASSET, parentCode: '1.1' }, // Used in Mapping

        { code: '2', name: 'PASIVO', type: AccountType.LIABILITY },
        { code: '2.1', name: 'PASIVO CORRIENTE', type: AccountType.LIABILITY, parentCode: '2' },
        { code: '2.1.01', name: 'CUENTAS POR PAGAR', type: AccountType.LIABILITY, parentCode: '2.1' },
        { code: '2.1.02', name: 'DEBITO FISCAL IVA', type: AccountType.LIABILITY, parentCode: '2.1' }, // Used in Mapping

        { code: '3', name: 'PATRIMONIO', type: AccountType.EQUITY },
        { code: '3.1', name: 'CAPITAL SOCIAL', type: AccountType.EQUITY, parentCode: '3' },

        { code: '4', name: 'INGRESOS', type: AccountType.INCOME },
        { code: '4.1', name: 'VENTAS', type: AccountType.INCOME, parentCode: '4' },

        { code: '5', name: 'COSTOS', type: AccountType.COST },
        { code: '5.1', name: 'COSTO DE VENTAS', type: AccountType.COST, parentCode: '5' },

        { code: '6', name: 'GASTOS', type: AccountType.EXPENSE },
        { code: '6.1', name: 'GASTOS OPERATIVOS', type: AccountType.EXPENSE, parentCode: '6' },
        { code: '6.1.99', name: 'GASTO IGTF', type: AccountType.EXPENSE, parentCode: '6.1' }, // IGTF
    ]

    // Helper to find parent ID
    const getParentId = async (code: string, companyId: string) => {
        // Find parent code (e.g. 1.1.01 -> 1.1)
        if (!code.includes('.')) return null
        // This logic relies on specific coding structure provided in list, for simplicity we look up parent by known logic or passed parentCode
        // Actually the list above has parentCode explicit.
        return null
    }

    // We need to insert in order of hierarchy or do two passes. 
    // Code is sorted above, so parents usually come first.

    for (const acc of accounts) {
        let parentId = null
        if (acc.parentCode) {
            const parent = await prisma.chartOfAccount.findUnique({
                where: { company_id_code: { company_id: company.id, code: acc.parentCode } }
            })
            parentId = parent?.id
        }

        await prisma.chartOfAccount.upsert({
            where: {
                company_id_code: {
                    company_id: company.id,
                    code: acc.code,
                },
            },
            update: {
                name: acc.name // Update name if it changes (e.g. to fix typos)
            },
            create: {
                company_id: company.id,
                code: acc.code,
                name: acc.name,
                type: acc.type,
                parent_id: parentId,
            },
        })
    }

    console.log('Siembra de datos (Seed) finalizada.')
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })
