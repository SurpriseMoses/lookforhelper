
-- Conversations table
CREATE TABLE public.conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  seeker_user_id UUID NOT NULL,
  helper_user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(seeker_user_id, helper_user_id)
);

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own conversations"
ON public.conversations FOR SELECT
USING (auth.uid() = seeker_user_id OR auth.uid() = helper_user_id);

CREATE POLICY "Seekers can create conversations"
ON public.conversations FOR INSERT
WITH CHECK (auth.uid() = seeker_user_id AND has_role(auth.uid(), 'seeker'));

CREATE TRIGGER update_conversations_updated_at
BEFORE UPDATE ON public.conversations
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Messages table
CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  content TEXT NOT NULL,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Conversation participants can view messages"
ON public.messages FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id = conversation_id
    AND (c.seeker_user_id = auth.uid() OR c.helper_user_id = auth.uid())
  )
);

CREATE POLICY "Conversation participants can send messages"
ON public.messages FOR INSERT
WITH CHECK (
  auth.uid() = sender_id AND
  EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id = conversation_id
    AND (c.seeker_user_id = auth.uid() OR c.helper_user_id = auth.uid())
  )
);

CREATE POLICY "Participants can mark messages as read"
ON public.messages FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id = conversation_id
    AND (c.seeker_user_id = auth.uid() OR c.helper_user_id = auth.uid())
  )
);

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- Interviews table
CREATE TABLE public.interviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  seeker_user_id UUID NOT NULL,
  helper_user_id UUID NOT NULL,
  conversation_id UUID REFERENCES public.conversations(id),
  interview_type TEXT NOT NULL DEFAULT 'video',
  status TEXT NOT NULL DEFAULT 'pending',
  proposed_date TIMESTAMP WITH TIME ZONE NOT NULL,
  location TEXT,
  meeting_link TEXT,
  notes TEXT,
  seeker_message TEXT,
  helper_response TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.interviews ENABLE ROW LEVEL SECURITY;

-- Validate interview status
CREATE OR REPLACE FUNCTION public.validate_interview_status()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.status NOT IN ('pending', 'accepted', 'declined', 'completed', 'cancelled') THEN
    RAISE EXCEPTION 'Invalid interview status: %', NEW.status;
  END IF;
  IF NEW.interview_type NOT IN ('video', 'in_person') THEN
    RAISE EXCEPTION 'Invalid interview type: %', NEW.interview_type;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_interview_status_trigger
BEFORE INSERT OR UPDATE ON public.interviews
FOR EACH ROW EXECUTE FUNCTION public.validate_interview_status();

CREATE TRIGGER update_interviews_updated_at
BEFORE UPDATE ON public.interviews
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE POLICY "Users can view own interviews"
ON public.interviews FOR SELECT
USING (auth.uid() = seeker_user_id OR auth.uid() = helper_user_id);

CREATE POLICY "Seekers can request interviews"
ON public.interviews FOR INSERT
WITH CHECK (auth.uid() = seeker_user_id AND has_role(auth.uid(), 'seeker'));

CREATE POLICY "Participants can update interviews"
ON public.interviews FOR UPDATE
USING (auth.uid() = seeker_user_id OR auth.uid() = helper_user_id);
