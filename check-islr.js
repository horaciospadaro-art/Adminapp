const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function checkISLRConcepts() {
    try {
        const concepts = await prisma.iSLRConcept.findMany({
            where: {
                description: {
                    contains: 'Comisiones',
                    mode: 'insensitive'
                }
            }
        })

        console.log('=== ISLR Concepts matching "Comisiones" ===')
        concepts.forEach(concept => {
            console.log('\nConcept:', concept.description)
            console.log('ID:', concept.id)
            console.log('Seniat Code:', concept.seniat_code)
            console.log('PN Resident Rate:', concept.pn_resident_rate)
            console.log('PJ Domiciled Rate:', concept.pj_domiciled_rate, '<-- THIS ONE FOR FARMATOIDE')
            console.log('PN Non-Resident Rate:', concept.pn_non_resident_rate)
            console.log('PJ Non-Domiciled Rate:', concept.pj_non_domiciled_rate)
            console.log('---')
            console.log('Type of pj_domiciled_rate:', typeof concept.pj_domiciled_rate)
            console.log('Number conversion:', Number(concept.pj_domiciled_rate))
        })

        if (concepts.length === 0) {
            console.log('No concepts found matching "Comisiones"')
        }
    } catch (error) {
        console.error('Error:', error)
    } finally {
        await prisma.$disconnect()
    }
}

checkISLRConcepts()
