import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'
import "dotenv/config";

const connectionString = `${process.env.DATABASE_URL}`
const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  try {
    console.log('Connecting...')
    await prisma.$connect()
    console.log('Successfully connected to the database')

    const count = await prisma.company.count()
    console.log(`Found ${count} companies`)

    // Check if BankAccount table exists
    try {
      const banks = await prisma.bankAccount.count()
      console.log(`Found ${banks} bank accounts (Table exists)`)
    } catch (e) {
      console.log('BankAccount table likely missing or inaccessible')
    }

  } catch (e) {
    console.error('Connection error:', e)
  } finally {
    await prisma.$disconnect()
  }
}

main()
