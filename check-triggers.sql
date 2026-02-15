-- Script para buscar Triggers y Funciones que puedan estar causando el error
-- Ejecutar en Supabase SQL Editor
-- 1. Listar Triggers en la tabla Document
SELECT event_object_table as table_name,
    trigger_name,
    event_manipulation as event,
    action_statement as definition
FROM information_schema.triggers
WHERE event_object_table = 'Document';
-- 2. Busqueda de texto en definiciones de funciones (por si alguna menciona 'igtf')
SELECT routine_name,
    routine_definition
FROM information_schema.routines
WHERE routine_definition ILIKE '%igtf%'
    AND routine_schema = 'public';