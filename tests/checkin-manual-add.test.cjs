const assert=require('node:assert/strict');
const fs=require('node:fs');
const js=fs.readFileSync('js/checkin.js','utf8');
const html=fs.readFileSync('checkin.html','utf8');
const css=fs.readFileSync('css/checkin.css','utf8');
const migrations=fs.readdirSync('supabase/migrations');
const migrationName=migrations.find(x=>x.includes('cimbria_checkin_test_badges_and_manual_guest_signup'));
assert(migrationName,"Missing check-in demo and registration migration");
const sql=fs.readFileSync('supabase/migrations/'+migrationName,'utf8');
assert(html.includes('id="ci-add-form"'),'Guest add form missing');
assert(html.includes('id="ci-add-name"'),'Guest name missing');
assert(html.includes('id="ci-add-contact"'),'Contact field missing');
assert(html.includes('id="ci-add-study"'),'Study program missing');
assert(html.includes('id="ci-add-overlay"'),'Guest modal missing');
assert(html.includes('id="ci-delete-tests"'),'Remove-demo control missing');
assert(html.includes('id="ci-show-tests"'),'Demo visibility switch missing');
assert(html.includes('id="ci-demo-count"'),'Separate demo tally missing');
assert(html.includes('checkin-2-20261031'),'Missing new browser cache key');
assert(js.includes('client.rpc("cimbria_checkin_add_guest"'),'Protected add RPC missing');
assert(js.includes('client.rpc("cimbria_checkin_clear_test_guests"'),'Safe demo cleanup missing');
assert(js.includes('state.guests.filter(x=>!x.is_test)'),'Real-only attendance totals missing');
assert(js.includes('state.guests.filter(x=>x.is_test)'),'Test totals missing');
assert(js.includes('state.showTests || !person.is_test'),'Show/hide test filter missing');
assert(js.includes("aria-label="),'Accessible check-in buttons missing');
assert(js.includes('ci-test-tag'),'Visible demo badges missing');
assert(js.includes('event:"*"'),'New registrations need to sync over Realtime');
assert(js.includes('.select("id,source_index,guest_name,contact_detail,study_program,is_test,checked_in,checked_in_at,updated_at")'),
  'Demo status must be fetched from DB');
assert(sql.includes('add column if not exists is_test boolean not null default false'),
  'Existing real guests must remain real');
assert(sql.includes('grant insert (source_index,guest_name,contact_detail,study_program)'),
  'Only carefully scoped admin inserts allowed');
assert(sql.includes('grant delete on public.cimbria_guest_checkin'),
  'Test cleanup needs DELETE grant');
assert(sql.includes('and is_test=true'),'Delete policy must exclude real guests');
assert(sql.includes('and is_test=false'),'Manual additions must not be demo');
assert(sql.includes('security invoker'),'Both RPCs must respect RLS');
assert(sql.includes('pg_advisory_xact_lock'),'Concurrent guest additions need locking');
assert(sql.includes('Nur berechtigte Cimbria-Admins'),'Server-side admin check missing');
assert(!sql.includes('Lena Winterfeld'),'Synthetic names must not appear in public migration');
const ids=[...js.matchAll(/els\("([a-z0-9-]+)"\)/g)].map(x=>x[1]);
const missing=[...new Set(ids)].filter(id=>!html.includes('id="'+id+'"'));
assert.deepEqual(missing,[],'Missing DOM references: '+missing.join(','));
assert(css.includes('.ci-demo-notice')&&css.includes('.ci-add-overlay'),'Demo and modal styles missing');
console.log("Check-in v2: demo separation, admin RPC, form, cleanup and mobile UI checks passed.");
