-- Script para verificar columnas en base de datos
-- Ejecutar en Supabase SQL Editor
SELECT table_name,
    column_name,
    data_type
FROM information_schema.columns
WHERE table_name IN (
        'Document',
        'DocumentItem',
        'Withholding',
        'BankTransaction'
    )
ORDER BY table_name,
    ordinal_position;