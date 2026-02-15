import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'

const connectionString = `${process.env.DATABASE_URL}`

const pool = new Pool({
    connectionString,
    max: 1, // Limit connections to avoid exhaustion in serverless
    // @ts-ignore
    statement_cache_size: 0 // Disable prepared statements to avoid 'column not available' errors with PgBouncer
})
// @ts-ignore
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

export default prisma
