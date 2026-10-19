
-- Cimbria V2: Approved admin email and atomic guest registration.
create table if not exists cimbria_private.admin_email_allowlist (
  email text primary key check (email = lower(btrim(email))),
  role text not null default 'admin' check (role in ('admin','supervisor')),
  enabled boolean not null default true,
  added_at timestamptz not null default now()
);
revoke all on cimbria_private.admin_email_allowlist from public,anon,authenticated;

insert into cimbria_private.admin_email_allowlist(email,role,enabled)
values ('henner@desma.africa','admin',true)
on conflict (email) do update set role=excluded.role, enabled=excluded.enabled;

create or replace function cimbria_private.provision_cimbria_admin()
returns trigger language plpgsql security definer set search_path=''
as $fn$
declare v_role text;
begin
  if new.email is null or new.email_confirmed_at is null then return new; end if;
  select a.role into v_role
  from cimbria_private.admin_email_allowlist a
  where a.email=lower(btrim(new.email)) and a.enabled=true;
  if v_role is not null then
    insert into public.admin_users(user_id,role,active)
    values (new.id,v_role,true)
    on conflict(user_id) do update set role=excluded.role,active=true;
  end if;
  return new;
end
$fn$;

revoke all on function cimbria_private.provision_cimbria_admin() from public,anon,authenticated;
drop trigger if exists cimbria_on_auth_user_provision on auth.users;
create trigger cimbria_on_auth_user_provision
after insert or update of email,email_confirmed_at on auth.users
for each row execute function cimbria_private.provision_cimbria_admin();

-- Backfill a verified Auth user if one is already present.
insert into public.admin_users(user_id,role,active)
select u.id,a.role,true from auth.users u
join cimbria_private.admin_email_allowlist a on a.email=lower(btrim(u.email))
where a.enabled=true and u.email_confirmed_at is not null
on conflict(user_id) do update set role=excluded.role,active=true;

create or replace function cimbria_private.is_cimbria_admin()
returns boolean language sql stable security definer set search_path=''
as $fn$
select exists (
  select 1
  from public.admin_users au
  join auth.users u on u.id=au.user_id
  join cimbria_private.admin_email_allowlist allow on allow.email=lower(btrim(u.email))
  where au.user_id=(select auth.uid())
    and au.active=true and u.email_confirmed_at is not null and allow.enabled=true
);
$fn$;
revoke all on function cimbria_private.is_cimbria_admin() from public,anon;
grant execute on function cimbria_private.is_cimbria_admin() to authenticated;

alter table public.tournaments
 add column if not exists revision bigint not null default 0 check(revision>=0);

create or replace function public.cimbria_guest_register_team(
  p_slug text, p_name text, p_players jsonb
)
returns jsonb
language plpgsql security definer set search_path=''
as $fn$
declare
  v_t public.tournaments%rowtype;
  v_team uuid;
  v_name text;
  v_member text;
  v_number integer;
  v_count integer;
begin
  -- Only called by server-side Edge Function using the service role key.
  select * into v_t from public.tournaments
    where slug=p_slug for update;
  if not found then raise exception 'Turnier nicht gefunden'; end if;
  if not (v_t.is_published and v_t.registration_open and v_t.phase='registration') then
    raise exception 'Die Anmeldung ist geschlossen';
  end if;
  v_name=btrim(regexp_replace(coalesce(p_name,''), '\s+', ' ', 'g'));
  if char_length(v_name)<3 or char_length(v_name)>35 then
    raise exception 'Teamname muss 3 bis 35 Zeichen enthalten';
  end if;
  if jsonb_typeof(p_players) is distinct from 'array'
     or jsonb_array_length(p_players)<v_t.min_players
     or jsonb_array_length(p_players)>v_t.max_players then
    raise exception 'Das Team muss aus 2 bis 4 Spielern bestehen';
  end if;
  if (select count(*) from public.teams where tournament_id=v_t.id)>=v_t.max_teams then
    raise exception 'Das Teilnehmerlimit ist erreicht';
  end if;
  if exists(select 1 from public.teams t
     where t.tournament_id=v_t.id and lower(t.name)=lower(v_name)) then
    raise exception 'Dieser Teamname ist bereits vergeben';
  end if;
  for v_number in 0..jsonb_array_length(p_players)-1 loop
    if jsonb_typeof(p_players->v_number) is distinct from 'string' then
      raise exception 'Ungültige Spielerangabe';
    end if;
    v_member=btrim(regexp_replace(p_players->>v_number,'\s+',' ','g'));
    if char_length(v_member)<2 or char_length(v_member)>50 then
      raise exception 'Spielername muss 2 bis 50 Zeichen enthalten';
    end if;
  end loop;
  insert into public.teams(tournament_id,name)
  values(v_t.id,v_name) returning id into v_team;
  for v_number in 0..jsonb_array_length(p_players)-1 loop
    v_member=btrim(regexp_replace(p_players->>v_number,'\s+',' ','g'));
    insert into public.players(team_id,slot,full_name)
    values(v_team,v_number+1,v_member);
  end loop;
  update public.tournaments set revision=revision+1 where id=v_t.id;
  select count(*) into v_count from public.teams where tournament_id=v_t.id;
  return jsonb_build_object('id',v_team,'team_name',v_name,'team_count',v_count);
end
$fn$;

revoke all on function public.cimbria_guest_register_team(text,text,jsonb)
from public,anon,authenticated;
grant execute on function public.cimbria_guest_register_team(text,text,jsonb)
to service_role;
