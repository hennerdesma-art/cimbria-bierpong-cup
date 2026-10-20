
do $$
declare ddl text;
begin
  select pg_get_functiondef('public.cimbria_admin_save_state(text,bigint,jsonb)'::regprocedure) into ddl;
  if position('v_match_count > 256' in ddl)>0 then
    ddl:=replace(ddl,'v_match_count > 256','v_match_count > 20000');
  elsif position('v_match_count>256' in ddl)>0 then
    ddl:=replace(ddl,'v_match_count>256','v_match_count>20000');
  else raise exception 'Original match limit not found; migration aborted'; end if;
  execute ddl;
end $$;
