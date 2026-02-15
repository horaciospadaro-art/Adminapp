import 'dotenv/config'
import { AccountType, PrismaClient } from '@prisma/client'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'

// Initialize Prisma Client with Postgres Adapter
const connectionString = process.env.DATABASE_URL || process.env.DIRECT_URL

if (!connectionString) {
    console.error('Error: DATABASE_URL not found in environment variables.')
    process.exit(1)
}

const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

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
        { code: '1', name: 'ACTIVO', type: AccountType.ASSET, parentCode: null },
        { code: '1.1', name: 'ACTIVO CORRIENTE', type: AccountType.ASSET, parentCode: '1' },
        { code: '1.1.01', name: 'EFECTIVO Y EQUIVALENTES', type: AccountType.ASSET, parentCode: '1.1' },
        { code: '1.1.01.00001', name: 'CAJA CHICA', type: AccountType.ASSET, parentCode: '1.1.01' },
        { code: '1.1.01.00002', name: 'BANCO MERCANTIL', type: AccountType.ASSET, parentCode: '1.1.01' },
        { code: '1.1.02', name: 'CREDITO FISCAL IVA', type: AccountType.ASSET, parentCode: '1.1' },
        { code: '1.1.02.00001', name: 'CRÉDITO FISCAL IVA', type: AccountType.ASSET, parentCode: '1.1.02' },

        { code: '2', name: 'PASIVO', type: AccountType.LIABILITY, parentCode: null },
        { code: '2.1', name: 'PASIVO CORRIENTE', type: AccountType.LIABILITY, parentCode: '2' },
        { code: '2.1.01', name: 'CUENTAS POR PAGAR', type: AccountType.LIABILITY, parentCode: '2.1' },
        { code: '2.1.01.00001', name: 'PROVEEDORES NACIONALES', type: AccountType.LIABILITY, parentCode: '2.1.01' },

        { code: '2.1.02', name: 'OBLIGACIONES FISCALES', type: AccountType.LIABILITY, parentCode: '2.1' },
        { code: '2.1.02.00001', name: 'DÉBITO FISCAL IVA', type: AccountType.LIABILITY, parentCode: '2.1.02' },

        { code: '3', name: 'PATRIMONIO', type: AccountType.EQUITY, parentCode: null },
        { code: '3.1', name: 'CAPITAL SOCIA', type: AccountType.EQUITY, parentCode: '3' },
        { code: '3.1.01', name: 'CAPITAL PAGADO', type: AccountType.EQUITY, parentCode: '3.1' },
        { code: '3.1.01.00001', name: 'CUENTA CAPITAL SOSIO A', type: AccountType.EQUITY, parentCode: '3.1.01' },

        { code: '4', name: 'INGRESOS', type: AccountType.INCOME, parentCode: null },
        { code: '4.1', name: 'VENTAS', type: AccountType.INCOME, parentCode: '4' },
        { code: '4.1.01', name: 'VENTAS BRUTAS', type: AccountType.INCOME, parentCode: '4.1' },
        { code: '4.1.01.00001', name: 'VENTAS DE MERCANCÍA', type: AccountType.INCOME, parentCode: '4.1.01' },

        { code: '5', name: 'COSTOS', type: AccountType.COST, parentCode: null },
        { code: '5.1', name: 'COSTO DE VENTAS', type: AccountType.COST, parentCode: '5' },
        { code: '5.1.01', name: 'COSTO DE MERCANCÍA VENDIDA', type: AccountType.COST, parentCode: '5.1' },
        { code: '5.1.01.00001', name: 'COSTO DE VENTAS', type: AccountType.COST, parentCode: '5.1.01' },

        { code: '6', name: 'GASTOS', type: AccountType.EXPENSE, parentCode: null },
        { code: '6.1', name: 'GASTOS OPERATIVOS', type: AccountType.EXPENSE, parentCode: '6' },
        { code: '6.1.01', name: 'GASTOS GENERALES', type: AccountType.EXPENSE, parentCode: '6.1' },
        { code: '6.1.01.00001', name: 'GASTO IGTF', type: AccountType.EXPENSE, parentCode: '6.1.01' },
    ]

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

    console.log('Siembra de datos (Seed) de Cuentas Contables finalizada.')

    // ==========================================
    // SEED: ISLR CONCEPTS (Conceptos de Retención ISLR) - Schema V2
    // ==========================================
    const islrConcepts = [
        {
            seniat_code: '001/002',
            description: 'Honorarios Profesionales',
            pn_resident_rate: '3% - Sust.',
            pj_domiciled_rate: '5%',
            pn_non_resident_rate: '34% (s/90%)',
            pj_non_domiciled_rate: '34% (s/90%)'
        },
        {
            seniat_code: '011',
            description: 'Arrendamiento Inmuebles',
            pn_resident_rate: '3% - Sust.',
            pj_domiciled_rate: '5%',
            pn_non_resident_rate: '34%',
            pj_non_domiciled_rate: '34%'
        },
        {
            seniat_code: '012',
            description: 'Arrendamiento Muebles',
            pn_resident_rate: '3% - Sust.',
            pj_domiciled_rate: '5%',
            pn_non_resident_rate: '34%',
            pj_non_domiciled_rate: '34%'
        },
        {
            seniat_code: '015',
            description: 'Comisiones',
            pn_resident_rate: '3% - Sust.',
            pj_domiciled_rate: '5%',
            pn_non_resident_rate: '34%',
            pj_non_domiciled_rate: '34%'
        },
        {
            seniat_code: '023',
            description: 'Contratistas / Servicios',
            pn_resident_rate: '1% - Sust.',
            pj_domiciled_rate: '2%',
            pn_non_resident_rate: '34%',
            pj_non_domiciled_rate: '34%'
        },
        {
            seniat_code: '036',
            description: 'Fletes / Transporte',
            pn_resident_rate: '1% - Sust.',
            pj_domiciled_rate: '3%',
            pn_non_resident_rate: '10% (s/base)',
            pj_non_domiciled_rate: '10% (s/base)'
        },
        {
            seniat_code: '040',
            description: 'Primas de Seguro',
            pn_resident_rate: '3%',
            pj_domiciled_rate: '5%',
            pn_non_resident_rate: '10% (s/30%)',
            pj_non_domiciled_rate: '10% (s/30%)'
        },
        {
            seniat_code: '042',
            description: 'Publicidad y Propaganda',
            pn_resident_rate: '3% - Sust.',
            pj_domiciled_rate: '5%',
            pn_non_resident_rate: '34%',
            pj_non_domiciled_rate: '34%'
        },
        {
            seniat_code: '005',
            description: 'Asistencia Técnica',
            pn_resident_rate: '-',
            pj_domiciled_rate: '-',
            pn_non_resident_rate: '34% (s/30%)',
            pj_non_domiciled_rate: '34% (s/30%)'
        },
        {
            seniat_code: '006',
            description: 'Servicios Tecnológicos',
            pn_resident_rate: '-',
            pj_domiciled_rate: '-',
            pn_non_resident_rate: '34% (s/50%)',
            pj_non_domiciled_rate: '34% (s/50%)'
        }
    ]

    for (const concept of islrConcepts) {
        const existing = await prisma.iSLRConcept.findFirst({
            where: { description: concept.description }
        })

        if (!existing) {
            await prisma.iSLRConcept.create({
                data: {
                    seniat_code: concept.seniat_code,
                    description: concept.description,
                    pn_resident_rate: concept.pn_resident_rate,
                    pj_domiciled_rate: concept.pj_domiciled_rate,
                    pn_non_resident_rate: concept.pn_non_resident_rate,
                    pj_non_domiciled_rate: concept.pj_non_domiciled_rate
                }
            })
        }
    }
    console.log('Siembra de datos (Seed) de Conceptos ISLR finalizada.')

    // ==========================================
    // SEED: VAT RETENTIONS (Retenciones de IVA)
    // ==========================================
    const vatRetentions = [
        { description: 'Retención del 75%', rate: '75.00' },
        { description: 'Retención del 100%', rate: '100.00' },
    ]

    for (const retention of vatRetentions) {
        const existing = await prisma.vATRetention.findFirst({
            where: { rate: retention.rate }
        })

        if (!existing) {
            await prisma.vATRetention.create({
                data: {
                    description: retention.description,
                    rate: retention.rate,
                    active: true
                }
            })
        }
    }
    console.log('Siembra de datos (Seed) de Retenciones IVA finalizada.')
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        // Ensure connection is closed even on error
        await prisma.$disconnect()
        process.exit(1)
    })
