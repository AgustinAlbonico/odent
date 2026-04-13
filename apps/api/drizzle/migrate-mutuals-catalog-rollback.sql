-- Rollback: Unlink patient_mutuals from catalog and clear catalog data
-- Phase 8 — Data Migration Rollback
-- Does NOT drop tables (schema migration handles that separately)
-- Idempotent: safe to run multiple times

BEGIN;

-- Step 1: Clear FK references on patient_mutuals
UPDATE patient_mutuals
SET mutual_id = NULL
WHERE mutual_id IS NOT NULL;

-- Step 2: Delete all catalog entries
DELETE FROM mutuals;

COMMIT;
