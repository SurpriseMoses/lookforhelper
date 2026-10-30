create or replace function public.has_active_seeker_subscription(_user_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.seeker_subscriptions
    where user_id = _user_id and status = 'active' and current_period_end > now())
$$;

drop policy if exists "Seekers can create conversations" on public.conversations;
create policy "Seekers can create conversations" on public.conversations for insert to authenticated
with check (auth.uid() = seeker_user_id and has_role(auth.uid(),'seeker') and public.has_active_seeker_subscription(auth.uid()));

drop policy if exists "Conversation participants can send messages" on public.messages;
create policy "Conversation participants can send messages" on public.messages for insert to authenticated
with check (auth.uid() = sender_id and exists (
  select 1 from public.conversations c where c.id = messages.conversation_id and (
    c.helper_user_id = auth.uid()
    or (c.seeker_user_id = auth.uid() and (public.has_active_seeker_subscription(auth.uid()) or public.has_role(auth.uid(),'admin')))
  )));