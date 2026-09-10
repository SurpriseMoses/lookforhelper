-- 1. helper_details.helper_references: revoke column read
REVOKE SELECT (helper_references) ON public.helper_details FROM anon, authenticated;

-- 2. institution_announcements.payment_reference
REVOKE SELECT (payment_reference) ON public.institution_announcements FROM anon, authenticated;

-- 3. institutions sensitive columns
REVOKE SELECT (registration_number, registration_document_url, rejection_reason) ON public.institutions FROM anon, authenticated;

-- 4. helper_subscriptions internal billing fields
REVOKE SELECT (id, trial_start, current_period_start, featured_cancelled, featured_cancelled_at, created_at, updated_at) ON public.helper_subscriptions FROM anon, authenticated;

-- Owner access to own institution private fields
CREATE OR REPLACE FUNCTION public.get_my_institution_private()
RETURNS TABLE (id uuid, registration_number text, registration_document_url text, rejection_reason text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT i.id, i.registration_number, i.registration_document_url, i.rejection_reason
  FROM public.institutions i
  WHERE i.user_id = auth.uid();
$$;
REVOKE ALL ON FUNCTION public.get_my_institution_private() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.get_my_institution_private() TO authenticated;

-- Admin access to all institutions incl. sensitive fields
CREATE OR REPLACE FUNCTION public.admin_list_institutions()
RETURNS SETOF public.institutions
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT i.* FROM public.institutions i
  WHERE public.has_role(auth.uid(), 'admin')
  ORDER BY i.created_at DESC;
$$;
REVOKE ALL ON FUNCTION public.admin_list_institutions() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.admin_list_institutions() TO authenticated;