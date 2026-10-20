
-- Bring the configurable minimum in sync even when an administrator has
-- already moved the existing tournament into groups/playoffs.
-- Never changes phase, teams, fixtures, scores, or registration state.
update public.tournaments
set min_teams=12
where slug='cimbria-bierpong-cup' and min_teams<>12;
