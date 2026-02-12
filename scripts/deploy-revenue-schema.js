
const { Client } = require('pg')

async function main() {
    const client = new Client({
        connectionString: "postgresql://postgres.xmbkzjuyylrctzithtwq:AdminHRS-1978-7878@aws-1-us-east-1.pooler.supabase.com:5432/postgres",
        ssl: { rejectUnauthorized: false }
    })

    try {
        await client.connect()
        console.log('Connected to database.')

        // 1. Create Enums safely
        console.log('Creating Enums...')
        try { await client.query(`DO $$ BEGIN CREATE TYPE "TaxType" AS ENUM ('IVA', 'ISLR', 'IGTF', 'RETENCION_IVA', 'RETENCION_ISLR', 'OTRO'); EXCEPTION WHEN duplicate_object THEN null; END $$;`) } catch (e) { }
        try { await client.query(`DO $$ BEGIN CREATE TYPE "DocumentType" AS ENUM ('INVOICE', 'BILL', 'CREDIT_NOTE', 'DEBIT_NOTE', 'RECEIPT', 'PAYMENT'); EXCEPTION WHEN duplicate_object THEN null; END $$;`) } catch (e) { }
        try { await client.query(`DO $$ BEGIN CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PARTIAL', 'PAID', 'VOID'); EXCEPTION WHEN duplicate_object THEN null; END $$;`) } catch (e) { }
        try { await client.query(`DO $$ BEGIN CREATE TYPE "ProductType" AS ENUM ('GOODS', 'SERVICE'); EXCEPTION WHEN duplicate_object THEN null; END $$;`) } catch (e) { }

        // 2. Create Tables
        console.log('Creating Tables...')

        // Tax
        await client.query(`
      CREATE TABLE IF NOT EXISTS "Tax" (
        "id" TEXT NOT NULL,
        "company_id" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "code" TEXT,
        "rate" DECIMAL(5,2) NOT NULL,
        "type" "TaxType" NOT NULL,
        "description" TEXT,
        "gl_account_id" TEXT NOT NULL,
        "is_active" BOOLEAN NOT NULL DEFAULT true,
        "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP(3) NOT NULL,
        CONSTRAINT "Tax_pkey" PRIMARY KEY ("id")
      );
    `)

        // Document
        await client.query(`
      CREATE TABLE IF NOT EXISTS "Document" (
        "id" TEXT NOT NULL,
        "company_id" TEXT NOT NULL,
        "third_party_id" TEXT NOT NULL,
        "currency_code" TEXT NOT NULL,
        "type" "DocumentType" NOT NULL,
        "date" TIMESTAMP(3) NOT NULL,
        "due_date" TIMESTAMP(3),
        "number" TEXT NOT NULL,
        "reference" TEXT,
        "subtotal" DECIMAL(15,2) NOT NULL,
        "tax_amount" DECIMAL(15,2) NOT NULL,
        "total" DECIMAL(15,2) NOT NULL,
        "balance" DECIMAL(15,2) NOT NULL,
        "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
        "notes" TEXT,
        "journal_entry_id" TEXT,
        "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP(3) NOT NULL,
        CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
      );
    `)

        // DocumentItem
        await client.query(`
      CREATE TABLE IF NOT EXISTS "DocumentItem" (
        "id" TEXT NOT NULL,
        "document_id" TEXT NOT NULL,
        "product_id" TEXT,
        "description" TEXT NOT NULL,
        "quantity" DECIMAL(12,4) NOT NULL,
        "unit_price" DECIMAL(15,2) NOT NULL,
        "tax_id" TEXT,
        "tax_rate" DECIMAL(5,2) NOT NULL DEFAULT 0,
        "tax_amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
        "total" DECIMAL(15,2) NOT NULL,
        "gl_account_id" TEXT,
        CONSTRAINT "DocumentItem_pkey" PRIMARY KEY ("id")
      );
    `)

        // Withholding
        await client.query(`
      CREATE TABLE IF NOT EXISTS "Withholding" (
        "id" TEXT NOT NULL,
        "company_id" TEXT NOT NULL,
        "document_id" TEXT NOT NULL,
        "third_party_id" TEXT NOT NULL,
        "type" "TaxType" NOT NULL,
        "date" TIMESTAMP(3) NOT NULL,
        "certificate_number" TEXT NOT NULL,
        "base_amount" DECIMAL(15,2) NOT NULL,
        "rate" DECIMAL(5,2) NOT NULL,
        "amount" DECIMAL(15,2) NOT NULL,
        "journal_entry_id" TEXT,
        "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP(3) NOT NULL,
        CONSTRAINT "Withholding_pkey" PRIMARY KEY ("id")
      );
    `)

        // PaymentAllocation
        await client.query(`
      CREATE TABLE IF NOT EXISTS "PaymentAllocation" (
        "id" TEXT NOT NULL,
        "payment_id" TEXT NOT NULL,
        "invoice_id" TEXT NOT NULL,
        "amount" DECIMAL(15,2) NOT NULL,
        "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "PaymentAllocation_pkey" PRIMARY KEY ("id")
      );
    `)

        console.log('Tables created. Creating indexes...')

        const indexes = [
            `CREATE INDEX IF NOT EXISTS "Tax_company_id_idx" ON "Tax"("company_id")`,
            `CREATE INDEX IF NOT EXISTS "Document_third_party_id_idx" ON "Document"("third_party_id")`,
            `CREATE INDEX IF NOT EXISTS "Document_date_idx" ON "Document"("date")`,
            `CREATE UNIQUE INDEX IF NOT EXISTS "Document_company_id_type_number_key" ON "Document"("company_id", "type", "number")`,
            `CREATE UNIQUE INDEX IF NOT EXISTS "Document_journal_entry_id_key" ON "Document"("journal_entry_id")`,
            `CREATE INDEX IF NOT EXISTS "DocumentItem_document_id_idx" ON "DocumentItem"("document_id")`,
            `CREATE INDEX IF NOT EXISTS "Withholding_document_id_idx" ON "Withholding"("document_id")`,
            `CREATE INDEX IF NOT EXISTS "Withholding_third_party_id_idx" ON "Withholding"("third_party_id")`,
            `CREATE UNIQUE INDEX IF NOT EXISTS "Withholding_journal_entry_id_key" ON "Withholding"("journal_entry_id")`,
            `CREATE INDEX IF NOT EXISTS "PaymentAllocation_payment_id_idx" ON "PaymentAllocation"("payment_id")`,
            `CREATE INDEX IF NOT EXISTS "PaymentAllocation_invoice_id_idx" ON "PaymentAllocation"("invoice_id")`
        ]

        for (const idx of indexes) {
            try { await client.query(idx) } catch (e) { console.log('Index note:', e.message) }
        }

        console.log('Indexes created. Adding Constraints...')

        // Constraints (FKs)
        const constraints = [
            `ALTER TABLE "Tax" ADD CONSTRAINT "Tax_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE`,
            `ALTER TABLE "Tax" ADD CONSTRAINT "Tax_gl_account_id_fkey" FOREIGN KEY ("gl_account_id") REFERENCES "ChartOfAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE`,
            `ALTER TABLE "Document" ADD CONSTRAINT "Document_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE`,
            `ALTER TABLE "Document" ADD CONSTRAINT "Document_third_party_id_fkey" FOREIGN KEY ("third_party_id") REFERENCES "ThirdParty"("id") ON DELETE RESTRICT ON UPDATE CASCADE`,
            `ALTER TABLE "Document" ADD CONSTRAINT "Document_journal_entry_id_fkey" FOREIGN KEY ("journal_entry_id") REFERENCES "JournalEntry"("id") ON DELETE SET NULL ON UPDATE CASCADE`,
            `ALTER TABLE "DocumentItem" ADD CONSTRAINT "DocumentItem_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
            `ALTER TABLE "DocumentItem" ADD CONSTRAINT "DocumentItem_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE`,
            `ALTER TABLE "Withholding" ADD CONSTRAINT "Withholding_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE`,
            `ALTER TABLE "Withholding" ADD CONSTRAINT "Withholding_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "Document"("id") ON DELETE RESTRICT ON UPDATE CASCADE`,
            `ALTER TABLE "Withholding" ADD CONSTRAINT "Withholding_third_party_id_fkey" FOREIGN KEY ("third_party_id") REFERENCES "ThirdParty"("id") ON DELETE RESTRICT ON UPDATE CASCADE`,
            `ALTER TABLE "Withholding" ADD CONSTRAINT "Withholding_journal_entry_id_fkey" FOREIGN KEY ("journal_entry_id") REFERENCES "JournalEntry"("id") ON DELETE SET NULL ON UPDATE CASCADE`,
            `ALTER TABLE "PaymentAllocation" ADD CONSTRAINT "PaymentAllocation_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "Document"("id") ON DELETE RESTRICT ON UPDATE CASCADE`,
            `ALTER TABLE "PaymentAllocation" ADD CONSTRAINT "PaymentAllocation_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "Document"("id") ON DELETE RESTRICT ON UPDATE CASCADE`
        ]

        for (const constraint of constraints) {
            try {
                await client.query(constraint)
            } catch (e) {
                if (!e.message.includes('already exists') && !e.message.includes('duplicate')) {
                    console.log('Constraint note:', e.message)
                }
            }
        }

        console.log('Migration completed successfully.')

    } catch (error) {
        console.error('Migration failed:', error)
    } finally {
        await client.end()
    }
}

main()
