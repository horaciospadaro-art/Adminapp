
import 'dotenv/config'
import prisma from '../lib/db'

async function debugDateFilter() {
    try {
        const startDateStr = '2026-02-11'
        const endDateStr = '2026-02-11'

        const startDate = new Date(startDateStr)
        const endDate = new Date(endDateStr)

        console.log('Testing Range:', {
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString()
        })

        const entries = await prisma.journalEntry.findMany({
            where: {
                description: { contains: 'comisiones', mode: 'insensitive' },
                date: {
                    gte: startDate,
                    lte: endDate
                }
            }
        })

        console.log('Entries found with exact date match:', entries.length)
        if (entries.length > 0) {
            console.log('Entry:', entries[0].date)
        }

        // Test with End of Day extension
        const endOfDay = new Date(endDateStr)
        endOfDay.setHours(23, 59, 59, 999)

        console.log('Testing Range with End of Day:', {
            startDate: startDate.toISOString(),
            endDate: endOfDay.toISOString()
        })

        const entriesEOD = await prisma.journalEntry.findMany({
            where: {
                description: { contains: 'comisiones', mode: 'insensitive' },
                date: {
                    gte: startDate,
                    lte: endOfDay
                }
            }
        })

        console.log('Entries found with EOD:', entriesEOD.length)

    } catch (error) {
        console.error('Error:', error)
    }
}

debugDateFilter()
