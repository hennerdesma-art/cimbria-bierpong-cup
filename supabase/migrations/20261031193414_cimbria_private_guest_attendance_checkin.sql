
-- Private attendance checklist for the Cimbria event.
-- IMPORTANT: Guest names/contact details must NEVER appear in this public repository.
-- The 52-person source import is performed separately through the protected Supabase connection.
create table if not exists public.cimbria_guest_checkin (
  id uuid primary key default gen_random_uuid(),
  list_key text not null default 'cimbria-gaesteliste',
  source_index integer not null check (source_index > 0),
  guest_name text not null check (char_length(btrim(guest_name)) between 2 and 100),
  contact_detail text,
  study_program text,
  checked_in boolean not null default false,
  checked_in_at timestamptz,
  checked_in_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (list_key, source_index)
);
create index if not exists cimbria_guest_checkin_lookup_idx
  on public.cimbria_guest_checkin(list_key, checked_in, guest_name);

alter table public.cimbria_guest_checkin enable row level security;

revoke all on public.cimbria_guest_checkin from public, anon, authenticated;
grant select on public.cimbria_guest_checkin to authenticated;
grant update (checked_in) on public.cimbria_guest_checkin to authenticated;

drop policy if exists cimbria_checkin_admin_read on public.cimbria_guest_checkin;
create policy cimbria_checkin_admin_read
  on public.cimbria_guest_checkin for select to authenticated
  using ((select cimbria_private.is_cimbria_admin()));
drop policy if exists cimbria_checkin_admin_update on public.cimbria_guest_checkin;
create policy cimbria_checkin_admin_update
  on public.cimbria_guest_checkin for update to authenticated
  using ((select cimbria_private.is_cimbria_admin()))
  with check ((select cimbria_private.is_cimbria_admin()));

create table if not exists cimbria_private.cimbria_checkin_audit (
  id bigint generated always as identity primary key,
  guest_id uuid not null references public.cimbria_guest_checkin(id) on delete cascade,
  old_checked_in boolean not null,
  new_checked_in boolean not null,
  actor_user_id uuid references auth.users(id) on delete set null,
  changed_at timestamptz not null default now()
);
revoke all on cimbria_private.cimbria_checkin_audit from public, anon, authenticated;

create or replace function cimbria_private.cimbria_checkin_stamp()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
begin
  if (select auth.uid()) is null
     or not (select cimbria_private.is_cimbria_admin()) then
    raise exception 'Anwesenheit darf nur die berechtigte Turnierleitung ändern';
  end if;
  if new.checked_in is not distinct from old.checked_in then
    return null;
  end if;
  new.checked_in_at := case when new.checked_in then now() else null end;
  new.checked_in_by := case when new.checked_in then (select auth.uid()) else null end;
  new.updated_at := now();
  return new;
end;
$function$;

create or replace function cimbria_private.cimbria_checkin_audit_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
begin
  insert into cimbria_private.cimbria_checkin_audit (
    guest_id,old_checked_in,new_checked_in,actor_user_id
  ) values (
    new.id,old.checked_in,new.checked_in,(select auth.uid())
  );
  return new;
end;
$function$;

drop trigger if exists cimbria_checkin_before_update
  on public.cimbria_guest_checkin;
create trigger cimbria_checkin_before_update
before update of checked_in on public.cimbria_guest_checkin
for each row execute function cimbria_private.cimbria_checkin_stamp();

drop trigger if exists cimbria_checkin_after_update
  on public.cimbria_guest_checkin;
create trigger cimbria_checkin_after_update
after update of checked_in on public.cimbria_guest_checkin
for each row execute function cimbria_private.cimbria_checkin_audit_change();

do $block$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname='supabase_realtime' and schemaname='public'
      and tablename='cimbria_guest_checkin'
  ) then
    alter publication supabase_realtime add table public.cimbria_guest_checkin;
  end if;
end;
$block$;
