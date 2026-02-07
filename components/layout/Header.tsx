export function Header() {
    return (
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
            <div className="flex items-center">
                <span className="text-gray-500 text-sm mr-2">Empresa:</span>
                <span className="font-semibold text-gray-800">Empresa Demo C.A.</span>
                <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">Activa</span>
            </div>
            <div className="flex items-center space-x-4">
                <button className="text-gray-500 hover:text-gray-700">
                    <span className="sr-only">Notificaciones</span>
                    🔔
                </button>
                <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold">
                    JD
                </div>
            </div>
        </header>
    )
}
