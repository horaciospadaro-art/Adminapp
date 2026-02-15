# ABC Admin App – Plan de negocio y reglas contables

Este documento describe la visión del producto, los módulos y las reglas de integridad contable para no perder contexto al continuar con modificaciones.

## Visión del producto

- **Sistema administrativo multi-empresas:** permitir crear muchas empresas; cada una con su propio plan contable y configuración.
- **Plan contable por empresa:** cada empresa tiene un plan de cuentas (Chart of Accounts) con códigos jerárquicos y tipos (Activo, Pasivo, Patrimonio, Ingreso, Costo, Gasto, Otro).
- **Módulos enlazados al plan contable:** los módulos (Clientes, Proveedores, Bancos, Inventario, etc.) están vinculados al plan de cuentas mediante cuentas asignadas (por cobrar, por pagar, cuenta de banco, cuenta de ingreso por producto, etc.).
- **Integridad lógica contable:** toda transacción registrada en los módulos administrativos debe desembocar en el plan contable con los débitos y créditos correspondientes. No debe quedar ninguna operación sin reflejo en los mayores analíticos.

## Módulos y flujo contable

| Módulo | Enlace al plan contable | Asiento generado |
|--------|-------------------------|------------------|
| **Empresas** | N/A | N/A |
| **Plan de cuentas** | Cuentas con tipo y jerarquía | Asientos manuales desde Contabilidad |
| **Clientes** | `receivable_account_id` (cuenta por cobrar) | Facturas de venta → CxC, Ingresos, IVA débito |
| **Proveedores** | `payable_account_id` (cuenta por pagar) | Facturas de compra → CxP, Gastos/Inventario, IVA crédito |
| **Facturas (venta)** | Cliente con cuenta por cobrar; ítems con `gl_account_id` (cuenta de ingreso); impuestos con `gl_account_id` | `createDocumentJournalEntry` (INVOICE / CREDIT_NOTE) |
| **Facturas de compra** | Proveedor con cuenta por pagar; ítems con `gl_account_id` | `createBillJournalEntry` |
| **Cobros (recibos)** | Cliente con cuenta por cobrar; banco o caja con cuenta contable | `createPaymentJournalEntry` |
| **Retenciones** | Tercero + cuenta del impuesto (retención IVA/ISLR) | `createWithholdingJournalEntry` |
| **Bancos** | Cuenta bancaria con `gl_account_id` | Asiento por movimiento (débito/crédito/transferencia/IGTF) en `api/banks/[bankId]/transactions` |
| **Inventario** | Producto con `asset_account_id`, `cogs_account_id`, `income_account_id` | Asiento por tipo de movimiento en `inventory-service.createJournalEntryForMovement` |

## Reglas de integridad contable

1. **Ningún documento/transacción sin asiento:** si falla la creación del asiento contable, la transacción de base de datos debe hacer rollback (no persistir el documento sin asiento).
2. **Validación en API:** en `documents`, `receipts` y `withholdings`, un error del helper contable se propaga y devuelve 422 con mensaje claro (ej. "Falta cuenta por cobrar en el cliente", "Falta cuenta contable en ítem").
3. **Validación en UI:** en formularios de clientes y proveedores la cuenta contable (por cobrar / por pagar) es obligatoria. En facturas de venta cada ítem debe tener cuenta de ingreso (`gl_account_id`), por producto o por línea.
4. **Fuente única del esquema:** el esquema de base de datos se gestiona con Prisma (`prisma/schema.prisma`). No se altera el esquema desde el SQL Editor de Supabase. Cambios con `npx prisma migrate dev` (local) o `npx prisma migrate deploy` (producción).

## Stack y despliegue

- **App:** Next.js 16, React 19, TypeScript, Tailwind 4.
- **Base de datos:** PostgreSQL (Supabase), acceso vía Prisma.
- **Despliegue:** Vercel. Código en GitHub. Variables de entorno en Vercel: `DATABASE_URL` (y `DIRECT_URL` si se usa pooler de Supabase).

## Referencia de archivos clave

- **Asientos automáticos:** `lib/accounting-helpers.ts` (`createDocumentJournalEntry`, `createBillJournalEntry`, `createPaymentJournalEntry`, `createWithholdingJournalEntry`).
- **API documentos (facturas venta):** `app/api/documents/route.ts`.
- **API facturas de compra:** `app/api/operations/suppliers/bills/route.ts`.
- **API cobros:** `app/api/receipts/route.ts`.
- **API retenciones:** `app/api/withholdings/route.ts`.
- **Reportes contables:** `lib/services/report-service.ts`, `lib/actions/accounting-reports.ts` (mayor analítico, diario legal, balance de comprobación, estado de resultados, balance general).
