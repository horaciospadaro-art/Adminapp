import { PageHeader } from '@/components/ui/PageHeader'
import { Info } from 'lucide-react'

export default function TaxesPage() {
    return (
        <div className="max-w-5xl mx-auto">
            <PageHeader title="Configuración de Impuestos" />

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                <div className="flex justify-center mb-4">
                    <div className="p-3 bg-blue-50 rounded-full">
                        <Info className="w-8 h-8 text-blue-500" />
                    </div>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Módulo de Impuestos</h3>
                <p className="text-gray-500 max-w-md mx-auto">
                    Aquí podrás configurar las tasas y retenciones para IVA, ISLR e IGTF.
                    <br />
                    Esta configuración estará disponible automáticamente para los módulos de Clientes y Proveedores.
                </p>

                <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 text-left max-w-4xl mx-auto">
                    <div className="p-4 border border-gray-200 rounded-lg bg-gray-50 opacity-60">
                        <h4 className="font-medium text-gray-800">IVA e IGTF</h4>
                        <p className="text-sm text-gray-500 mt-1">Tasas generales y reducidas.</p>
                    </div>
                    <div className="p-4 border border-gray-200 rounded-lg bg-gray-50 opacity-60">
                        <h4 className="font-medium text-gray-800">Retenciones IVA</h4>
                        <p className="text-sm text-gray-500 mt-1">Porcentajes de retención (75%, 100%).</p>
                    </div>
                    <div className="p-4 border border-gray-200 rounded-lg bg-gray-50 opacity-60">
                        <h4 className="font-medium text-gray-800">Retenciones ISLR</h4>
                        <p className="text-sm text-gray-500 mt-1">Tablas de conceptos y sustraendos.</p>
                    </div>
                </div>
            </div>
        </div>
    )
}
