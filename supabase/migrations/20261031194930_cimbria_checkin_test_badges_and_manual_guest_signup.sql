-- Cimbria: safely distinguish fake check-in demonstration entries from real guests.
-- DO NOT put any real guest names or contact data in this public migration.
alter table public.cimbria_guest_checkin
  add column if not exists is_test boolean not null default false;
alter table public.cimbria_guest_checkin
  add column if not exists created_by uuid references auth.users(id)
    on delete set null default auth.uid();

create index if not exists cimbria_checkin_test_filter
on public.cimbria_guest_checkin(list_key,is_test,checked_in);

-- Grant narrowly scoped rights, in addition to the existing checked_in-only UPDATE.
grant insert (source_index,guest_name,contact_detail,study_program)
  on public.cimbria_guest_checkin to authenticated;
grant delete on public.cimbria_guest_checkin to authenticated;

drop policy if exists cimbria_checkin_admin_insert on public.cimbria_guest_checkin;
create policy cimbria_checkin_admin_insert
  on public.cimbria_guest_checkin for insert to authenticated
  with check (
    (select cimbria_private.is_cimbria_admin())
    and list_key='cimbria-gaesteliste'
    and is_test=false
    and created_by=(select auth.uid())
  );

drop policy if exists cimbria_checkin_admin_delete_tests on public.cimbria_guest_checkin;
create policy cimbria_checkin_admin_delete_tests
  on public.cimbria_guest_checkin for delete to authenticated
  using (
    (select cimbria_private.is_cimbria_admin())
    and list_key='cimbria-gaesteliste'
    and is_test=true
  );

-- SECURITY INVOKER: keeps RLS/grants in force even inside RPC.
-- An advisory transaction lock prevents duplicate source indexes from two admins.
create or replace function public.cimbria_checkin_add_guest(
  p_name text,
  p_contact text default null,
  p_study text default null
) returns jsonb
language plpgsql
security invoker
set search_path=''
as $function$
declare
  v_name text := btrim(coalesce(p_name,''));
  v_contact text := nullif(btrim(coalesce(p_contact,'')),'');
  v_study text := nullif(btrim(coalesce(p_study,'')),'');
  v_index integer;
  v_guest public.cimbria_guest_checkin%rowtype;
begin
  if (select auth.uid()) is null
     or not (select cimbria_private.is_cimbria_admin()) then
    raise exception 'Nur berechtigte Cimbria-Admins können Gäste hinzufügen';
  end if;
  if char_length(v_name)<2 or char_length(v_name)>100 then
    raise exception 'Der Name muss zwischen 2 und 100 Zeichen enthalten';
  end if;
  if coalesce(char_length(v_contact),0)>200 or coalesce(char_length(v_study),0)>140 then
    raise exception 'Kontakt oder Studiengang ist zu lang';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtext('cimbria-checkin-add:' || 'cimbria-gaesteliste')
  );

  if exists (
    select 1 from public.cimbria_guest_checkin g
    where g.list_key='cimbria-gaesteliste' and not g.is_test
      and lower(btrim(g.guest_name))=lower(v_name)
      and lower(coalesce(btrim(g.contact_detail),''))=lower(coalesce(v_contact,''))
  ) then
    raise exception 'Diese Person ist bereits auf der Gästeliste';
  end if;

  select coalesce(max(source_index),0)+1 into v_index
  from public.cimbria_guest_checkin where list_key='cimbria-gaesteliste';

  insert into public.cimbria_guest_checkin
    (source_index,guest_name,contact_detail,study_program)
  values (v_index,v_name,v_contact,v_study)
  returning * into v_guest;

  return jsonb_build_object(
    'success',true,'guest',to_jsonb(v_guest)
  );
end;
$function$;

revoke all on function public.cimbria_checkin_add_guest(text,text,text) from public,anon;
grant execute on function public.cimbria_checkin_add_guest(text,text,text)
  to authenticated;

create or replace function public.cimbria_checkin_clear_test_guests()
returns jsonb
language plpgsql
security invoker
set search_path=''
as $function$
declare
  v_removed integer := 0;
begin
  if (select auth.uid()) is null
     or not (select cimbria_private.is_cimbria_admin()) then
    raise exception 'Nur berechtigte Cimbria-Admins können Testpersonen entfernen';
  end if;

  delete from public.cimbria_guest_checkin
   where list_key='cimbria-gaesteliste' and is_test=true;
  get diagnostics v_removed=row_count;

  return jsonb_build_object('success',true,'removed',v_removed);
end;
$function$;
revoke all on function public.cimbria_checkin_clear_test_guests()
from public,anon;
grant execute on function public.cimbria_checkin_clear_test_guests()
to authenticated;
