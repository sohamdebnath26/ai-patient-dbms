-- Migration 00014: Address fields — landmark & district
--
-- Adds landmark and district columns to the patients table for
-- structured address capture per EMR best practices.
--
-- All new columns are nullable to preserve backward compatibility
-- with existing records.

BEGIN;

ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS landmark text;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS district text;

COMMIT;