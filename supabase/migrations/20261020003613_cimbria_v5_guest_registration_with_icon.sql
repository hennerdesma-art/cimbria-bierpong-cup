CREATE OR REPLACE FUNCTION public.cimbria_guest_register_team(p_slug text, p_name text, p_players jsonb, p_icon_id text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
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
  if p_icon_id is null or p_icon_id not in
     ('crown','skull','flame','bolt','target','rocket',
      'shield','star','anchor','dragon','cup','phoenix') then
    raise exception 'Ungültiges Team-Emblem';
  end if;
  insert into public.teams(tournament_id,name,icon_id)
  values(v_t.id,v_name,p_icon_id) returning id into v_team;
  for v_number in 0..jsonb_array_length(p_players)-1 loop
    v_member=btrim(regexp_replace(p_players->>v_number,'\s+',' ','g'));
    insert into public.players(team_id,slot,full_name)
    values(v_team,v_number+1,v_member);
  end loop;
  update public.tournaments set revision=revision+1 where id=v_t.id;
  select count(*) into v_count from public.teams where tournament_id=v_t.id;
  return jsonb_build_object('id',v_team,'team_name',v_name,'team_count',v_count);
end
$function$
;
revoke all on function public.cimbria_guest_register_team(text,text,jsonb,text)
  from public,anon,authenticated;
grant execute on function public.cimbria_guest_register_team(text,text,jsonb,text)
  to service_role;
