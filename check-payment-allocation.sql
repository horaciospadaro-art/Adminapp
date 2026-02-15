-- Script para verificar las columnas de PaymentAllocation
-- Ejecutar en Supabase SQL Editor
SELECT column_name,
    data_type
FROM information_schema.columns
WHERE table_name = 'PaymentAllocation';