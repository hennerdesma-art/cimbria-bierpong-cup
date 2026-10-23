// Regression tests for missed TV intros/winner scenes during delayed or unstable connectivity.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const script = fs.readFileSync('js/tv.js','utf8');
const tvPage = fs.readFileSync('tv.html','utf8');
const start = script.indexOf('function shouldApplyCue(');
const end = script.indexOf('function showCue(',start);
assert(start>0&&end>start,'Cue decision function must exist in TV script');
const sandbox = {};
vm.runInNewContext(script.slice(start,end)+'\nthis.shouldApplyCue = shouldApplyCue;', sandbox);
const accept=sandbox.shouldApplyCue;
assert.equal(typeof accept,'function');

const current=new Date(Date.now()-4000).toISOString();
const stale=new Date(Date.now()-5*60*1000).toISOString();
const unexpectedFuture=new Date(Date.now()+90*1000).toISOString();
const cue=(id,kind,created_at)=>({id,kind,created_at,duration_ms:10000});

// Fresh TV starts with a recent intro; later TV starts must not replay stale history.
assert.equal(accept(cue(12,'intro',current),0,false),true,'Recent intro on initial load');
assert.equal(accept(cue(12,'intro',stale),0,false),false,'Do not replay old intro on TV startup');
assert.equal(accept(cue(12,'clear',current),0,false),false,'Do not replay clear on startup');
// User opens a live TV while there is an active rules dispute.
assert.equal(accept(cue(12,'rules',stale),0,false),true,'Rules persist across TV reloads');
// After first poll, the ID is authoritative: internet delay or device clock skew must not drop cues.
assert.equal(accept(cue(13,'intro',stale),12,true),true,'Delayed new intro must play');
assert.equal(accept(cue(13,'winner',unexpectedFuture),12,true),true,'Clock skew must not drop winner');
assert.equal(accept(cue(13,'bracket',stale),12,true),true,'Delayed new bracket must play');
assert.equal(accept(cue(13,'clear',stale),12,true),true,'Clear must always work');
assert.equal(accept(cue(12,'intro',current),12,true),false,'Duplicate event must be ignored');

assert(script.includes('if(previewKind&&previewDone&&previewKind!=="rules")'),
  'Normal previews must leave isolated preview mode');
assert(script.includes('previewKind=null;'),'Preview must return to actual live TV');
assert(script.includes('},2500);'),'Fast, independent cue polling is necessary');
assert(script.includes('if(fetching){refreshAgain=true;return;}'),
  'Do not lose updates while network refresh is in flight');
assert(script.includes('if((cue.kind==="intro"||cue.kind==="winner")&&!match)'),
  'Match state must be available before playing an intro/win');
assert(!script.includes('Math.max(3500,cue.duration_ms+3000)'),
  'Old clock-dependent expiration gate must stay removed');
assert(tvPage.includes('id="tv-preview-alert"'),'Preview must be visibly labeled');
assert(tvPage.includes('live-cues-fix-20261023'),'Bust old TV JS/CSS browser caches');

console.log('TV-cue reliability and preview recovery checks passed.');
