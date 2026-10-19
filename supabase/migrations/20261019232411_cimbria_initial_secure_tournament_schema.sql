
-- Cimbria Bierpong Cup | Secure baseline schema v1
-- The public website remains a local demo until a protected registration endpoint
-- and authenticated admin UI are connected. Anonymous clients have READ ONLY access
-- to explicitly published tournament records. Player names remain private.

create table public.tournaments (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null check (char_length(btrim(name)) between 3 and 120),
  phase text not null default 'registration'
    check (phase in ('registration','groups','playoffs','finished')),
  is_published boolean not null default false,
  registration_open boolean not null default false,
  min_teams integer not null default 24 check (min_teams between 2 and 64),
  max_teams integer not null default 32 check (max_teams between 2 and 64),
  group_count integer not null default 8 check (group_count between 1 and 16),
  playoff_teams integer not null default 16 check (playoff_teams in (2,4,8,16,32)),
  min_players integer not null default 2 check (min_players between 2 and 4),
  max_players integer not null default 4 check (max_players between 2 and 4),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint tournament_ranges check (min_teams <= max_teams and min_players <= max_players)
);

create table public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'admin' check (role in ('admin','supervisor')),
  active boolean not null default true,
  added_at timestamptz not null default now()
);

-- No client may insert into admin_users; trusted administrators are provisioned
-- through the Supabase Dashboard / a trusted server after Auth is configured.
create or replace function public.is_cimbria_admin()
returns boolean language sql stable security definer set search_path = ''
as $fn$
  select exists (
    select 1 from public.admin_users au
    where au.user_id = (select auth.uid()) and au.active = true
  );
$fn$;

create table public.teams (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references public.tournaments(id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 3 and 35 and name = btrim(name)),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, tournament_id)
);
create unique index teams_unique_name_per_tournament
  on public.teams(tournament_id, lower(name));
create index teams_by_tournament on public.teams(tournament_id, created_at);

create table public.players (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  slot smallint not null check (slot between 1 and 4),
  full_name text not null
    check (char_length(btrim(full_name)) between 2 and 50 and full_name = btrim(full_name)),
  created_at timestamptz not null default now(),
  unique (team_id,slot)
);
create index players_by_team on public.players(team_id);

create table public.groups (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references public.tournaments(id) on delete cascade,
  code text not null check (code ~ '^[A-P]$'),
  sort_order integer not null default 0 check (sort_order >= 0),
  unique (id, tournament_id),
  unique (tournament_id,code)
);

create table public.group_members (
  tournament_id uuid not null references public.tournaments(id) on delete cascade,
  group_id uuid not null,
  team_id uuid not null,
  created_at timestamptz not null default now(),
  primary key (tournament_id,team_id),
  foreign key (group_id,tournament_id)
    references public.groups(id,tournament_id) on delete cascade,
  foreign key (team_id,tournament_id)
    references public.teams(id,tournament_id) on delete cascade
);
create index group_members_by_group on public.group_members(group_id);

create table public.game_tables (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references public.tournaments(id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 60 and name=btrim(name)),
  sort_order integer not null default 0 check (sort_order >= 0),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id,tournament_id)
);
create unique index game_tables_unique_name_per_tournament
  on public.game_tables(tournament_id, lower(name));

create table public.matches (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references public.tournaments(id) on delete cascade,
  group_id uuid,
  stage text not null check (stage in ('group','tiebreak','playoff')),
  round_no integer not null default 0 check (round_no >= 0),
  tiebreak_series integer not null default 0 check (tiebreak_series >= 0),
  bracket_position integer not null default 0 check (bracket_position >= 0),
  order_index integer not null default 0 check (order_index >= 0),
  team_a_id uuid,
  team_b_id uuid,
  winner_team_id uuid,
  status text not null default 'open'
    check (status in ('open','ready','live','done')),
  table_id uuid,
  played_table_id uuid,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (group_id,tournament_id)
    references public.groups(id,tournament_id),
  foreign key (team_a_id,tournament_id)
    references public.teams(id,tournament_id),
  foreign key (team_b_id,tournament_id)
    references public.teams(id,tournament_id),
  foreign key (winner_team_id,tournament_id)
    references public.teams(id,tournament_id),
  foreign key (table_id,tournament_id)
    references public.game_tables(id,tournament_id),
  foreign key (played_table_id,tournament_id)
    references public.game_tables(id,tournament_id),
  constraint group_stage_consistency check (
    (stage='playoff' and group_id is null)
    or (stage in ('group','tiebreak') and group_id is not null)
  ),
  constraint distinct_opponents check (
    team_a_id is null or team_b_id is null or team_a_id <> team_b_id
  ),
  constraint result_winner_valid check (
    (status='done' and winner_team_id is not null
      and winner_team_id in (team_a_id,team_b_id)
      and completed_at is not null)
    or (status<>'done' and winner_team_id is null and completed_at is null)
  ),
  constraint active_match_has_table check (
    (status in ('open','done') and table_id is null)
    or (status in ('ready','live') and table_id is not null
      and team_a_id is not null and team_b_id is not null)
  )
);
-- A table can host only one ready or live match at any moment.
create unique index matches_one_live_per_table
  on public.matches(table_id) where status in ('ready','live');
