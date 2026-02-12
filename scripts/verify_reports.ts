
import 'dotenv/config'
import { getLegalJournal, getJournalEntryList } from '../lib/actions/accounting-reports'
import { getPersistentCompanyId } from '../lib/company-utils'

async function verifyReports() {
    try {
        const companyId = await getPersistentCompanyId()
        console.log('Using Company ID:', companyId)

        // Test Legal Journal
        // Month 2 (Feb), Year 2026
        const journalEntries = await getLegalJournal({
            companyId,
            month: 2,
            year: 2026
        })
        console.log(`Legal Journal Entries (Feb 2026): ${journalEntries.length}`)
        if (journalEntries.length > 0) {
            console.log('Sample Entry:', journalEntries[0].description)
        }

        // Test Journal Entry List
        // 2026-02-11
        const startDate = new Date('2026-02-11')
        const endDate = new Date('2026-02-11')

        const listEntries = await getJournalEntryList({
            companyId,
            startDate,
            endDate
        })
        console.log(`Entry List (2026-02-11): ${listEntries.length}`)
        if (listEntries.length > 0) {
            console.log('Sample Entry:', listEntries[0].description)
        }

    } catch (error) {
        console.error('Error:', error)
    }
}

verifyReports()
