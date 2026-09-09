-- 00023: Add missing DELETE policies for prescription_items and prescriptions.
-- The tables had SELECT and INSERT policies but no DELETE,
-- so removeMedication() failed silently for authenticated users.

BEGIN;

CREATE POLICY prescription_items_delete ON public.prescription_items FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.prescriptions p
    WHERE p.id = prescription_items.prescription_id
      AND p.created_by = auth.uid()
  ));

CREATE POLICY prescription_items_delete_admin ON public.prescription_items FOR DELETE
  USING (public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY prescriptions_delete ON public.prescriptions FOR DELETE
  USING (created_by = auth.uid());

CREATE POLICY prescriptions_delete_admin ON public.prescriptions FOR DELETE
  USING (public.get_user_role(auth.uid()) = 'admin');

COMMIT;