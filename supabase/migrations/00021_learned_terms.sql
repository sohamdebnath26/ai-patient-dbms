-- 00021: Learned clinical terms for autocomplete suggestions.
-- Doctors can add custom terms (skin diseases, surgeries, conditions)
-- which become available as future autocomplete options.

BEGIN;

CREATE TABLE public.learned_terms (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category    text NOT NULL,
  term        text NOT NULL,
  usage_count integer NOT NULL DEFAULT 1,
  created_by  uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_learned_terms_category_term
  ON public.learned_terms (category, lower(term));

CREATE INDEX idx_learned_terms_category_usage
  ON public.learned_terms (category, usage_count DESC);

ALTER TABLE public.learned_terms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read learned terms"
  ON public.learned_terms
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert learned terms"
  ON public.learned_terms
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update usage count"
  ON public.learned_terms
  FOR UPDATE
  TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

COMMIT;