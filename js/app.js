/*
 * Cimbria Cup – lokal lauffaehiger Website-Prototyp.
 * Kein produktives Backend; alle Daten liegen im Browser-localStorage.
 * Wichtig: Admin-Zugriff ist in dieser Demo NICHT authentifiziert.
 */
(() => {
  'use strict';
  const CLOUD = window.CimbriaCloud;
  if (!CLOUD || CLOUD.broken) {
    document.getElementById('app').innerHTML =
      '<main style="max-width:620px;margin:15vh auto;padding:24px;color:#fff;text-align:center">' +
      '<h1>Cimbria Cup</h1><p>Die sichere Verbindung zum Turniersystem konnte nicht geladen werden. Bitte aktualisiere die Seite.</p></main>';
    return;
  }

  const VERSION = 3;
  const STORE_KEY = 'cimbria-cup-design-v2-demo';
  const GROUPS = ['A','B','C','D','E','F','G','H'];
  const MAX_TEAMS = () => state.maxTeams || 32;
  const MIN_TEAMS = () => state.minTeams || 16;
  const DEMO_NAMES = [
    'Zirkelfreunde','BierBuddies','Pongstars','Cup Kings',
    'Goldene Becher','The Last Cups','Cimbria Titans','Team Feierabend',
    'Bieronauten','House Legends','Pong & Glory','Becherbande',
    'Tischkönige','Violett Victory','Bordeaux Boys','Die Nachzügler',
    'Doppelwurf','Cups of Gold','Drei gewinnt','Der Zirkel',
    'Royal Pongs','Purple Shots','Cimbria United','Final Call'
  ];
  const PATHS = {
    home:'<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V10Z"/><path d="M9 21v-8h6v8"/>',
    users:'<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
    calendar:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/>',
    trophy:'<path d="M8 21h8m-4-4v4M7 3h10v7a5 5 0 0 1-10 0V3ZM7 5H4v3a4 4 0 0 0 4 4M17 5h3v3a4 4 0 0 1-4 4"/>',
    shield:'<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="m9 12 2 2 4-4"/>',
    arrow:'<path d="M5 12h14m-6-6 6 6-6 6"/>',
    chevron:'<path d="m9 18 6-6-6-6"/>',
    plus:'<path d="M12 5v14M5 12h14"/>',
    minus:'<path d="M5 12h14"/>',
    close:'<path d="M18 6 6 18M6 6l12 12"/>',
    menu:'<path d="M4 7h16M4 12h16M4 17h16"/>',
    cup:'<path d="M5 5h14l-1.4 14H6.4L5 5ZM4 5h16M9 22h6"/>',
    clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    spark:'<path d="m12 2 2.1 7.9L22 12l-7.9 2.1L12 22l-2.1-7.9L2 12l7.9-2.1L12 2Z"/>',
    check:'<path d="m5 12 4 4L19 6"/>',
    info:'<circle cx="12" cy="12" r="9"/><path d="M12 10v6m0-9h.01"/>',
    search:'<circle cx="10.7" cy="10.7" r="7"/><path d="m16 16 5 5"/>',
    shuffle:'<path d="m18 14 4 4-4 4m-1-4h1a5 5 0 0 0 4-2M2 5h3a5 5 0 0 1 4 2l6 10a5 5 0 0 0 4 2h3M18 2l4 4-4 4m4-4h-3a5 5 0 0 0-4 2l-2 3M2 19h3a5 5 0 0 0 4-2l2-3"/>',
    table:'<path d="M3 7h18v3H3zM5 10v11m14-11v11"/>',
    play:'<path d="m8 5 11 7-11 7V5Z"/>',
    pause:'<path d="M8 5v14M16 5v14"/>',
    edit:'<path d="m4 17-.7 4 4-.7L20 7.6 16.4 4 4 17ZM14.5 5.5l4 4"/>',
    rotate:'<path d="M3 12a9 9 0 1 0 3-6.7L3 8m0-5v5h5"/>',
    lock:'<rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
    flag:'<path d="M4 22V4m0 1c4-3 8 3 12 0v12c-4 3-8-3-12 0"/>',
    settings:'<path d="M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Zm0-6v3m0 14v3M4.9 4.9l2.1 2.1m10 10 2.1 2.1M2 12h3m14 0h3M4.9 19.1 7 17m10-10 2.1-2.1"/>',
    alert:'<path d="m12 3 10 18H2L12 3Zm0 7v4m0 3h.01"/>',
    crown:'<path d="M2 8 7 13l5-9 5 9 5-5-2 12H4L2 8Zm2 15h16"/>',
    grid:'<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
    radio:'<path d="M5 16a8 8 0 0 1 0-8m4 4a3 3 0 1 1 6 0m4-4a8 8 0 0 1 0 8"/><circle cx="12" cy="12" r="1"/>',
    mail:'<rect x="2" y="5" width="20" height="14" rx="2"/><path d="m3 7 9 7 9-7"/>'
  };

  const icon = (name, cls = '') => `<svg class="icon ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${PATHS[name] || PATHS.info}</svg>`;
  const escape = (value) => String(value == null ? '' : value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const teamById = id => state.teams.find(t => t.id === id);
  const teamLabel = id => id ? (teamById(id)?.name || 'Unbekanntes Team') : 'Noch offen';
  const teamMarkup = id => escape(teamLabel(id));
  const initials = name => name.split(/\s+/).map(x => x.charAt(0)).slice(0,2).join('').toUpperCase();
  const int = value => Number.isFinite(Number(value)) ? Number(value) : 0;
  const timeString = timestamp => timestamp ? new Date(timestamp).toLocaleTimeString('de-DE', {hour:'2-digit',minute:'2-digit'}) : '';
  const groupName = value => `Gruppe ${value}`;
  const matchTitle = m => `${teamLabel(m.teamAId)} vs. ${teamLabel(m.teamBId)}`;
  const groupMatches = () => state.matches.filter(m => m.type === 'group');
  const allMatches = () => state.matches.concat(state.playoffMatches);
  const getMatch = id => allMatches().find(m => m.id === id);
  const statusLabel = status => ({open:'Offen',ready:'Bereit',live:'Läuft',done:'Abgeschlossen'})[status] || 'Unbekannt';
  const matchBadge = m => m.status === 'live' ? `<span class="badge green"><span class="pulse"></span> LIVE</span>` : m.status === 'done' ? `<span class="badge gold">${icon('check')} Beendet</span>` : m.status === 'ready' ? '<span class="badge violet">Bereit</span>' : '<span class="badge">Offen</span>';

  function seedData(){
    const teams = DEMO_NAMES.map((name,index) => ({
      id: `team-${index + 1}`, name,
      players: [`Spieler ${index+1}A`, `Spieler ${index+1}B`],
      createdAt: Date.now() - (24-index)*60000
    }));
    return {
      version: VERSION,
      phase: 'registration',
      registrationOpen: true,
      teams,
      groups: [],
      matches: [],
      playoffMatches: [],
      tables: Array.from({length:4},(_,i)=>({id:`table-${i+1}`,name:`Tisch ${i+1}`,active:true})),
      log: [{id:'log-seed',time:Date.now(),text:'Demo-Turnier angelegt · 24 Beispielteams registriert.'}]
    };
  }
  function load(){
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (!raw) return seedData();
      const parsed = JSON.parse(raw);
      if (parsed?.version === VERSION && Array.isArray(parsed.teams) && Array.isArray(parsed.matches) && Array.isArray(parsed.tables)) return parsed;
    } catch(err) { console.warn('Lokale Demo-Daten konnten nicht geladen werden:',err); }
    return seedData();
  }
  // Never expose local demo teams as genuine live registrations.
  let state = {version:VERSION,phase:'registration',registrationOpen:false,isPublished:false,
    teams:[],groups:[],matches:[],playoffMatches:[],tables:[],log:[],revision:0,maxTeams:32,minTeams:16};
  let ui = {
    page: 'home', mobileMenu:false, adminTab:'tables', liveFilter:'all', liveGroup:'A',
    saving:false, cloudLoading:true, authSent:false, authEmail:'Henner@desma.africa',signupOpen:false,adminMembers:[],
    liveSearch:'', liveExpanded:false, teamSearch:'', selections:{}, registration:{teamName:'',players:['','']}, toast:null
  };
  function persist(){ /* Live state is persisted in Supabase, never in localStorage. */ }
  let toastTimeout = null;
  function notify(message,error=false){
    ui.toast={message,error};
    clearTimeout(toastTimeout);
    render();
    toastTimeout=setTimeout(()=>{ui.toast=null;render();},4200);
  }
  function logAction(text){
    state.log.unshift({id:`log-${Date.now()}-${Math.random().toString(16).slice(2,5)}`,time:Date.now(),text});
    state.log=state.log.slice(0,35);
  }
  function commit(message,error=false){
    if (ui.saving) return;
    ui.saving=true;
    render();
    CLOUD.save(state).then(next=>{
      state=next;
      ui.saving=false;
      notify(message,error);
    }).catch(async err=>{
      ui.saving=false;
      try { state=await CLOUD.reload(); } catch(loadError){ console.warn(loadError); }
      notify('Nicht gespeichert: '+err.message,true);
    });
  }
  const navItems = [
    {key:'home',label:'Home',icon:'home'},
    {key:'live',label:'Live',icon:'radio'},
    {key:'teams',label:'Teams',icon:'users'},
    {key:'playoffs',label:'Playoffs',icon:'trophy'},
    {key:'schedule',label:'Spielplan',icon:'calendar'},
    {key:'info',label:'Infos',icon:'info'},
    {key:'registration',label:'Anmeldung',icon:'users'},
    {key:'admin',label:'Admin',icon:'shield'}
  ];
  function routeFromHash(){
    const path=window.location.hash.replace(/^#\/?/,'').split('/')[0];
    return navItems.some(x=>x.key===path) ? path : 'home';
  }
  function navigate(page){
    ui.mobileMenu=false;
    if(routeFromHash()===page && ui.page===page) {render();window.scrollTo(0,0);return;}
    window.location.hash=`#/${page}`;
  }
  function isBusyTeam(teamId){
    return allMatches().some(m => (m.status==='ready'||m.status==='live') && (m.teamAId === teamId || m.teamBId === teamId));
  }
  function tableMatch(tableId){
    return allMatches().find(m => (m.status==='ready'||m.status==='live') && m.tableId===tableId);
  }
  function createRoundRobin(teamIds, prefix, group, type, roundOffset=0){
    let ring=teamIds.slice();
    if (ring.length%2) ring.push(null);
    const rounds=[];
    for(let round=0;round<ring.length-1;round++){
      const pairs=[];
      for(let i=0;i<ring.length/2;i++){
        const a=ring[i], b=ring[ring.length-1-i];
        if(a && b) pairs.push({id:CLOUD?crypto.randomUUID():`${prefix}-${round}-${i}`,type,group,teamAId:a,teamBId:b,winnerId:null,status:'open',tableId:null,round:round+roundOffset,position:i,completedAt:null});
      }
      rounds.push(pairs);
      ring=[ring[0],ring[ring.length-1],...ring.slice(1,-1)];
    }
    return rounds;
  }
  function shuffle(arr){
    const copy=arr.slice();
    for(let i=copy.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[copy[i],copy[j]]=[copy[j],copy[i]];}
    return copy;
  }
  function drawGroups(){
    if(state.phase!=='registration'){notify('Die Gruppen können nur vor Turnierbeginn ausgelost werden.',true);return;}
    if(state.teams.length<MIN_TEAMS() || state.teams.length>MAX_TEAMS()){notify(`Für den Start benötigen wir ${MIN_TEAMS()}–${MAX_TEAMS()} Teams.`,true);return;}
    if(!window.confirm(`Gruppenphase mit ${state.teams.length} Teams starten? Die Anmeldung wird geschlossen und alle Begegnungen werden erstellt.`))return;
    const randomized=shuffle(state.teams.map(t=>t.id));
    const groupItems=GROUPS.map(name=>({name,teamIds:[]}));
    randomized.forEach((id,i)=>groupItems[i%8].teamIds.push(id));
    const rounds=groupItems.map(g=>createRoundRobin(g.teamIds,`grp-${g.name}`,g.name,'group'));
    const matchList=[];
    const maxRounds=Math.max(...rounds.map(r=>r.length));
    for(let r=0;r<maxRounds;r++) for(let g=0;g<rounds.length;g++) if(rounds[g][r])matchList.push(...rounds[g][r]);
    state.groups=groupItems;
    state.matches=matchList.map((m,i)=>({...m,order:i+1}));
    state.playoffMatches=[];
    state.phase='groups';
    state.registrationOpen=false;
    logAction(`${groupItems.length} Gruppen ausgelost · ${matchList.length} Gruppenspiele erstellt.`);
    commit('Gruppenphase gestartet! Spielplan und Gruppentabellen sind bereit.');
  }
  function matchesForGroup(g){return state.matches.filter(m=>m.group===g && m.type==='group');}
  function tiebreaksForGroup(g){return state.matches.filter(m=>m.group===g && m.type==='tiebreak');}
  // Regel: Siege > direkter Vergleich (genau zwei Teams) > Entscheidungsrunde bei 3+ Punktgleichen.
  // Bei einem neuen Kreis von drei Teams kann eine weitere Entscheidungsrunde erstellt werden.
  function computeRanking(g){
    const grouping=state.groups.find(gr=>gr.name===g);
    if(!grouping)return {ranking:[],unresolved:[],pending:[],complete:false};
    const base=matchesForGroup(g);
    const complete=base.every(m=>m.status==='done');
    const table=grouping.teamIds.map(id=>({id,w:base.filter(m=>m.status==='done'&&m.winnerId===id).length,l:base.filter(m=>m.status==='done'&&(m.teamAId===id||m.teamBId===id)&&m.winnerId!==id).length}));
    const blocks=new Map();
    table.forEach(t=>{if(!blocks.has(t.w))blocks.set(t.w,[]);blocks.get(t.w).push(t);});
    const ranking=[], unresolved=[], pending=[];
    const tb=tiebreaksForGroup(g);
    function h2hOrder(a,b,fixtures){
      const direct=fixtures.filter(m=>m.status==='done'&&[a.id,b.id].includes(m.teamAId)&&[a.id,b.id].includes(m.teamBId));
      const last=direct[direct.length-1];
      if(!last)return 0;
      return last.winnerId===a.id?-1:1;
    }
    for(const wins of [...blocks.keys()].sort((a,b)=>b-a)){
      const same=blocks.get(wins);
      if(same.length===1){ranking.push(...same);continue;}
      if(same.length===2){
        ranking.push(...same.slice().sort((a,b)=>h2hOrder(a,b,base)));
        if(complete && h2hOrder(same[0],same[1],base)===0)unresolved.push(same.map(t=>t.id));
        continue;
      }
      // Incomplete regular groups cannot have a decisive tie yet.
      if(!complete){ranking.push(...same);continue;}
      const sameIds=same.map(t=>t.id);
      const relevant=tb.filter(m=>sameIds.includes(m.teamAId)&&sameIds.includes(m.teamBId));
      const incomplete=relevant.some(m=>m.status!=='done');
      if(incomplete)pending.push(sameIds);
      const withTiebreak=same.map(t=>({...t,tbWins:relevant.filter(m=>m.status==='done'&&m.winnerId===t.id).length}));
      withTiebreak.sort((a,b)=>b.tbWins-a.tbWins||h2hOrder(a,b,relevant));
      ranking.push(...withTiebreak);
      if(incomplete)continue;
      const seen=new Map();
      withTiebreak.forEach(t=>{if(!seen.has(t.tbWins))seen.set(t.tbWins,[]);seen.get(t.tbWins).push(t);});
      for(const tied of seen.values()){
        if(tied.length>=3)unresolved.push(tied.map(t=>t.id));
        else if(tied.length===2 && h2hOrder(tied[0],tied[1],relevant)===0)unresolved.push(tied.map(t=>t.id));
      }
    }
    return {ranking,unresolved,pending,complete};
  }
  function addTiebreak(group){
    if(state.phase!=='groups')return;
    const rank=computeRanking(group);
    if(!rank.complete){notify('Zuerst müssen alle regulären Gruppenspiele beendet sein.',true);return;}
    if(rank.pending.length){notify('Die bereits angelegten Entscheidungsspiele sind noch nicht beendet.',true);return;}
    const cluster=rank.unresolved[0];
    if(!cluster){notify('In dieser Gruppe ist keine weitere Entscheidungsrunde erforderlich.',true);return;}
    if(cluster.length<3){notify('Ein Zweiergleichstand wird mit dem direkten Vergleich entschieden.',true);return;}
    const nextNumber=tiebreaksForGroup(group).length+1;
    const rounds=createRoundRobin(cluster,`tb-${group}-${nextNumber}-${Date.now()}`,group,'tiebreak');
    const extra=rounds.flat().map((m,i)=>({...m,order:state.matches.length+i+1}));
    state.matches.push(...extra);
    logAction(`Entscheidungsrunde für Gruppe ${group}: ${extra.length} Spiele angelegt.`);
    commit(`${extra.length} Entscheidungsspiele für Gruppe ${group} wurden hinzugefügt.`);
  }
  function playableMatches(){
    const current=state.phase==='playoffs'?state.playoffMatches:state.phase==='groups'?state.matches:[];
    return current.filter(m=>m.status==='open'&&m.teamAId&&m.teamBId&&!isBusyTeam(m.teamAId)&&!isBusyTeam(m.teamBId));
  }
  function suggestedMatch(){
    const available=playableMatches();
    const recent=allMatches().filter(m=>m.status==='done').sort((a,b)=>(b.completedAt||0)-(a.completedAt||0)).slice(0,5);
    function priority(m){
      const repeat=recent.reduce((score,finished,idx)=>score+([m.teamAId,m.teamBId].some(id=>id===finished.teamAId||id===finished.teamBId)?Math.max(0,35-idx*7):0),0);
      const playedGroup=state.matches.filter(f=>f.status==='done'&&f.group===m.group).length;
      return repeat+playedGroup*1.5+(m.order||0)/100;
    }
    return available.sort((a,b)=>priority(a)-priority(b))[0]||null;
  }
  function assignMatch(tableId,matchId){
    const table=state.tables.find(t=>t.id===tableId);
    const match=getMatch(matchId);
    if(!table||!table.active||tableMatch(tableId)||!match||match.status!=='open'||!match.teamAId||!match.teamBId){notify('Dieser Tisch oder dieses Spiel ist nicht mehr verfügbar.',true);return;}
    if(isBusyTeam(match.teamAId)||isBusyTeam(match.teamBId)){notify('Mindestens eines der Teams spielt bereits an einem anderen Tisch.',true);return;}
    match.tableId=tableId;match.status='ready';
    logAction(`${matchTitle(match)} an ${table.name} zugewiesen.`);
    delete ui.selections[tableId];
    commit(`${table.name}: Begegnung zugewiesen. Spiel kann gestartet werden.`);
  }
  function startMatch(tableId){
    const m=tableMatch(tableId);
    if(!m||m.status!=='ready'){notify('Am ausgewählten Tisch ist kein spielbereites Match.',true);return;}
    m.status='live';m.startedAt=Date.now();
    logAction(`${matchTitle(m)} gestartet.`);
    commit('Spiel gestartet – jetzt in der Live-Ansicht sichtbar.');
  }
  function undoAssignment(tableId){
    const m=tableMatch(tableId);
    if(!m||m.status!=='ready'){notify('Nur bereitgestellte, noch nicht gestartete Spiele können freigegeben werden.',true);return;}
    m.status='open';m.tableId=null;
    logAction(`Zuweisung für ${matchTitle(m)} gelöst.`);
    commit('Tisch freigegeben. Das Spiel ist wieder in der Warteschlange.');
  }
  function advanceWinner(finished){
    if(finished.type!=='playoff'||finished.round===3)return;
    const next=state.playoffMatches.find(m=>m.round===finished.round+1&&m.position===Math.floor(finished.position/2));
    if(!next)return;
    const slot=finished.position%2===0?'teamAId':'teamBId';
    next[slot]=finished.winnerId;
  }
  function finishMatch(id,winnerId){
    const m=getMatch(id);
    if(!m||m.status!=='live'||![m.teamAId,m.teamBId].includes(winnerId)){notify('Ungültige Spielauswahl. Bitte das laufende Spiel wählen.',true);return;}
    if(!window.confirm(`Sieger bestätigen: ${teamLabel(winnerId)}?\n\nDas Ergebnis wird für alle Besucher live gespeichert.`))return;
    m.winnerId=winnerId;m.status='done';m.completedAt=Date.now();m.playedTableId=m.tableId;m.tableId=null;
    advanceWinner(m);
    logAction(`${teamLabel(winnerId)} gewinnt gegen ${teamLabel(winnerId===m.teamAId?m.teamBId:m.teamAId)}.`);
    commit(`Sieger gespeichert: ${teamLabel(winnerId)}. Tabelle und Spielplan aktualisiert.`);
  }
  function updateWinner(id,winnerId){
    const m=getMatch(id);
    if(!m||m.status!=='done'||![m.teamAId,m.teamBId].includes(winnerId)||m.winnerId===winnerId)return;
    if(m.type==='group' && state.phase==='playoffs'){notify('Gruppenergebnisse sind nach Playoff-Start gesperrt.',true);return;}
    if(m.type==='playoff'){
      const next=state.playoffMatches.find(x=>x.round===m.round+1&&x.position===Math.floor(m.position/2));
      if(next && (next.status==='ready'||next.status==='live'||next.status==='done')){notify('Das Folge-Spiel wurde bereits begonnen oder abgeschlossen. Korrektur gesperrt.',true);return;}
      if(next){
        const oldSlot=m.position%2===0?'teamAId':'teamBId';
        next[oldSlot]=winnerId;
      }
    }
    if(!window.confirm(`Ergebnis korrigieren? Neuer Sieger: ${teamLabel(winnerId)}`))return;
    m.winnerId=winnerId;
    logAction(`Ergebnis korrigiert: ${teamLabel(winnerId)} gewinnt ${matchTitle(m)}.`);
    commit('Ergebnis korrigiert.');
  }
  function completeDemoGroups(){
    if(CLOUD){notify('Ergebnisse können online ausschließlich durch echte Spiele entstehen.',true);return;}
    if(state.phase!=='groups'){notify('Die Gruppensimulation ist nur während der Gruppenphase möglich.',true);return;}
    if(state.matches.some(m=>m.status==='ready'||m.status==='live')){notify('Zuerst alle zugewiesenen Spiele beenden oder freigeben.',true);return;}
    if(!window.confirm('Alle offenen regulären Gruppenspiele mit Demo-Ergebnissen abschließen? Dies dient nur zum Testen des Playoff-Baums.'))return;
    let count=0;
    // Acyclic ranking, sofern manuelle Ergebnisse nicht schon einen Kreis erzeugt haben.
    for(const match of state.matches){
      if(match.type!=='group'||match.status!=='open')continue;
      const group=state.groups.find(g=>g.name===match.group);
      const a=group.teamIds.indexOf(match.teamAId);
      const b=group.teamIds.indexOf(match.teamBId);
      match.winnerId=a<b?match.teamAId:match.teamBId;
      match.status='done';match.completedAt=Date.now()+count;
      count++;
    }
    logAction(`${count} Gruppenspiele mit Demo-Ergebnissen abgeschlossen.`);
    commit(`${count} Gruppenspiele abgeschlossen. Playoff-Freigabe ist jetzt möglich.`);
  }
  function startPlayoffs(){
    if(state.phase!=='groups'){notify('Playoffs können erst nach der Gruppenphase starten.',true);return;}
    if(!state.groups.length||groupMatches().some(m=>m.status!=='done')){notify('Zuerst alle regulären Gruppenspiele abschließen.',true);return;}
    const rankings=GROUPS.map(g=>computeRanking(g));
    if(rankings.some(r=>r.unresolved.length||r.pending.length)||tiebreaksUnfinished()){
      notify('Vor dem Playoff-Start müssen sämtliche Entscheidungsspiele abgeschlossen und alle Platzierungen eindeutig sein.',true);return;
    }
    if(!window.confirm('Playoffs mit den jeweils zwei besten Teams starten? Gruppenergebnisse werden anschließend gesperrt.'))return;
    const qualified=Object.fromEntries(GROUPS.map((g,i)=>[g,{first:rankings[i].ranking[0]?.id,second:rankings[i].ranking[1]?.id}]));
    const pairings=[
      ['A','first','B','second'],['C','first','D','second'],
      ['E','first','F','second'],['G','first','H','second'],
      ['B','first','A','second'],['D','first','C','second'],
      ['F','first','E','second'],['H','first','G','second']
    ];
    const playoff=[];
    pairings.forEach(([ga,ra,gb,rb],i)=>playoff.push({
      id:crypto.randomUUID(),type:'playoff',round:0,position:i,order:i,
      teamAId:qualified[ga][ra],teamBId:qualified[gb][rb],
      winnerId:null,status:'open',tableId:null,completedAt:null
    }));
    for(let r=1;r<4;r++)for(let i=0;i<8/2**r;i++)playoff.push({
      id:crypto.randomUUID(),type:'playoff',round:r,position:i,order:i,
      teamAId:null,teamBId:null,winnerId:null,status:'open',tableId:null,completedAt:null
    });
    state.playoffMatches=playoff;
    state.phase='playoffs';
    logAction('Achtelfinale und Playoff-Baum offiziell freigegeben.');
    commit('Playoffs gestartet! Der Turnierbaum ist jetzt befüllt.');
  }
  function tiebreaksUnfinished(){return state.matches.some(m=>m.type==='tiebreak'&&m.status!=='done');}
  function addTeam(){
    if(!state.registrationOpen||state.phase!=='registration'){notify('Die Anmeldung ist aktuell geschlossen.',true);return;}
    if(state.teams.length>=MAX_TEAMS()){notify('Alle Plätze sind vergeben.',true);return;}
    const teamName=ui.registration.teamName.trim().replace(/\s+/g,' ');
    const players=ui.registration.players.map(v=>v.trim().replace(/\s+/g,' '));
    if(teamName.length<3||teamName.length>35){notify('Der Teamname muss 3 bis 35 Zeichen haben.',true);return;}
    if(players.length<2||players.length>4||players.some(name=>name.length<2||name.length>50)){notify('Bitte 2 bis 4 vollständige Spielernamen eintragen (je 2–50 Zeichen).',true);return;}
    if(state.teams.some(t=>t.name.toLocaleLowerCase('de')===teamName.toLocaleLowerCase('de'))){notify('Dieser Teamname ist bereits vergeben.',true);return;}
    if (CLOUD){
      if(ui.saving)return;
      ui.saving=true;render();
      CLOUD.guestRegister(teamName,players).then(async result=>{
        ui.registration={teamName:'',players:['','']};
        ui.saving=false;
        notify('Willkommen, '+result.team+'! Eure Anmeldung wurde gespeichert.');
      }).catch(err=>{ui.saving=false;notify(err.message,true);});
      return;
    }
    state.teams.push({id:crypto.randomUUID(),name:teamName,players,createdAt:Date.now()});
    logAction(`Neues Team registriert: ${teamName} (${players.length} Personen).`);
    ui.registration={teamName:'',players:['','']};
    commit(`Willkommen, ${teamName}! Eure Anmeldung wurde in dieser Browser-Demo gespeichert.`);
  }
  function addTable(){
    if(state.tables.length>=16){notify('Maximal 16 Tische möglich.',true);return;}
    const next=state.tables.length+1;
    state.tables.push({id:crypto.randomUUID(),name:`Tisch ${next}`,active:true,sortOrder:next});
    logAction(`Tisch ${next} hinzugefügt.`);
    commit('Neuer Tisch hinzugefügt.');
  }
  function toggleTable(tableId){
    const table=state.tables.find(t=>t.id===tableId);
    if(!table)return;
    if(tableMatch(table.id)){notify('Beende das laufende Spiel oder löse die Bereitstellung, bevor du den Tisch deaktivierst.',true);return;}
    table.active=!table.active;
    logAction(`${table.name} ${table.active?'aktiviert':'deaktiviert'}.`);
    commit(`${table.name} ist jetzt ${table.active?'aktiv':'inaktiv'}.`);
  }
  function renameTable(tableId){
    const table=state.tables.find(t=>t.id===tableId);
    if(!table)return;
    const newName=window.prompt('Neuer Name des Tisches:',table.name);
    if(newName===null)return;
    const cleaned=newName.trim();
    if(cleaned.length<2||cleaned.length>30){notify('Tischnamen müssen 2 bis 30 Zeichen haben.',true);return;}
    table.name=cleaned;
    logAction(`Tisch umbenannt in ${cleaned}.`);
    commit('Tisch erfolgreich umbenannt.');
  }
  function resetDemo(){
    if(CLOUD){notify('Ein Zurücksetzen des Online-Turniers ist deaktiviert.',true);return;}
    if(!window.confirm('Alle lokalen Änderungen einschließlich Anmeldungen, Ergebnissen und Tischen löschen und die 24 Demo-Teams wiederherstellen?'))return;
    state=seedData();
    ui.selections={};ui.registration={teamName:'',players:['','']};
    commit('Die Demo wurde auf den Ausgangszustand zurückgesetzt.');
    navigate('home');
  }

  function renderHeader(){
    const isLive = allMatches().some(m => m.status === 'live');
    const publicNav = navItems.filter(n => !['registration','admin'].includes(n.key));
    return `<header class="site-header"><div class="container header-inner">
        <a class="logo" href="#/home" aria-label="Cimbria Cup Startseite"><img class="logo-crest" src="assets/zirkel-cimbria.png" alt="" loading="eager"/><span class="logo-separator"></span><span class="logo-text"><strong>CIMBRIA</strong><span>BIERPONG CUP</span></span></a>
        <nav class="desktop-nav" aria-label="Hauptnavigation">
          ${publicNav.map(n => `<a class="nav-item ${ui.page===n.key?'active':''}" href="#/${n.key}">${n.label}${n.key==='live'&&isLive?'<span class="nav-live-dot"></span>':''}</a>`).join('')}
        </nav>
        <div class="header-right"><a class="btn btn-gold top-join" href="#/registration">${icon('users')} Team anmelden</a><a class="admin-shortcut ${ui.page==='admin'?'active':''}" href="#/admin" title="Turnierleitung" aria-label="Admin-Dashboard">${icon('settings')}</a>
          <button class="menu-button" type="button" data-action="menu" aria-label="Menü öffnen" aria-expanded="${ui.mobileMenu}">${icon(ui.mobileMenu?'close':'menu','svg-lg')}</button>
        </div>
      </div><nav class="mobile-nav ${ui.mobileMenu?'open':''}" aria-label="Mobiles Menü">
          ${navItems.map(n => `<a class="nav-item ${ui.page===n.key?'active':''}" href="#/${n.key}">${icon(n.icon)}${n.label}</a>`).join('')}
      </nav></header>`;
  }
  function renderMobileTabs(){
    const tabs=['home','live','teams','playoffs','schedule'].map(key=>navItems.find(n=>n.key===key));
    return `<nav class="bottom-tabs" aria-label="Mobile Schnellnavigation">${tabs.map(n=>`<a href="#/${n.key}" class="bottom-tab ${ui.page===n.key?'active':''}">${icon(n.icon)}<span>${n.label}</span></a>`).join('')}</nav>`;
  }
  function renderFooter(){
    return `<footer class="footer"><div class="container footer-inner">
      <a class="logo footer-brand" href="#/home"><img class="logo-crest" src="assets/zirkel-cimbria.png" alt=""/><span class="logo-separator"></span><span class="logo-text"><strong>CIMBRIA</strong><span>BIERPONG CUP</span></span></a>
      <div class="footer-copy">Mehr als ein Spiel. Gute Drinks. Starke Teams.<br><span>Design-Demo · Daten nur in diesem Browser</span></div>
      <div class="footer-links"><a href="#/info">Infos & FAQ</a><a href="#/registration">Anmeldung</a><a href="#/admin">Turnierleitung</a></div>
    </div></footer>`;
  }
  function pageBanner(kicker,title,lead,right=''){
    return `<section class="page-banner"><div class="container page-heading"><div><div class="kicker">${escape(kicker)}</div><h1>${title}</h1><p>${lead}</p></div><img class="page-ornament-crest" src="assets/zirkel-cimbria.png" alt="" aria-hidden="true"/></div></section>`;
  }
  function matchRow(m){
    const table=state.tables.find(t=>t.id===m.tableId);
    const roundName=m.type==='tiebreak'?'Entscheidungsspiel':m.type==='playoff'?['Achtelfinale','Viertelfinale','Halbfinale','Finale'][m.round]:`Gruppe ${m.group}`;
    return `<div class="match-mini">
      <div><div class="match-pair"><span ${m.status==='done'&&m.winnerId===m.teamAId?'class="gold"':''}>${teamMarkup(m.teamAId)}</span><span class="match-vs">VS</span><span ${m.status==='done'&&m.winnerId===m.teamBId?'class="gold"':''}>${teamMarkup(m.teamBId)}</span></div>
      <div class="match-info">${roundName} ${table?' · '+escape(table.name):''}</div>${m.status==='live'?`<small>🥤 ${m.cupsA??10} : ${m.cupsB??10} Becher übrig</small>`:''}</div>
      <div class="match-actions">${matchBadge(m)}${m.status==='done'?`<span class="text-xs gold">Sieger: ${teamMarkup(m.winnerId)}</span>`:''}</div>
    </div>`;
  }
  function compactMatch(m){
    const t=state.tables.find(t=>t.id===m.tableId);
    const label=m.type==='playoff'?['Achtelfinale','Viertelfinale','Halbfinale','Finale'][m.round]:m.type==='tiebreak'?'Entscheidungsspiel':`Gruppe ${m.group}`;
    return `<div class="v2-match-item"><div class="v2-match-context">${escape(label)}${t?' · '+escape(t.name):''}</div>
      <div class="v2-match-team ${m.winnerId===m.teamAId?'winner':''}"><span>${teamMarkup(m.teamAId)}</span>${m.winnerId===m.teamAId?icon('trophy'):''}</div>
      <div class="v2-match-team ${m.winnerId===m.teamBId?'winner':''}"><span>${teamMarkup(m.teamBId)}</span>${m.winnerId===m.teamBId?icon('trophy'):''}</div>
      <div class="v2-match-state">${m.status==='live'?`<span class="live-anim"></span> LIVE · 🥤 ${m.cupsA??10} : ${m.cupsB??10}`:m.status==='done'?'Beendet':m.status==='ready'?'Startklar':'Als Nächstes'}</div>
    </div>`;
  }
  function renderHome(){
    const live=allMatches().filter(m=>m.status==='live');
    const ready=allMatches().filter(m=>m.status==='ready');
    const upcoming=allMatches().filter(m=>m.status==='open'&&m.teamAId&&m.teamBId);
    const highlighted=live[0]||ready[0]||upcoming[0];
    const groupA=state.groups.some(g=>g.name==='A')?computeRanking('A').ranking:[];
    const final=state.playoffMatches.find(m=>m.round===3);
    const phase=state.phase==='registration'?'Anmeldephase':state.phase==='groups'?'Gruppenphase':'Playoffs';
    return `<section class="v2-landing"><div class="container landing-content">
      <div class="hero-crest-wrap"><img src="assets/zirkel-cimbria.png" alt="Cimbria-Zirkel" class="hero-crest"/></div>
      <div class="hero-rule"><span></span><span>MEHR ALS EIN SPIEL</span><span></span></div>
      <h1 class="landing-title">CIMBRIA<span>BIERPONG CUP</span></h1>
      <p class="landing-text">Das legendäre Bierpong-Turnier.<br>Gute Drinks. Starke Teams. Unvergessliche Nächte.</p>
      <div class="hero-actions landing-actions"><a class="btn btn-gold" href="#/registration">${icon('users')} Team anmelden ${icon('arrow')}</a><a class="btn btn-outline" href="#/live">${icon('radio')} Live verfolgen ${icon('arrow')}</a></div>
      <div class="hero-facts"><span>${icon('users')} ${state.teams.length} / ${MAX_TEAMS()} Teams</span><span>${icon('grid')} 8 Gruppen</span><span>${icon('trophy')} 16 Playoff-Plätze</span></div>
    </div></section>
    <section class="home-dashboard container"><div class="v2-grid-4">
      <a href="#/live" class="v2-glass v2-feature-card"><div class="v2-feature-header"><div class="v2-feature-icon">${icon('radio')}</div><div><span class="v2-eyebrow">LIVE MATCHES</span><p>Aktuelle Begegnungen</p></div>${icon('chevron','v2-go')}</div>
      ${highlighted?compactMatch(highlighted):`<div class="v2-mini-empty">${icon('clock')}<strong>Es geht bald los</strong><span>Die Begegnungen erscheinen nach der Gruppenauslosung.</span></div>`}
      </a>
      <a href="#/live" class="v2-glass v2-feature-card"><div class="v2-feature-header"><div class="v2-feature-icon">${icon('users')}</div><div><span class="v2-eyebrow">GRUPPEN</span><p>8 Gruppen · je 3–4 Teams</p></div>${icon('chevron','v2-go')}</div>
      <div class="v2-compact-ranking"><div class="v2-th"><span>GRUPPE A</span><span>S</span></div>
      ${groupA.length?groupA.slice(0,4).map((t,i)=>`<div class="v2-rank-row"><span><b>${i+1}</b> ${teamMarkup(t.id)}</span><b>${t.w}</b></div>`).join(''):`<div class="v2-mini-empty inline">${icon('shuffle')}<span>Gruppenauslosung steht noch aus.</span></div>`}</div></a>
      <a href="#/playoffs" class="v2-glass v2-feature-card"><div class="v2-feature-header"><div class="v2-feature-icon">${icon('trophy')}</div><div><span class="v2-eyebrow">PLAYOFFS</span><p>Der Weg zum Titel</p></div>${icon('chevron','v2-go')}</div>
      <div class="v2-mini-bracket"><div class="v2-bracket-line"><span>${state.phase==='playoffs'?teamMarkup(state.playoffMatches[0]?.teamAId):'Gruppensieger A'}</span><span>${state.phase==='playoffs'?teamMarkup(state.playoffMatches[0]?.teamBId):'Gruppenzweiter B'}</span></div><div class="v2-bracket-join"></div><div class="v2-bracket-winner">${final?.winnerId?teamMarkup(final.winnerId):'Finale offen'}</div></div>
      </a>
      <a href="#/schedule" class="v2-glass v2-feature-card"><div class="v2-feature-header"><div class="v2-feature-icon">${icon('calendar')}</div><div><span class="v2-eyebrow">TURNIERPLAN</span><p>Alle Runden im Überblick</p></div>${icon('chevron','v2-go')}</div>
      <div class="v2-timeline-list"><div><b>01</b><span>Anmeldung</span><small>${state.phase==='registration'?'Aktuell':'Erledigt'}</small></div><div><b>02</b><span>Gruppenphase</span><small>${state.phase==='groups'?'Aktuell':'8 Gruppen'}</small></div><div><b>03</b><span>Playoffs</span><small>${state.phase==='playoffs'?'Aktuell':'16 Teams'}</small></div><div><b>04</b><span>Finale</span><small>1 Champion</small></div></div>
      </a>
    </div><div class="v2-motto"><span>${icon('trophy')} LEGENDÄRE STIMMUNG</span><span>${icon('users')} STARKE TEAMS</span><span>${icon('spark')} GUTE DRINKS</span><span>${icon('crown')} UNVERGESSLICHE NÄCHTE</span></div></section>
    <section class="v2-after container"><div><div class="kicker">EIN ABEND · EIN TITEL</div><h2>Bereit für den Cup?</h2><p>Teams anmelden, Begegnungen live verfolgen und das Finale gemeinsam feiern.</p></div><a class="btn btn-gold" href="#/registration">Jetzt mitmachen ${icon('arrow')}</a></section>`;
  }
  function renderRegistration(){
    const spots=MAX_TEAMS()-state.teams.length;
    const open=state.registrationOpen&&state.phase==='registration'&&spots>0;
    return `${pageBanner('MEHR ALS EIN SPIEL','Team <em>anmelden</em>','Erlebt den Cimbria Bierpong Cup mit eurem Team. Zwei Personen spielen, bis zu vier dürfen dabei sein.')}
      <div class="container content-pad"><div class="v2-registration-grid"><section class="v2-glass v2-registration-card">
        <div class="v2-form-title"><span class="v2-form-icon">${icon('users')}</span><div><h2>Team anmelden</h2><p>Sichert euch euren Platz für das nächste Turnier.</p></div></div>
        ${!open?`<div class="notice danger-note">${icon('info')}<div>${spots===0?'Alle Plätze vergeben.':'Anmeldung geschlossen.'} Die Turnierleitung kann die Anmeldung bei Bedarf öffnen.</div></div>`:''}
        <form id="team-registration" ${!open?'aria-disabled="true"':''}>
          <div class="field"><label for="team-name">Teamname <span class="gold">*</span></label><input id="team-name" name="teamName" data-draft="name" maxlength="35" minlength="3" value="${escape(ui.registration.teamName)}" placeholder="z. B. Die Zirkelfreunde" autocomplete="off" ${!open?'disabled':''} required/><span class="field-note">Euer Teamname erscheint im Spielplan und den Tabellen.</span></div>
          <div class="player-heading"><div><h3>${icon('users')} Teammitglieder</h3><p>Spieler 1 und 2 sind Pflicht; weitere sind optional.</p></div><span class="badge gold">${ui.registration.players.length} / 4</span></div>
          ${ui.registration.players.map((name,i)=>`<div class="player-row v2-player-row"><span class="player-nr">${icon('users')}</span><label class="v2-player-label" for="player-${i}">${i===0?'Teamkapitän':`Spieler ${i+1}`} ${i>1?'<small>optional</small>':''}</label><input id="player-${i}" class="input" name="player" data-player="${i}" type="text" value="${escape(name)}" maxlength="50" minlength="2" placeholder="Vor- und Nachname" ${!open?'disabled':''} required/>${i>=2?`<button type="button" data-action="remove-player" data-index="${i}" aria-label="Spieler ${i+1} entfernen" class="tiny-button" ${!open?'disabled':''}>${icon('close')}</button>`:'<span class="v2-required">*</span>'}</div>`).join('')}
          <button type="button" data-action="add-player" class="btn btn-quiet btn-sm v2-add-player" ${!open||ui.registration.players.length>=4?'disabled':''}>${icon('plus')} Spieler hinzufügen</button>
          <div class="v2-inline-notice">${icon('info')} <span>Es werden ausschließlich <b>Siege und Niederlagen</b> erfasst. Pro Begegnung spielen zwei Personen aus eurem Team.</span></div>
          <button type="submit" class="btn btn-gold v2-submit" ${!open?'disabled':''}>${icon('users')} Jetzt Team anmelden ${icon('arrow')}</button>
          <div class="privacy-note">Eure Anmeldung wird zentral im Cimbria-Turniersystem gespeichert.</div>
        </form>
      </section><aside class="v2-glass v2-info-card"><div class="v2-section-head">${icon('trophy')}<h2>Wichtigste Infos</h2></div>
        ${[["users","2–4 Spieler","Zwei aktive Spieler pro Partie. Zusätzliche Mitglieder können wechseln."],["grid","Maximal ${MAX_TEAMS()} Teams","Die Anzahl legt die Turnierleitung fest."],["trophy","Gruppen + Playoffs","8 Gruppen, anschließend K.-o.-Runde mit 16 Teams."],["radio","Ergebnisse live verfolgen","Alle bestätigten Siege sind für alle Besucher live sichtbar."]].map(([ico,t,d])=>`<div class="v2-info-item"><div class="v2-info-icon">${icon(ico)}</div><div><strong>${t}</strong><p>${d}</p></div></div>`).join('')}
        <div class="v2-seat-card"><div class="wide-line"><span>Aktueller Anmeldestand</span><strong>${state.teams.length} / ${MAX_TEAMS()}</strong></div><div class="progress-track"><div class="progress-bar" style="width:${Math.min(100,state.teams.length/MAX_TEAMS()*100)}%"></div></div><small>${spots} Plätze verfügbar · ${open?'Anmeldung geöffnet':'Anmeldung geschlossen'}</small></div>
        <a href="#/info" class="v2-info-link">Turnierregeln & häufige Fragen ${icon('arrow')}</a>
      </aside></div></div>`;
  }
  function renderStandings(g){
    const {ranking,unresolved,pending,complete}=computeRanking(g);
    if(!ranking.length)return `<div class="view-empty">${icon('grid')}<strong>Noch keine Auslosung</strong><p>Die Gruppentabellen werden nach dem Start der Gruppenphase erstellt.</p></div>`;
    return `<div class="group-tabs">${GROUPS.map(group=>`<button class="group-tab ${ui.liveGroup===group?'active':''}" data-action="group" data-group="${group}" aria-label="Gruppe ${group} anzeigen">${group}</button>`).join('')}</div>
      <table class="standings"><thead><tr><th>Platz / Team</th><th>Sp.</th><th>S</th><th>N</th></tr></thead><tbody>${ranking.map((t,i)=>`<tr class="${i<2?'qualified':''}"><td><span class="place">${i+1}</span>${teamMarkup(t.id)}</td><td>${t.w+t.l}</td><td><strong>${t.w}</strong></td><td>${t.l}</td></tr>`).join('')}</tbody></table>
      <p class="muted text-xs" style="line-height:1.7;margin:14px 0 0">${complete?(unresolved.length?'Entscheidungsspiele nötig – Platzierungen noch nicht endgültig.':pending.length?'Entscheidungsspiele laufen noch.':'Alle regulären Gruppenspiele beendet.'):'Die Tabelle wird nach jedem Spiel automatisch aktualisiert.'} ${complete?'':'Platz 1 & 2 sind bis zum Gruppenende vorläufig.'}</p>`;
  }
  function renderLive(){
    const matches=allMatches();
    const live=matches.filter(m=>m.status==='live');
    const ready=matches.filter(m=>m.status==='ready');
    const upcoming=matches.filter(m=>m.status==='open'&&m.teamAId&&m.teamBId);
    const done=matches.filter(m=>m.status==='done');
    const filtered=matches.filter(m=>{
      if(ui.liveFilter==='live'&&m.status!=='live')return false;
      if(ui.liveFilter==='pending'&&!['open','ready'].includes(m.status))return false;
      if(ui.liveFilter==='done'&&m.status!=='done')return false;
      const query=ui.liveSearch.toLocaleLowerCase('de');
      if(query&&!`${teamLabel(m.teamAId)} ${teamLabel(m.teamBId)} ${m.group||''}`.toLocaleLowerCase('de').includes(query))return false;
      return true;
    }).sort((a,b)=>({live:0,ready:1,open:2,done:3}[a.status]-{live:0,ready:1,open:2,done:3}[b.status])||(a.order||0)-(b.order||0));
    const visible=ui.liveExpanded||ui.liveSearch?filtered:filtered.slice(0,12);
    return `${pageBanner('LIVE · DIREKT VOM SPIELTISCH','Das Turnier <em>live</em>','Alle Begegnungen, Tische und Ergebnisse auf einen Blick. Nur Siege und Niederlagen – kein laufender Becherstand.')}
    <div class="container content-pad v2-live-page">
      <div class="v2-live-kpis"><div class="v2-glass"><span>${icon('radio')} GERADE LIVE</span><strong>${live.length}</strong><small>laufende Matches</small></div><div class="v2-glass"><span>${icon('table')} AKTIVE TISCHE</span><strong>${state.tables.filter(t=>t.active).length}</strong><small>zur Verfügung</small></div><div class="v2-glass"><span>${icon('check')} ABSOLVIERT</span><strong>${done.length}</strong><small>Spiele abgeschlossen</small></div><div class="v2-glass"><span>${icon('clock')} NOCH AUSSTEHEND</span><strong>${matches.length-done.length}</strong><small>inkl. vorbereiteter Spiele</small></div></div>
      <div class="v2-live-featured">
        <section class="v2-glass v2-panel v2-current-matches"><div class="v2-panel-title"><div>${icon('radio')}<span>LIVE MATCHES</span></div><a href="#/schedule">Zum Spielplan ${icon('arrow')}</a></div>
          ${live.length?live.slice(0,4).map(m=>`<div class="v2-current-row"><div><span class="v2-eyebrow">${escape(state.tables.find(t=>t.id===m.tableId)?.name||'Spieltisch')} · ${m.type==='group'?`Gruppe ${m.group}`:m.type==='tiebreak'?'Entscheidungsspiel':ROUND_LABELS[m.round]}</span><strong>${teamMarkup(m.teamAId)} <span class="v2-vs">VS</span> ${teamMarkup(m.teamBId)}</strong></div><span class="badge green">${icon('radio')} LIVE</span></div>`).join(''):`<div class="v2-mini-empty v2-feature-empty">${icon('radio')}<strong>Aktuell läuft kein Match</strong><span>${state.phase==='registration'?'Der Spielplan startet nach der Auslosung.':'Sobald der Admin ein Spiel startet, erscheint es hier.'}</span></div>`}
        </section>
        <section class="v2-glass v2-panel"><div class="v2-panel-title"><div>${icon('table')}<span>SPIELTISCHE</span></div><span>${state.tables.filter(t=>t.active).length} aktiv</span></div><div class="v2-tables-compact">${state.tables.map(t=>{const m=tableMatch(t.id);return `<div class="v2-table-line"><strong>${escape(t.name)}</strong><span class="v2-status ${m?.status==='live'?'is-live':m?'is-ready':t.active?'is-free':'is-disabled'}">${!t.active?'Inaktiv':m?.status==='live'?'Läuft':m?'Bereit':'Frei'}</span></div>`}).join('')}</div></section>
        <section class="v2-glass v2-panel"><div class="v2-panel-title"><div>${icon('clock')}<span>ALS NÄCHSTES</span></div><a href="#/schedule">Alle ${icon('chevron')}</a></div>${[...ready,...upcoming].slice(0,4).length?[...ready,...upcoming].slice(0,4).map(m=>`<div class="v2-next-line"><small>${m.type==='group'?`Gruppe ${m.group}`:m.type==='tiebreak'?'Entscheidungsspiel':ROUND_LABELS[m.round]}</small><strong>${teamMarkup(m.teamAId)} <span class="v2-vs">vs.</span> ${teamMarkup(m.teamBId)}</strong></div>`).join(''):`<div class="v2-mini-empty inline"><span>Auslosung und Spielplanung stehen noch aus.</span></div>`}</section>
      </div>
      <div class="v2-live-bottom"><section class="v2-glass v2-panel"><div class="v2-panel-title"><div>${icon('grid')}<span>GRUPPENPHASE</span></div><span>Platz 1 & 2 qualifizieren sich</span></div>${renderStandings(ui.liveGroup)}</section>
        <section class="v2-glass v2-panel"><div class="v2-panel-title"><div>${icon('calendar')}<span>BEGEGNUNGEN</span></div><span>${matches.length} Spiele</span></div><div class="v2-filterbar"><div class="tab-row">${[['all','Alle'],['live','Live'],['pending','Anstehend'],['done','Beendet']].map(([value,label])=>`<button class="mini-filter ${ui.liveFilter===value?'active':''}" data-action="live-filter" data-filter="${value}">${label}</button>`).join('')}</div><input id="live-search" type="search" placeholder="Team suchen …" class="search-input" aria-label="Spiele durchsuchen" value="${escape(ui.liveSearch)}"></div>
      <div class="v2-fixtures">${visible.length?visible.map(m=>`<div class="v2-fixture-row"><div><small>${m.type==='group'?`Gruppe ${m.group}`:m.type==='tiebreak'?'Entscheidungsspiel':ROUND_LABELS[m.round]}</small><strong>${teamMarkup(m.teamAId)} <span class="v2-vs">vs.</span> ${teamMarkup(m.teamBId)}</strong></div><span class="v2-status ${m.status==='live'?'is-live':m.status==='ready'?'is-ready':m.status==='done'?'is-done':'is-free'}">${m.status==='done'?`Sieg: ${teamMarkup(m.winnerId)}`:statusLabel(m.status)}</span></div>`).join(''):`<div class="v2-mini-empty inline">Keine Begegnungen vorhanden.</div>`}</div>
      ${filtered.length>12&&!ui.liveExpanded&&!ui.liveSearch?`<button class="btn btn-outline btn-block" style="margin-top:15px" data-action="live-expand">Alle Begegnungen anzeigen ${icon('arrow')}</button>`:''}</section></div>
    </div>`;
  }
  function renderTeams(){
    const teams=state.teams.filter(t=>!ui.teamSearch||(CLOUD.isAdmin?
      `${t.name} ${t.players.join(' ')}`:t.name).toLocaleLowerCase('de').includes(ui.teamSearch.toLocaleLowerCase('de')));
    return `${pageBanner('DIE KONKURRENZ','Alle <em>Teams</em>','Lerne die Mannschaften kennen, die um den Cimbria Cup spielen.')}
      <div class="container content-pad"><div class="v2-glass v2-panel"><div class="v2-panel-title"><div>${icon('users')}<span>${state.teams.length} TEAMS ANGEMELDET</span></div><a href="#/registration">Team anmelden ${icon('arrow')}</a></div><input id="team-search" class="search-input v2-team-search" type="search" placeholder="Nach Team suchen ..." aria-label="Teams suchen" value="${escape(ui.teamSearch||'')}">
      <div class="v2-teams-grid">${teams.map(t=>`<div class="v2-team-card"><div class="v2-team-badge">${icon('users')}</div><strong>${escape(t.name)}</strong><span>${CLOUD.isAdmin?t.players.length+' Teammitglieder':'Angemeldet'}</span>
        <p>${CLOUD.isAdmin?t.players.map(escape).join(' · '):'Cimbria Bierpong Cup'}</p></div>`).join('')||'<p class="muted">Keine Teams gefunden.</p>'}</div></div></div>`;
  }
  function renderSchedule(){
    const matches=allMatches();
    const pending=matches.filter(m=>m.status!=='done'&&m.teamAId&&m.teamBId).sort((a,b)=>({live:0,ready:1,open:2}[a.status]||3)-({live:0,ready:1,open:2}[b.status]||3)||a.order-b.order);
    return `${pageBanner('DER WEG ZUM FINALE','Der <em>Spielplan</em>','Alle Runden und Tischbelegungen. Startzeiten werden von der Turnierleitung noch festgelegt.')}
      <div class="container content-pad"><div class="v2-schedule-steps">${[['01','Anmeldung',state.phase==='registration'],['02','Gruppenphase',state.phase==='groups'],['03','Playoffs',state.phase==='playoffs'],['04','Finale',false]].map(([id,name,active])=>`<div class="v2-glass ${active?'step-active':''}"><span>${id}</span><strong>${name}</strong><small>${active?'Aktuelle Phase':id==='01'&&state.phase!=='registration'?'Abgeschlossen':'Geplant'}</small></div>`).join('')}</div>
      <div class="v2-glass v2-panel"><div class="v2-panel-title"><div>${icon('calendar')}<span>KOMMENDE SPIELE</span></div><span>${pending.length} Begegnungen geplant</span></div>
      ${pending.length?pending.slice(0,30).map(m=>`<div class="v2-fixture-row"><div><small>${m.type==='group'?`Gruppe ${m.group}`:m.type==='tiebreak'?'Entscheidungsspiel':ROUND_LABELS[m.round]} ${m.tableId?' · '+escape(state.tables.find(t=>t.id===m.tableId)?.name||''):''}</small><strong>${teamMarkup(m.teamAId)} <span class="v2-vs">vs.</span> ${teamMarkup(m.teamBId)}</strong></div><span class="v2-status ${m.status==='live'?'is-live':m.status==='ready'?'is-ready':'is-free'}">${statusLabel(m.status)}</span></div>`).join(''):`<div class="v2-mini-empty v2-feature-empty">${icon('calendar')}<strong>Spielplan folgt</strong><span>Nach der Auslosung werden alle Begegnungen automatisch erzeugt.</span></div>`}
      </div></div>`;
  }
  function renderInfo(){
    return `${pageBanner('GUT ZU WISSEN','Infos & <em>FAQ</em>','Alles Wichtige zur Teilnahme und zum Turnierformat.')}
      <div class="container content-pad v2-info-page"><div class="v2-glass v2-panel"><div class="v2-section-head">${icon('info')}<h2>Das Turnier</h2></div>
        <div class="v2-info-item"><div class="v2-info-icon">${icon('users')}</div><div><strong>${MIN_TEAMS()}–${MAX_TEAMS()} Teams · 2–4 Personen</strong><p>Pro Begegnung stehen zwei Spieler am Tisch. Teammitglieder können zwischen Partien wechseln.</p></div></div>
        <div class="v2-info-item"><div class="v2-info-icon">${icon('grid')}</div><div><strong>Acht Gruppen</strong><p>In jeder Gruppe spielt jeder gegen jeden. Die besten zwei Teams qualifizieren sich.</p></div></div>
        <div class="v2-info-item"><div class="v2-info-icon">${icon('trophy')}</div><div><strong>K.-o.-Phase mit 16 Teams</strong><p>Achtelfinale, Viertelfinale, Halbfinale und Finale. Der Sieger zieht jeweils weiter.</p></div></div>
      </div><div class="v2-glass v2-panel"><div class="v2-section-head">${icon('spark')}<h2>Häufige Fragen</h2></div>
        <details><summary>Wie werden Ergebnisse gewertet?</summary><p>Nur Sieg oder Niederlage. Becherstände werden nicht erfasst.</p></details>
        <details><summary>Was passiert bei einem Gleichstand?</summary><p>Zuerst zählen die Siege, bei zwei gleich platzierten Teams der direkte Vergleich. Ein nicht auflösbarer Dreiergleichstand wird durch Entscheidungsspiele aufgelöst.</p></details>
        <details><summary>Wer trägt die Ergebnisse ein?</summary><p>Die Turnierleitung bestätigt nach jedem Spiel den Sieger. Der Admin-Bereich erhält vor dem öffentlichen Start eine sichere Anmeldung.</p></details>
        <details><summary>Wie funktionieren die Spieltische?</summary><p>Die Anzahl der Tische wird im Admin-Bereich festgelegt. Der Hybridmodus macht Vorschläge, die Leitung bestätigt oder verändert die Zuweisung.</p></details>
        <details><summary>Stehen Datum, Uhrzeit und Ort fest?</summary><p>Diese Veranstaltungsinformationen ergänzen wir, sobald sie offiziell festgelegt sind.</p></details>
      </div></div>`;
  }
  const ROUND_LABELS=['Achtelfinale','Viertelfinale','Halbfinale','Finale'];
  const ROUND_SLOTS=[['A1','B2'],['C1','D2'],['E1','F2'],['G1','H2'],['B1','A2'],['D1','C2'],['F1','E2'],['H1','G2']];
  function bracketTeam(id,placeholder,winnerId){
    return `<div class="bracket-team ${id&&winnerId===id?'winner':''} ${id?'':'empty'}"><span>${id?teamMarkup(id):escape(placeholder)}</span>${id&&winnerId===id?icon('check'):''}</div>`;
  }
  function renderPlayoffs(){
    const matchCount=state.playoffMatches.filter(m=>m.status==='done').length;
    const champion=state.playoffMatches.find(m=>m.round===3)?.winnerId;
    return `${pageBanner('DER WEG ZUM HAUSPOKAL','Die Playoffs','16 Teams. Vier K.-o.-Runden. Am Ende bleibt genau ein Champion.','16')}
      <div class="container content-pad"><div class="tool-row"><div class="tool-left"><span class="badge gold">${icon('trophy')} SINGLE ELIMINATION</span><span class="badge">${matchCount} / 15 entschieden</span></div><span class="demo-label">${state.phase==='playoffs'?'PLAYOFFS FREIGEGEBEN':'VORSCHAU – PLÄTZE NOCH OFFEN'}</span></div>
        <div class="notice" style="margin-bottom:24px">${icon('info')}<div>Gruppensieger spielen gegen Zweitplatzierte einer anderen Gruppe. Beide Teams derselben Gruppe befinden sich in unterschiedlichen Hälften des Turnierbaums. Der Sieger jeder Partie rückt automatisch eine Runde weiter.</div></div>
        <div class="bracket-scroll"><div class="bracket">${ROUND_LABELS.map((name,r)=>{
          const matches=state.playoffMatches.filter(m=>m.round===r).sort((a,b)=>a.position-b.position);
          const length=8/2**r;
          const matchCells=Array.from({length},(_,pos)=>{
            const m=matches[pos];
            const placeholders=r===0?ROUND_SLOTS[pos].map(x=>`${x.charAt(1)}. Gruppe ${x.charAt(0)}`):['Sieger der Vorrunde','Sieger der Vorrunde'];
            return `<div class="bracket-match ${r===3?'championship':''}" style="grid-row:${2+pos*(2**(r+1))} / span ${2**(r+1)};align-self:center">${bracketTeam(m?.teamAId,placeholders[0],m?.winnerId)}${bracketTeam(m?.teamBId,placeholders[1],m?.winnerId)}<div class="bracket-small">${m?.status==='done'?'Abgeschlossen':m?.status==='live'?'LIVE · '+escape(state.tables.find(t=>t.id===m.tableId)?.name||''):m?.status==='ready'?'Bereit':`Spiel ${pos+1}`}</div></div>`;
          }).join('');
          return `<div class="bracket-col r${r+1}"><div class="bracket-header"><strong>${name}</strong><span>${16/2**r} Teams · ${length} ${length===1?'Spiel':'Spiele'}</span></div>${matchCells}</div>`;
        }).join('')}</div></div>
        <div class="trophy-block">${icon('trophy')}<span class="panel-caption">DER WEG ZUM TITEL</span><h2>${champion?teamMarkup(champion):'Wer holt sich die Krone?'}</h2><p>${champion?'Herzlichen Glückwunsch zum Cimbria Cup!':'Der Champion erscheint hier, sobald das Finale beendet ist.'}</p></div>
      </div>`;
  }

  function renderAdminTables(){
    const candidates=playableMatches();
    const suggestion=suggestedMatch();
    const content=state.tables.map(t=>{
      const m=tableMatch(t.id);
      let body='';
      if(!t.active){
        body=`<div class="table-body"><p>Der Tisch ist deaktiviert und erhält keine Spielvorschläge.</p></div><div class="table-actions"><button class="btn btn-quiet btn-sm" data-action="toggle-table" data-id="${t.id}">Tisch aktivieren</button><button class="btn btn-quiet btn-sm" data-action="rename-table" data-id="${t.id}">${icon('edit')}</button></div>`;
      } else if(!m){
        const chosen=ui.selections[t.id]||suggestion?.id||'';
        body=`<div class="table-body">${suggestion?`<div class="panel-caption" style="font-size:9px">${icon('spark')} AUTOMATISCHER VORSCHLAG</div><strong>${escape(matchTitle(suggestion))}</strong><p>${suggestion.type==='group'?'Gruppe '+suggestion.group:suggestion.type==='tiebreak'?'Entscheidungsspiel · '+suggestion.group:ROUND_LABELS[suggestion.round]} · Kann ohne Teamkonflikt zugewiesen werden.</p>`:`<strong>Noch kein Spiel verfügbar</strong><p>${state.phase==='registration'?'Zuerst die Gruppenauslosung starten.':'Alle spielbereiten Teams sind belegt oder Spiele noch nicht freigegeben.'}</p>`}</div>
          ${candidates.length?`<label class="sr-only" for="select-${t.id}">Spiel für ${escape(t.name)} auswählen</label><select class="table-select" id="select-${t.id}" data-selection="${t.id}">${candidates.map(c=>`<option value="${escape(c.id)}" ${chosen===c.id?'selected':''}>${escape(matchTitle(c))}</option>`).join('')}</select>`:''}
          <div class="table-actions"><button class="btn btn-gold btn-sm" data-action="assign" data-id="${t.id}" ${!candidates.length?'disabled':''}>${icon('check')} Zuweisen</button><button class="btn btn-quiet btn-sm" data-action="toggle-table" data-id="${t.id}">Deaktivieren</button><button class="btn btn-quiet btn-sm" data-action="rename-table" data-id="${t.id}" aria-label="${escape(t.name)} umbenennen">${icon('edit')}</button></div>`;
      } else if(m.status==='ready'){
        body=`<div class="table-body"><strong>${escape(teamLabel(m.teamAId))}</strong><p>gegen</p><strong>${escape(teamLabel(m.teamBId))}</strong><p>${m.type==='group'?'Gruppe '+m.group:m.type==='tiebreak'?'Entscheidungsspiel':ROUND_LABELS[m.round]} · Bereit zum Start</p></div><div class="table-actions"><button class="btn btn-gold btn-sm" data-action="start-match" data-id="${t.id}">${icon('play')} Spiel starten</button><button class="btn btn-quiet btn-sm" data-action="unassign" data-id="${t.id}">Freigeben</button></div>`;
      } else {
        body=`<div class="table-body"><div class="panel-caption" style="font-size:9px">SPIEL LÄUFT · BECHERZÄHLER</div>
<div class="cup-score-grid">${[['a',m.teamAId,m.cupsA??10],['b',m.teamBId,m.cupsB??10]].map(([side,team,cups])=>`
<div class="cup-team"><strong>${escape(teamLabel(team))}</strong><span class="cup-remaining">${cups}</span><small>Becher übrig</small><div class="cup-buttons">
<button class="btn btn-outline btn-sm" data-action="cup" data-id="${m.id}" data-side="${side}" data-delta="-1" ${cups<=0?'disabled':''}>−</button>
<button class="btn btn-outline btn-sm" data-action="cup" data-id="${m.id}" data-side="${side}" data-delta="1" ${cups>=10?'disabled':''}>+</button></div></div>`).join('')}</div><p>Sieger anschließend separat bestätigen.</p></div><div class="table-actions"><button class="btn btn-outline btn-sm" data-action="finish" data-match="${m.id}" data-winner="${m.teamAId}">${icon('trophy')} ${escape(teamLabel(m.teamAId))}</button><button class="btn btn-outline btn-sm" data-action="finish" data-match="${m.id}" data-winner="${m.teamBId}">${icon('trophy')} ${escape(teamLabel(m.teamBId))}</button></div>`;
      }
      return `<article class="table-card ${m?.status==='live'?'is-live':m?'is-ready':t.active?'':'inactive'}">
        <div class="table-title"><strong>${icon('table')} ${escape(t.name)}</strong><span class="badge ${m?.status==='live'?'green':m?'gold':''}">${!t.active?'Inaktiv':m?m.status==='live'?'Läuft':'Bereit':'Frei'}</span></div>${body}
      </article>`;
    }).join('');
    return `<div class="wide-line" style="margin-bottom:16px"><div><div class="card-title">Spieltische und Zuweisungen</div><div class="card-subtitle">Hybridmodus: Die App schlägt vor, die Turnierleitung entscheidet.</div></div><button class="btn btn-outline btn-sm" data-action="add-table">${icon('plus')} Tisch hinzufügen</button></div>
      <div class="table-grid">${content}</div>
      <div class="notice margin-top">${icon('shield')}<div>Automatische Vorschläge vermeiden parallele Spiele eines Teams und bevorzugen längere Pausen. Die manuelle Auswahl bleibt jederzeit möglich. Beim Abschluss wird der Tisch sofort wieder frei.</div></div>`;
  }
  function renderAdminResults(){
    const done=allMatches().filter(m=>m.status==='done').sort((a,b)=>(b.completedAt||0)-(a.completedAt||0));
    const ties=GROUPS.flatMap(g=>computeRanking(g).unresolved.map(teamIds=>({group:g,teamIds})));
    return `<div class="card-title" style="margin-bottom:5px">Ergebnisse & Entscheidungsrunden</div><p class="muted text-sm" style="line-height:1.7;margin-bottom:22px">Die Siegerauswahl erfolgt an den Spieltischen. Bereits abgeschlossene Partien können – soweit der Turnierverlauf dies noch zulässt – korrigiert werden.</p>
      ${ties.length?`<div class="notice danger-note" style="margin-bottom:20px">${icon('alert')}<div><strong>Offene Gleichstände:</strong> ${ties.map(t=>`Gruppe ${t.group}`).join(', ')}. Eine Entscheidungsrunde ist erforderlich.</div></div>${ties.map(t=>`<div class="admin-queue-row"><span>Gruppe ${t.group}: ${t.teamIds.map(teamLabel).map(escape).join(', ')}</span><button class="btn btn-outline btn-sm" data-action="tiebreak" data-group="${t.group}">Entscheidungsspiele</button></div>`).join('')}`:''}
      <div class="admin-queue" style="margin-top:20px">${done.length?done.slice(0,32).map(m=>{
        const other=m.winnerId===m.teamAId?m.teamBId:m.teamAId;
        const restricted=(m.type==='group'&&state.phase==='playoffs');
        return `<div class="admin-queue-row"><div><strong>${teamMarkup(m.winnerId)}</strong> <span class="muted">schlägt</span> ${teamMarkup(other)}<div class="muted text-xs" style="margin-top:6px">${m.type==='group'?'Gruppe '+m.group:m.type==='tiebreak'?'Entscheidungsspiel':ROUND_LABELS[m.round]} · ${timeString(m.completedAt)}</div></div><button class="btn btn-quiet btn-sm" data-action="correct" data-match="${m.id}" data-winner="${other}" ${restricted?'disabled title="Nach Playoff-Start gesperrt"':''}>${icon('edit')} Korrigieren</button></div>`;
      }).join(''):`<div class="view-empty">${icon('trophy')}<strong>Noch keine Ergebnisse</strong><p>Weise im Reiter „Spieltische“ ein Spiel zu, starte es und bestätige den Sieger.</p></div>`}</div>`;
  }
  function renderAdminTeams(){
    return `<div class="wide-line" style="margin-bottom:22px"><div><div class="card-title">Registrierte Teams</div><div class="card-subtitle">${state.teams.length} von ${MAX_TEAMS()} Plätzen vergeben</div></div><a class="btn btn-outline btn-sm" href="#/registration">${icon('plus')} Teamanmeldung öffnen</a></div>
      <div class="admin-team-list">${state.teams.map(t=>`<div class="admin-team"><div class="wide-line"><strong>${escape(t.name)}</strong>${state.phase==='registration'?`<span style="display:flex;gap:6px"><button class="tiny-button" data-action="rename-team" data-id="${escape(t.id)}" aria-label="Team umbenennen">${icon('edit')}</button><button class="tiny-button" data-action="delete-team" data-id="${escape(t.id)}" aria-label="Team löschen">${icon('close')}</button></span>`:''}</div><small>${t.players.map(escape).join(' · ')}</small></div>`).join('')}</div>
      <div class="notice margin-top">${icon('info')}<div>In dieser ersten Version können Teams vor dem Turnierstart umbenannt oder entfernt werden. Nach der Auslosung bleibt die Teilnehmerliste gesperrt, damit Ergebnisse und Gruppenzuordnung konsistent bleiben.</div></div>`;
  }
  function renderAdminMembers(){
    return `<div class="card-title">Admin-Mitglieder</div><p class="muted text-sm">Neue Admins mit ihrer E-Mail freigeben. Jede Person legt ein eigenes Passwort fest und bestätigt einmalig die E-Mail.</p>
    <form id="member-add" class="subtle-frame"><div class="field"><label>E-Mail-Adresse</label><input name="email" type="email" required></div>
    <div class="field"><label>Rolle</label><select name="role" class="table-select"><option value="supervisor">Turnieradmin (Spiele & Ergebnisse)</option><option value="admin">Hauptadmin (inklusive Mitgliederverwaltung)</option></select></div>
    <button class="btn btn-gold" type="submit">Mitglied freigeben</button></form>
    <div class="admin-team-list" style="margin-top:14px">${ui.adminMembers.map(m=>`<div class="admin-team">
    <strong>${escape(m.email)}</strong> · <small>${m.role==='admin'?'Hauptadmin':'Turnieradmin'} · ${m.enabled?(m.activated?'Aktiv':'Eingeladen'):'Deaktiviert'}</small>
    ${m.enabled&&m.email!=='henner@desma.africa'?`<button class="btn btn-quiet btn-sm" data-action="member-remove" data-email="${escape(m.email)}">Zugriff entziehen</button>`:''}
    </div>`).join('')}</div><div class="notice">Neue Mitglieder legen im Admin-Login unter „Ersten Zugang erstellen“ ihr Passwort fest.</div>`;
  }
  function renderAdminSettings(){
    const remain=state.matches.filter(m=>m.type==='group'&&m.status!=='done').length;
    const matchesReady=state.phase==='groups' && remain===0 && !tiebreaksUnfinished() && !GROUPS.some(g=>computeRanking(g).unresolved.length);
    const activeMatchCount=allMatches().filter(m=>m.status==='ready'||m.status==='live').length;
    return `<div class="card-title">Turniersteuerung</div><p class="muted text-sm" style="margin:8px 0 21px;line-height:1.7">Hier startet die Turnierleitung die nächste Phase. Bestehende Ergebnisse werden vor versehentlichem Überschreiben geschützt.</p>
      <div class="subtle-frame"><div class="panel-caption">SCHRITT 1 · GRUPPENPHASE</div><h3 class="serif" style="font-size:22px;margin:8px 0">Gruppen auslosen</h3><p class="muted text-sm" style="line-height:1.7;margin:0 0 16px">Die angemeldeten Teams werden automatisch auf acht Gruppen verteilt. Für jede Gruppe wird jeder gegen jeden angesetzt.</p><button class="btn btn-gold" data-action="start-groups" ${state.phase!=='registration'||state.teams.length<24?'disabled':''}>${icon('shuffle')} Gruppenphase starten</button></div>
      <div class="subtle-frame" style="margin-top:14px"><div class="panel-caption">SCHRITT 2 · ECHTE ERGEBNISSE</div><h3 class="serif" style="font-size:22px;margin:8px 0">Gruppenspiele abschließen</h3><p class="muted text-sm" style="line-height:1.7;margin:0">Noch offen: <strong>${remain}</strong>. Bitte Sieger an den jeweiligen Tischen bestätigen.</p></div>
      <div class="subtle-frame" style="margin-top:14px"><div class="panel-caption">SCHRITT 3 · PLAYOFFS</div><h3 class="serif" style="font-size:22px;margin:8px 0">Playoffs freigeben</h3><p class="muted text-sm" style="line-height:1.7;margin:0 0 16px">Die acht Gruppensieger und acht Gruppenzweiten werden automatisch für das Achtelfinale gesetzt. Bei ungelösten Gleichständen ist dieser Schritt gesperrt.</p><button class="btn btn-gold" data-action="start-playoffs" ${matchesReady?'':'disabled'}>${icon('trophy')} Playoffs starten</button></div>
      <div class="admin-separator"></div>
<form id="team-limit" class="subtle-frame"><h3 class="serif" style="font-size:22px">Maximale Teamanzahl</h3>
<p class="muted text-sm">16 bis 512 Teams, vor der Auslosung änderbar. Größere Turniere führen zu mehr Gruppenspielen.</p>
<div class="field"><input type="number" name="limit" min="16" max="512" value="${MAX_TEAMS()}" required></div>
<button class="btn btn-outline" type="submit" ${state.phase!=='registration'||ui.saving?'disabled':''}>Teamlimit speichern</button>
</form><div class="subtle-frame" style="margin-top:14px"><h3 class="serif" style="font-size:22px;margin:0 0 8px">Öffentliche Teamanmeldung</h3>
       <p class="muted text-sm">Anmeldungen sind ${state.registrationOpen?'geöffnet':'geschlossen'}. Gäste benötigen kein Benutzerkonto.</p>
       <button class="btn btn-outline" data-action="toggle-registration" ${state.phase!=='registration'||ui.saving?'disabled':''}>${icon(state.registrationOpen?'lock':'users')} ${state.registrationOpen?'Anmeldung schließen':'Anmeldung öffnen'}</button></div>`;
  }
  function renderAdmin(){
    if (!CLOUD.isAdmin) {
      return `${pageBanner('TURNIERLEITUNG · GESCHÜTZT','Admin <em>Login</em>','Nur freigegebene Turnierleiter dürfen Spiele und Ergebnisse verwalten.')}
      <div class="container content-pad"><section class="v2-glass v2-panel" style="max-width:540px;margin:0 auto">
      <div class="v2-form-title"><span class="v2-form-icon">${icon('lock')}</span><div>
      <h2>Sicher anmelden</h2><p>Mit deiner Admin-E-Mail und deinem Passwort anmelden – ganz ohne Bestätigungs-E-Mail.</p></div></div>
      ${CLOUD.email?`<div class="notice">${icon('info')} Angemeldet als ${escape(CLOUD.email)}, aber für die Turnierleitung nicht freigeschaltet.</div>`:''}
      <form id="cimbria-admin-login"><div class="field"><label for="admin-email">Admin-E-Mail</label>
      <input type="email" id="admin-email" name="email" autocomplete="email" required
      value="${escape(ui.authEmail)}" placeholder="name@example.com"></div>
      <div class="field"><label for="admin-password">Passwort</label>
      <input type="password" id="admin-password" name="password" autocomplete="current-password"
        minlength="8" required placeholder="Admin-Passwort"></div>
      <button class="btn btn-gold v2-submit" type="submit" ${ui.saving?'disabled':''}>${icon('lock')} Als Admin anmelden</button></form>
      <p class="muted text-sm" style="margin-top:20px">Teilnehmer und Zuschauer benötigen keinen Account.</p>
<button class="btn btn-quiet btn-sm" data-action="signup-toggle">Ersten Zugang für eingeladene Admins erstellen</button>
${ui.signupOpen?`<form id="admin-signup" class="subtle-frame">
<div class="field"><label>E-Mail</label><input type="email" name="email" required></div>
<div class="field"><label>Passwort</label><input type="password" name="password" minlength="10" required></div>
<button class="btn btn-outline" type="submit">Zugang erstellen</button></form>`:''}
      </section></div>`;
    }
    const activeCount=state.tables.filter(t=>t.active).length;
    const liveCount=allMatches().filter(m=>m.status==='live').length;
    const complete=allMatches().filter(m=>m.status==='done').length;
    const suggestion=suggestedMatch();
    const groupDone=groupMatches().filter(m=>m.status==='done').length;
    const groupTotal=groupMatches().length;
    return `${pageBanner('TURNIERLEITUNG · HYBRIDMODUS','Admin <em>Control Center</em>','Tische steuern. Begegnungen verwalten. Den Weg zum Finale freigeben.')}
      <div class="container content-pad v2-admin-page">
      <div class="v2-admin-notice">${icon('shield')} <span><b>Geschützter Admin-Bereich</b> · ${escape(CLOUD.email)} · Änderungen werden in Supabase gespeichert.</span>
      <button class="btn btn-quiet btn-sm" data-action="admin-logout">Abmelden</button></div>
      <div class="v2-admin-top"><section class="v2-glass v2-panel v2-admin-phase"><div class="v2-panel-title"><div>${icon('grid')}<span>TURNIERSTATUS</span></div></div>
        <span class="v2-eyebrow">Aktuelle Phase</span><h2>${state.phase==='registration'?'Anmeldung':state.phase==='groups'?'Gruppenphase':'Playoffs'}</h2><p>${state.teams.length} / ${MAX_TEAMS()} Teams registriert</p>
        <div class="progress-track"><div class="progress-bar" style="width:${groupTotal?Math.round(groupDone/groupTotal*100):0}%"></div></div>
        <small>${groupDone} / ${groupTotal} reguläre Gruppenspiele</small>
        <div class="v2-admin-metrics"><div>${icon('table')}<span>Aktive Tische</span><strong>${activeCount}</strong></div><div>${icon('radio')}<span>Live-Spiele</span><strong>${liveCount}</strong></div><div>${icon('check')}<span>Abgeschlossen</span><strong>${complete}</strong></div></div>
        <button class="btn btn-outline btn-block" data-action="admin-tab" data-tab="settings">${icon('settings')} Turnier steuern</button></section>
      <section class="v2-glass v2-panel v2-admin-tables-spotlight"><div class="v2-panel-title"><div>${icon('table')}<span>SPIELTISCHE (${state.tables.length})</span></div><button class="btn btn-outline btn-sm" data-action="admin-tab" data-tab="tables">Alle verwalten ${icon('arrow')}</button></div>
        <div class="v2-table-overview">${state.tables.slice(0,6).map(t=>{const m=tableMatch(t.id);return `<div class="v2-table-tile"><div class="wide-line"><strong>${escape(t.name)}</strong><span class="v2-status ${!t.active?'is-disabled':m?.status==='live'?'is-live':m?'is-ready':'is-free'}">${!t.active?'Inaktiv':m?.status==='live'?'Läuft':m?'Bereit':'Frei'}</span></div><div class="v2-table-decor">${icon('table')}</div><p>${m?`${teamMarkup(m.teamAId)}<br><span>gegen</span><br>${teamMarkup(m.teamBId)}`:'Kein Spiel zugewiesen'}</p><button data-action="admin-tab" data-tab="tables" class="btn btn-outline btn-sm">Tisch öffnen ${icon('chevron')}</button></div>`}).join('')}</div></section>
      <section class="v2-glass v2-panel v2-admin-next"><div class="v2-panel-title"><div>${icon('clock')}<span>NÄCHSTES SPIEL</span></div></div>
        ${suggestion?`<div class="v2-admin-proposal"><span class="v2-eyebrow">AUTOMATISCHER VORSCHLAG</span><h3>${teamMarkup(suggestion.teamAId)}</h3><span class="v2-vs">VS</span><h3>${teamMarkup(suggestion.teamBId)}</h3><small>${suggestion.type==='group'?`Gruppe ${suggestion.group}`:suggestion.type==='tiebreak'?'Entscheidungsspiel':ROUND_LABELS[suggestion.round]}</small></div>`:`<div class="v2-mini-empty"><strong>Noch keine Begegnungen</strong><span>Im Turnierbereich zuerst die Auslosung starten.</span></div>`}
        <button class="btn btn-gold btn-block" data-action="admin-tab" data-tab="tables">Tischzuweisung öffnen ${icon('arrow')}</button></section></div>
        <div class="v2-admin-workspace"><section class="v2-glass v2-panel"><div class="v2-panel-title"><div>${icon('settings')}<span>TURNIERVERWALTUNG</span></div><span>Hybridmodus</span></div><div class="tab-row">${[['tables','Spieltische'],['results','Ergebnisse'],['teams','Teams'],['settings','Turnier'],['members','Mitglieder']].map(([tab,label])=>`<button class="tab-btn ${ui.adminTab===tab?'active':''}" data-action="admin-tab" data-tab="${tab}">${label}</button>`).join('')}</div><div class="v2-admin-tab-content">${ui.adminTab==='tables'?renderAdminTables():ui.adminTab==='results'?renderAdminResults():ui.adminTab==='teams'?renderAdminTeams():ui.adminTab==='members'?renderAdminMembers():renderAdminSettings()}</div></section>
        <aside class="v2-glass v2-panel"><div class="v2-panel-title"><div>${icon('clock')}<span>LETZTE AKTIVITÄTEN</span></div></div>${state.log.slice(0,8).map(e=>`<div class="admin-event">${icon('check')}<div>${escape(e.text)}<time>${timeString(e.time)} Uhr</time></div></div>`).join('')}</aside></div>
      </div>`;
  }
  function render(keepScroll=true){
    const el=document.getElementById('app');
    if(!el)return;
    const scrollY=window.scrollY;
    const views={home:renderHome,registration:renderRegistration,live:renderLive,playoffs:renderPlayoffs,admin:renderAdmin,teams:renderTeams,schedule:renderSchedule,info:renderInfo};
    el.innerHTML=`${renderHeader()}<main id="content">${(views[ui.page]||views.home)()}</main>${renderFooter()}${renderMobileTabs()}${ui.toast?`<div class="toast ${ui.toast.error?'error':''}" role="status">${icon(ui.toast.error?'alert':'check')}<span>${escape(ui.toast.message)}</span><button class="tiny-button" aria-label="Hinweis schließen" data-action="close-toast">${icon('close')}</button></div>`:''}`;
    if(keepScroll)window.scrollTo(0,scrollY);
  }
  function renameTeam(id){
    if(state.phase!=='registration')return;
    const team=teamById(id);
    if(!team)return;
    const changed=window.prompt('Neuer Teamname:',team.name);
    if(changed===null)return;
    const name=changed.trim();
    if(name.length<3||name.length>35){notify('Teamnamen müssen zwischen 3 und 35 Zeichen lang sein.',true);return;}
    if(state.teams.some(t=>t.id!==id&&t.name.toLowerCase()===name.toLowerCase())){notify('Teamname bereits vergeben.',true);return;}
    team.name=name;
    logAction(`Team umbenannt in ${name}.`);
    commit('Teamname aktualisiert.');
  }
  function deleteTeam(id){
    if(state.phase!=='registration')return;
    const team=teamById(id);
    if(!team)return;
    if(!window.confirm(`Team „${team.name}“ aus der Anmeldung entfernen?`))return;
    state.teams=state.teams.filter(t=>t.id!==id);
    logAction(`Team ${team.name} entfernt.`);
    commit('Team entfernt. Der Platz ist wieder frei.');
  }
  function handleAction(btn){
    const action=btn.dataset.action;
    const publicActions=['menu','live-filter','live-expand','group',
      'add-player','remove-player','close-toast'];
    if(ui.saving && !['menu','close-toast'].includes(action))return;
    if(!CLOUD.isAdmin && !publicActions.includes(action) && action!=='signup-toggle')return;
    switch(action){
      case 'toggle-registration':
        if(state.phase!=='registration')break;
        state.registrationOpen=!state.registrationOpen;
        commit(state.registrationOpen?'Anmeldung ist geöffnet.':'Anmeldung wurde geschlossen.');
        break;
      case 'admin-logout':
        ui.saving=true;
        CLOUD.logout().then(()=>{ui.saving=false;notify('Abgemeldet.');})
          .catch(e=>{ui.saving=false;notify(e.message,true);});
        break;
      case 'signup-toggle':ui.signupOpen=!ui.signupOpen;render();break;
case 'menu':ui.mobileMenu=!ui.mobileMenu;render();break;
      case 'admin-tab':
ui.adminTab=btn.dataset.tab;render();
if(ui.adminTab==='members')CLOUD.getMembers().then(m=>{ui.adminMembers=m;render();}).catch(e=>notify(e.message,true));break;
case 'cup':
ui.saving=true;CLOUD.updateCups(btn.dataset.id,btn.dataset.side,Number(btn.dataset.delta)).then(next=>{state=next;ui.saving=false;render();}).catch(e=>{ui.saving=false;notify(e.message,true);});break;
case 'member-remove':
if(!window.confirm('Admin-Zugriff entziehen?'))break;
ui.saving=true;CLOUD.changeMember('remove',btn.dataset.email).then(m=>{ui.adminMembers=m;ui.saving=false;render();}).catch(e=>{ui.saving=false;notify(e.message,true);});break;
      case 'live-filter':ui.liveFilter=btn.dataset.filter;ui.liveExpanded=false;render();break;
      case 'live-expand':ui.liveExpanded=true;render();break;
      case 'group':ui.liveGroup=btn.dataset.group;render();break;
      case 'add-player':
        if(ui.registration.players.length<4&&state.registrationOpen){ui.registration.players.push('');render();document.querySelector(`[data-player="${ui.registration.players.length-1}"]`)?.focus();}
        break;
      case 'remove-player':
        if(ui.registration.players.length>2){ui.registration.players.splice(int(btn.dataset.index),1);render();}
        break;
      case 'add-table':addTable();break;
      case 'toggle-table':toggleTable(btn.dataset.id);break;
      case 'rename-table':renameTable(btn.dataset.id);break;
      case 'assign':{
        const tableId=btn.dataset.id;
        const matchId=ui.selections[tableId]||suggestedMatch()?.id;
        if(matchId)assignMatch(tableId,matchId);
        else notify('Kein verfügbares Spiel gefunden.',true);
        break;
      }
      case 'start-match':startMatch(btn.dataset.id);break;
      case 'unassign':undoAssignment(btn.dataset.id);break;
      case 'finish':finishMatch(btn.dataset.match,btn.dataset.winner);break;
      case 'correct':updateWinner(btn.dataset.match,btn.dataset.winner);break;
      case 'tiebreak':addTiebreak(btn.dataset.group);break;
      case 'start-groups':drawGroups();break;
      case 'finish-demo-groups':completeDemoGroups();break;
      case 'start-playoffs':startPlayoffs();break;
      case 'rename-team':renameTeam(btn.dataset.id);break;
      case 'delete-team':deleteTeam(btn.dataset.id);break;
      case 'reset':resetDemo();break;
      case 'close-toast':ui.toast=null;clearTimeout(toastTimeout);render();break;
    }
  }
  document.addEventListener('click',event=>{
    const btn=event.target.closest('[data-action]');
    if(btn && !btn.disabled){event.preventDefault();handleAction(btn);}
    else if(event.target.closest('a[href^="#/"]'))ui.mobileMenu=false;
  });
  document.addEventListener('input',event=>{
    const target=event.target;
    if(target.dataset.draft==='name'){ui.registration.teamName=target.value;return;}
    if(target.dataset.player!==undefined){ui.registration.players[Number(target.dataset.player)]=target.value;return;}
    if(target.id==='team-search'){
      ui.teamSearch=target.value;const pos=target.selectionStart;render();const el=document.getElementById('team-search');if(el){el.focus();el.setSelectionRange(pos,pos);}return;
    }
    if(target.id==='live-search'){
      ui.liveSearch=target.value;
      const pos=target.selectionStart;
      render();
      const replacement=document.querySelector('#live-search');
      if(replacement){replacement.focus();replacement.setSelectionRange(pos,pos);}
    }
  });
  document.addEventListener('change',event=>{
    const tableId=event.target.dataset.selection;
    if(tableId)ui.selections[tableId]=event.target.value;
  });
  document.addEventListener('submit',event=>{
    if(event.target.id==='team-limit'){
event.preventDefault();if(ui.saving)return;
ui.saving=true;CLOUD.setTeamLimit(Number(event.target.elements.limit.value)).then(s=>{state=s;ui.saving=false;notify('Teamlimit gespeichert.');}).catch(e=>{ui.saving=false;notify(e.message,true);});return;
}
if(event.target.id==='member-add'){
event.preventDefault();if(ui.saving)return;
ui.saving=true;CLOUD.changeMember('add',event.target.elements.email.value.trim(),event.target.elements.role.value).then(m=>{ui.adminMembers=m;ui.saving=false;notify('Admin freigegeben.');}).catch(e=>{ui.saving=false;notify(e.message,true);});return;
}
if(event.target.id==='admin-signup'){
event.preventDefault();if(ui.saving)return;
const em=event.target.elements.email.value.trim(),pw=event.target.elements.password.value;
event.target.elements.password.value='';ui.saving=true;
CLOUD.registerInvitedAdmin(em,pw).then(()=>{ui.saving=false;notify('Zugang angelegt: Bitte E-Mail einmal bestätigen.');}).catch(e=>{ui.saving=false;notify(e.message,true);});return;
}
if(event.target.id==='cimbria-admin-login'){
      event.preventDefault();
      if(ui.saving)return;
      const email=event.target.elements.email.value.trim();
      const password=event.target.elements.password.value;
      event.target.elements.password.value='';
      ui.authEmail=email;ui.saving=true;render();
      CLOUD.signInAdmin(email,password).then(()=>{
        ui.saving=false;
        notify('Erfolgreich als Turnierleitung angemeldet.');
      }).catch(e=>{
        ui.saving=false;
        notify('Login fehlgeschlagen: '+(e.message||'E-Mail oder Passwort prüfen.'),true);
      });
      return;
    }
    if(event.target.id!=='team-registration')return;
    if(ui.saving){event.preventDefault();return;}
    event.preventDefault();
    const form=event.target;
    ui.registration.teamName=form.elements.teamName.value;
    ui.registration.players=Array.from(form.querySelectorAll('input[name="player"]')).map(el=>el.value);
    addTeam();
  });
  window.addEventListener('hashchange',()=>{ui.page=routeFromHash();ui.mobileMenu=false;render(false);window.scrollTo(0,0);});
  window.addEventListener('storage',event=>{
    if(event.key===STORE_KEY && event.newValue){
      state=load();render();
    }
  });
  ui.page=routeFromHash();
  render(false);
  CLOUD.initialize(next=>{
    state=next;
    ui.cloudLoading=false;
    render();
  },(admin,email)=>{
    if(admin)ui.authSent=false;
    if(email)ui.authEmail=email;
    render();
  }).catch(err=>{
    ui.cloudLoading=false;
    notify('Turnierdaten konnten nicht geladen werden: '+err.message,true);
  });
})();
