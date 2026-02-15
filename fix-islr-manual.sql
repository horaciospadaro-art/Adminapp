-- ISLR Rates Manual Correction Script
-- Review and manually correct the rates that look wrong
-- First, identify problematic records (rates > 100 or with trailing dots)
SELECT id,
    description,
    pn_resident_rate,
    pj_domiciled_rate,
    pn_non_resident_rate,
    pj_non_domiciled_rate
FROM "ISLRConcept"
WHERE CAST(
        COALESCE(NULLIF(pn_resident_rate, ''), '0') AS NUMERIC
    ) > 100
    OR CAST(
        COALESCE(NULLIF(pj_domiciled_rate, ''), '0') AS NUMERIC
    ) > 100
    OR CAST(
        COALESCE(NULLIF(pn_non_resident_rate, ''), '0') AS NUMERIC
    ) > 100
    OR CAST(
        COALESCE(NULLIF(pj_non_domiciled_rate, ''), '0') AS NUMERIC
    ) > 100
    OR pn_resident_rate LIKE '%.'
    OR pj_domiciled_rate LIKE '%.'
    OR pn_non_resident_rate LIKE '%.'
    OR pj_non_domiciled_rate LIKE '%.'
ORDER BY description;
-- Clean up trailing dots
UPDATE "ISLRConcept"
SET pn_resident_rate = RTRIM(pn_resident_rate, '.'),
    pj_domiciled_rate = RTRIM(pj_domiciled_rate, '.'),
    pn_non_resident_rate = RTRIM(pn_non_resident_rate, '.'),
    pj_non_domiciled_rate = RTRIM(pj_non_domiciled_rate, '.')
WHERE pn_resident_rate LIKE '%.'
    OR pj_domiciled_rate LIKE '%.'
    OR pn_non_resident_rate LIKE '%.'
    OR pj_non_domiciled_rate LIKE '%.';
-- Manual corrections for specific concepts
-- UNCOMMENT AND ADJUST THE RATES BELOW BASED ON YOUR OFFICIAL ISLR TABLE
/*
 -- Example: Asistencia Técnica (currently shows 3430, should probably be 34 and 30)
 UPDATE "ISLRConcept"
 SET 
 pn_resident_rate = '3',
 pj_domiciled_rate = '5',
 pn_non_resident_rate = '34',
 pj_non_domiciled_rate = '34'
 WHERE description = 'Asistencia Técnica';
 
 -- Example: Honorarios Profesionales (currently shows 3490, should probably be 34 and 90)
 UPDATE "ISLRConcept"
 SET 
 pn_resident_rate = '3',
 pj_domiciled_rate = '5',
 pn_non_resident_rate = '34',
 pj_non_domiciled_rate = '90'
 WHERE description = 'Honorarios Profesionales';
 
 -- Example: Primas de Seguro
 UPDATE "ISLRConcept"
 SET 
 pn_resident_rate = '3',
 pj_domiciled_rate = '5',
 pn_non_resident_rate = '10',
 pj_non_domiciled_rate = '10'
 WHERE description = 'Primas de Seguro';
 
 -- Example: Servicios Tecnológicos
 UPDATE "ISLRConcept"
 SET 
 pn_resident_rate = '3',
 pj_domiciled_rate = '5',
 pn_non_resident_rate = '34',
 pj_non_domiciled_rate = '50'
 WHERE description = 'Servicios Tecnológicos';
 */
-- Final verification - show all records
SELECT id,
    description,
    pn_resident_rate AS "PN Residente",
    pj_domiciled_rate AS "PJ Domiciliada",
    pn_non_resident_rate AS "PN No Residente",
    pj_non_domiciled_rate AS "PJ No Domiciliada"
FROM "ISLRConcept"
ORDER BY description;