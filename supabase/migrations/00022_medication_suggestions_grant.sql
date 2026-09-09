-- 00022: Grant SELECT on medication_suggestions so authenticated users
-- can actually read the table. The table was created in 00019 with
-- RLS enabled and a policy, but the table-level GRANT was missing.

BEGIN;

GRANT SELECT ON public.medication_suggestions TO authenticated;
GRANT SELECT ON public.medication_suggestions TO anon;

COMMIT;