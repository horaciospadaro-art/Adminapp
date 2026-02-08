import { ProductForm } from '@/components/inventory/ProductForm'
import prisma from '@/lib/db'
import { notFound } from 'next/navigation'

export default async function EditServicePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const product = await prisma.product.findUnique({
        where: { id }
    })

    if (!product) notFound()

    return (
        <div className="max-w-4xl mx-auto py-8">
            <h1 className="text-2xl font-bold mb-6 text-gray-800">Editar Servicio</h1>
            <ProductForm isService initialData={JSON.parse(JSON.stringify(product))} />
        </div>
    )
}
