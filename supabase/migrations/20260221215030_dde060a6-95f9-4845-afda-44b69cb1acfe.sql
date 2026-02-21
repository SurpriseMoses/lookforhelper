
-- 1. Remove overly permissive helper_subscriptions policy
DROP POLICY IF EXISTS "Published subscription viewable for search" ON public.helper_subscriptions;

-- 2. Remove overly permissive reviews policy
DROP POLICY IF EXISTS "Anyone can view reviews for public profiles" ON public.reviews;
