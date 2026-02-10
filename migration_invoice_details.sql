-- Add new columns to Document table
ALTER TABLE "Document" ADD COLUMN "control_number" TEXT;
ALTER TABLE "Document" ADD COLUMN "accounting_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Add new columns to DocumentItem table
ALTER TABLE "DocumentItem" ADD COLUMN "vat_retention_rate" DECIMAL(5, 2) NOT NULL DEFAULT 0;
ALTER TABLE "DocumentItem" ADD COLUMN "vat_retention_amount" DECIMAL(15, 2) NOT NULL DEFAULT 0;
ALTER TABLE "DocumentItem" ADD COLUMN "islr_rate" DECIMAL(5, 2) NOT NULL DEFAULT 0;
ALTER TABLE "DocumentItem" ADD COLUMN "islr_amount" DECIMAL(15, 2) NOT NULL DEFAULT 0;
