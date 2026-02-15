-- Script para eliminar columnas IGTF de la tabla Document
-- Ejecutar en Supabase SQL Editor
-- 1. Eliminar columnas is_igtf e igtf_amount de la tabla Document
ALTER TABLE "Document" DROP COLUMN IF EXISTS "is_igtf";
ALTER TABLE "Document" DROP COLUMN IF EXISTS "igtf_amount";
-- 2. Verificar que las columnas fueron eliminadas
SELECT column_name,
    data_type
FROM information_schema.columns
WHERE table_name = 'Document'
    AND column_name IN ('is_igtf', 'igtf_amount');
-- Si el resultado está vacío, las columnas fueron eliminadas correctamente