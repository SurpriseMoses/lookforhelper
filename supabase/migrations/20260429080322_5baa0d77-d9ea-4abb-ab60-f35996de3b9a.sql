CREATE TABLE IF NOT EXISTS public.helper_reminder_tracking (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email_step smallint NOT NULL DEFAULT 0,
  last_reminder_sent_at timestamptz,
  completed_at timestamptz,
  unsubscribed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.helper_reminder_tracking ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all reminder tracking"
  ON public.helper_reminder_tracking FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Users can view own reminder tracking"
  ON public.helper_reminder_tracking FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_helper_reminder_step ON public.helper_reminder_tracking(email_step, last_reminder_sent_at);