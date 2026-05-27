REVOKE SELECT (payment_reference) ON public.institution_announcements FROM anon, authenticated;
GRANT SELECT (payment_reference) ON public.institution_announcements TO service_role;