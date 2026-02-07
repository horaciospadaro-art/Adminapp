export default function DashboardPage() {
    return (
        <div>
            <h1 className="text-2xl font-bold text-gray-800 mb-6">Tablero de Control</h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                {/* KPI Cards */}
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                    <h3 className="text-gray-500 text-sm font-medium">Balance en Caja/Bancos</h3>
                    <p className="text-3xl font-bold text-gray-900 mt-2">12.450,00 <span className="text-lg text-gray-400">VES</span></p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                    <h3 className="text-gray-500 text-sm font-medium">Ventas del Mes</h3>
                    <p className="text-3xl font-bold text-green-600 mt-2">45.200,00 <span className="text-lg text-gray-400">VES</span></p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                    <h3 className="text-gray-500 text-sm font-medium">Cuentas por Pagar</h3>
                    <p className="text-3xl font-bold text-red-600 mt-2">8.300,00 <span className="text-lg text-gray-400">VES</span></p>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Actividad Reciente</h2>
                <div className="text-sm text-gray-500 py-8 text-center bg-gray-50 rounded border border-dashed border-gray-200">
                    No se encontraron transacciones recientes.
                </div>
            </div>
        </div>
    )
}
