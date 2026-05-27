
-- 1) helper_details.helper_references: hide contact info from anon/authenticated direct reads
REVOKE SELECT (helper_references) ON public.helper_details FROM anon, authenticated;
GRANT SELECT (helper_references) ON public.helper_details TO service_role;

-- Public-safe references (name + relationship only)
CREATE OR REPLACE FUNCTION public.get_helper_references_public(_user_id uuid)
RETURNS jsonb
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    jsonb_agg(jsonb_build_object('name', r->>'name', 'relationship', r->>'relationship')),
    '[]'::jsonb
  )
  FROM public.helper_details hd,
       LATERAL jsonb_array_elements(COALESCE(hd.helper_references, '[]'::jsonb)) AS r
  WHERE hd.user_id = _user_id
    AND (hd.is_published = true OR auth.uid() = hd.user_id OR public.has_role(auth.uid(), 'admin'::app_role));
$$;

-- Owner/admin full references (includes contact)
CREATE OR REPLACE FUNCTION public.get_helper_references_full(_user_id uuid)
RETURNS jsonb
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT helper_references
  FROM public.helper_details
  WHERE user_id = _user_id
    AND (auth.uid() = _user_id OR public.has_role(auth.uid(), 'admin'::app_role));
$$;

REVOKE ALL ON FUNCTION public.get_helper_references_public(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_helper_references_public(uuid) TO anon, authenticated;
REVOKE ALL ON FUNCTION public.get_helper_references_full(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_helper_references_full(uuid) TO authenticated;

-- 2) helper_subscriptions: restrict anon reads to marketplace-relevant columns only
REVOKE SELECT ON public.helper_subscriptions FROM anon;
GRANT SELECT (user_id, status, trial_end, current_period_end, featured_active, featured_expires_at)
  ON public.helper_subscriptions TO anon;
