
-- 1. Fix privilege escalation: prevent users from self-assigning admin role
DROP POLICY IF EXISTS "Users can insert own role on signup" ON public.user_roles;
CREATE POLICY "Users can insert own non-admin role on signup"
  ON public.user_roles
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND role IN ('helper'::app_role, 'seeker'::app_role, 'institution'::app_role)
  );

-- 2a. Restrict phone_number on profiles: remove SELECT for anon and authenticated; service_role and column owner via RPC only
REVOKE SELECT (phone_number) ON public.profiles FROM anon, authenticated;

-- 2b. Restrict suspended_at and suspended_reason from anonymous (admin reads via authenticated role)
REVOKE SELECT (suspended_at, suspended_reason) ON public.profiles FROM anon;

-- 3. Secure RPC for users to read their own phone number
CREATE OR REPLACE FUNCTION public.get_my_phone()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT phone_number FROM public.profiles WHERE user_id = auth.uid()
$$;

REVOKE EXECUTE ON FUNCTION public.get_my_phone() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.get_my_phone() TO authenticated;

-- 4. Restrict immigration / work-authorization status from unauthenticated browsing
REVOKE SELECT (work_authorization_status) ON public.helper_details FROM anon;

-- 5. Realtime: add minimal RLS so only authenticated sessions can subscribe to channels
-- Drop any existing permissive policy first
DROP POLICY IF EXISTS "Authenticated can read realtime messages" ON realtime.messages;
CREATE POLICY "Authenticated can read realtime messages"
  ON realtime.messages
  FOR SELECT
  TO authenticated
  USING (true);
