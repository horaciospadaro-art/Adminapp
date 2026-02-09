-- CreateEnum
CREATE TYPE "MovementType" AS ENUM (
    'PURCHASE',
    'SALE',
    'ADJUSTMENT_IN',
    'ADJUSTMENT_OUT',
    'TRANSFER_IN',
    'TRANSFER_OUT'
);
-- AlterTable
ALTER TABLE "Product"
ADD COLUMN "minimum_stock" DECIMAL(12, 4) NOT NULL DEFAULT 0,
    ADD COLUMN "reorder_point" DECIMAL(12, 4),
    ADD COLUMN "last_purchase_date" TIMESTAMP(3);
-- CreateTable
CREATE TABLE "InventoryMovement" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "type" "MovementType" NOT NULL,
    "quantity" DECIMAL(12, 4) NOT NULL,
    "unit_cost" DECIMAL(15, 2) NOT NULL,
    "total_value" DECIMAL(15, 2) NOT NULL,
    "avg_cost_before" DECIMAL(15, 2) NOT NULL,
    "avg_cost_after" DECIMAL(15, 2) NOT NULL,
    "reference" TEXT,
    "description" TEXT,
    "document_id" TEXT,
    "journal_entry_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "InventoryMovement_pkey" PRIMARY KEY ("id")
);
-- CreateIndex
CREATE UNIQUE INDEX "InventoryMovement_journal_entry_id_key" ON "InventoryMovement"("journal_entry_id");
-- CreateIndex
CREATE INDEX "InventoryMovement_product_id_idx" ON "InventoryMovement"("product_id");
-- CreateIndex
CREATE INDEX "InventoryMovement_date_idx" ON "InventoryMovement"("date");
-- CreateIndex
CREATE INDEX "InventoryMovement_type_idx" ON "InventoryMovement"("type");
-- AddForeignKey
ALTER TABLE "InventoryMovement"
ADD CONSTRAINT "InventoryMovement_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "InventoryMovement"
ADD CONSTRAINT "InventoryMovement_journal_entry_id_fkey" FOREIGN KEY ("journal_entry_id") REFERENCES "JournalEntry"("id") ON DELETE
SET NULL ON UPDATE CASCADE;