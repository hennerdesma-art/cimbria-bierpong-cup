
-- Cimbria V5: public read-only broadcast cues, administrator-operated control,
-- and curated team crest IDs. No sensitive user data in broadcast tables.

alter table public.teams
  add column icon_id text not null default 'crown';
alter table public.teams
  add constraint teams_icon_id_whitelist
  check(icon_id in ('crown','skull','flame','bolt','target','rocket',
                    'shield','star','anchor','dragon','cup','phoenix'));

alter table public.tournaments
  add column tv_auto_intros boolean not null default true,
  add column tv_auto_wins boolean not null default true,
  add column tv_rotate_bracket boolean not null default true,
  add column tv_main_match_id uuid references public.matches(id) on delete set null;

create table public.tv_cues (
 id bigint generated always as identity primary key,
 tournament_id uuid not null references public.tournaments(id) on delete cascade,
 match_id uuid references public.matches(id) on delete set null,
 kind text not null check(kind in ('intro','winner','bracket','clear')),
 duration_ms integer not null default 9000 check(duration_ms between 1000 and 30000),
 source text not null check(source in ('automatic','manual')),
 created_at timestamptz not null default now()
);
create index tv_cues_by_tournament_time on public.tv_cues(tournament_id,id desc);
alter table public.tv_cues enable row level security;
revoke all on public.tv_cues from public,anon,authenticated;
grant select on public.tv_cues to anon,authenticated;
grant insert on public.tv_cues to authenticated;
create policy tv_cues_public_read on public.tv_cues for select to anon,authenticated
using (
  exists(select 1 from public.tournaments t
    where t.id=tv_cues.tournament_id and t.is_published=true)
);
create policy tv_cues_admin_write on public.tv_cues for insert to authenticated
with check ((select cimbria_private.is_cimbria_admin()));

-- Trigger is internal; it creates broadcast events only for the selected Main Stage match.
create or replace function cimbria_private.cimbria_match_tv_cue()
returns trigger language plpgsql security definer set search_path=''
as $body$
declare v_t public.tournaments%rowtype;
begin
 if new.status = old.status or new.status not in ('live','done') then
   return new;
 end if;
 select * into v_t from public.tournaments where id=new.tournament_id;
 if not found or v_t.tv_main_match_id is distinct from new.id then
   return new;
 end if;
 if new.status='live' and v_t.tv_auto_intros then
   insert into public.tv_cues(tournament_id,match_id,kind,duration_ms,source)
   values(new.tournament_id,new.id,'intro',10000,'automatic');
 elsif new.status='done' and v_t.tv_auto_wins and new.winner_team_id is not null then
   insert into public.tv_cues(tournament_id,match_id,kind,duration_ms,source)
   values(new.tournament_id,new.id,'winner',11000,'automatic');
 end if;
 return new;
end;
$body$;
revoke all on function cimbria_private.cimbria_match_tv_cue() from public,anon,authenticated;
create trigger matches_emit_tv_cue
after update of status on public.matches
for each row execute function cimbria_private.cimbria_match_tv_cue();

-- Admin controls the public TV from a single API, without exposing write access to guests.
create or replace function public.cimbria_tv_control(
  p_action text, p_match uuid default null, p_value boolean default null
) returns jsonb language plpgsql security invoker set search_path=''
as $body$
declare v_t public.tournaments%rowtype; v_m public.matches%rowtype;
declare v_kind text; v_id bigint; v_duration integer;
begin
 if not cimbria_private.is_cimbria_admin() then
   raise exception 'Keine Berechtigung zur TV-Regie';
 end if;
 select * into v_t from public.tournaments
 where slug='cimbria-bierpong-cup' for update;
 if not found then raise exception 'Turnier nicht gefunden'; end if;

 if p_action in ('auto_intros','auto_wins','rotate_bracket') then
   if p_value is null then raise exception 'Boolean Einstellung fehlt';end if;
   if p_action='auto_intros' then
     update public.tournaments set tv_auto_intros=p_value where id=v_t.id;
   elsif p_action='auto_wins' then
     update public.tournaments set tv_auto_wins=p_value where id=v_t.id;
   else
     update public.tournaments set tv_rotate_bracket=p_value where id=v_t.id;
   end if;
   return jsonb_build_object('success',true,'action',p_action,'value',p_value);
 end if;

 if p_action='main_stage' then
   if p_match is not null then
     select * into v_m from public.matches
       where id=p_match and tournament_id=v_t.id;
     if not found or v_m.status not in ('ready','live') then
       raise exception 'Main Stage muss ein bereites oder laufendes Spiel sein';
     end if;
   end if;
   update public.tournaments set tv_main_match_id=p_match where id=v_t.id;
   return jsonb_build_object('success',true,'match_id',p_match);
 end if;

 if p_action in ('intro','winner') then
   if p_match is null then raise exception 'Spiel auswählen'; end if;
   select * into v_m from public.matches
     where id=p_match and tournament_id=v_t.id;
   if not found then raise exception 'Spiel nicht gefunden'; end if;
   if p_action='intro' and v_m.status not in ('ready','live') then
     raise exception 'Intro nur für bereite/laufende Spiele';
   end if;
   if p_action='winner' and (v_m.status<>'done' or v_m.winner_team_id is null) then
     raise exception 'Siegeranimation nur nach Ergebnisbestätigung';
   end if;
 end if;

 if p_action='intro' then v_kind='intro';v_duration=10000;
 elsif p_action='winner' then v_kind='winner';v_duration=11000;
 elsif p_action='bracket' then v_kind='bracket';v_duration=16000;
 elsif p_action='clear' then v_kind='clear';v_duration=1000;
 else raise exception 'Unbekannte TV-Aktion';end if;
 insert into public.tv_cues(tournament_id,match_id,kind,duration_ms,source)
 values(v_t.id,p_match,v_kind,v_duration,'manual')
 returning id into v_id;
 return jsonb_build_object('success',true,'cue_id',v_id,'kind',v_kind);
end;
$body$;
revoke all on function public.cimbria_tv_control(text,uuid,boolean) from public,anon;
grant execute on function public.cimbria_tv_control(text,uuid,boolean) to authenticated;

do $body$
begin
 if exists(select 1 from pg_publication where pubname='supabase_realtime')
    and not exists(select 1 from pg_publication_tables
        where pubname='supabase_realtime' and schemaname='public' and tablename='tv_cues')
 then
   alter publication supabase_realtime add table public.tv_cues;
 end if;
end;
$body$;
