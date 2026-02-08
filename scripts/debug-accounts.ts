import 'dotenv/config'
import prisma from '../lib/db'

async function main() {
    console.log('--- Cuentas Actuales ---')
    const accounts = await prisma.chartOfAccount.findMany({
        orderBy: { code: 'asc' },
        select: { code: true, name: true, parent_id: true }
    })

    accounts.forEach(acc => {
        console.log(`${acc.code.padEnd(20)} | ${acc.name}`)
    })
    console.log(`Total: ${accounts.length}`)
}

main()
