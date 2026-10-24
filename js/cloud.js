/* Cimbria Cup V3 - online data adapter. Public publishable key only.
 * Access is enforced by Supabase RLS and server-side RPCs. Never put service_role
 * credentials in this file or any other file deployed on GitHub Pages.
 */
(() => {
  "use strict";
  const URL = "https://cxjhlaavfsavokqflxti.supabase.co";
  const KEY = "sb_publishable_Z_beWnDCYEO4kBbZmq4Hxw_Q8D4fvt9";
  const SLUG = "cimbria-bierpong-cup";
  const supabase = window.supabase;
  if (!supabase?.createClient) {
    window.CimbriaCloud = { broken: true, error: "Supabase konnte nicht geladen werden." };
    return;
  }
  const client = supabase.createClient(URL, KEY, {
    auth: { persistSession: true, autoRefreshToken: true,
      detectSessionInUrl: true, storageKey: "cimbria-cup-admin-session" },
  });
  let authorized = false;
  let canManageMembers = false;
  let authEmail = "";
  let revision = 0;
  let tournamentId = null;
  let currentState = null;
  let onState = null;
  let onAuth = null;
  let channel = null;
  let busy = false;
  let requestCounter = 0;
  let poll = null;
  let authStarted = false;

  const db = (table) => client.from(table);
  const assert = (r) => {
    if (r.error) throw new Error(r.error.message || "Datenbankfehler");
    return r.data;
  };
  const empty = () => ({
    version: 3, phase: "registration", registrationOpen: false,
    teams: [], groups: [], matches: [], playoffMatches: [], tables: [], log: [],
    revision: 0, isPublished: false, maxTeams:32, minTeams:12, groupCount:8, playoffTeams:16,
    tvAutoIntros:true, tvAutoWins:true, tvRotateBracket:true, tvMainMatchId:null,
  });
  const timestamp = (value) => value ? Date.parse(value) : null;
  const normalize = (t, teams, players, groups, members, tables, matches, logs) => {
    const groupCodes = Object.fromEntries(groups.map(g => [g.id, g.code]));
    const groupIds = Object.fromEntries(groups.map(g => [g.code, g.id]));
    const registeredTeams = teams.map(row => ({
      id: row.id, name: row.name, iconId:row.icon_id||"crown",
      players: players.filter(p => p.team_id === row.id)
        .sort((a,b) => a.slot-b.slot).map(p => p.full_name),
      createdAt: timestamp(row.created_at),
    }));
    const mapped = matches.map(m => ({
      id: m.id, type: m.stage, group: m.group_id ? groupCodes[m.group_id] : undefined,
      round: m.round_no, position: m.bracket_position, order: m.order_index,
      teamAId: m.team_a_id, teamBId: m.team_b_id,
      winnerId: m.winner_team_id, status: m.status,
      tableId: m.table_id, playedTableId: m.played_table_id,cupsA:m.cups_a,cupsB:m.cups_b,
      startedAt: timestamp(m.started_at), completedAt: timestamp(m.completed_at),
    }));
    return {
      version: 3, phase: t.phase, registrationOpen: t.registration_open,
      isPublished: t.is_published, revision: t.revision, maxTeams:t.max_teams, minTeams:t.min_teams,
      groupCount:t.group_count,playoffTeams:t.playoff_teams,
      tvAutoIntros:t.tv_auto_intros, tvAutoWins:t.tv_auto_wins,
      tvRotateBracket:t.tv_rotate_bracket, tvMainMatchId:t.tv_main_match_id,
      teams: registeredTeams,
      groups: t.phase === "registration" ? [] : groups.slice(0,t.group_count).map(g => ({
        name: g.code, id: groupIds[g.code],
        teamIds: members.filter(m => m.group_id === g.id).map(m => m.team_id),
      })),
      matches: mapped.filter(m => m.type !== "playoff"),
      playoffMatches: mapped.filter(m => m.type === "playoff"),
      tables: tables.map(t => ({
        id: t.id, name: t.name, active: t.active, sortOrder: t.sort_order,
      })),
      log: logs.map(a => ({
        id: String(a.id), time: timestamp(a.created_at),
        text: ({ INSERT:"Hinzugefügt",UPDATE:"Aktualisiert",DELETE:"Entfernt" })[a.action] +
          ": " + ({matches:"Spiel",teams:"Team",game_tables:"Tisch",tournaments:"Turnier"})[a.entity],
      })),
    };
  };

  async function role() {
    const { data: { user }, error } = await client.auth.getUser();
    if (error && !/missing|session/i.test(error.message || "")) console.warn("Auth:", error.message);
    authEmail = user?.email || "";
    authorized = false;
    canManageMembers = false;
    if (user) {
      const r = await db("admin_users").select("role,active")
        .eq("user_id", user.id).eq("active",true).maybeSingle();
      authorized = !r.error && !!r.data;
      canManageMembers = authorized && r.data?.role === "admin";
    }
    onAuth?.(authorized, authEmail);
    return authorized;
  }
  async function reload() {
    const key = ++requestCounter;
    const t = assert(await db("tournaments")
      .select("id,name,slug,phase,registration_open,is_published,revision,max_teams,min_teams,group_count,playoff_teams,tv_auto_intros,tv_auto_wins,tv_rotate_bracket,tv_main_match_id")
      .eq("slug",SLUG).maybeSingle());
    if (!t) {
      const blank = empty();
      if (key !== requestCounter) return currentState || blank;
      currentState = blank; revision = 0; tournamentId = null;
      onState?.(blank);
      return blank;
    }
    const [
      teamR,groupR,memberR,tableR,matchR,
    ] = await Promise.all([
      db("teams").select("id,name,icon_id,created_at").eq("tournament_id",t.id).order("created_at"),
      db("groups").select("id,code,sort_order").eq("tournament_id",t.id).order("sort_order"),
      db("group_members").select("group_id,team_id").eq("tournament_id",t.id),
      db("game_tables").select("id,name,sort_order,active").eq("tournament_id",t.id).order("sort_order"),
      db("matches").select("id,group_id,stage,round_no,bracket_position,order_index,team_a_id,team_b_id,winner_team_id,status,table_id,played_table_id,started_at,completed_at,cups_a,cups_b")
        .eq("tournament_id",t.id).order("order_index"),
    ]);
    const teams = assert(teamR), groups = assert(groupR), members = assert(memberR);
    const tables = assert(tableR), matches = assert(matchR);
    let players = [], logs = [];
    if (authorized) {
      const prs = [
        teams.length
          ? db("players").select("team_id,slot,full_name").in("team_id", teams.map(x=>x.id))
          : Promise.resolve({data:[],error:null}),
        db("audit_events").select("id,entity,action,created_at")
          .eq("tournament_id",t.id).order("created_at",{ascending:false}).limit(20),
      ];
      const [p,l] = await Promise.all(prs);
      players = assert(p); logs = assert(l);
    }
    const result = normalize(t,teams,players,groups,members,tables,matches,logs);
    if (key !== requestCounter) return currentState || result;
    revision = t.revision; tournamentId = t.id; currentState = result;
    onState?.(result);
    return result;
  }
  function events() {
    if (channel) client.removeChannel(channel);
    const tables = ["tournaments","teams","groups","group_members","matches","game_tables"];
    channel = client.channel("cimbria-live-" + Date.now());
    tables.forEach(table => {
      channel.on("postgres_changes", { event:"*", schema:"public", table },
        () => { if (!busy && !document.hidden) reload().catch(console.warn); });
    });
    channel.subscribe();
  }
  async function initialize(stateCallback, authCallback) {
    onState = stateCallback; onAuth = authCallback;
    if (authStarted) return reload();
    authStarted = true;
    client.auth.onAuthStateChange(() => {
      // Delay all Supabase API calls until the auth callback has finished.
      setTimeout(() => role().then(() => {
        events(); return reload();
      }).catch(console.warn), 0);
    });
    await role();
    const data = await reload();
    events();
    if (poll) clearInterval(poll);
    poll = setInterval(() => {
      if (!document.hidden && !busy) reload().catch(console.warn);
    }, 20000);
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden && !busy) reload().catch(console.warn);
    });
    return data;
  }
  function payload(s) {
    return {
      phase:s.phase, registrationOpen:!!s.registrationOpen,
      teams:s.teams.map(t=>({id:t.id,name:t.name})),
      groups:s.groups.map(g=>({name:g.name,teamIds:g.teamIds})),
      tables:s.tables.map(t=>({id:t.id,name:t.name,active:t.active,sortOrder:t.sortOrder||0})),
      matches:s.matches.map(m=>({
        id:m.id,type:m.type,group:m.group,round:m.round||0,position:m.position||0,order:m.order||0,
        teamAId:m.teamAId,teamBId:m.teamBId,winnerId:m.winnerId,status:m.status,
        tableId:m.tableId,playedTableId:m.playedTableId,
        startedAt:m.startedAt,completedAt:m.completedAt,
      })),
      playoffMatches:s.playoffMatches.map(m=>({
        id:m.id,type:m.type,round:m.round||0,position:m.position||0,order:m.order||0,
        teamAId:m.teamAId,teamBId:m.teamBId,winnerId:m.winnerId,status:m.status,
        tableId:m.tableId,playedTableId:m.playedTableId,
        startedAt:m.startedAt,completedAt:m.completedAt,
      })),
    };
  }
  async function save(s) {
    if (!authorized) throw new Error("Bitte zuerst als Administrator anmelden.");
    if (!tournamentId) throw new Error("Das Turnier ist nicht verfügbar.");
    if (busy) throw new Error("Bitte warte, bis die vorherige Änderung gespeichert ist.");
    busy = true;
    try {
      const r = await client.rpc("cimbria_admin_save_state", {
        p_slug:SLUG,p_revision:revision,p_state:payload(s),
      });
      assert(r);
      revision = Number(r.data);
      return await reload();
    } finally { busy=false; }
  }
  async function guestRegister(teamName, players, iconId="crown") {
    if (busy) throw new Error("Bitte warte einen Moment.");
    busy=true;
    try {
      const { data, error } = await client.functions.invoke("cimbria-register-team", {
        body: {teamName, players, iconId},
      });
      if (error) {
        let msg = error.message || "Anmeldung fehlgeschlagen.";
        try {
          const content = await error.context?.json();
          if (content?.error) msg = content.error;
        } catch (_) { /* use original message */ }
        throw new Error(msg);
      }
      if (!data?.success) throw new Error(data?.error || "Anmeldung fehlgeschlagen.");
      await reload();
      return data;
    } finally { busy=false; }
  }
  async function signInAdmin(email,password) {
    const result = await client.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (result.error) throw new Error("E-Mail oder Passwort ungültig.");
    const allowed = await role();
    if (!allowed) {
      await client.auth.signOut();
      await role();
      throw new Error("Dieses Konto besitzt keine Freigabe für die Turnierleitung.");
    }
    await reload();
    return true;
  }
  async function setTeamLimit(max){assert(await client.rpc("cimbria_set_max_teams",{p_max:max}));return reload();}
  async function updateCups(id,side,delta){assert(await client.rpc("cimbria_update_cups",{p_match:id,p_team:side,p_delta:delta}));return reload();}
  async function editTeam(teamId,name,players,groupCode=null,swapTeamId=null,expectedRevision=revision) {
    if (!authorized) throw new Error("Nur Turnieradmins dürfen Teams ändern.");
    if (busy) throw new Error("Bitte die laufende Speicherung abwarten.");
    if (!Array.isArray(players) || players.length<2 || players.length>4)
      throw new Error("Jedes Team benötigt zwei bis vier Mitglieder.");
    if (!Number.isSafeInteger(Number(expectedRevision)))
      throw new Error("Ungültiger Turnierstand. Bitte die Seite aktualisieren.");
    busy = true;
    try {
      const result = assert(await client.rpc("cimbria_admin_edit_team",{
        p_team_id:teamId,
        p_name:String(name).trim(),
        p_players:players.map(p=>String(p).trim()),
        p_expected_revision:Number(expectedRevision),
        p_group_code:groupCode||null,
        p_swap_team_id:swapTeamId||null,
      }));
      if (!result?.success) throw new Error("Änderung wurde von Supabase nicht bestätigt.");
      revision=Number(result.revision);
      const next=await reload();
      return {state:next,details:result};
    } finally { busy=false; }
  }
  async function getMembers(){return assert(await client.rpc("cimbria_admin_members",{p_action:"list"}));}
  async function changeMember(action,email,role="supervisor"){assert(await client.rpc("cimbria_admin_members",{p_action:action,p_email:email,p_role:role}));return getMembers();}
  async function registerInvitedAdmin(email,password){
    const r=await client.auth.signUp({email:email.trim(),password,options:{emailRedirectTo:window.location.origin+window.location.pathname}});
    if(r.error)throw r.error;
    return true;
  }
  async function tvControl(action, matchId=null, value=null) {
    if (!authorized) throw new Error("Admin-Anmeldung erforderlich.");
    const r = await client.rpc("cimbria_tv_control",{
      p_action:action, p_match:matchId, p_value:value
    });
    assert(r);
    await reload();
    return r.data;
  }
  async function resetTournament(confirmation,expectedRevision) {
    if (!authorized || !canManageMembers)
      throw new Error("Nur Hauptadmins dürfen das Turnier zurücksetzen.");
    if (busy) throw new Error("Bitte auf die laufende Datenbankänderung warten.");
    if (confirmation !== "CIMBRIA RESET")
      throw new Error("Die Sicherheitsbestätigung ist ungültig.");
    if (!Number.isSafeInteger(expectedRevision) || expectedRevision < 0)
      throw new Error("Bitte den aktuellen Turnierstand neu laden.");
    busy = true;
    try {
      const response = assert(await client.rpc("cimbria_reset_tournament",{
        p_slug: SLUG,
        p_expected_revision: expectedRevision,
        p_confirmation: confirmation,
      }));
      if (!response?.success)
        throw new Error("Das Zurücksetzen wurde von Supabase nicht bestätigt.");
      revision = Number(response.new_revision);
      await reload();
      return response;
    } finally { busy = false; }
  }
  async function logout() {
    const r = await client.auth.signOut();
    if (r.error) throw r.error;
    authorized=false;canManageMembers=false;authEmail="";
    onAuth?.(false,"");
    return await reload();
  }
  window.CimbriaCloud = {
    initialize, reload, save, guestRegister, signInAdmin, logout,setTeamLimit,updateCups,getMembers,changeMember,registerInvitedAdmin,tvControl,resetTournament,editTeam,
    get isAdmin() { return authorized; },
    get canManageMembers() { return canManageMembers; },
    get email() { return authEmail; },
    get isBusy() { return busy; },
    get isConfigured() { return !!tournamentId; },
    get current() { return currentState; },
  };
})();
