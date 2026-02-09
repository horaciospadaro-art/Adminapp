-- CreateTable for Withholding
CREATE TABLE "Withholding" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "document_id" TEXT NOT NULL,
    "third_party_id" TEXT NOT NULL,
    "type" "TaxType" NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "certificate_number" TEXT NOT NULL,
    "base_amount" DECIMAL(15, 2) NOT NULL,
    "rate" DECIMAL(5, 2) NOT NULL,
    "amount" DECIMAL(15, 2) NOT NULL,
    "journal_entry_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Withholding_pkey" PRIMARY KEY ("id")
);
-- CreateTable for PaymentAllocation
CREATE TABLE "PaymentAllocation" (
    "id" TEXT NOT NULL,
    "payment_id" TEXT NOT NULL,
    "invoice_id" TEXT NOT NULL,
    "amount" DECIMAL(15, 2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PaymentAllocation_pkey" PRIMARY KEY ("id")
);
-- CreateIndex
CREATE INDEX "Withholding_document_id_idx" ON "Withholding"("document_id");
-- CreateIndex
CREATE INDEX "Withholding_third_party_id_idx" ON "Withholding"("third_party_id");
-- CreateIndex
CREATE UNIQUE INDEX "Withholding_journal_entry_id_key" ON "Withholding"("journal_entry_id");
-- CreateIndex
CREATE INDEX "PaymentAllocation_payment_id_idx" ON "PaymentAllocation"("payment_id");
-- CreateIndex
CREATE INDEX "PaymentAllocation_invoice_id_idx" ON "PaymentAllocation"("invoice_id");
-- AddForeignKey
ALTER TABLE "Withholding"
ADD CONSTRAINT "Withholding_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "Withholding"
ADD CONSTRAINT "Withholding_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "Document"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "Withholding"
ADD CONSTRAINT "Withholding_third_party_id_fkey" FOREIGN KEY ("third_party_id") REFERENCES "ThirdParty"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "Withholding"
ADD CONSTRAINT "Withholding_journal_entry_id_fkey" FOREIGN KEY ("journal_entry_id") REFERENCES "JournalEntry"("id") ON DELETE
SET NULL ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "PaymentAllocation"
ADD CONSTRAINT "PaymentAllocation_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "Document"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "PaymentAllocation"
ADD CONSTRAINT "PaymentAllocation_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "Document"("id") ON DELETE RESTRICT ON UPDATE CASCADE;