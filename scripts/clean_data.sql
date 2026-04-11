-- ==========================================
-- Database Cleaning Script for Hutan Sosial (v2)
-- ==========================================

BEGIN;

-- 1. SOCIAL FOREST PERMITS: Fix Invalid Years
-- ==========================================

-- Fix 1: Swap columns where permitStatus looks like a year (e.g. '2023') and permitYear is invalid (< 1990)
UPDATE "SocialForestPermits"
SET 
    "permitYear" = CAST("permitStatus" AS INTEGER),
    "permitStatus" = 'Izin' 
WHERE 
    "permitStatus" ~ '^\d{4}$' -- Status is 4 digits
    AND ("permitYear" IS NULL OR "permitYear" < 1990);

/*_SPLIT_*/

-- Fix 2: If permitYear is still invalid, try to extract from permitNumber
UPDATE "SocialForestPermits"
SET "permitYear" = CAST(SUBSTRING("permitNumber" FROM '20\d{2}') AS INTEGER)
WHERE 
    ("permitYear" IS NULL OR "permitYear" < 1990)
    AND "permitNumber" ~ '20\d{2}';

/*_SPLIT_*/

-- Fix 3: Fallback for remaining invalid years -> Set to NULL and mark Status
UPDATE "SocialForestPermits"
SET 
    "permitYear" = NULL,
    "permitStatus" = CASE 
        WHEN "permitStatus" = 'Izin' THEN 'Data Tidak Lengkap'
        ELSE "permitStatus" || ' (Tahun Invalid)'
    END
WHERE 
    "permitYear" IS NOT NULL 
    AND "permitYear" < 1990;

/*_SPLIT_*/

-- 2. COMMODITIES: Fix Typos and Normalize
-- =======================================

-- Temp table for mappings
CREATE TEMP TABLE commodity_mappings (bad_name TEXT, good_name TEXT);
INSERT INTO commodity_mappings VALUES
    ('Rumout', 'Rumput Laut'),
    ('rumout', 'Rumput Laut'),
    ('budidaya rumout laut', 'Rumput Laut'),
    ('Cemgleh', 'Cengkeh'),
    ('cemgleh', 'Cengkeh'),
    ('Coklat', 'Cokelat'),
    ('Mannga', 'Mangga'),
    ('Ekowisara', 'Ekowisata'),
    ('ekwisata', 'Ekowisata'),
    ('ekwisata terumbu karang', 'Ekowisata Terumbu Karang'),
    ('langsa', 'Langsat'),
    ('gufasa', 'Gofasa'),
    ('tofiri', 'Kayu Tafiri'),
    ('Kayu Tafiri', 'Kayu Tafiri'), 
    ('manggrov', 'Mangrove'),
    ('Jambu Mente', 'Jambu Mete'),
    ('21', NULL), 
    ('60', NULL);

/*_SPLIT_*/

-- STEP A: Delete Garbage (Numeric / NULL mappings)
DELETE FROM "Commodities"  
WHERE name ~ '^\d+$' OR name IN (SELECT bad_name FROM commodity_mappings WHERE good_name IS NULL);

/*_SPLIT_*/

-- STEP B: Handle renames and merges
-- Iterate through mappings
DO $$
DECLARE
    r RECORD;
    bad_id INT;
    good_id INT;
BEGIN
    FOR r IN SELECT * FROM commodity_mappings WHERE good_name IS NOT NULL LOOP
        -- find IDs
        SELECT id INTO bad_id FROM "Commodities" WHERE name ILIKE r.bad_name LIMIT 1;
        SELECT id INTO good_id FROM "Commodities" WHERE name ILIKE r.good_name LIMIT 1;

        IF bad_id IS NOT NULL THEN
            IF good_id IS NOT NULL AND good_id != bad_id THEN
                -- Both exist: MERGE (Move permits to good_id, delete bad_id)
                UPDATE "PermitCommodities" SET "commodityId" = good_id WHERE "commodityId" = bad_id;
                DELETE FROM "Commodities" WHERE id = bad_id;
            ELSIF good_id IS NULL THEN
                -- Only bad exists: RENAME
                UPDATE "Commodities" SET name = r.good_name WHERE id = bad_id;
            END IF;
        END IF;
    END LOOP;
END $$;


/*_SPLIT_*/


-- STEP C: Handle Duplicates (Case Insensitive Same Name)
-- e.g. 'Cokelat' and 'cokelat'
CREATE TEMP TABLE duplicate_commodities AS
SELECT 
    LOWER(name) as lower_name, 
    MIN(id) as keep_id, 
    ARRAY_AGG(id) as all_ids
FROM "Commodities"
GROUP BY LOWER(name)
HAVING COUNT(*) > 1;

/*_SPLIT_*/

DO $$
DECLARE
    r RECORD;
    bad_id INT;
BEGIN
    FOR r IN SELECT * FROM duplicate_commodities LOOP
        FOREACH bad_id IN ARRAY r.all_ids LOOP
            IF bad_id != r.keep_id THEN
                -- Re-link
                UPDATE "PermitCommodities" SET "commodityId" = r.keep_id WHERE "commodityId" = bad_id;
                DELETE FROM "Commodities" WHERE id = bad_id;
            END IF;
        END LOOP;
    END LOOP;
END $$;

/*_SPLIT_*/

-- 3. DISTRICTS & FOREST STATUS: Clean Numeric/Garbage
-- ==================================================

-- Only delete orphaned Districts
DELETE FROM "Districts" 
WHERE name ~ '^\d+$'
AND NOT EXISTS (SELECT 1 FROM "Villages" WHERE "districtId" = "Districts".id);

/*_SPLIT_*/

-- Only delete orphaned ForestAreaStatuses
DELETE FROM "ForestAreaStatuses" 
WHERE name ~ '^\d+$'
AND NOT EXISTS (SELECT 1 FROM "PermitForestStatuses" WHERE "statusId" = "ForestAreaStatuses".id);

COMMIT;
