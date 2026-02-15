import { UnifiedReportNavigation } from '@/components/reports/UnifiedReportNavigation'
import { FinancialTable } from '@/components/reports/FinancialTable'
import { FinancialControlsWrapper } from './FinancialControlsWrapper'
import { ReportService, ReportType } from '@/lib/services/report-service'

interface PageProps {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function FinancialReportsPage(props: PageProps) {
    const searchParams = await props.searchParams;
    const reportType = (searchParams.report as ReportType) || 'trial_balance'

    const now = new Date()
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]

    const startDate = (searchParams.start as string) || firstDay
    const endDate = (searchParams.end as string) || lastDay

    const data = await ReportService.getFinancialData(reportType, startDate, endDate)

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-800">Centro de Reportes</h1>

            <UnifiedReportNavigation activeReport={reportType} />

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <FinancialControlsWrapper
                    currentReport={reportType}
                    startDate={startDate}
                    endDate={endDate}
                />
            </div>

            <FinancialTable rows={data.rows} title={data.title} startDate={startDate} endDate={endDate} />
        </div>
    )
}
