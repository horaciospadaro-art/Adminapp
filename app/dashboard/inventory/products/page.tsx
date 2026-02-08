import { ProductList } from '@/components/inventory/ProductList'

export default function ProductsPage() {
    return <ProductList type="GOODS" title="Productos" basePath="/dashboard/inventory/products" />
}
