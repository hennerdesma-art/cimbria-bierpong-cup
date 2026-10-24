
-- Admin-only tournament team edits. All updates are transactional and keep team IDs/results stable.
create or replace function public.cimbria_admin_edit_team(
  p_team_id uuid,
  p_name text,
  p_players jsonb,
  p_expected_revision bigint,
  p_group_code text default null,
  p_swap_team_id uuid default null
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $function$
declare
  v_t public.tournaments%rowtype;
  v_team public.teams%rowtype;
  v_name text;
  v_member text;
  v_names text[] := array[]::text[];
  v_count integer;
  v_i integer;
  v_old_group uuid;
  v_new_group uuid;
  v_swap_group uuid;
  v_group_code text;
  v_source_size integer;
  v_target_size integer;
  v_changed_group boolean := false;
  v_removed integer := 0;
  v_added integer := 0;
  v_order integer;
  v_gid uuid;
  v_a uuid;
  v_b uuid;
begin
  if (select auth.uid()) is null or not (select cimbria_private.is_cimbria_admin()) then
    raise exception 'Nur angemeldete Turnieradmins dürfen Teams verwalten';
  end if;

  if p_team_id is null or p_expected_revision is null then
    raise exception 'Team oder Änderungsstand fehlt';
  end if;

  -- Lock the tournament row exactly like ordinary admin saves to prevent concurrent edits.
  select t.* into v_t
    from public.tournaments t
    join public.teams tm on tm.tournament_id=t.id
   where tm.id=p_team_id
     for update of t;
  if not found then raise exception 'Team nicht gefunden'; end if;
  if v_t.revision <> p_expected_revision then
    raise exception 'Turnier wurde zwischenzeitlich geändert. Bitte Daten neu laden';
  end if;

  select * into v_team from public.teams
   where id=p_team_id and tournament_id=v_t.id for update;
  if not found then raise exception 'Team wurde entfernt'; end if;

  v_name := btrim(coalesce(p_name,''));
  if char_length(v_name)<3 or char_length(v_name)>35 then
    raise exception 'Teamname muss 3 bis 35 Zeichen enthalten';
  end if;
  if exists (
    select 1 from public.teams t
    where t.tournament_id=v_t.id and t.id<>p_team_id
      and lower(t.name)=lower(v_name)
  ) then raise exception 'Dieser Teamname wird bereits verwendet'; end if;

  if p_players is null or jsonb_typeof(p_players)<>'array' then
    raise exception 'Bitte die Mitglieder als Liste angeben';
  end if;
  v_count := jsonb_array_length(p_players);
  if v_count < 2 or v_count > 4 then
    raise exception 'Ein Team benötigt 2 bis 4 Mitglieder';
  end if;
  for v_i in 0..v_count-1 loop
    if jsonb_typeof(p_players->v_i)<>'string' then
      raise exception 'Mitglied % hat einen ungültigen Namen',v_i+1;
    end if;
    v_member := btrim(p_players->>v_i);
    if char_length(v_member)<2 or char_length(v_member)>50 then
      raise exception 'Mitglied %: Name muss 2 bis 50 Zeichen enthalten',v_i+1;
    end if;
    if lower(v_member)=any(v_names) then
      raise exception 'Teammitglieder dürfen nicht doppelt erfasst werden';
    end if;
    v_names := array_append(v_names,lower(v_member));
  end loop;

  -- A group correction is permitted only during group stage, and only when
  -- neither moved team has a ready, live or completed fixture.
  if p_group_code is not null and btrim(p_group_code)<>'' then
    v_group_code := upper(btrim(p_group_code));
    if v_t.phase='registration' then
      raise exception 'Gruppen können erst nach der Auslosung korrigiert werden';
    end if;
    select gm.group_id into v_old_group
      from public.group_members gm
     where gm.tournament_id=v_t.id and gm.team_id=p_team_id
     for update;
    if v_old_group is null then raise exception 'Team besitzt keine Gruppenzuordnung'; end if;
    select g.id into v_new_group from public.groups g
     where g.tournament_id=v_t.id and g.code=v_group_code
       and g.sort_order between 1 and v_t.group_count;
    if v_new_group is null then raise exception 'Die Zielgruppe existiert nicht'; end if;

    v_changed_group := (v_old_group <> v_new_group);
    if v_changed_group then
      if v_t.phase<>'groups' then
        raise exception 'Nach dem Playoff-Start kann die Gruppeneinteilung nicht mehr geändert werden';
      end if;
      if exists (select 1 from public.matches
        where tournament_id=v_t.id and stage='playoff') then
        raise exception 'Ein Playoff-Baum besteht bereits; Gruppenwechsel gesperrt';
      end if;
      if exists (select 1 from public.matches
        where tournament_id=v_t.id and stage='tiebreak'
          and group_id in (v_old_group,v_new_group)) then
        raise exception 'In den betroffenen Gruppen bestehen Entscheidungsspiele; erst klären';
      end if;
      if exists (select 1 from public.matches m
        where m.tournament_id=v_t.id and m.status in ('ready','live','done')
          and (m.team_a_id=p_team_id or m.team_b_id=p_team_id)) then
        raise exception 'Dieses Team hat bereits ein zugewiesenes oder gespieltes Match; Gruppenwechsel gesperrt';
      end if;

      if p_swap_team_id is not null then
        if p_swap_team_id=p_team_id then raise exception 'Ein Team kann nicht mit sich selbst tauschen'; end if;
        select gm.group_id into v_swap_group from public.group_members gm
         where gm.tournament_id=v_t.id and gm.team_id=p_swap_team_id
         for update;
        if v_swap_group is distinct from v_new_group then
          raise exception 'Tauschpartner gehört nicht zur Zielgruppe';
        end if;
        if exists (select 1 from public.matches m
          where m.tournament_id=v_t.id and m.status in ('ready','live','done')
            and (m.team_a_id=p_swap_team_id or m.team_b_id=p_swap_team_id)) then
          raise exception 'Tauschpartner hat bereits ein zugewiesenes oder gespieltes Match';
        end if;
      else
        select count(*) into v_source_size from public.group_members
          where tournament_id=v_t.id and group_id=v_old_group;
        select count(*) into v_target_size from public.group_members
          where tournament_id=v_t.id and group_id=v_new_group;
        if v_source_size<=2 then
          raise exception 'Mindestens zwei Teams müssen in jeder Gruppe bleiben. Bitte einen Tauschpartner wählen';
        end if;
        if v_target_size>=4 then
          raise exception 'Zielgruppe wäre zu groß (max. 4). Bitte einen Tauschpartner wählen';
        end if;
      end if;

      update public.group_members set group_id=v_new_group
       where tournament_id=v_t.id and team_id=p_team_id;
      if p_swap_team_id is not null then
        update public.group_members set group_id=v_old_group
         where tournament_id=v_t.id and team_id=p_swap_team_id;
      end if;

      -- Keep all completed matches for unaffected teams. Only obsolete *open*
      -- fixtures in either changed group are removed.
      delete from public.matches m
       where m.tournament_id=v_t.id
         and m.stage='group' and m.status='open'
         and m.group_id in (v_old_group,v_new_group)
         and (
           not exists (select 1 from public.group_members gm
             where gm.tournament_id=v_t.id and gm.group_id=m.group_id and gm.team_id=m.team_a_id)
           or
           not exists (select 1 from public.group_members gm
             where gm.tournament_id=v_t.id and gm.group_id=m.group_id and gm.team_id=m.team_b_id)
         );
      get diagnostics v_removed = row_count;

      -- Rebuild missing round-robin pairings without rewriting completed games
      -- or changing their winners, table numbers, cups, or timestamps.
      select coalesce(max(order_index),0) into v_order
       from public.matches where tournament_id=v_t.id;
      for v_gid in select distinct id from unnest(array[v_old_group,v_new_group]) as x(id)
      loop
        for v_a in select team_id from public.group_members
                    where tournament_id=v_t.id and group_id=v_gid order by team_id
        loop
          for v_b in select team_id from public.group_members
                      where tournament_id=v_t.id and group_id=v_gid and team_id>v_a order by team_id
          loop
            if not exists (
              select 1 from public.matches m
               where m.tournament_id=v_t.id and m.stage='group' and m.group_id=v_gid
                 and ((m.team_a_id=v_a and m.team_b_id=v_b)
                  or (m.team_a_id=v_b and m.team_b_id=v_a))
            ) then
              v_order:=v_order+1;
              insert into public.matches (
                tournament_id,group_id,stage,round_no,bracket_position,
                order_index,team_a_id,team_b_id,status
              ) values (
                v_t.id,v_gid,'group',0,0,
                v_order,v_a,v_b,'open'
              );
              v_added:=v_added+1;
            end if;
          end loop;
        end loop;
      end loop;
    elsif p_swap_team_id is not null then
      raise exception 'Tauschpartner kann nur beim tatsächlichen Gruppenwechsel gesetzt werden';
    end if;
  elsif p_swap_team_id is not null then
    raise exception 'Für einen Tausch muss eine Zielgruppe angegeben werden';
  end if;

  -- Preserve the stable team UUID used by every historical score and TV cue.
  if v_team.name is distinct from v_name then
    update public.teams set name=v_name where id=p_team_id;
  end if;

  -- Upsert slots instead of deleting all player records; keep stable IDs
  -- for unchanged slots and allow adding/removing slots 3/4 mid-tournament.
  for v_i in 0..v_count-1 loop
    insert into public.players(team_id,slot,full_name)
    values(p_team_id,(v_i+1)::smallint,btrim(p_players->>v_i))
    on conflict(team_id,slot)
    do update set full_name=excluded.full_name
      where public.players.full_name is distinct from excluded.full_name;
  end loop;
  delete from public.players where team_id=p_team_id and slot>v_count;

  update public.tournaments set revision=revision+1 where id=v_t.id;
  return jsonb_build_object(
    'success',true,'team_id',p_team_id,'name',v_name,
    'member_count',v_count,'group_changed',v_changed_group,
    'fixtures_removed',v_removed,'fixtures_created',v_added,
    'revision',v_t.revision+1
  );
end;
$function$;

revoke all on function public.cimbria_admin_edit_team(uuid,text,jsonb,bigint,text,uuid)
 from public,anon;
grant execute on function public.cimbria_admin_edit_team(uuid,text,jsonb,bigint,text,uuid)
 to authenticated;
