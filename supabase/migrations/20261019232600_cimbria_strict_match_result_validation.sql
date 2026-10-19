
alter table public.matches drop constraint result_winner_valid;
alter table public.matches add constraint result_winner_valid check (
  (status='done' and team_a_id is not null and team_b_id is not null
    and winner_team_id is not null
    and (winner_team_id=team_a_id or winner_team_id=team_b_id)
    and completed_at is not null)
  or
  (status<>'done' and winner_team_id is null and completed_at is null)
);
alter table public.matches add constraint group_matches_require_two_teams check (
  stage='playoff' or (team_a_id is not null and team_b_id is not null)
);
create or replace function cimbria_private.cimbria_block_deactivation_of_busy_table()
returns trigger language plpgsql security definer set search_path = ''
as $fn$
begin
  if old.active=true and new.active=false and exists (
    select 1 from public.matches m
    where m.table_id=new.id and m.status in ('ready','live')
  ) then
    raise exception 'Cannot deactivate a table while a match is assigned or live';
  end if;
  return new;
end;
$fn$;
revoke all on function cimbria_private.cimbria_block_deactivation_of_busy_table()
  from public,anon,authenticated;
create trigger game_tables_block_busy_deactivation
  before update of active on public.game_tables
  for each row execute function cimbria_private.cimbria_block_deactivation_of_busy_table();
