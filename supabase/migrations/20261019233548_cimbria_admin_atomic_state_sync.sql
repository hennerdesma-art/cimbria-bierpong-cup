
-- One-transaction optimistic concurrency sync for the existing Cimbria UI.
-- Callable only by authenticated, explicitly provisioned admins.
create or replace function public.cimbria_admin_save_state(
  p_slug text, p_revision bigint, p_state jsonb
)
returns bigint
language plpgsql security definer set search_path=''
as $fn$
declare
  v_t public.tournaments%rowtype;
  v_item jsonb;
  v_inner jsonb;
  v_group_id uuid;
  v_code text;
  v_match_id uuid;
  v_match_count integer :=0;
  v_phase text;
  v_reg boolean;
  v_old_team_count integer;
  v_team_count integer;
begin
  if not cimbria_private.is_cimbria_admin() then
    raise exception 'Keine Admin-Berechtigung';
  end if;
  if jsonb_typeof(p_state) <> 'object'
      or jsonb_typeof(p_state->'teams') <> 'array'
      or jsonb_typeof(p_state->'tables') <> 'array'
      or jsonb_typeof(p_state->'groups') <> 'array'
      or jsonb_typeof(p_state->'matches') <> 'array'
      or jsonb_typeof(p_state->'playoffMatches') <> 'array' then
    raise exception 'Ungültiger Turnierstatus';
  end if;

  select * into v_t from public.tournaments where slug=p_slug for update;
  if not found then raise exception 'Turnier unbekannt'; end if;
  if v_t.revision<>p_revision then
    raise exception 'Die Daten haben sich geändert. Bitte neu laden.';
  end if;
  v_phase=p_state->>'phase';
  v_reg=(p_state->>'registrationOpen')::boolean;
  if v_phase not in ('registration','groups','playoffs','finished') or v_reg is null then
    raise exception 'Ungültige Phase oder Anmeldestatus';
  end if;
  if (v_t.phase='registration' and v_phase not in ('registration','groups'))
     or (v_t.phase='groups' and v_phase not in ('groups','playoffs'))
     or (v_t.phase='playoffs' and v_phase not in ('playoffs','finished'))
     or (v_t.phase='finished' and v_phase<>'finished') then
    raise exception 'Turnierphase kann nicht zurückgesetzt werden';
  end if;
  if v_reg and (v_phase<>'registration' or not v_t.is_published) then
    raise exception 'Anmeldung ist nur in veröffentlichter Anmeldephase möglich';
  end if;
  select count(*) into v_old_team_count from public.teams where tournament_id=v_t.id;
  v_team_count=jsonb_array_length(p_state->'teams');
  if v_team_count>v_t.max_teams then raise exception 'Zu viele Teams'; end if;
  if v_phase='groups' and v_t.phase='registration' and v_team_count<v_t.min_teams then
    raise exception 'Zu wenige Teams für die Gruppenphase';
  end if;

  -- Team additions only through the validated guest registration endpoint.
  for v_item in select value from jsonb_array_elements(p_state->'teams') loop
    if not exists (
      select 1 from public.teams
      where id=(v_item->>'id')::uuid and tournament_id=v_t.id
    ) then raise exception 'Unbekanntes Team; Neuanmeldungen über das Registrierungsformular'; end if;
    if v_t.phase='registration' then
      update public.teams set name=btrim(v_item->>'name')
      where id=(v_item->>'id')::uuid
        and tournament_id=v_t.id
        and name is distinct from btrim(v_item->>'name');
    end if;
  end loop;
  if v_t.phase='registration' then
    delete from public.teams t where t.tournament_id=v_t.id
      and not exists(
        select 1 from jsonb_array_elements(p_state->'teams') e
        where (e->>'id')::uuid=t.id
      );
  elsif v_team_count<>v_old_team_count then
    raise exception 'Die Teamanzahl ist nach der Auslosung gesperrt';
  end if;

  -- Game tables may be dynamically added, renamed and enabled / disabled.
  if jsonb_array_length(p_state->'tables')>16 then
    raise exception 'Maximal 16 Tische unterstützt';
  end if;
  for v_item in select value from jsonb_array_elements(p_state->'tables') loop
    if char_length(btrim(v_item->>'name'))<1 then raise exception 'Ungültiger Tischname'; end if;
    insert into public.game_tables
      (id,tournament_id,name,sort_order,active)
    values(
      (v_item->>'id')::uuid,v_t.id,btrim(v_item->>'name'),
      coalesce((v_item->>'sortOrder')::integer,0),
      (v_item->>'active')::boolean
    )
    on conflict (id) do update
      set name=excluded.name,active=excluded.active,sort_order=excluded.sort_order
    where public.game_tables.tournament_id=excluded.tournament_id
      and (public.game_tables.name,public.game_tables.active,public.game_tables.sort_order)
        is distinct from (excluded.name,excluded.active,excluded.sort_order);
  end loop;

  -- Group membership assigned once by the admin draw, no reshuffles mid-game.
  if v_t.phase='registration' and v_phase='groups' then
    delete from public.group_members where tournament_id=v_t.id;
    for v_item in select value from jsonb_array_elements(p_state->'groups') loop
      v_code=v_item->>'name';
      select g.id into v_group_id from public.groups g
        where g.tournament_id=v_t.id and g.code=v_code;
      if v_group_id is null then raise exception 'Unbekannte Gruppe'; end if;
      for v_inner in select value from jsonb_array_elements(v_item->'teamIds') loop
        insert into public.group_members(tournament_id,group_id,team_id)
        values(v_t.id,v_group_id,(trim(both '"' from v_inner::text))::uuid);
      end loop;
    end loop;
    if (select count(*) from public.group_members where tournament_id=v_t.id)<>v_team_count then
      raise exception 'Nicht alle Teams sind einer Gruppe zugewiesen';
    end if;
  end if;

  v_match_count=jsonb_array_length(p_state->'matches')+
                jsonb_array_length(p_state->'playoffMatches');
  if v_match_count>256 then raise exception 'Zu viele Begegnungen'; end if;
  for v_item in
    select value from jsonb_array_elements(p_state->'matches')
    union all
    select value from jsonb_array_elements(p_state->'playoffMatches')
  loop
    if (v_item->>'type') not in ('group','tiebreak','playoff') then
      raise exception 'Unbekannter Begegnungstyp';
    end if;
    v_group_id=null;
    if (v_item->>'type')<>'playoff' then
      select id into v_group_id from public.groups
      where tournament_id=v_t.id and code=(v_item->>'group');
      if v_group_id is null then raise exception 'Unbekannte Spielgruppe'; end if;
    end if;
    v_match_id=(v_item->>'id')::uuid;
    -- New and existing matches must never refer to a different tournament.
    if exists(select 1 from public.matches
      where id=v_match_id and tournament_id<>v_t.id) then
      raise exception 'Unzulässige Begegnungs-ID';
    end if;
    insert into public.matches(
      id,tournament_id,group_id,stage,round_no,bracket_position,
      order_index,team_a_id,team_b_id,winner_team_id,status,
      table_id,played_table_id,started_at,completed_at
    ) values (
      v_match_id,v_t.id,v_group_id,(v_item->>'type'),
      coalesce((v_item->>'round')::integer,0),
      coalesce((v_item->>'position')::integer,0),
      coalesce((v_item->>'order')::integer,0),
      (v_item->>'teamAId')::uuid,
      (v_item->>'teamBId')::uuid,
      (v_item->>'winnerId')::uuid,
      (v_item->>'status'),
      (v_item->>'tableId')::uuid,
      (v_item->>'playedTableId')::uuid,
      case when v_item->>'startedAt' is not null
        then to_timestamp((v_item->>'startedAt')::double precision/1000) end,
      case when v_item->>'completedAt' is not null
        then to_timestamp((v_item->>'completedAt')::double precision/1000) end
    )
    on conflict (id) do update set
      team_a_id=excluded.team_a_id,
      team_b_id=excluded.team_b_id,
      winner_team_id=excluded.winner_team_id,
      status=excluded.status,
      table_id=excluded.table_id,
      played_table_id=excluded.played_table_id,
      started_at=excluded.started_at,
      completed_at=excluded.completed_at
    where public.matches.tournament_id=excluded.tournament_id and
     (
       public.matches.team_a_id,public.matches.team_b_id,
       public.matches.winner_team_id,public.matches.status,
       public.matches.table_id,public.matches.played_table_id,
       public.matches.started_at,public.matches.completed_at
     ) is distinct from
     (
       excluded.team_a_id,excluded.team_b_id,
       excluded.winner_team_id,excluded.status,
       excluded.table_id,excluded.played_table_id,
       excluded.started_at,excluded.completed_at
     );
  end loop;
  if v_t.phase='groups' and v_phase='playoffs' then
    if exists(select 1 from public.matches where tournament_id=v_t.id
      and stage in ('group','tiebreak') and status<>'done') then
      raise exception 'Alle Gruppenspiele und Entscheidungsspiele müssen beendet sein';
    end if;
    if (select count(*) from public.matches where tournament_id=v_t.id and stage='playoff')<>15 then
      raise exception 'Der Playoff-Baum muss aus 15 Spielen bestehen';
    end if;
  end if;
  update public.tournaments set
    phase=v_phase,registration_open=v_reg,revision=revision+1
  where id=v_t.id;
  return v_t.revision+1;
end
$fn$;
revoke all on function public.cimbria_admin_save_state(text,bigint,jsonb)
  from public,anon;
grant execute on function public.cimbria_admin_save_state(text,bigint,jsonb)
  to authenticated;
