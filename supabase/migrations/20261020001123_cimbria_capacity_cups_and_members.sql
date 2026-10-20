
alter table public.tournaments drop constraint if exists tournaments_max_teams_check;
alter table public.tournaments add constraint tournaments_max_teams_check check(max_teams between 16 and 512);
alter table public.tournaments drop constraint if exists tournaments_min_teams_check;
alter table public.tournaments add constraint tournaments_min_teams_check check(min_teams between 16 and 512);
update public.tournaments set min_teams=16 where slug='cimbria-bierpong-cup';
alter table public.matches add column cups_a smallint check(cups_a between 0 and 10);
alter table public.matches add column cups_b smallint check(cups_b between 0 and 10);
create or replace function public.cimbria_set_max_teams(p_max integer)
returns integer language plpgsql security invoker set search_path='' as $$
declare v_t public.tournaments%rowtype;
begin
 if not cimbria_private.is_cimbria_admin() then raise exception 'Kein Admin';end if;
 select * into v_t from public.tournaments where slug='cimbria-bierpong-cup' for update;
 if v_t.phase<>'registration' or p_max<16 or p_max>512 then raise exception '16 bis 512 Teams vor Auslosung';end if;
 if p_max<(select count(*) from public.teams where tournament_id=v_t.id) then raise exception 'Limit kleiner als aktuelle Anmeldungen';end if;
 update public.tournaments set max_teams=p_max,revision=revision+1 where id=v_t.id;
 return p_max;
end$$;
revoke all on function public.cimbria_set_max_teams(integer) from public,anon;
grant execute on function public.cimbria_set_max_teams(integer) to authenticated;
create or replace function public.cimbria_update_cups(p_match uuid,p_team text,p_delta integer)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare m public.matches%rowtype;v integer;
begin
 if not cimbria_private.is_cimbria_admin() then raise exception 'Keine Adminrechte'; end if;
 if p_delta not in (-1,1) or p_team not in ('a','b') then raise exception 'Ungültig';end if;
 select * into m from public.matches where id=p_match for update;
 if not found or m.status<>'live' then raise exception 'Spiel läuft nicht';end if;
 v=coalesce(case when p_team='a' then m.cups_a else m.cups_b end,10)+p_delta;
 if v<0 or v>10 then raise exception 'Becherstand nur 0 bis 10';end if;
 if p_team='a' then update public.matches set cups_a=v where id=p_match;
 else update public.matches set cups_b=v where id=p_match;end if;
 return jsonb_build_object('cups_a',case when p_team='a' then v else m.cups_a end,
                           'cups_b',case when p_team='b' then v else m.cups_b end);
end$$;
revoke all on function public.cimbria_update_cups(uuid,text,integer) from public,anon;
grant execute on function public.cimbria_update_cups(uuid,text,integer) to authenticated;
create or replace function public.cimbria_admin_members(p_action text,p_email text default null,p_role text default 'supervisor')
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_owner boolean;
begin
 select exists(select 1 from public.admin_users a join auth.users u on u.id=a.user_id
  where a.user_id=auth.uid() and a.role='admin' and a.active and u.email_confirmed_at is not null) into v_owner;
 if not v_owner then raise exception 'Nur Hauptadmins können Mitglieder verwalten';end if;
 if p_action='list' then
   return coalesce((select jsonb_agg(jsonb_build_object('email',a.email,'role',a.role,'enabled',a.enabled,
     'activated',exists(select 1 from auth.users u join public.admin_users ad on ad.user_id=u.id where lower(u.email)=a.email and ad.active)) order by a.email)
      from cimbria_private.admin_email_allowlist a),'[]'::jsonb);
 end if;
 if p_email is null or length(trim(p_email))<5 or position('@' in p_email)<2 then raise exception 'Ungültige E-Mail';end if;
 if lower(trim(p_email))='henner@desma.africa' and p_action='remove' then raise exception 'Hauptadmin kann nicht entfernt werden';end if;
 if p_action='add' then
  if p_role not in ('admin','supervisor') then raise exception 'Ungültige Rolle';end if;
  insert into cimbria_private.admin_email_allowlist(email,role,enabled)
   values(lower(trim(p_email)),p_role,true)
   on conflict(email) do update set role=excluded.role,enabled=true;
  update public.admin_users a set role=p_role,active=true from auth.users u
   where u.id=a.user_id and lower(u.email)=lower(trim(p_email)) and u.email_confirmed_at is not null;
  return jsonb_build_object('success',true);
 elsif p_action='remove' then
  update cimbria_private.admin_email_allowlist set enabled=false where email=lower(trim(p_email));
  update public.admin_users a set active=false from auth.users u
   where u.id=a.user_id and lower(u.email)=lower(trim(p_email));
  return jsonb_build_object('success',true);
 end if;
 raise exception 'Ungültige Aktion';
end$$;
revoke all on function public.cimbria_admin_members(text,text,text) from public,anon;
grant execute on function public.cimbria_admin_members(text,text,text) to authenticated;
