-- Drop the duplicate handle_new_user trigger to prevent duplicate profile inserts
DROP TRIGGER IF EXISTS on_auth_user_created on auth.users;

-- Keep only the handle_new_user_profile trigger which creates the profile correctly
-- Also ensure we don't have handle_new_user firing anymore by checking and removing if it exists
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;