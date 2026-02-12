
import 'dotenv/config'
import prisma from '../lib/db'

async function checkEntry() {
    try {
        const entries = await prisma.journalEntry.findMany({
            where: {
                description: {
                    contains: 'comisiones',
                    mode: 'insensitive'
                }
            },
            include: {
                lines: {
                    include: {
                        account: true
                    }
                }
            }
        })

        console.log('Found entries:', JSON.stringify(entries, null, 2))

        // Also check total count
        const count = await prisma.journalEntry.count()
        console.log('Total Journal Entries:', count)

    } catch (error) {
        console.error('Error:', error)
    } finally {
        // We don't disconnect the shared instance usually, but for a script it's fine or we just let it exit.
        // await prisma.$disconnect()
    }
}

checkEntry()
