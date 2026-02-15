-- Script para verificar y corregir el company_id
-- Ejecutar en Supabase SQL Editor
-- 1. Ver qué companies existen en la base de datos
SELECT id,
    name,
    rif
FROM "Company";
-- 2. Si no existe ninguna company, crear una por defecto
-- (Descomenta y ajusta los valores según tu empresa)
/*
 INSERT INTO "Company" (id, name, rif, fiscal_year_start, currency, created_at, updated_at)
 VALUES (
 '1',
 'ARCOIRIS',
 'J-XXXXXXXX-X',
 '2025-01-01',
 'VES',
 NOW(),
 NOW()
 )
 ON CONFLICT (id) DO NOTHING;
 */