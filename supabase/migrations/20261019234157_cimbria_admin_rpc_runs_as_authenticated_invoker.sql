
-- The save function operates under the calling user's RLS policies.
-- Its explicit admin check remains in place, so security definer elevation is unnecessary.
alter function public.cimbria_admin_save_state(text,bigint,jsonb)
  security invoker;
