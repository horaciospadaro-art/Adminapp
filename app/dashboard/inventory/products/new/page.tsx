import { ProductForm } from '@/components/inventory/ProductForm'

export default function NewProductPage() {
    return (
        <div className="max-w-4xl mx-auto py-8">
            <h1 className="text-2xl font-bold mb-6 text-gray-800">Nuevo Producto</h1>
            <ProductForm />
        </div>
    )
}
