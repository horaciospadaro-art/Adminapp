import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient, AccountType } from '@prisma/client'
import fs from 'fs'
import path from 'path'

// Simple .env parser
const envPath = path.resolve(process.cwd(), '.env')
console.log(`Loading .env from: ${envPath}`)
if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf8')
    envConfig.split('\n').forEach(line => {
        // Handle comments and empty lines
        if (!line || line.startsWith('#')) return;

        const firstEquals = line.indexOf('=');
        if (firstEquals !== -1) {
            const key = line.substring(0, firstEquals).trim();
            const value = line.substring(firstEquals + 1).trim(); // Keep the rest including =
            // Remove quotes if present
            const cleanValue = value.replace(/^"|"$/g, '').replace(/^'|'$/g, '');
            process.env[key] = cleanValue;
        }
    })
    console.log('.env loaded.')
} else {
    console.log('.env NOT found.')
}

const connectionString = `${process.env.DATABASE_URL}`

// Parse connection string for debug (basic)
try {
    const url = new URL(connectionString);
    console.log(`Debug: Host=${url.hostname}, Port=${url.port}, User=${url.username}, DB=${url.pathname}`);
} catch (e) {
    console.log('Debug: Could not parse connection string');
}

// Direct PG Test
const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false } // Relaxed SSL
})

// Prisma Client (Adapter)
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
    console.log('Testing direct PG connection...')
    try {
        const client = await pool.connect();
        const res = await client.query('SELECT NOW()');
        console.log('PG Connected:', res.rows[0]);
        client.release();
    } catch (err) {
        console.error('PG Connection Failed:', err);
        // Continue anyway to see if Prisma works (maybe it handles SSL differently)
    }

    console.log('Seeding Basic Chart of Accounts...')

    try {
        // Get the first company (Demo)
        const company = await prisma.company.findFirst()

        if (!company) {
            console.log('No company found. Please create a company first.')
            return
        }

        console.log(`Using Company: ${company.name} (${company.id})`)

        const accounts = [
            // Roots
            { code: '1', name: 'ACTIVO', type: AccountType.ASSET },
            { code: '2', name: 'PASIVO', type: AccountType.LIABILITY },
            { code: '3', name: 'PATRIMONIO', type: AccountType.EQUITY },
            { code: '4', name: 'INGRESOS', type: AccountType.INCOME },
            { code: '5', name: 'COSTOS', type: AccountType.COST },
            { code: '6', name: 'GASTOS', type: AccountType.EXPENSE },
            { code: '7', name: 'OTROS GASTOS', type: AccountType.OTHER },

            // Pasivos Hierarchy (Standard V-Ledge)
            { code: '2.1', name: 'Pasivo Corriente', type: AccountType.LIABILITY, parentCode: '2' },
            { code: '2.1.01', name: 'Cuentas por Pagar Comerciales', type: AccountType.LIABILITY, parentCode: '2.1' },
            { code: '2.1.01.00001', name: 'Cuentas por Pagar Proveedores Nacionales', type: AccountType.LIABILITY, parentCode: '2.1.01' },
        ]

        for (const acc of accounts) {
            // Check if it exists
            const existing = await prisma.chartOfAccount.findUnique({
                where: {
                    company_id_code: {
                        company_id: company.id,
                        code: acc.code
                    }
                }
            })

            if (!existing) {
                // Find Parent ID if needed
                let parentId = null
                if (acc.parentCode) {
                    const parent = await prisma.chartOfAccount.findUnique({
                        where: {
                            company_id_code: {
                                company_id: company.id,
                                code: acc.parentCode
                            }
                        }
                    })
                    if (parent) parentId = parent.id
                }

                await prisma.chartOfAccount.create({
                    data: {
                        company_id: company.id,
                        code: acc.code,
                        name: acc.name,
                        type: acc.type,
                        parent_id: parentId,
                    }
                })
                console.log(`Created: ${acc.code} - ${acc.name}`)
            } else {
                // Force update type to ensure consistency if it exists but is wrong
                if (existing.type !== acc.type) {
                    await prisma.chartOfAccount.update({
                        where: { id: existing.id },
                        data: { type: acc.type }
                    })
                    console.log(`Updated Type: ${acc.code} - ${acc.name}`)
                } else {
                    console.log(`Exists (Correct): ${acc.code} - ${acc.name}`)
                }
            }
        }
    } catch (e) {
        console.error('Prisma Error:', e)
        throw e
    }

    console.log('Seeding complete.')
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
        await pool.end()
    })
