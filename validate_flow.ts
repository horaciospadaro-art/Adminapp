require('dotenv').config();
// Intentar importar prisma de lib/db.ts
// lib/db.ts tiene 'export default prisma', así que en CJS esto suele ser .default
let prisma;
try {
    const dbModule = require('./lib/db');
    prisma = dbModule.default || dbModule;
} catch (e) {
    // Fallback si falla
    console.error("Error importando db:", e);
    const { PrismaClient } = require('@prisma/client');
    prisma = new PrismaClient();
}

async function validateFlow() {
    console.log('🔄 Iniciando Validación de Flujo de Facturación e Inventario...');

    try {
        // 1. Obtener una Compañía
        const company = await prisma.company.findFirst();
        if (!company) throw new Error('❌ No se encontró ninguna compañía.');
        console.log(`✅ Compañía encontrada: ${company.name}`);

        // 2. Obtener un Producto (o crear uno de prueba)
        let product = await prisma.product.findFirst({
            where: { type: 'GOODS', track_inventory: true }
        });

        if (!product) {
            console.log('⚠️ No se encontró producto, creando uno de prueba...');
            // Necesitamos una cuenta de activo para el producto
            const assetAccount = await prisma.chartOfAccount.findFirst({ where: { type: 'ASSET' } });

            product = await prisma.product.create({
                data: {
                    company_id: company.id,
                    name: 'Producto de Prueba Auto',
                    type: 'GOODS',
                    track_inventory: true,
                    sales_price: 100,
                    quantity_on_hand: 50,
                    avg_cost: 50,
                    asset_account_id: assetAccount?.id
                }
            });
        }
        console.log(`✅ Producto listo: ${product.name} (Stock: ${product.quantity_on_hand})`);

        // 3. Obtener un Cliente
        const client = await prisma.thirdParty.findFirst({
            where: { type: 'CLIENTE' }
        });
        if (!client) throw new Error('❌ No se encontró ningún cliente.');
        console.log(`✅ Cliente encontrado: ${client.name}`);

        // 4. Crear Factura (Simulación)
        console.log('📝 Creando Factura de Venta...');
        const invoice = await prisma.document.create({
            data: {
                company_id: company.id,
                third_party_id: client.id,
                type: 'INVOICE',
                date: new Date(),
                due_date: new Date(),
                number: `TEST-${Date.now()}`,
                currency_code: 'VES',
                subtotal: 100,
                tax_amount: 16,
                total: 116,
                balance: 116,
                items: {
                    create: {
                        description: 'Venta de Prueba',
                        product_id: product.id,
                        quantity: 1,
                        unit_price: 100,
                        total: 100,
                        tax_rate: 16,
                        tax_amount: 16
                    }
                }
            }
        });
        console.log(`✅ Factura creada: ${invoice.number}`);

        // 5. Validar Movimiento de Inventario
        console.log('📦 Registrando Movimiento de Salida...');
        const movement = await prisma.inventoryMovement.create({
            data: {
                company_id: company.id,
                product_id: product.id,
                date: new Date(),
                type: 'SALE',
                quantity: 1,
                unit_cost: 50,
                total_value: 50,
                avg_cost_before: 50,
                avg_cost_after: 50,
                document_id: invoice.id
            }
        });
        console.log(`✅ Movimiento registrado: ${movement.type} - Cantidad: ${movement.quantity}`);

        console.log('\n🎉 VALIDACIÓN EXITOSA: La base de datos soporta el flujo completo.');

    } catch (error) {
        console.error('\n❌ ERROR DE VALIDACIÓN:', error);
        process.exit(1);
    } finally {
        if (prisma) await prisma.$disconnect();
    }
}

validateFlow();
