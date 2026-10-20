/* Cimbria Cup V5 – public read-only cinematic broadcast display.
   Credentials: public publishable key only. No administrative session or writes. */
(function(){
"use strict";
var URL="https://cxjhlaavfsavokqflxti.supabase.co";
var KEY="sb_publishable_Z_beWnDCYEO4kBbZmq4Hxw_Q8D4fvt9";
var SLUG="cimbria-bierpong-cup";
var VALID=new Set(["crown","skull","flame","bolt","target","rocket","shield","star","anchor","dragon","cup","phoenix"]);
var ROUND=["ACHTELFINALE","VIERTELFINALE","HALBFINALE","FINALE"];
var $=function(id){return document.getElementById(id);};
function esc(v){return String(v==null?"":v).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c];});}
function iconPath(id){return "assets/team-icons/"+(VALID.has(id)?id:"crown")+".svg";}
function phaseLabel(p){return {"registration":"ANMELDUNG","groups":"GRUPPENPHASE","playoffs":"PLAYOFFS","finished":"FINALE BEENDET"}[p]||"CIMBRIA CUP";}
function matchRound(m){return m.stage==="group"?"GRUPPE "+(state.groupById[m.group_id]||"—"):m.stage==="tiebreak"?"ENTSCHEIDUNGSSPIEL":ROUND[m.round_no]||"PLAYOFFS";}
function setText(id,val){var e=$(id);if(e)e.textContent=val==null?"":String(val);}
function nowDate(){var d=new Date();setText("tv-clock",new Intl.DateTimeFormat("de-DE",{hour:"2-digit",minute:"2-digit"}).format(d));setText("tv-day",new Intl.DateTimeFormat("de-DE",{weekday:"short",day:"2-digit",month:"short"}).format(d).toUpperCase());}
var state={t:null,teams:[],matches:[],tables:[],groups:[],members:[],groupById:{},teamsById:{},tablesById:{}};
var client=null,channel=null,fetching=false,refreshSoon=null,sceneTimer=null,introClockTimer=null,lastSceneTime=Date.now(),lastCueId=0,started=false,sceneActive=false;
var connection=$("tv-connection");
var previewKind=new URLSearchParams(window.location.search).get("preview");
var previewDone=false;
function previewAnimation(){
 if(previewDone||!["intro","winner","bracket"].includes(previewKind))return;
 previewDone=true;
 var names=["Die Zirkelfreunde","Cup Kings","Flüssige Legenden","Beerpong Bandits",
  "Becherbuben","Tischkönige","Pongstars","Violett Victory","Raketencrew",
  "Die Nachzügler","Hauslegenden","Purple Shots","Die Drinkers",
  "Die Wilden","Cimbria United","Final Call"];
 var crests=["crown","skull","flame","bolt","target","rocket","shield","star",
  "anchor","dragon","cup","phoenix","crown","shield","flame","cup"];
 var previousTeams=state.teamsById,previousMatches=state.matches;
 var demoTeams=names.map(function(name,i){return {id:"preview-"+i,name:name,icon_id:crests[i]};});
 state.teamsById=Object.assign({},previousTeams,Object.fromEntries(demoTeams.map(function(t){return [t.id,t];})));
 var rounds=[];
 for(var round=0;round<4;round++){
   var count=8/Math.pow(2,round);
   for(var i=0;i<count;i++){
     var a=round===0?"preview-"+(i*2):round===1?"preview-"+(i*4):
            round===2?"preview-"+(i*8):"preview-0";
     var b=round===0?"preview-"+(i*2+1):round===1?"preview-"+(i*4+2):
            round===2?"preview-"+(i*8+4):"preview-8";
     rounds.push({id:"mock-"+round+"-"+i,stage:"playoff",round_no:round,
       bracket_position:i,team_a_id:a,team_b_id:b,
       winner_team_id:round<2?a:null,status:round<2?"done":"open"});
   }
 }
 var fake={id:"demo-spotlight",stage:"playoff",round_no:2,team_a_id:"preview-0",
  team_b_id:"preview-2",winner_team_id:"preview-0",table_id:null,played_table_id:null};
 if(previewKind==="bracket")state.matches=rounds;
 showScene(previewKind,previewKind==="bracket"?null:fake,previewKind==="bracket"?16000:11000);
 state.matches=previousMatches;
 // Team logos/names are already rendered into the preview. Live refresh remains untouched.
 state.teamsById=previousTeams;
}

