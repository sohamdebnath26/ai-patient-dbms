-- 00019a: Add route column to prescription_items for medication route tracking.
-- This runs after 00019_medication_suggestions.

BEGIN;

ALTER TABLE public.prescription_items ADD COLUMN IF NOT EXISTS route text;

COMMIT;