-- Read-only television overlay for disputes; no match/result changes.
alter table public.tv_cues drop constraint tv_cues_kind_check;
alter table public.tv_cues add constraint tv_cues_kind_check
 check(kind in ('intro','winner','bracket','clear','rules'));
CREATE OR REPLACE FUNCTION public.cimbria_tv_control(p_action text, p_match uuid DEFAULT NULL::uuid, p_value boolean DEFAULT NULL::boolean)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
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
 elsif p_action='rules' then v_kind='rules';v_duration=30000;
 elsif p_action='clear' then v_kind='clear';v_duration=1000;
 else raise exception 'Unbekannte TV-Aktion';end if;
 insert into public.tv_cues(tournament_id,match_id,kind,duration_ms,source)
 values(v_t.id,p_match,v_kind,v_duration,'manual')
 returning id into v_id;
 return jsonb_build_object('success',true,'cue_id',v_id,'kind',v_kind);
end;
$function$
;