create index matches_tournament_queue
  on public.matches(tournament_id,stage,status,order_index);
create index matches_by_group on public.matches(group_id);
create index matches_by_team_a on public.matches(team_a_id);
create index matches_by_team_b on public.matches(team_b_id);

create table public.audit_events (
  id bigint generated always as identity primary key,
  tournament_id uuid references public.tournaments(id) on delete set null,
  actor_user_id uuid,
  entity text not null,
  entity_id text not null,
  action text not null check (action in ('INSERT','UPDATE','DELETE')),
  previous_value jsonb,
  current_value jsonb,
  created_at timestamptz not null default now()
);
create index audit_by_tournament_time on public.audit_events(tournament_id,created_at desc);

create or replace function public.cimbria_set_updated_at()
returns trigger language plpgsql set search_path = ''
as $fn$
begin
  new.updated_at = now();
  return new;
end;
$fn$;
create trigger tournaments_touch before update on public.tournaments
  for each row execute function public.cimbria_set_updated_at();
create trigger teams_touch before update on public.teams
  for each row execute function public.cimbria_set_updated_at();
create trigger tables_touch before update on public.game_tables
  for each row execute function public.cimbria_set_updated_at();
create trigger matches_touch before update on public.matches
  for each row execute function public.cimbria_set_updated_at();

create or replace function public.cimbria_enforce_team_capacity()
returns trigger language plpgsql security definer set search_path = ''
as $fn$
declare v_limit integer;
begin
  select max_teams into v_limit
    from public.tournaments where id=new.tournament_id for update;
  if (select count(*) from public.teams where tournament_id=new.tournament_id) >= v_limit then
    raise exception 'Tournament team capacity reached (% teams)', v_limit;
  end if;
  return new;
end;
$fn$;
create trigger teams_enforce_capacity before insert on public.teams
  for each row execute function public.cimbria_enforce_team_capacity();

-- Prevent two concurrent matches for any team, even on different tables.
create or replace function public.cimbria_validate_match_assignment()
returns trigger language plpgsql security definer set search_path = ''
as $fn$
begin
  if new.status not in ('ready','live') then return new; end if;
  perform pg_advisory_xact_lock(hashtextextended(new.tournament_id::text,0));
  if not exists (
    select 1 from public.game_tables gt where gt.id=new.table_id
      and gt.tournament_id=new.tournament_id and gt.active=true
  ) then
    raise exception 'Game table is inactive or does not exist';
  end if;
  if exists (
    select 1 from public.matches m
    where m.tournament_id=new.tournament_id and m.id<>new.id
      and m.status in ('ready','live')
      and (
        m.team_a_id in (new.team_a_id,new.team_b_id)
        or m.team_b_id in (new.team_a_id,new.team_b_id)
      )
  ) then
    raise exception 'A team is already assigned to another ready/live match';
  end if;
  return new;
end;
$fn$;
create trigger match_assignment_guard
  before insert or update of status,table_id,team_a_id,team_b_id on public.matches
  for each row execute function public.cimbria_validate_match_assignment();

create or replace function public.cimbria_record_audit()
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
  if tg_table_name='tournaments' then
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
create trigger audit_tournaments after insert or update or delete on public.tournaments
  for each row execute function public.cimbria_record_audit();
create trigger audit_teams after insert or update or delete on public.teams
  for each row execute function public.cimbria_record_audit();
create trigger audit_matches after insert or update or delete on public.matches
  for each row execute function public.cimbria_record_audit();
create trigger audit_game_tables after insert or update or delete on public.game_tables
  for each row execute function public.cimbria_record_audit();

-- Team standings derive only from wins and losses (no cup scores).
create view public.group_standings with (security_invoker=true) as
select gm.tournament_id,gm.group_id,g.code as group_code,gm.team_id,t.name as team_name,
  count(m.id) filter (where m.status='done')::integer as played,
  count(m.id) filter (where m.status='done' and m.winner_team_id=gm.team_id)::integer as wins,
  count(m.id) filter (where m.status='done' and m.winner_team_id<>gm.team_id)::integer as losses
from public.group_members gm
join public.groups g on g.id=gm.group_id and g.tournament_id=gm.tournament_id
join public.teams t on t.id=gm.team_id and t.tournament_id=gm.tournament_id
left join public.matches m on m.group_id=gm.group_id
  and m.stage='group' and (m.team_a_id=gm.team_id or m.team_b_id=gm.team_id)
