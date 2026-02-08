import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  try {
    await prisma.$connect()
    console.log('Successfully connected to the database')
    const count = await prisma.company.count()
    console.log(`Found ${count} companies`)
    
    // Check if BankAccount table exists (by trying to query it)
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
