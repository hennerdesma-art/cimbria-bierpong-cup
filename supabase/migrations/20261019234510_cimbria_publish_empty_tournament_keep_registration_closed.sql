
-- Make the empty tournament visible to website visitors; keep registration
-- CLOSED until the verified administrator intentionally opens it.
update public.tournaments
set is_published=true, registration_open=false
where slug='cimbria-bierpong-cup' and is_published=false;
