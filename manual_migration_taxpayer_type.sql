-- 1. Crear el tipo ENUM si no existe (Postgres no soporta IF NOT EXISTS para CREATE TYPE directamente, asi que usamos un bloque DO)
DO $$ BEGIN CREATE TYPE "TaxpayerType" AS ENUM (
    'PN_RESIDENTE',
    'PN_NO_RESIDENTE',
    'PJ_DOMICILIADA',
    'PJ_NO_DOMICILIADA'
);
EXCEPTION
WHEN duplicate_object THEN null;
END $$;
-- 2. Agregar la columna a la tabla ThirdParty
ALTER TABLE "ThirdParty"
ADD COLUMN IF NOT EXISTS "taxpayer_type" "TaxpayerType" NOT NULL DEFAULT 'PJ_DOMICILIADA';