function connectionStatus(s,err){
 if(!connection)return;
 connection.className="tv-connection"+(err?" error":s==="VERBUNDEN"?" ok":"");
 connection.textContent=s;
}
function teamById(id){return state.teamsById[id]||{name:"NOCH OFFEN",icon_id:"shield"};}
function tableById(id){return state.tablesById[id]||null;}
function teamBadge(id){var t=teamById(id);return '<img alt="" loading="lazy" src="'+iconPath(t.icon_id)+'"><span class="team-text">'+esc(t.name)+'</span>';}
function relevantMatch(m){return !!(m.team_a_id&&m.team_b_id);}
function mainMatch(){
 var matches=state.matches;
 var designated=matches.find(function(m){return m.id===state.t?.tv_main_match_id && relevantMatch(m);});
 if(designated && designated.status!=="done")return designated;
 return matches.find(function(m){return m.status==="live" && relevantMatch(m);}) ||
        matches.find(function(m){return m.status==="ready" && relevantMatch(m);}) ||
        null;
}
function renderHero(){
 var m=mainMatch(),isLive=!!(m&&m.status==="live");
 setText("tv-phase",phaseLabel(state.t?.phase));
 setText("tv-counter",state.teams.length+" TEAMS · "+state.matches.filter(function(x){return x.status==="done";}).length+" SPIELE BEENDET");
 if(!m){
   $("tv-main-title").innerHTML="CIMBRIA <em>BEERPONG CUP</em>";
   setText("tv-main-subtitle",state.t?.phase==="registration"?"DIE TEAMS MELDEN SICH AN. DER COUNTDOWN LÄUFT.":"DER NÄCHSTE SHOWDOWN KOMMT.");
   $("tv-main-title").innerHTML="CIMBRIA <em>BEERPONG CUP</em>";
   setText("tv-main-state","MAIN STAGE");
   setText("tv-match-state","MAIN STAGE");
   setText("tv-match-table","BEREIT FÜR DAS TURNIER");
   setText("tv-team-a","DEIN TEAM");setText("tv-team-b","DEINE GEGNER");
   $("tv-team-a-img").src=iconPath("crown");$("tv-team-b-img").src=iconPath("skull");
   setText("tv-cups-a","—");setText("tv-cups-b","—");
   setText("tv-match-context","ACHT GRUPPEN · EIN POKAL · EIN CHAMPION");
   return;
 }
 var a=teamById(m.team_a_id),b=teamById(m.team_b_id),table=tableById(m.table_id||m.played_table_id);
 $("tv-main-title").innerHTML="MAIN <em>STAGE</em>";
 setText("tv-main-subtitle",isLive?"DAS DUELL LÄUFT – JEDER BECHER ZÄHLT.":"DAS NÄCHSTE DUELL IST BEREIT.");
 setText("tv-match-state",isLive?"GERADE LIVE":"NÄCHSTES SPIEL");
 setText("tv-match-table",table?table.name.toUpperCase():"MAIN STAGE");
 setText("tv-team-a",a.name);setText("tv-team-b",b.name);
 $("tv-team-a-img").src=iconPath(a.icon_id);$("tv-team-b-img").src=iconPath(b.icon_id);
 setText("tv-cups-a",isLive?(m.cups_a==null?10:m.cups_a)+" BECHER":"BEREIT");
 setText("tv-cups-b",isLive?(m.cups_b==null?10:m.cups_b)+" BECHER":"BEREIT");
 setText("tv-match-context",matchRound(m)+" · "+(table?table.name.toUpperCase():"MAIN STAGE"));
}
function renderTables(){
 setText("tv-table-count",state.tables.filter(function(t){return t.active;}).length+" AKTIV");
 var markup=state.tables.slice(0,10).map(function(t){
  var m=state.matches.find(function(m){return m.table_id===t.id && (m.status==="ready"||m.status==="live");});
  var isMain=!!(m&&m.id===state.t?.tv_main_match_id);
  var game=m?teamById(m.team_a_id).name+" vs. "+teamById(m.team_b_id).name:"";
  var txt=!t.active?"INAKTIV":m?(m.status==="live"?"LIVE":"BEREIT"):"FREI";
  return '<div class="tv-table-line'+(isMain?' is-main':'')+'"><span class="table-name">'+esc(t.name)+'</span><span class="table-game">'+esc(game||"Kein Spiel zugewiesen")+'</span><span class="table-status'+(m?.status==="live"?" live":"")+'">'+txt+'</span></div>';
 }).join("");
 $("tv-tables").innerHTML=markup||'<div class="tv-empty">Die Tischliste wird vorbereitet.</div>';
}
function renderUpcoming(){
 var coming=state.matches.filter(function(m){return relevantMatch(m)&&(m.status==="ready"||m.status==="open");}).sort(function(a,b){
  return (a.status==="ready"?0:1)-(b.status==="ready"?0:1)||(a.order_index||0)-(b.order_index||0);
 }).slice(0,4);
 $("tv-upcoming").innerHTML=coming.map(function(m){
  var table=tableById(m.table_id);
  return '<div class="tv-next-line"><strong>'+esc(teamById(m.team_a_id).name)+' <span style="color:#dbb373">VS</span> '+esc(teamById(m.team_b_id).name)+'</strong><small>'+esc(table?.name||matchRound(m))+'</small></div>';
 }).join("")||'<div class="tv-empty">Der Spielplan folgt nach der Gruppenauslosung.</div>';
}
function groupStats(group){
 var groupTeams=state.members.filter(function(x){return x.group_id===group.id;}).map(function(x){return x.team_id;});
 return groupTeams.map(function(id){
   var plays=state.matches.filter(function(m){return m.group_id===group.id&&m.stage==="group"&&m.status==="done"&&(m.team_a_id===id||m.team_b_id===id);});
   return {id:id,w:plays.filter(function(m){return m.winner_team_id===id;}).length,l:plays.filter(function(m){return m.winner_team_id!==id;}).length};
 }).sort(function(a,b){return b.w-a.w||a.l-b.l||teamById(a.id).name.localeCompare(teamById(b.id).name,"de");});
}
function renderGroups(){
 var list=state.groups.slice(0,4);
 $("tv-groups").innerHTML=list.map(function(g){
  var ranking=groupStats(g).slice(0,4);
  return '<div class="tv-group"><div class="tv-group-head"><span>GRUPPE '+esc(g.code)+'</span><span>S / N</span></div>'+
    (ranking.map(function(row){return '<div class="tv-group-row"><span>'+esc(teamById(row.id).name)+'</span><b>'+row.w+' / '+row.l+'</b></div>';}).join("")||'<div class="tv-empty" style="padding:9px 0">Noch nicht ausgelost</div>')+'</div>';
 }).join("");
}
function renderTeaser(){
 var done=state.matches.filter(function(m){return m.stage==="playoff"&&m.status==="done";}).length;
 var other=state.matches.filter(function(m){return m.stage==="playoff";}).length;
 var champ=state.matches.find(function(m){return m.stage==="playoff"&&m.round_no===3&&m.status==="done";});
 $("tv-bracket-teaser").innerHTML='<div class="tv-bracket-step"><span>'+other+'</span><small>PLAYOFF-SPIELE</small></div>'+
    '<div class="tv-bracket-step"><span>'+done+'</span><small>ENTSCHIEDEN</small></div>'+
    '<div class="tv-bracket-step"><span>★</span><small>'+esc(champ?teamById(champ.winner_team_id).name:"DER TITEL WARTET")+'</small></div>';
}
function renderAll(){
 if(!state.t)return;
 renderHero();renderTables();renderUpcoming();renderGroups();renderTeaser();
 setText("tv-ticker-message",state.t.phase==="registration"?"DIE ANMELDUNG IST "+(state.t.registration_open?"GEÖFFNET":"NOCH GESCHLOSSEN")+" · DAS TURNIER BEGINNT BALD":
 "STARKE TEAMS · LEGENDÄRE SPIELE · JEDER BECHER ZÄHLT");
}
function bracketHtml(){
 var rounds=[0,1,2,3],playoffs=state.matches.filter(function(m){return m.stage==="playoff";});
 return rounds.map(function(r){
  var ms=playoffs.filter(function(m){return m.round_no===r;}).sort(function(a,b){return a.bracket_position-b.bracket_position;});
  return '<div class="bracket-round"><div class="bracket-round-title">'+ROUND[r]+'</div>'+
  (ms.length?ms.map(function(m,i){
    return '<div class="bracket-match" style="--i:'+i+'"><div class="bracket-team'+(m.winner_team_id===m.team_a_id?' winner':'')+'">'+teamBadge(m.team_a_id)+(m.winner_team_id===m.team_a_id?'<span class="win-spark">★</span>':'')+'</div>'+
      '<div class="bracket-team'+(m.winner_team_id===m.team_b_id?' winner':'')+'">'+teamBadge(m.team_b_id)+(m.winner_team_id===m.team_b_id?'<span class="win-spark">★</span>':'')+'</div></div>';
  }).join(""):'<div class="bracket-match"><div class="bracket-team">NOCH OFFEN</div><div class="bracket-team">AUSLOSUNG FOLGT</div></div>')+'</div>';
 }).join("");
}
function closeScene(){
 if(sceneTimer)clearTimeout(sceneTimer);
 if(introClockTimer)clearInterval(introClockTimer);
 introClockTimer=null;
 sceneTimer=null;sceneActive=false;
 var root=$("tv-scene");root.classList.remove("on");root.setAttribute("aria-hidden","true");root.removeAttribute("data-kind");
}
function showScene(kind,match,duration){
 if(kind==="clear"){closeScene();return;}
 if(!["intro","winner","bracket"].includes(kind))return;
 duration=Number(duration)||9000;
 if(kind!=="bracket"&&!match)return;
 if(sceneTimer)clearTimeout(sceneTimer);
 if(introClockTimer)clearInterval(introClockTimer);
 introClockTimer=null;
 sceneTimer=null;
 var root=$("tv-scene");
 root.classList.remove("on");
 root.dataset.kind=kind;
 root.style.setProperty("--cue-duration",duration+"ms");
 root.setAttribute("aria-hidden","false");
 if(kind==="intro"){
   var a=teamById(match.team_a_id),b=teamById(match.team_b_id),table=tableById(match.table_id||match.played_table_id);
   setText("scene-intro-a",a.name);setText("scene-intro-b",b.name);
   $("scene-intro-a-icon").src=iconPath(a.icon_id);$("scene-intro-b-icon").src=iconPath(b.icon_id);
   setText("scene-intro-context",matchRound(match)+" · "+(table?table.name.toUpperCase():"MAIN STAGE"));
   var introStart=Date.now();
   setText("scene-countdown-value",Math.ceil(duration/1000));
   introClockTimer=setInterval(function(){
     setText("scene-countdown-value",Math.max(0,Math.ceil((duration-(Date.now()-introStart))/1000)));
   },200);
 }else if(kind==="winner"){
   var win=teamById(match.winner_team_id),t=tableById(match.played_table_id||match.table_id);
   setText("scene-winner-name",win.name);
   $("scene-winner-icon").src=iconPath(win.icon_id);
   setText("scene-win-context",matchRound(match)+(t?" · "+t.name.toUpperCase():"")+
     (match.stage==="playoff"&&match.round_no<3?" · AUFSTIEG IN DIE NÄCHSTE RUNDE":""));
 }else{
   $("scene-bracket-grid").innerHTML=bracketHtml();
 }
 // Restart all CSS animations on successive TV cues.
 void root.offsetWidth;root.classList.add("on");
 lastSceneTime=Date.now();sceneActive=true;
 sceneTimer=setTimeout(closeScene,duration);
}
function showCue(cue){
 if(!cue||cue.id<=lastCueId)return;
 lastCueId=cue.id;
 var age=Date.now()-Date.parse(cue.created_at);
 if(age<0||age>Math.max(3500,cue.duration_ms+3000))return;
 var match=state.matches.find(function(m){return m.id===cue.match_id;})||null;
 showScene(cue.kind,match,cue.duration_ms);
}
async function checkCue(){
 if(!state.t||!client)return;
 var r=await client.from("tv_cues").select("id,kind,match_id,duration_ms,created_at")
   .eq("tournament_id",state.t.id).order("id",{ascending:false}).limit(1);
 if(r.error)throw r.error;
 if(r.data&&r.data[0])showCue(r.data[0]);
}
async function refresh(){
 if(fetching||!client)return;
 fetching=true;
 try {
   var tr=await client.from("tournaments").select(
     "id,slug,phase,is_published,registration_open,tv_main_match_id,tv_auto_intros,tv_auto_wins,tv_rotate_bracket")
     .eq("slug",SLUG).maybeSingle();
   if(tr.error)throw tr.error;
   if(!tr.data){connectionStatus("DIE TV-DATEN SIND NOCH NICHT FREIGEGEBEN.",true);return;}
   var t=tr.data;
   var responses=await Promise.all([
     client.from("teams").select("id,name,icon_id").eq("tournament_id",t.id).limit(600),
     client.from("matches").select("id,tournament_id,group_id,stage,round_no,bracket_position,order_index,team_a_id,team_b_id,winner_team_id,status,table_id,played_table_id,cups_a,cups_b").eq("tournament_id",t.id).limit(20000),
     client.from("game_tables").select("id,name,active,sort_order").eq("tournament_id",t.id).order("sort_order"),
     client.from("groups").select("id,code,sort_order").eq("tournament_id",t.id).order("sort_order"),
     client.from("group_members").select("group_id,team_id").eq("tournament_id",t.id).limit(600),
   ]);
   for(var i=0;i<responses.length;i++){if(responses[i].error)throw responses[i].error;}
   state.t=t;state.teams=responses[0].data||[];state.matches=responses[1].data||[];
   state.tables=responses[2].data||[];state.groups=responses[3].data||[];
   state.members=responses[4].data||[];
   state.teamsById=Object.fromEntries(state.teams.map(function(x){return [x.id,x];}));
   state.tablesById=Object.fromEntries(state.tables.map(function(x){return [x.id,x];}));
   state.groupById=Object.fromEntries(state.groups.map(function(x){return [x.id,x.code];}));
   renderAll();connectionStatus("VERBUNDEN",false);
   if(previewKind&&!previewDone)previewAnimation();
   else await checkCue();
 }catch(err){
   console.warn("TV-Synchronisation:",err);
   connectionStatus("VERBINDUNG UNTERBROCHEN – ERNEUTER VERSUCH",true);
 }finally{fetching=false;}
}
function queueRefresh(){
 if(refreshSoon)clearTimeout(refreshSoon);
 refreshSoon=setTimeout(function(){refreshSoon=null;refresh();},350);
}
function subscribe(){
 if(channel){client.removeChannel(channel);channel=null;}
 var tables=["tournaments","matches","teams","game_tables","groups","group_members","tv_cues"];
 channel=client.channel("cimbria-tv-live");
 tables.forEach(function(table){
  channel.on("postgres_changes",{event:"*",schema:"public",table:table},queueRefresh);
 });
 channel.subscribe();
}
function renderConfetti(){
 var el=$("scene-confetti");var colors=["#ffe3a4","#e4b66a","#f06a85","#fff2d7","#aa5bb5"];
 var bits=[];
 for(var i=0;i<60;i++){
   var speed=4+(i%9)*.42,delay=-1*(i%12)*.42,x=(i*37)%97,drift=((i*17)%80-40);
   bits.push('<i style="--x:'+x+'%;--size:'+(6+i%6)+'px;--color:'+colors[i%colors.length]+';--speed:'+speed+'s;--delay:'+delay+'s;--drift:'+drift+'px;--rotation:'+(i*32)+'deg"></i>');
 }
 el.innerHTML=bits.join("");
}
function autoBracket(){
 if(!state.t||!state.t.tv_rotate_bracket||state.t.phase!=="playoffs"||sceneActive)return;
 if(Date.now()-lastSceneTime>=82000){
   showScene("bracket",null,15000);
 }
}
function start(){
 if(!window.supabase?.createClient){connectionStatus("SUPABASE KANN NICHT GELADEN WERDEN",true);return;}
 if(started)return;started=true;
 client=window.supabase.createClient(URL,KEY,{
   auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}
 });
 nowDate();setInterval(nowDate,20000);
 renderConfetti();
 var vid=$("tv-background");
 function videoState(){if(document.hidden||window.matchMedia("(prefers-reduced-motion: reduce)").matches)vid.pause();else vid.play().catch(function(){});}
 document.addEventListener("visibilitychange",function(){videoState();if(!document.hidden)queueRefresh();});
 videoState();
 document.addEventListener("keydown",function(e){
   if(e.key==="f"||e.key==="F"){if(document.fullscreenElement)document.exitFullscreen();else document.documentElement.requestFullscreen?.().catch(function(){});}
   if(e.key==="Escape")closeScene();
 });
 subscribe();
 refresh();
 setInterval(function(){if(!document.hidden)refresh();},12000);
 setInterval(autoBracket,5000);
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start);else start();
})();