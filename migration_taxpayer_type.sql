-- CreateEnum
CREATE TYPE "TaxpayerType" AS ENUM (
    'PN_RESIDENTE',
    'PN_NO_RESIDENTE',
    'PJ_DOMICILIADA',
    'PJ_NO_DOMICILIADA'
);
-- AlterTable
ALTER TABLE "ThirdParty"
ADD COLUMN "taxpayer_type" "TaxpayerType" NOT NULL DEFAULT 'PJ_DOMICILIADA';