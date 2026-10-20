
-- The public SECURITY INVOKER wrapper requires permission to call the
-- private SECURITY DEFINER procedure. The latter still verifies the
-- confirmed head-admin identity, confirmation phrase, and revision.
grant usage on schema cimbria_private to authenticated;
grant execute on function cimbria_private.cimbria_reset_tournament_secure(text,bigint,text)
 to authenticated;
