-- CreateTable: GlobalTaxConfiguration
CREATE TABLE "GlobalTaxConfiguration" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "iva_fiscal_debit_account_id" TEXT,
    "iva_fiscal_credit_account_id" TEXT,
    "iva_retention_account_id" TEXT,
    "islr_retention_account_id" TEXT,
    "igtf_account_id" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "GlobalTaxConfiguration_pkey" PRIMARY KEY ("id")
);
-- CreateIndex
CREATE UNIQUE INDEX "GlobalTaxConfiguration_company_id_key" ON "GlobalTaxConfiguration"("company_id");
-- AddForeignKey
ALTER TABLE "GlobalTaxConfiguration"
ADD CONSTRAINT "GlobalTaxConfiguration_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
-- AddForeignKeys (Accounts)
ALTER TABLE "GlobalTaxConfiguration"
ADD CONSTRAINT "GlobalTaxConfiguration_iva_fiscal_debit_account_id_fkey" FOREIGN KEY ("iva_fiscal_debit_account_id") REFERENCES "ChartOfAccount"("id") ON DELETE
SET NULL ON UPDATE CASCADE;
ALTER TABLE "GlobalTaxConfiguration"
ADD CONSTRAINT "GlobalTaxConfiguration_iva_fiscal_credit_account_id_fkey" FOREIGN KEY ("iva_fiscal_credit_account_id") REFERENCES "ChartOfAccount"("id") ON DELETE
SET NULL ON UPDATE CASCADE;
ALTER TABLE "GlobalTaxConfiguration"
ADD CONSTRAINT "GlobalTaxConfiguration_iva_retention_account_id_fkey" FOREIGN KEY ("iva_retention_account_id") REFERENCES "ChartOfAccount"("id") ON DELETE
SET NULL ON UPDATE CASCADE;
ALTER TABLE "GlobalTaxConfiguration"
ADD CONSTRAINT "GlobalTaxConfiguration_islr_retention_account_id_fkey" FOREIGN KEY ("islr_retention_account_id") REFERENCES "ChartOfAccount"("id") ON DELETE
SET NULL ON UPDATE CASCADE;
ALTER TABLE "GlobalTaxConfiguration"
ADD CONSTRAINT "GlobalTaxConfiguration_igtf_account_id_fkey" FOREIGN KEY ("igtf_account_id") REFERENCES "ChartOfAccount"("id") ON DELETE
SET NULL ON UPDATE CASCADE;
-- CreateTable: VATRetention
CREATE TABLE "VATRetention" (
    "id" TEXT NOT NULL,
    "seniat_code" TEXT,
    "description" TEXT NOT NULL,
    "rate" DECIMAL(5, 2) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "VATRetention_pkey" PRIMARY KEY ("id")
);
-- AlterTable: Tax (Make gl_account_id optional)
-- First drop the Not Null constraint
ALTER TABLE "Tax"
ALTER COLUMN "gl_account_id" DROP NOT NULL;
-- Seed: VAT Retention (75% and 100%)
INSERT INTO "VATRetention" ("id", "description", "rate", "updatedAt")
VALUES (
        gen_random_uuid(),
        'Retención del 75%',
        75.00,
        CURRENT_TIMESTAMP
    ),
    (
        gen_random_uuid(),
        'Retención del 100%',
        100.00,
        CURRENT_TIMESTAMP
    );
-- Seed: GlobalTaxConfiguration (Try to create one for the first existing company)
INSERT INTO "GlobalTaxConfiguration" ("id", "company_id", "updatedAt")
SELECT gen_random_uuid(),
    id,
    CURRENT_TIMESTAMP
FROM "Company"
LIMIT 1 ON CONFLICT DO NOTHING;