group by gm.tournament_id,gm.group_id,g.code,gm.team_id,t.name;

-- Explicit RLS and grants: anonymous users can only read published event data.
alter table public.tournaments enable row level security;
alter table public.admin_users enable row level security;
alter table public.teams enable row level security;
alter table public.players enable row level security;
alter table public.groups enable row level security;
alter table public.group_members enable row level security;
alter table public.game_tables enable row level security;
alter table public.matches enable row level security;
alter table public.audit_events enable row level security;

revoke all on table
  public.tournaments,public.admin_users,public.teams,public.players,public.groups,
  public.group_members,public.game_tables,public.matches,public.audit_events
  from anon,authenticated;
revoke all on public.group_standings from anon,authenticated;
revoke all on function public.is_cimbria_admin() from public,anon;
grant execute on function public.is_cimbria_admin() to authenticated;

grant select on public.tournaments,public.teams,public.groups,public.group_members,
  public.game_tables,public.matches,public.group_standings
  to anon,authenticated;
grant select,insert,update,delete on public.tournaments,public.teams,public.groups,
  public.group_members,public.game_tables,public.matches,public.players to authenticated;
grant select on public.players,public.admin_users,public.audit_events to authenticated;

create policy tournaments_public_read on public.tournaments
  for select to anon,authenticated using (is_published=true);
create policy tournaments_admin_all on public.tournaments
  for all to authenticated
  using ((select public.is_cimbria_admin()))
  with check ((select public.is_cimbria_admin()));

create policy teams_public_read on public.teams
  for select to anon,authenticated using (
    exists(select 1 from public.tournaments t
       where t.id=tournament_id and t.is_published=true)
  );
create policy teams_admin_all on public.teams
  for all to authenticated
  using ((select public.is_cimbria_admin()))
  with check ((select public.is_cimbria_admin()));

create policy groups_public_read on public.groups
  for select to anon,authenticated using (
    exists(select 1 from public.tournaments t
       where t.id=tournament_id and t.is_published=true)
  );
create policy groups_admin_all on public.groups
  for all to authenticated
  using ((select public.is_cimbria_admin()))
  with check ((select public.is_cimbria_admin()));

create policy group_members_public_read on public.group_members
  for select to anon,authenticated using (
    exists(select 1 from public.tournaments t
      where t.id=tournament_id and t.is_published=true)
  );
create policy group_members_admin_all on public.group_members
  for all to authenticated
  using ((select public.is_cimbria_admin()))
  with check ((select public.is_cimbria_admin()));

create policy game_tables_public_read on public.game_tables
  for select to anon,authenticated using (
    exists(select 1 from public.tournaments t
      where t.id=tournament_id and t.is_published=true)
  );
create policy game_tables_admin_all on public.game_tables
  for all to authenticated
  using ((select public.is_cimbria_admin()))
  with check ((select public.is_cimbria_admin()));

create policy matches_public_read on public.matches
  for select to anon,authenticated using (
    exists(select 1 from public.tournaments t
      where t.id=tournament_id and t.is_published=true)
  );
create policy matches_admin_all on public.matches
  for all to authenticated
  using ((select public.is_cimbria_admin()))
  with check ((select public.is_cimbria_admin()));

create policy players_admin_all on public.players
  for all to authenticated
  using ((select public.is_cimbria_admin()))
  with check ((select public.is_cimbria_admin()));
create policy admin_users_read_own on public.admin_users
  for select to authenticated using (user_id=(select auth.uid()));
create policy audit_admin_read on public.audit_events
  for select to authenticated using ((select public.is_cimbria_admin()));

-- Start in unpublished, closed registration mode. No sample participant data.
insert into public.tournaments
  (slug,name,phase,is_published,registration_open,
   min_teams,max_teams,group_count,playoff_teams,min_players,max_players)
values
  ('cimbria-bierpong-cup','Cimbria Bierpong Cup','registration',false,false,
   24,32,8,16,2,4)
on conflict (slug) do nothing;
insert into public.groups(tournament_id,code,sort_order)
select t.id,c.code,c.ord
from public.tournaments t
cross join (values ('A',1),('B',2),('C',3),('D',4),
                  ('E',5),('F',6),('G',7),('H',8)) as c(code,ord)
where t.slug='cimbria-bierpong-cup'
on conflict (tournament_id,code) do nothing;

-- Realtime replication only for non-sensitive public tournament objects.
do $fn$
declare nm text;
begin
  if exists(select 1 from pg_publication where pubname='supabase_realtime') then
    foreach nm in array array[
      'tournaments','teams','groups','group_members','matches','game_tables'
    ] loop
      if not exists(select 1 from pg_publication_tables
        where pubname='supabase_realtime' and schemaname='public' and tablename=nm)
      then
        execute format('alter publication supabase_realtime add table public.%I',nm);
      end if;
    end loop;
  end if;
end;
$fn$;
