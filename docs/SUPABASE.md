# Supabase Backend – Cimbria Bierpong Cup

**Projekt:** https://supabase.com/dashboard/project/cxjhlaavfsavokqflxti (Frankfurt, `eu-central-1`).

## Status
- SQL-Migrationen angewendet; RLS, Realtime, serverseitige Validierung und Admin-Allowlist eingerichtet.
- Die E-Mail `henner@desma.africa` ist in `cimbria_private.admin_email_allowlist` freigegeben.
- Der Auth-Benutzer ist bereits vorhanden, E-Mail verifiziert und Admin-Recht aktiv.
- Der Registrierungs-Endpunkt `cimbria-register-team` ist aktiv. Die Anmeldung ist standardmäßig geschlossen.
- Vier freie Spieltische und Gruppen A–H sind angelegt; keine echten Teilnehmer.

## Admin-Login (E-Mail und Passwort)
- Öffne die Website unter `#/admin` und melde dich mit der freigegebenen E-Mail-Adresse sowie deinem Supabase-Auth-Passwort an.
- Die Website nutzt `supabase.auth.signInWithPassword()`; kein Versand von E-Mails ist für den Login nötig.
- Der bestehende Auth-Benutzer ist bereits verifiziert und in `admin_users` aktiviert.
- RLS und `cimbria_private.admin_email_allowlist` bleiben unverändert und verhindern fremde Admin-Zugriffe.
- Die Zugangsdaten dürfen **nicht** in öffentliche Dateien committed werden. Das Passwort nur über den offiziellen Supabase-Auth-Admin-API- oder Account-Workflow ändern.
- Bei Kennwortverlust erfolgt der Reset über Supabase Authentication (ggf. mit E-Mail-Versand).

## Datenmodell
`tournaments` (Phase, Anmeldestatus, Version), `teams` (Teamnamen),
`players` (private Spielernamen), `groups`, `group_members`,
`matches`, `game_tables`, `admin_users`, `audit_events`,
`group_standings` (View).

## Sicherheit und Schreibwege
- Gäste dürfen veröffentlichten Turnierstand lesen; Spielernamen sind nur Admins zugänglich.
- Registrierung erfolgt **ohne Konto** über die Edge Function; sie validiert 2–4 Spielernamen, Teamname, Limits, eindeutigen Namen und den geöffneten Registrierungsstatus; ein einziger Datenbankvorgang legt Team plus Spieler an.
- Admin-Änderungen laufen als angemeldeter Benutzer über die RLS-geschützte Funktion `cimbria_admin_save_state` (SECURITY INVOKER), mit Revision gegen konkurrierende Änderungen.
- Die `service_role`-Berechtigung wird ausschließlich innerhalb der Edge Function verwendet. Sie darf nicht ins Browser-JavaScript oder GitHub.
- Anmeldungen sind absichtlich ohne CAPTCHA, explizite IP-Rate-Limits oder Gast-Bearbeitungslinks umgesetzt. Vor Eventstart erhöhte Missbrauchsgefahr berücksichtigen.

## Testablauf
1. Auth Redirect URLs einstellen; Admin-Link bestätigen.
2. Anmeldung im Admin-Bereich öffnen.
3. Gastanmeldung eines Testteams vornehmen und Anzeige auf zweitem Gerät prüfen.
4. Gruppen auslosen und Spielstatus, Ergebnis, Tiebreak und Playoff-Übergänge testen.
5. Für ein echtes Turnier Testdaten vorher unter Admin-Kontrolle entfernen; keine produktiven Ergebnisse simulieren.

**Hinweis:** Die Datenbank- und Quellcodeintegration ist eingerichtet; ein echter Login-Link muss noch durch den berechtigten Postfachinhaber bestätigt und der komplette UI-Test mit zwei Geräten durchgeführt werden.


## Erweiterungen 2026-10-20
- `max_teams`: 16–512, über Admin-Formular einstellbar vor der Auslosung; bei hoher Anzahl steigt die Spieldauer stark.
- `cimbria_admin_members`: E-Mail-basierte Freigabeliste, Rollen `admin` und `supervisor`. Neu eingeladene Mitglieder registrieren sich mit eigenem Passwort und E-Mail-Bestätigung.
- `cups_a`/`cups_b`: Becherstand 0–10, nur bei laufenden Spielen administrativ änderbar; Sieger weiterhin manuell.


## V5 · Public Live-TV mode and chosen team crests

- \`tournaments.tv_auto_intros\`, \`tv_auto_wins\`, \`tv_rotate_bracket\` are administrator-controlled booleans (initially true).
- \`tournaments.tv_main_match_id\` contains the selected Main Stage match (nullable FK to \`matches\`).
- \`tv_cues\` contains read-only-public scene notifications (\`intro\`, \`winner\`, \`bracket\`, \`clear\`). Anonymous users have only SELECT when the corresponding tournament is published.
- \`matches_emit_tv_cue\` runs after status transitions to \`live\` and \`done\` and inserts cinematic cues only for the selected Main Stage; winner cues require a confirmed winner. A cup counter reaching 0 has **no effect** on the status or winner.
- \`public.cimbria_tv_control\` is a \`SECURITY INVOKER\` RPC with a trusted-admin check. It changes broadcast toggles, chooses Main Stage, or creates manually requested cues. Viewers cannot call this RPC.
- \`teams.icon_id\` accepts only one of twelve built-in emblem IDs. The four-argument, service-role-only registration RPC validates and stores this icon atomically along with the team/players.
- The deployed registration Edge Function was updated to include \`p_icon_id\`, and will reject disallowed icon IDs.
- Realtime publication includes \`tv_cues\`. TV also polls periodically to recover from temporary disconnections.
- The TV uses the **public** Supabase Publishable Key only. Never expose the service role credential in \`tv.js\` or the browser.
- V5 test scenes under \`tv.html?preview=intro\`, \`?preview=winner\` and \`?preview=bracket\` use fictional data exclusively in browser memory; they do not write to Supabase.
