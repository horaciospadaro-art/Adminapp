export const dynamic = 'force-dynamic'
import { Sidebar } from '@/components/layout/Sidebar'
import { TopBar } from '@/components/layout/TopBar'
import prisma from '@/lib/db'

async function getActiveCompany() {
    return await prisma.company.findFirst()
}

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const company = await getActiveCompany()

    return (
        <div className="flex h-screen bg-[#f4f5f8] flex-col">
            <div data-print-hide>
                <TopBar companyName={company?.name} />
            </div>
            <div className="flex flex-1 overflow-hidden">
                <div data-print-hide className="shrink-0">
                    <Sidebar />
                </div>
                <main className="flex-1 overflow-auto p-6 relative print:p-0">
                    {children}
                </main>
            </div>
        </div>
    )
}
