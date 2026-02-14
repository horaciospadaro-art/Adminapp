
import { CustomerStatement } from '@/components/operations/CustomerStatement'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default async function CustomerStatementPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    return (
        <div className="space-y-6 pb-20">
            <div className="flex items-center gap-4">
                <Link href="/dashboard/revenue/customers" className="text-gray-500 hover:text-gray-700">
                    <ArrowLeft className="w-6 h-6" />
                </Link>
                <h1 className="text-2xl font-bold text-gray-800">Estado de Cuenta del Cliente</h1>
            </div>
            <CustomerStatement customerId={id} />
        </div>
    )
}
