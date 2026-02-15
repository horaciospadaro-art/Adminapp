-- Fix ALL ISLR Concepts - Clean rate values to be pure numbers
-- This will remove % symbols and extract only numeric values
-- First, let's see all current values
SELECT id,
    description,
    pn_resident_rate,
    pj_domiciled_rate,
    pn_non_resident_rate,
    pj_non_domiciled_rate
FROM "ISLRConcept"
ORDER BY description;
-- Update all rates to remove % symbols and extract only numbers
-- This uses REGEXP_REPLACE to extract only digits and decimal points
UPDATE "ISLRConcept"
SET pn_resident_rate = CASE
        WHEN pn_resident_rate IS NULL THEN NULL
        WHEN pn_resident_rate = '' THEN NULL
        ELSE REGEXP_REPLACE(pn_resident_rate, '[^0-9.]', '', 'g')
    END,
    pj_domiciled_rate = CASE
        WHEN pj_domiciled_rate IS NULL THEN NULL
        WHEN pj_domiciled_rate = '' THEN NULL
        ELSE REGEXP_REPLACE(pj_domiciled_rate, '[^0-9.]', '', 'g')
    END,
    pn_non_resident_rate = CASE
        WHEN pn_non_resident_rate IS NULL THEN NULL
        WHEN pn_non_resident_rate = '' THEN NULL
        ELSE REGEXP_REPLACE(pn_non_resident_rate, '[^0-9.]', '', 'g')
    END,
    pj_non_domiciled_rate = CASE
        WHEN pj_non_domiciled_rate IS NULL THEN NULL
        WHEN pj_non_domiciled_rate = '' THEN NULL
        ELSE REGEXP_REPLACE(pj_non_domiciled_rate, '[^0-9.]', '', 'g')
    END;
-- Verify the cleanup - all values should now be pure numbers
SELECT id,
    description,
    pn_resident_rate,
    pj_domiciled_rate,
    pn_non_resident_rate,
    pj_non_domiciled_rate
FROM "ISLRConcept"
ORDER BY description;
-- Example of what the data should look like after cleanup:
-- "3% - Sust." -> "3"
-- "34%" -> "34"
-- "5" -> "5"