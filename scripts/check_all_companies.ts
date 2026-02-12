
import 'dotenv/config'
import prisma from '../lib/db'

async function checkCompanies() {
    try {
        const companies = await prisma.company.findMany()
        console.log('Total Companies:', companies.length)
        console.log(JSON.stringify(companies, null, 2))
    } catch (error) {
        console.error('Error:', error)
    }
}

checkCompanies()
