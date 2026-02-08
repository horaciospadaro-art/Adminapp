import Link from 'next/link'

export function TopBar() {
    return (
        <header className="h-14 bg-[#2c2c2c] text-white flex items-center justify-between px-4 shrink-0 z-20 relative shadow-sm">
            <div className="flex items-center gap-4">
                {/* Logo / Brand */}
                <Link href="/dashboard" className="flex items-center gap-2 font-bold text-lg tracking-tight">
                    <div className="w-8 h-8 bg-[#84cc16] rounded-full flex items-center justify-center text-white font-bold text-xs">
                        ABC
                    </div>
                    <span>ABC AdminApp</span>
                </Link>

                {/* Search Bar (Visual Placeholder) */}
                <div className="hidden md:block relative ml-8">
                    <input
                        type="text"
                        placeholder="Buscar"
                        className="bg-[#1a1a1a] text-sm text-gray-300 rounded-full px-4 py-1.5 w-64 border border-transparent focus:border-[#2ca01c] focus:outline-none"
                    />
                </div>
            </div>

            <div className="flex items-center gap-2">
                {/* Icons Placeholder */}
                <button className="p-2 hover:bg-[#3d3d3d] rounded-full transition-colors text-gray-300">
                    <span className="sr-only">Ayuda</span>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                </button>
                <button className="p-2 hover:bg-[#3d3d3d] rounded-full transition-colors text-gray-300">
                    <span className="sr-only">Notificaciones</span>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>
                </button>
                <button className="p-2 hover:bg-[#3d3d3d] rounded-full transition-colors text-gray-300">
                    <span className="sr-only">Configuración</span>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                </button>
                <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-xs font-bold ml-2">
                    H
                </div>
            </div>
        </header>
    )
}
