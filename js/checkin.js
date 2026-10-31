/* Cimbria private guest check-in.
 * This file contains NO guest names, contact data or attendance states.
 * Only authenticated, allowlisted admins can read the RLS-protected Supabase table.
 */
(() => {
  "use strict";
  const API_URL = "https://cxjhlaavfsavokqflxti.supabase.co";
  const PUBLISHABLE_KEY = "sb_publishable_Z_beWnDCYEO4kBbZmq4Hxw_Q8D4fvt9";
  const STORAGE_KEY = "cimbria-cup-admin-session";
  const LIST_KEY = "cimbria-gaesteliste";

  const els = id => document.getElementById(id);
  const state = {
    guests: [], user: null, allowed: false, activeFilter: "all",
    search: "", expanded: new Set(), pending: new Set(),
    loading: false, busyAuth: false, toastTimer: null, reloadTimer: null,
    channel: null, pollTimer: null, started: false
  };
  const clean = text => String(text || "").replace(/[&<>"']/g,
    char => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]));
  const folded = text => String(text || "").toLocaleLowerCase("de")
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const when = time => {
    if (!time) return "";
    const dt = new Date(time);
    return Number.isFinite(dt.valueOf())
      ? dt.toLocaleTimeString("de-DE", {hour:"2-digit", minute:"2-digit"})+" Uhr"
      : "";
  };
  const client = window.supabase?.createClient?.(API_URL, PUBLISHABLE_KEY, {
    auth: {
      storageKey: STORAGE_KEY, persistSession: true, autoRefreshToken: true,
      detectSessionInUrl: true
    }
  });
  function showSection(section) {
    ["ci-boot","ci-auth","ci-denied","ci-dashboard"].forEach(id => {
      els(id).hidden = id !== section;
    });
  }
  function notice(text, error = false) {
    const toast = els("ci-toast");
    if (state.toastTimer) clearTimeout(state.toastTimer);
    toast.textContent = text;
    toast.classList.toggle("error", Boolean(error));
    toast.hidden = false;
    state.toastTimer = setTimeout(() => toast.hidden = true, 3700);
  }
  function connection(online) {
    const icon = document.querySelector(".ci-live-indicator");
    if (!icon) return;
    icon.classList.toggle("is-offline", !online);
    icon.lastChild.textContent = online
      ? " Mit Supabase synchronisiert"
      : " Verbindung prüfen";
  }
  function clearPrivateData() {
    state.allowed = false;
    state.guests = [];
    state.pending.clear();
    state.expanded.clear();
    state.user = null;
    els("ci-people").replaceChildren();
    if (state.channel) {
      client?.removeChannel?.(state.channel);
      state.channel = null;
    }
  }
  async function authorize() {
    if (!client) {
      showSection("ci-denied");
      els("ci-denied").querySelector("p").textContent =
        "Die Verbindung zur Anmeldung konnte nicht geladen werden. Bitte die Seite neu öffnen.";
      return;
    }
    if (state.busyAuth) return;
    state.busyAuth = true;
    try {
      const { data, error } = await client.auth.getUser();
      if (error && !/missing|session/i.test(error.message || "")) {
        console.warn("Gäste-Check-in Auth", error.message);
      }
      const user = data?.user;
      if (!user) {
        clearPrivateData();
        showSection("ci-auth");
        return;
      }
      const roleRes = await client.from("admin_users").select("role,active")
        .eq("user_id",user.id).eq("active",true).maybeSingle();
      if (roleRes.error || !roleRes.data?.active) {
        clearPrivateData();
        showSection("ci-denied");
        return;
      }
      state.allowed = true;
      state.user = user;
      els("ci-current-user").textContent = user.email || "Angemeldeter Admin";
      showSection("ci-dashboard");
      await refreshGuests({ silent: false });
      if (state.allowed && state.guests.length === 0) {
        // We know the checklist is pre-populated. Empty results can indicate
        // an allowlist/RLS block rather than an empty event registration.
        clearPrivateData();
        showSection("ci-denied");
        return;
      }
      subscribe();
    } catch (error) {
      clearPrivateData();
      showSection("ci-auth");
      els("ci-auth-error").textContent =
        "Gästeliste nicht erreichbar. Bitte die Verbindung prüfen und erneut anmelden.";
      els("ci-auth-error").hidden = false;
      console.warn("Guest check-in authorization:", error);
    } finally {
      state.busyAuth = false;
    }
  }

  async function refreshGuests({silent = true} = {}) {
    if (!state.allowed || state.loading || state.pending.size) return;
    state.loading = true;
    try {
      const response = await client.from("cimbria_guest_checkin")
        .select("id,source_index,guest_name,contact_detail,study_program,checked_in,checked_in_at,updated_at")
        .eq("list_key",LIST_KEY).order("source_index",{ascending:true});
      if (response.error) throw new Error(response.error.message);
      if (!state.allowed) return;
      state.guests = response.data || [];
      connection(true);
      render();
    } catch (error) {
      connection(false);
      if (!silent) notice("Anwesenheit konnte nicht geladen werden. Bitte Verbindung prüfen.",true);
      console.warn("Check-in sync:",error);
      throw error;
    } finally {
      state.loading = false;
    }
  }

  function subscribe() {
    if (!state.allowed || state.channel) return;
    state.channel = client.channel("cimbria-guest-checkin-"+Date.now())
      .on("postgres_changes",{
        event:"UPDATE",schema:"public",table:"cimbria_guest_checkin"
      }, payload => {
        if (!payload.new?.list_key || payload.new.list_key===LIST_KEY)
          queueReload();
      })
      .subscribe();
  }

  function queueReload() {
    if (!state.allowed) return;
    if (state.reloadTimer) clearTimeout(state.reloadTimer);
    state.reloadTimer = setTimeout(() => {
      if (!document.hidden && state.allowed)
        refreshGuests().catch(() => {});
    }, 350);
  }

  function filteredGuests() {
    const query = folded(state.search.trim());
    const digits = state.search.replace(/\D/g,"");
    return [...state.guests]
      .filter(person => state.activeFilter==="all"
        || (state.activeFilter==="present" && person.checked_in)
        || (state.activeFilter==="open" && !person.checked_in))
      .filter(person => {
        if (!query) return true;
        const searchable = folded([
          person.guest_name, person.study_program, person.contact_detail
        ].join(" "));
        return searchable.includes(query)
          || (digits.length>=3 && String(person.contact_detail||"")
                .replace(/\D/g,"").includes(digits));
      })
      .sort((a,b) => a.guest_name.localeCompare(b.guest_name,"de",{sensitivity:"base"})
        || a.source_index-b.source_index);
  }

  function personMarkup(person) {
    const present=Boolean(person.checked_in);
    const pending=state.pending.has(person.id);
    const details=state.expanded.has(person.id);
    const status=present ? "Anwesend" : "Noch offen";
    const checkLabel=present ? "Als nicht anwesend markieren" : "Als anwesend markieren";
    const contact=person.contact_detail || "Kein Kontakt angegeben";
    return `<article class="ci-person ${present?"is-present":""} ${pending?"is-pending":""}"
      role="listitem" data-person-id="${clean(person.id)}">
      <button class="ci-person-check" type="button" data-check-id="${clean(person.id)}"
        aria-pressed="${present}" aria-label="${clean(person.guest_name)}: ${checkLabel}"
        ${pending?"disabled":""}>
        <span class="ci-status-circle" aria-hidden="true">${present?"✓":"·"}</span>
        <span class="ci-person-copy">
          <span class="ci-person-name">${clean(person.guest_name)}</span>
          <span class="ci-person-degree">${clean(person.study_program || "Studiengang nicht angegeben")}</span>
        </span>
        <span class="ci-person-status">${pending?"Speichert…":status}</span>
      </button>
      <div class="ci-person-foot">
        <span class="ci-person-number">LISTE · ${String(person.source_index).padStart(2,"0")}</span>
        <button class="ci-contact-trigger" type="button" data-details-id="${clean(person.id)}"
          aria-expanded="${details}" aria-label="Kontaktdetails von ${clean(person.guest_name)} ${details?"verbergen":"anzeigen"}">
          ${details?"Details verbergen −":"Kontakt anzeigen +"}
        </button>
      </div>
      ${details?`<div class="ci-person-details">
        <strong>KONTAKT</strong><span>${clean(contact)}</span>
        ${person.checked_in_at?`<small>Eingecheckt um ${when(person.checked_in_at)}</small>`:""}
      </div>`:""}
    </article>`;
  }

  function render() {
    if (!state.allowed) return;
    const total = state.guests.length;
    const present = state.guests.filter(x=>x.checked_in).length;
    const remaining = total-present;
    const pct=total?Math.round(100*present/total):0;
    els("ci-present-count").textContent=String(present);
    els("ci-total-count").textContent=String(total);
    els("ci-open-count").textContent=String(remaining);
    els("ci-percent-count").textContent=pct+" %";
    els("ci-progress-fill").style.width=pct+"%";
    els("ci-progress-track").setAttribute("aria-valuenow",String(pct));
    els("ci-filter-total").textContent=String(total);
    els("ci-filter-present").textContent=String(present);
    els("ci-filter-open").textContent=String(remaining);
    document.querySelectorAll("[data-filter]").forEach(btn=>{
      const active=btn.dataset.filter===state.activeFilter;
      btn.classList.toggle("active",active);
      btn.setAttribute("aria-pressed",String(active));
    });
    const rows=filteredGuests();
    els("ci-match-count").textContent=rows.length===1?"1 Person":" "+rows.length+" Personen";
    els("ci-people").innerHTML=rows.map(personMarkup).join("");
    els("ci-empty").hidden=rows.length!==0;
  }

  async function toggleGuest(id) {
    if (!state.allowed || state.pending.has(id)) return;
    const person=state.guests.find(x=>x.id===id);
    if (!person) return;
    const prev=Boolean(person.checked_in);
    state.pending.add(id);
    person.checked_in=!prev;
    render();
    try {
      // Compare-and-swap: a second check-in operator cannot silently
      // overwrite an intervening change made from another device.
      const result = await client.from("cimbria_guest_checkin")
        .update({checked_in:!prev}).eq("id",id).eq("list_key",LIST_KEY)
        .eq("checked_in",prev)
        .select("id,checked_in,checked_in_at,updated_at").maybeSingle();
      if (result.error) throw result.error;
      if (!result.data) throw new Error("Ein anderes Gerät hat den Status geändert.");
      Object.assign(person,result.data);
      connection(true);
      notice(prev?"Als noch offen markiert.":"Person erfolgreich eingecheckt.");
    } catch (error) {
      person.checked_in=prev;
      notice("Nicht gespeichert – bitte Verbindung und aktuellen Status prüfen.",true);
      connection(false);
      console.warn("Check-in update failed:", error);
      queueReload();
    } finally {
      state.pending.delete(id);
      render();
    }
  }

  function bindEvents() {
    els("ci-login-form").addEventListener("submit",async event=>{
      event.preventDefault();
      if (!client || state.busyAuth) return;
      const form=event.currentTarget;
      const email=form.elements.email.value.trim();
      const password=form.elements.password.value;
      form.elements.password.value="";
      const button=form.querySelector("button[type=submit]");
      button.disabled=true;
      els("ci-auth-error").hidden=true;
      try {
        const {error}=await client.auth.signInWithPassword({email,password});
        if (error) throw error;
        showSection("ci-boot");
        await authorize();
      } catch (error) {
        els("ci-auth-error").textContent =
          "Anmeldung fehlgeschlagen. Bitte E-Mail, Passwort und Admin-Freigabe prüfen.";
        els("ci-auth-error").hidden=false;
        console.warn("Check-in sign-in:",error);
      } finally {
        button.disabled=false;
      }
    });
    els("ci-change-user").addEventListener("click",async()=>{
      try { await client?.auth.signOut(); }
      catch(e) { console.warn(e); }
      clearPrivateData();
      showSection("ci-auth");
    });
    els("ci-logout").addEventListener("click",async()=>{
      if (!window.confirm("Admin-Zugang abmelden? Du wirst dabei auch auf der Hauptwebsite abgemeldet.")) return;
      try {await client.auth.signOut();}
      catch(e) { console.warn(e); }
      clearPrivateData();
      showSection("ci-auth");
    });
    els("ci-search").addEventListener("input",event=>{
      state.search=event.target.value;
      render();
    });
    document.querySelectorAll("[data-filter]").forEach(btn=>{
      btn.addEventListener("click",()=>{
        state.activeFilter=btn.dataset.filter;
        render();
      });
    });
    els("ci-clear-filters").addEventListener("click",()=>{
      state.search="";
      state.activeFilter="all";
      els("ci-search").value="";
      render();
      els("ci-search").focus();
    });
    els("ci-people").addEventListener("click",event=>{
      const details=event.target.closest("[data-details-id]");
      if(details){
        const id=details.dataset.detailsId;
        if (state.expanded.has(id)) state.expanded.delete(id);
        else state.expanded.add(id);
        render();
        return;
      }
      const check=event.target.closest("[data-check-id]");
      if(check && !check.disabled) void toggleGuest(check.dataset.checkId);
    });
    window.addEventListener("keydown",event=>{
      if ((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==="k" && state.allowed){
        event.preventDefault();
        els("ci-search").focus();
        els("ci-search").select();
      }
    });
    document.addEventListener("visibilitychange",()=>{
      const video=els("checkin-video");
      if (document.hidden) video?.pause();
      else {
        const ret=video?.play();
        if(ret?.catch)ret.catch(()=>{});
        if(state.allowed)queueReload();
      }
    });
    const motion=window.matchMedia("(prefers-reduced-motion: reduce)");
    if(motion.matches)els("checkin-video")?.pause();
    if(motion.addEventListener)motion.addEventListener("change",()=>{
      if(motion.matches)els("checkin-video")?.pause();
      else if(!document.hidden)els("checkin-video")?.play()?.catch(()=>{});
    });
  }

  async function boot() {
    bindEvents();
    if (!client) {
      showSection("ci-denied");
      els("ci-denied").querySelector("p").textContent =
        "Supabase konnte nicht geladen werden. Bitte Internetverbindung prüfen und Seite neu laden.";
      return;
    }
    showSection("ci-boot");
    await authorize();
    state.pollTimer=setInterval(()=>{
      if(state.allowed&&!document.hidden)
        refreshGuests().catch(()=>{});
    },8000);
    client.auth.onAuthStateChange((event)=>{
      if (event==="SIGNED_OUT"){
        clearPrivateData();
        showSection("ci-auth");
      }
    });
  }
  void boot();
})();
