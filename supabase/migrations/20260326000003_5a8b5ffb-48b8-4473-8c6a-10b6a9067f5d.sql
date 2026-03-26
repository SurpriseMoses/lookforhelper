-- Allow seekers to also create verification requests
DROP POLICY IF EXISTS "Helpers can create verification requests" ON public.verification_requests;
CREATE POLICY "Authenticated users can create verification requests"
ON public.verification_requests
FOR INSERT
TO public
WITH CHECK (
  auth.uid() = user_id
  AND (has_role(auth.uid(), 'helper'::app_role) OR has_role(auth.uid(), 'seeker'::app_role))
);

-- Allow seekers to also create verification payments
DROP POLICY IF EXISTS "Users can create own verification payments" ON public.verification_payments;
CREATE POLICY "Authenticated users can create own verification payments"
ON public.verification_payments
FOR INSERT
TO public
WITH CHECK (
  auth.uid() = user_id
  AND (has_role(auth.uid(), 'helper'::app_role) OR has_role(auth.uid(), 'seeker'::app_role))
);

-- Allow seekers to also update own pending/rejected verification requests
DROP POLICY IF EXISTS "Helpers can update own pending requests" ON public.verification_requests;
CREATE POLICY "Users can update own pending requests"
ON public.verification_requests
FOR UPDATE
TO public
USING (
  auth.uid() = user_id
  AND status IN ('pending', 'rejected')
);