
alter function public.cimbria_admin_members(text,text,text) set schema cimbria_private;
revoke all on function cimbria_private.cimbria_admin_members(text,text,text) from public,anon;
grant usage on schema cimbria_private to authenticated;
grant execute on function cimbria_private.cimbria_admin_members(text,text,text) to authenticated;
create function public.cimbria_admin_members(p_action text,p_email text default null,p_role text default 'supervisor')
returns jsonb language sql security invoker set search_path='' as $$
  select cimbria_private.cimbria_admin_members(p_action,p_email,p_role);
$$;
revoke all on function public.cimbria_admin_members(text,text,text) from public,anon;
grant execute on function public.cimbria_admin_members(text,text,text) to authenticated;
