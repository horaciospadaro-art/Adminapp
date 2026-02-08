import Link from 'next/link'
import { ShieldCheck } from 'lucide-react'

export default function Home() {
  return (
    <div className="min-h-screen bg-white flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md flex flex-col items-center">

        {/* Logo Section Row 1: ABC + Icon */}
        <div className="flex items-center justify-center space-x-2">
          <h1 className="text-5xl font-extrabold text-[#1e293b] tracking-tight">
            ABC
          </h1>
          <ShieldCheck className="h-12 w-12 text-[#84cc16]" strokeWidth={3} />
        </div>

        {/* Logo Section Row 2: AdminApp */}
        <div className="mt-[-0.5rem] mb-2">
          <span className="text-4xl font-bold text-[#1e293b]">AdminApp</span>
        </div>

        {/* Orange Separator */}
        <div className="w-32 h-1.5 bg-[#f97316] rounded-full mb-6"></div>

        {/* Subtitle */}
        <p className="text-center text-sm text-[#64748b] font-medium tracking-wider uppercase mb-10">
          Software Contable & Administrativo
        </p>

        {/* Login Button Area */}
        <div className="w-full max-w-xs">
          <Link
            href="/dashboard"
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-md text-base font-semibold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 transform hover:scale-[1.02]"
          >
            Entrar al Sistema
          </Link>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-xs text-gray-400">
          &copy; {new Date().getFullYear()} ABC AdminApp <br />
          Todos los derechos reservados.
        </div>
      </div>
    </div>
  )
}
