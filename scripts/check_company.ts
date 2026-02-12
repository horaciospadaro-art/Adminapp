
import 'dotenv/config'
import prisma from '../lib/db'

async function checkCompany() {
    try {
        const company = await prisma.company.findFirst()
        console.log('Default Company ID:', company?.id)

        // Compare with value from previous script
        const targetId = "486e632f-7252-493c-af9b-80fa25d0a4ae"
        if (company?.id === targetId) {
            console.log('MATCH: Company ID matches the entry company ID.')
        } else {
            console.log('MISMATCH: Default Company ID is different from entry company ID.')
        }

    } catch (error) {
        console.error('Error:', error)
    }
}

checkCompany()
