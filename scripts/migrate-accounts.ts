import 'dotenv/config'
import prisma from '../lib/db'
import { AccountService } from '../lib/services/account-service'

async function main() {
    console.log('Iniciando migración de códigos de cuenta...')

    const accounts = await prisma.chartOfAccount.findMany()

    for (const acc of accounts) {
        try {
            const formatted = AccountService.formatCode(acc.code)

            if (formatted !== acc.code) {
                console.log(`Migrando ${acc.code} -> ${formatted}`)

                // Check collision
                const exists = await prisma.chartOfAccount.findUnique({
                    where: { company_id_code: { company_id: acc.company_id, code: formatted } }
                })

                if (exists) {
                    console.log(`⚠️ Destino ${formatted} ya existe. Saltando...`)
                } else {
                    console.log(`Actualizando ${acc.code} a ${formatted}...`)
                    await prisma.chartOfAccount.update({
                        where: { id: acc.id },
                        data: { code: formatted }
                    })
                }
            }
        } catch (e: any) {
            console.error(`Error procesando ${acc.code}: ${e.message}`)
        }
    }

    // Now re-run hierarchy fix (parent_ids might need update if parents also changed?)
    // Actually, parent_id links by ID (UUID), so changing the 'code' field doesn't break relationships!
    // We just need to ensure the codes look right.

    console.log('Migración completada.')
}

main().catch(console.error)
