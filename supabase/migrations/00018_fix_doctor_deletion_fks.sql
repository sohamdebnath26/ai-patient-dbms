-- 00018: Fix ON DELETE behaviour for tables created after 00010
-- Without this, deleting a doctor account will fail with FK violations
-- on procedures, clinical_images, and image_analysis.

BEGIN;

ALTER TABLE public.procedures
  ALTER COLUMN created_by DROP NOT NULL,
  DROP CONSTRAINT IF EXISTS procedures_created_by_fkey,
  ADD CONSTRAINT procedures_created_by_fkey
    FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.clinical_images
  ALTER COLUMN created_by DROP NOT NULL,
  DROP CONSTRAINT IF EXISTS clinical_images_created_by_fkey,
  ADD CONSTRAINT clinical_images_created_by_fkey
    FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.image_analysis
  ALTER COLUMN created_by DROP NOT NULL,
  DROP CONSTRAINT IF EXISTS image_analysis_created_by_fkey,
  ADD CONSTRAINT image_analysis_created_by_fkey
    FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

-- Remove orphaned trigger function from 00004 (dead code)
DROP FUNCTION IF EXISTS public.set_patient_updated_at();

COMMIT;