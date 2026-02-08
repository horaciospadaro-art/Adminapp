import { DynamicReportBuilder } from '@/components/reports/DynamicReportBuilder'

export default function ReportBuilderPage() {
    return (
        <div className="h-full flex flex-col space-y-4">
            <div>
                <h1 className="text-2xl font-bold text-gray-800">Constructor de Reportes</h1>
                <p className="text-gray-500 text-sm">
                    Seleccione un módulo y personalice sus columnas para generar un reporte a medida.
                </p>
            </div>

            <DynamicReportBuilder />
        </div>
    )
}
