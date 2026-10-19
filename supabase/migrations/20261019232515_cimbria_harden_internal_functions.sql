
-- Move privileged helper/trigger functions outside exposed public API schema.
create schema if not exists cimbria_private;
revoke all on schema cimbria_private from public, anon, authenticated;
grant usage on schema cimbria_private to authenticated;

alter function public.is_cimbria_admin() set schema cimbria_private;
alter function public.cimbria_set_updated_at() set schema cimbria_private;
alter function public.cimbria_enforce_team_capacity() set schema cimbria_private;
alter function public.cimbria_validate_match_assignment() set schema cimbria_private;
alter function public.cimbria_record_audit() set schema cimbria_private;

revoke all on function cimbria_private.is_cimbria_admin() from public, anon, authenticated;
grant execute on function cimbria_private.is_cimbria_admin() to authenticated;
revoke all on function cimbria_private.cimbria_set_updated_at() from public, anon, authenticated;
revoke all on function cimbria_private.cimbria_enforce_team_capacity() from public, anon, authenticated;
revoke all on function cimbria_private.cimbria_validate_match_assignment() from public, anon, authenticated;
revoke all on function cimbria_private.cimbria_record_audit() from public, anon, authenticated;

-- Explicitly preserve no public function invocation; policies reference functions by OID
-- and follow a schema move automatically.
-- Keep audit DELETE logging safe even after parent/child cascades remove the event.
create or replace function cimbria_private.cimbria_record_audit()
returns trigger language plpgsql security definer set search_path = ''
as $fn$
declare v_old jsonb;
declare v_new jsonb;
declare v_record jsonb;
declare v_tournament uuid;
begin
  if tg_op <> 'INSERT' then v_old=to_jsonb(old); end if;
  if tg_op <> 'DELETE' then v_new=to_jsonb(new); end if;
  v_record=coalesce(v_new,v_old);
  if tg_op='DELETE' then
    v_tournament=null; -- retain audit without relying on a deleted FK parent
  elsif tg_table_name='tournaments' then
    v_tournament=(v_record->>'id')::uuid;
  else
    v_tournament=(v_record->>'tournament_id')::uuid;
  end if;
  insert into public.audit_events
    (tournament_id,actor_user_id,entity,entity_id,action,previous_value,current_value)
  values
    (v_tournament,(select auth.uid()),tg_table_name,v_record->>'id',
      tg_op,v_old,v_new);
  return coalesce(new,old);
end;
$fn$;
