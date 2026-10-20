
-- The reset is deliberately NOT executed by installing this migration.
-- This creates an administrator-only, revision-protected operation and a private backup.
create table if not exists cimbria_private.tournament_reset_backups (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references public.tournaments(id) on delete restrict,
  actor_user_id uuid not null references auth.users(id),
  previous_revision bigint not null,
  created_at timestamptz not null default now(),
  summary jsonb not null,
  snapshot jsonb not null
);
create index if not exists cimbria_reset_backups_tournament_time
on cimbria_private.tournament_reset_backups(tournament_id,created_at desc);
revoke all on cimbria_private.tournament_reset_backups from public, anon, authenticated;

create or replace function cimbria_private.cimbria_reset_tournament_secure(
  p_slug text, p_expected_revision bigint, p_confirmation text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_t public.tournaments%rowtype;
  v_actor uuid := auth.uid();
  v_summary jsonb;
  v_backup_id uuid;
begin
  -- The server checks actual verified permissions. UI visibility is never enough.
  if v_actor is null or not exists (
    select 1
    from public.admin_users a
    join auth.users u on u.id=a.user_id
    join cimbria_private.admin_email_allowlist al
      on al.email=lower(u.email) and al.enabled=true and al.role='admin'
    where a.user_id=v_actor and a.active=true and a.role='admin'
      and u.email_confirmed_at is not null
  ) then
    raise exception 'Nur ein bestätigter Hauptadmin darf das Turnier zurücksetzen';
  end if;

  if p_confirmation is distinct from 'CIMBRIA RESET' then
    raise exception 'Sicherheitsbestätigung stimmt nicht überein';
  end if;
  if p_expected_revision is null or p_slug is null then
    raise exception 'Ungültige Reset-Anfrage';
  end if;

  select * into v_t
  from public.tournaments
  where slug=p_slug
  for update;
  if not found then raise exception 'Turnier nicht gefunden'; end if;
  if v_t.revision <> p_expected_revision then
    raise exception 'Turnier wurde zwischenzeitlich geändert. Bitte Daten neu laden.';
  end if;

  select jsonb_build_object(
    'teams', (select count(*) from public.teams where tournament_id=v_t.id),
    'players', (select count(*) from public.players p
      join public.teams tm on tm.id=p.team_id where tm.tournament_id=v_t.id),
    'groups_assigned', (select count(*) from public.group_members where tournament_id=v_t.id),
    'matches', (select count(*) from public.matches where tournament_id=v_t.id),
    'tv_cues', (select count(*) from public.tv_cues where tournament_id=v_t.id),
    'audit_events', (select count(*) from public.audit_events where tournament_id=v_t.id),
    'old_phase', v_t.phase
  ) into v_summary;

  -- Archive everything transactionally before deleting any registration/result.
  insert into cimbria_private.tournament_reset_backups
    (tournament_id,actor_user_id,previous_revision,summary,snapshot)
  values (
    v_t.id,v_actor,v_t.revision,v_summary,
    jsonb_build_object(
      'tournament', to_jsonb(v_t),
      'teams', (select coalesce(jsonb_agg(to_jsonb(x)), '[]'::jsonb)
                from public.teams x where x.tournament_id=v_t.id),
      'players', (select coalesce(jsonb_agg(to_jsonb(p)), '[]'::jsonb)
                  from public.players p join public.teams tm on tm.id=p.team_id
                  where tm.tournament_id=v_t.id),
      'groups', (select coalesce(jsonb_agg(to_jsonb(x)), '[]'::jsonb)
                 from public.groups x where x.tournament_id=v_t.id),
      'group_members', (select coalesce(jsonb_agg(to_jsonb(x)), '[]'::jsonb)
                        from public.group_members x where x.tournament_id=v_t.id),
      'game_tables', (select coalesce(jsonb_agg(to_jsonb(x)), '[]'::jsonb)
                      from public.game_tables x where x.tournament_id=v_t.id),
      'matches', (select coalesce(jsonb_agg(to_jsonb(x)), '[]'::jsonb)
                  from public.matches x where x.tournament_id=v_t.id),
      'tv_cues', (select coalesce(jsonb_agg(to_jsonb(x)), '[]'::jsonb)
                  from public.tv_cues x where x.tournament_id=v_t.id),
      'audit_events', (select coalesce(jsonb_agg(to_jsonb(x)), '[]'::jsonb)
                       from public.audit_events x where x.tournament_id=v_t.id)
    )
  ) returning id into v_backup_id;

  -- Clear references before removing the rows they point to.
  update public.tournaments
    set tv_main_match_id=null, registration_open=false
  where id=v_t.id;

  delete from public.tv_cues where tournament_id=v_t.id;
  delete from public.matches where tournament_id=v_t.id;
  delete from public.group_members where tournament_id=v_t.id;
  delete from public.players p using public.teams t
    where p.team_id=t.id and t.tournament_id=v_t.id;
  delete from public.teams where tournament_id=v_t.id;

  -- Archive the full old audit history; keep only the new reset event visible.
  delete from public.audit_events where tournament_id=v_t.id;

  -- Keep the site, permanent group codes, configured tables, team capacity,
  -- TV settings, all admin accounts, and their individual passwords.
  -- Registration remains closed until an administrator reopens it.
  update public.tournaments set
      phase='registration', registration_open=false,
      group_count=8, playoff_teams=16,
      tv_main_match_id=null, revision=revision+1
  where id=v_t.id;

  return jsonb_build_object(
    'success',true,
    'new_phase','registration',
    'registration_open',false,
    'new_revision',v_t.revision+1,
    'backup_id',v_backup_id,
    'deleted',v_summary
  );
end;
$function$;

revoke all on function cimbria_private.cimbria_reset_tournament_secure(text,bigint,text)
 from public,anon,authenticated;

create or replace function public.cimbria_reset_tournament(
  p_slug text, p_expected_revision bigint, p_confirmation text
)
returns jsonb
language sql
security invoker
set search_path = ''
as $function$
  select cimbria_private.cimbria_reset_tournament_secure(
    p_slug,p_expected_revision,p_confirmation
  );
$function$;
revoke all on function public.cimbria_reset_tournament(text,bigint,text)
 from public,anon;
grant execute on function public.cimbria_reset_tournament(text,bigint,text)
 to authenticated;
