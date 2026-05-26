
-- 1. Restrict phone_number column on profiles from public/anon and authenticated
REVOKE SELECT ON public.profiles FROM anon, authenticated;
GRANT SELECT (id, user_id, full_name, avatar_url, created_at, updated_at, is_suspended, suspended_at, suspended_reason, is_verified, verified_at, referral_code, referred_by, last_active_at) ON public.profiles TO anon, authenticated;

-- 2. Restrict sensitive institution columns from anonymous reads
REVOKE SELECT ON public.institutions FROM anon;
GRANT SELECT (id, user_id, institution_name, description, country, city, phone, email, website, facebook_url, instagram_url, tiktok_url, logo_url, banner_url, verification_status, is_suspended, verified_at, created_at, updated_at, verification_paid) ON public.institutions TO anon;

-- 3. Drop overly permissive SELECT policy on messages that bypasses participant scoping
DROP POLICY IF EXISTS "Authenticated can read realtime messages" ON public.messages;

-- 4. Drop overly permissive realtime.messages SELECT policy (was USING true for any authenticated user)
DROP POLICY IF EXISTS "Authenticated can read realtime messages" ON realtime.messages;
