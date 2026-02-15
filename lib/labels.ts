/**
 * Etiquetas en español para estados y tipos mostrados al usuario.
 * La aplicación es en español; no mostrar claves en inglés (PENDING, BILL, POSTED, etc.).
 */

/** Estado de pago de documentos (facturas, etc.) */
export function paymentStatusLabel(status: string | null | undefined): string {
  if (!status) return '—'
  const map: Record<string, string> = {
    PENDING: 'Pendiente',
    PARTIAL: 'Parcial',
    PAID: 'Pagado',
    VOID: 'Anulado',
  }
  return map[status] ?? status
}

/** Estado de asiento contable */
export function journalEntryStatusLabel(status: string | null | undefined): string {
  if (!status) return '—'
  const map: Record<string, string> = {
    POSTED: 'Publicado',
    DRAFT: 'Borrador',
  }
  return map[status] ?? status
}

/** Tipo de documento (factura de compra, pago, retención, etc.) para estado de cuenta proveedores */
export function documentTypeLabel(type: string | null | undefined): string {
  if (!type) return '—'
  const map: Record<string, string> = {
    BILL: 'Factura',
    PAYMENT: 'Pago',
    CREDIT_NOTE: 'Nota de crédito',
    DEBIT_NOTE: 'Nota de débito',
    RETENTION: 'Retención',
  }
  return map[type] ?? type
}

/** Tipo de documento para estado de cuenta clientes (ventas) */
export function documentTypeLabelClient(type: string | null | undefined): string {
  if (!type) return '—'
  const map: Record<string, string> = {
    INVOICE: 'Factura',
    RECEIPT: 'Cobro',
    CREDIT_NOTE: 'Nota de crédito',
    DEBIT_NOTE: 'Nota de débito',
  }
  return map[type] ?? type
}

/** Estado de transacción bancaria */
export function bankTxStatusLabel(status: string | null | undefined): string {
  if (!status) return '—'
  const map: Record<string, string> = {
    PENDING: 'Pendiente',
    RECONCILED: 'Conciliado',
  }
  return map[status] ?? status
}
