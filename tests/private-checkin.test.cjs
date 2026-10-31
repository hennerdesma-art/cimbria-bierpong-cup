const assert=require('node:assert/strict');
const fs=require('node:fs');
const source=fs.readFileSync('js/checkin.js','utf8');
const html=fs.readFileSync('checkin.html','utf8');
const css=fs.readFileSync('css/checkin.css','utf8');
const app=fs.readFileSync('js/app.js','utf8');
const migrations=fs.readdirSync('supabase/migrations');
const name=migrations.find(x=>x.includes('cimbria_private_guest_attendance_checkin'));
assert(name,'Private guest attendance migration is missing');
const schema=fs.readFileSync('supabase/migrations/'+name,'utf8');
assert(app.includes('href="checkin.html"'),'Admin dashboard link is missing');
assert(html.includes('name="robots" content="noindex'),'Private page should not be indexed');
assert(html.includes('id="ci-auth"')&&html.includes('id="ci-dashboard" hidden'),
  'Initial guest list must be hidden until authenticated');
assert(html.includes('ci-login-form'),'Admin login form missing');
assert(source.includes('storageKey: STORAGE_KEY'),'Same Supabase admin login storage must be reused');
assert(source.includes('admin_users'),'Existing admin role verification missing');
assert(source.includes('cimbria_guest_checkin'),'Private Supabase table not queried');
assert(source.includes('.eq("checked_in",prev)'),'Concurrent edits must use compare-and-swap');
assert(source.includes('checked_in_at'),'Check-in timestamp missing');
assert(source.includes('8000'),'Background sync not configured');
assert(source.includes('aria-pressed=')&&source.includes('role="listitem"'),
  'Accessible check-in buttons required');
assert(schema.includes('enable row level security'),'Guest data must be RLS-protected');
assert(schema.includes('grant update (checked_in)'),'Only attendance state may be changed');
assert(schema.includes('revoke all on public.cimbria_guest_checkin from public, anon, authenticated'),
  'Unexpected public grants');
assert(schema.includes('cimbria_private.is_cimbria_admin()'),'Server-side admin guard missing');
assert(schema.includes('cimbria_checkin_audit'),'Attendance update log missing');
assert(!schema.includes('insert into public.cimbria_guest_checkin'),'Private guest names must not be in public migrations');
const ids=[...source.matchAll(/els\("([a-z0-9-]+)"\)/g)].map(m=>m[1]);
const missing=[...new Set(ids)].filter(id=>!html.includes('id="'+id+'"'));
assert.deepEqual(missing,[],'Missing page nodes '+missing);
assert(css.includes('.ci-person-check'),'Touch-friendly row control styles missing');
assert(css.includes('@media(max-width:670px)'),'Mobile layout missing');
console.log('Private check-in: auth, data isolation, RLS, DOM and mobile UX checks passed.');
