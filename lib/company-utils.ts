
import prisma from '@/lib/db'

/**
 * Retrieves the primary company ID for the application.
 * Currently hardcoded to prefer 'Empresa Demo C.A.' or the first created company.
 * This ensures consistency across reports and actions.
 */
export async function getPersistentCompanyId() {
    // Try to find the specific demo company first
    const demoCompany = await prisma.company.findFirst({
        where: { name: 'Empresa Demo C.A.' }
    })

    if (demoCompany) {
        return demoCompany.id
    }

    // Fallback to the first created company
    const firstCompany = await prisma.company.findFirst({
        orderBy: { created_at: 'asc' }
    })

    return firstCompany?.id || ''
}
