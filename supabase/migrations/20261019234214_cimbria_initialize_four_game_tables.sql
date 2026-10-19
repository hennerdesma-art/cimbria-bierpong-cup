
-- Provide four initial tables from the existing design. Admins may add/remove
-- or disable more later; nobody is assigned automatically.
insert into public.game_tables(tournament_id,name,sort_order,active)
select t.id, 'Tisch '||n::text, n, true
from public.tournaments t
cross join generate_series(1,4) as n
where t.slug='cimbria-bierpong-cup'
on conflict do nothing;
