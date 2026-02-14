-- Fix Product table constraints to match Prisma schema
-- Make account IDs nullable and SKU nullable
ALTER TABLE "Product"
ALTER COLUMN "income_account_id" DROP NOT NULL;
ALTER TABLE "Product"
ALTER COLUMN "cogs_account_id" DROP NOT NULL;
ALTER TABLE "Product"
ALTER COLUMN "asset_account_id" DROP NOT NULL;
ALTER TABLE "Product"
ALTER COLUMN "sku" DROP NOT NULL;