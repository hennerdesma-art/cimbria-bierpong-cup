const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const js=fs.readFileSync('js/checkin.js','utf8');
const html=fs.readFileSync('checkin.html','utf8');
const css=fs.readFileSync('css/checkin.css','utf8');
const migrationName=fs.readdirSync('supabase/migrations').find(x=>x.includes('cimbria_checkin_test_badges_and_manual_guest_signup'));
assert(migrationName,'Migration to safely identify demo data is missing');
const sql=fs.readFileSync('supabase/migrations/'+migrationName,'utf8');

// Everything looks and behaves as one list: no demo badges, banners, filters or removal UI.
for(const id of ['ci-demo-notice','ci-show-tests','ci-delete-tests','ci-demo-count']){
  assert(!html.includes(id),'Demo-only UI must be removed: '+id);
  assert(!js.includes('els("'+id+'")'),'Removed demo UI must have no JavaScript references: '+id);
}
assert(!html.includes('TEST'),'No visible demo labels or warnings');
assert(!js.includes('ci-test-tag'),'Guest-card demo badges must be removed');
assert(!css.includes('.ci-test-tag')&&!css.includes('.ci-demo-notice'),'No special demo styling');
assert(!js.includes('state.showTests'),'Guests may not be filtered out by demo state');
assert(js.includes('const total=state.guests.length;'),'KPI total must include all 82 guests');
assert(js.includes('const present=state.guests.filter(x=>x.checked_in).length;'),
  'KPI present must include all guest check-ins');
assert(js.includes('rows.length+" Personen"'),'List count should not distinguish demo entries');
assert(html.includes('Personen angekommen')&&html.includes('Personen ausstehend'),
  'Statistics must not describe only real guests');

// Last-minute admin registration remains fully functional and private.
for(const id of ['ci-add-form','ci-add-name','ci-add-contact','ci-add-study','ci-add-overlay']){
  assert(html.includes('id="'+id+'"'),"Missing add-guest control: "+id);
}
assert(js.includes('client.rpc("cimbria_checkin_add_guest"'),'Server-side guest-add RPC missing');
assert(js.includes('cimbria_guest_checkin'),'Supabase guest source missing');
assert(js.includes('event:"*"'),'Guest list must receive Realtime changes');
assert(sql.includes('and is_test=true'),'Later cleanup must still target only synthetic records');
assert(sql.includes('and is_test=false'),'New registrations remain genuine entries');
assert(sql.includes('security invoker'),'Admin RPCs must retain RLS');

// Actually execute the count-rendering function with one original guest
// and one fake guest. Both must affect the same summary statistics.
const start=js.indexOf('  function render() {');
const end=js.indexOf('\n  async function toggleGuest(',start);
assert(start>=0&&end>start,'Render function cannot be isolated');
const byId=new Map();
const element=id=>{
  if(!byId.has(id))byId.set(id,{textContent:'',style:{},innerHTML:'',hidden:false,
    setAttribute(name,value){this[name]=value}});
  return byId.get(id);
};
const testGuests=[
  {id:'a',guest_name:'Beispiel A',is_test:false,checked_in:false},
  {id:'b',guest_name:'Beispiel B',is_test:true,checked_in:true},
];
const context={
  state:{allowed:true,guests:testGuests,activeFilter:'all'},
  els:element,document:{querySelectorAll:()=>[]},
  filteredGuests:()=>testGuests,
  personMarkup:()=>'<div class="person"></div>'
};
vm.runInNewContext(js.slice(start,end)+'\nthis.renderForTest=render;',context);
context.renderForTest();
assert.equal(element('ci-total-count').textContent,'2');
assert.equal(element('ci-present-count').textContent,'1');
assert.equal(element('ci-open-count').textContent,'1');
assert.equal(element('ci-percent-count').textContent,'50 %');
assert.equal(element('ci-filter-total').textContent,'2');
assert.equal(element('ci-filter-present').textContent,'1');
assert.equal(element('ci-match-count').textContent,'2 Personen');
assert(html.includes('checkin-unified-3-20261031'),'Cache-busted asset URLs missing');
console.log('Unified check-in UI and statistics, private demo cleanup, and admin add: passed.');
