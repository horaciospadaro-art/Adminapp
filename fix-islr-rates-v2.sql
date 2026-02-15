-- Fix ISLR Rates - Extract only the FIRST number from each field
-- This will handle cases like "3% - Sust." -> "3" and "34%" -> "34"
-- First, let's see the current problematic values
SELECT id,
    description,
    pn_resident_rate,
    pj_domiciled_rate,
    pn_non_resident_rate,
    pj_non_domiciled_rate
FROM "ISLRConcept"
WHERE LENGTH(pn_resident_rate) > 3
    OR LENGTH(pj_domiciled_rate) > 3
    OR LENGTH(pn_non_resident_rate) > 3
    OR LENGTH(pj_non_domiciled_rate) > 3
ORDER BY description;
-- Update to extract only the first number (before any non-numeric character)
UPDATE "ISLRConcept"
SET pn_resident_rate = CASE
        WHEN pn_resident_rate IS NULL
        OR pn_resident_rate = '' THEN NULL
        ELSE SUBSTRING(
            REGEXP_REPLACE(pn_resident_rate, '^[^0-9]*([0-9.]+).*$', '\1'),
            1,
            10
        )
    END,
    pj_domiciled_rate = CASE
        WHEN pj_domiciled_rate IS NULL
        OR pj_domiciled_rate = '' THEN NULL
        ELSE SUBSTRING(
            REGEXP_REPLACE(pj_domiciled_rate, '^[^0-9]*([0-9.]+).*$', '\1'),
            1,
            10
        )
    END,
    pn_non_resident_rate = CASE
        WHEN pn_non_resident_rate IS NULL
        OR pn_non_resident_rate = '' THEN NULL
        ELSE SUBSTRING(
            REGEXP_REPLACE(
                pn_non_resident_rate,
                '^[^0-9]*([0-9.]+).*$',
                '\1'
            ),
            1,
            10
        )
    END,
    pj_non_domiciled_rate = CASE
        WHEN pj_non_domiciled_rate IS NULL
        OR pj_non_domiciled_rate = '' THEN NULL
        ELSE SUBSTRING(
            REGEXP_REPLACE(
                pj_non_domiciled_rate,
                '^[^0-9]*([0-9.]+).*$',
                '\1'
            ),
            1,
            10
        )
    END;
-- Verify all values are now clean
SELECT id,
    description,
    pn_resident_rate,
    pj_domiciled_rate,
    pn_non_resident_rate,
    pj_non_domiciled_rate
FROM "ISLRConcept"
ORDER BY description;
-- Expected results:
-- "3% - Sust." -> "3"
-- "34%" -> "34"
-- "3430" -> "3" (takes only first number before any change)
-- "3." -> "3"