import { ProductForm } from '@/components/inventory/ProductForm'

export default function NewServicePage() {
    return (
        <div className="max-w-4xl mx-auto py-8">
            <h1 className="text-2xl font-bold mb-6 text-gray-800">Nuevo Servicio</h1>
            <ProductForm isService />
        </div>
    )
}
