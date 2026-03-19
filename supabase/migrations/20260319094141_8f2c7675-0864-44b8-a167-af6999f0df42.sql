
-- Allow admins to read ALL user_roles (fixes recurring admin access issues)
CREATE POLICY "Admins can read all roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to view ALL helper_details (including unpublished)
CREATE POLICY "Admins can view all helper details"
ON public.helper_details
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
