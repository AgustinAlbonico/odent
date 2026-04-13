-- Migration: Populate mutuals catalog from existing free-text patient_mutuals data
-- Phase 8 — Data Migration Script
-- Idempotent: safe to run multiple times

BEGIN;

-- Step 1: Insert distinct mutual names into the catalog
-- Skips empty/null names, trims whitespace, deduplicates via ON CONFLICT
INSERT INTO mutuals (id, name, code, is_active, created_at, updated_at)
SELECT
  gen_random_uuid(),
  TRIM(mutual_name),
  UPPER(LEFT(TRIM(mutual_name), 20)),
  true,
  NOW(),
  NOW()
FROM (
  SELECT DISTINCT mutual_name
  FROM patient_mutuals
  WHERE mutual_name IS NOT NULL
    AND TRIM(mutual_name) != ''
) AS distinct_names
ON CONFLICT (name) DO NOTHING;

-- Step 2: Link existing patient_mutuals records to catalog entries
-- Only updates rows that don't already have a mutual_id set
UPDATE patient_mutuals pm
SET mutual_id = m.id
FROM mutuals m
WHERE TRIM(pm.mutual_name) = m.name
  AND pm.mutual_id IS NULL;

COMMIT;
