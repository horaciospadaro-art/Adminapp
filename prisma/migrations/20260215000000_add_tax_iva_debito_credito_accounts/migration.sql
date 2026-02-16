-- AlterTable: IVA Débito Fiscal (ventas) y Crédito Fiscal (compras) por tasa de impuesto
ALTER TABLE "Tax" ADD COLUMN IF NOT EXISTS "debito_fiscal_account_id" TEXT;
ALTER TABLE "Tax" ADD COLUMN IF NOT EXISTS "credito_fiscal_account_id" TEXT;

-- AddForeignKey (solo si no existen; en PostgreSQL no hay IF NOT EXISTS para constraints, se asume migración única)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Tax_debito_fiscal_account_id_fkey'
  ) THEN
    ALTER TABLE "Tax" ADD CONSTRAINT "Tax_debito_fiscal_account_id_fkey"
      FOREIGN KEY ("debito_fiscal_account_id") REFERENCES "ChartOfAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Tax_credito_fiscal_account_id_fkey'
  ) THEN
    ALTER TABLE "Tax" ADD CONSTRAINT "Tax_credito_fiscal_account_id_fkey"
      FOREIGN KEY ("credito_fiscal_account_id") REFERENCES "ChartOfAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
