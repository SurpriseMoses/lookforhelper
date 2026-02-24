CREATE POLICY "Anyone can check helper subscription status"
ON public.helper_subscriptions
FOR SELECT
USING (true);