import 'dotenv/config'
import { IntegrationEngine, EventType } from '../lib/services/integration-engine'
import prisma from '../lib/db'

async function main() {
    console.log('Starting Integration Test...')

    // 1. Ensure we have data (Company, Product, Accounts) using Prisma
    // We assume Seed ran, or we create minimal data if missing

    // Find default company
    const company = await prisma.company.findFirst({ where: { rif: 'J-00000000-0' } })
    if (!company) throw new Error('Company not found. Did you run migration.sql and seed?')

    console.log(`Using Company: ${company.name}`)

    const engine = new IntegrationEngine()

    // 2. Simulate Invoice Event
    // We need a product first.
    // Let's ensure a product exists
    let product = await prisma.product.findUnique({
        where: { company_id_sku: { company_id: company.id, sku: 'TEST-SKU' } }
    })

    if (!product) {
        console.log('Creating Test Product...')
        // We need accounts for the product
        const assetAcc = await prisma.chartOfAccount.findFirst({ where: { code: '1.1.01' } }) // Using Cash/Asset as placeholder
        const incomeAcc = await prisma.chartOfAccount.findFirst({ where: { code: '4.1' } }) // Ventas
        const cogsAcc = await prisma.chartOfAccount.findFirst({ where: { code: '5.1' } }) // Costo

        if (!assetAcc || !incomeAcc || !cogsAcc) {
            throw new Error('Required accounts for product creation not found')
        }

        product = await prisma.product.create({
            data: {
                company_id: company.id,
                sku: 'TEST-SKU',
                name: 'Test Setup Product',
                type: 'GOODS',
                asset_account_id: assetAcc.id,
                income_account_id: incomeAcc.id,
                cogs_account_id: cogsAcc.id,
                avg_cost: 100,
                quantity_on_hand: 10
            }
        })
    }

    console.log('Simulating Invoice Approved Event (Qty: 2, Price: 150)...')
    // Expected:
    // Income (Credit): 300
    // IVA (Credit): 300 * 0.16 = 48
    // AR (Debit): 348
    // COGS (Debit): 2 * 100 = 200
    // Inventory (Credit): 200

    await engine.handleEvent({
        type: EventType.INVOICE_APPROVED,
        companyId: company.id,
        date: new Date(),
        payload: {
            thirdPartyName: 'Cliente Generico',
            items: [
                { sku: 'TEST-SKU', qty: 2, price: 150 } // Total 300
            ]
        }
    })

    console.log('Event Processed. Checking Journal Entry...')

    // 3. Verify Journal Entry
    const lastEntry = await prisma.journalEntry.findFirst({
        where: { company_id: company.id },
        orderBy: { created_at: 'desc' },
        include: { lines: { include: { account: true } } }
    })

    if (lastEntry && lastEntry.description.includes('Cliente Generico')) {
        console.log('✅ Success! Journal Entry found:')
        console.log(`Date: ${lastEntry.date}`)
        console.log(`Description: ${lastEntry.description}`)
        console.log('Lines:')
        lastEntry.lines.forEach(line => {
            console.log(`  - Account: ${line.account.code} (${line.account.name}) | Debit: ${Number(line.debit)} | Credit: ${Number(line.credit)} | Desc: ${line.description}`)
        })

        // Basic assertions
        const totalDebit = lastEntry.lines.reduce((s, l) => s + Number(l.debit), 0)
        const totalCredit = lastEntry.lines.reduce((s, l) => s + Number(l.credit), 0)
        console.log(`\nBalance Check: Debit ${totalDebit} = Credit ${totalCredit} ? ${Math.abs(totalDebit - totalCredit) < 0.01}`)

        // Check for Taxes
        const taxLine = lastEntry.lines.find(l => l.account.code === '2.1.02') // Debito Fiscal
        if (taxLine && Number(taxLine.credit) === 48) console.log('✅ Tax Calculation Correct (48)')
        else console.error(`❌ Tax Calculation Incorrect. Expected Credit 48. Found: ${taxLine?.credit}`)

    } else {
        console.error('❌ Failed! Journal Entry not found or incorrect.')
    }
}

main()
    .catch(e => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
