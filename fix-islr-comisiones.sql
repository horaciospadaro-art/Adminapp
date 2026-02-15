-- Fix ISLR Concept "Comisiones" - Set rate for Persona Jurídica Domiciliada
-- This will fix the NaN issue when calculating ISLR retention for PJ Domiciliada suppliers
UPDATE "ISLRConcept"
SET pj_domiciled_rate = '5'
WHERE description ILIKE '%comisiones%';
-- Verify the update
SELECT id,
    seniat_code,
    description,
    pn_resident_rate,
    pj_domiciled_rate,
    pn_non_resident_rate,
    pj_non_domiciled_rate
FROM "ISLRConcept"
WHERE description ILIKE '%comisiones%';