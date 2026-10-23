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

- `tournaments.tv_auto_intros`, `tv_auto_wins`, `tv_rotate_bracket` are administrator-controlled booleans (initially true).
- `tournaments.tv_main_match_id` contains the selected Main Stage match (nullable FK to `matches`).
- `tv_cues` contains read-only-public scene notifications (`intro`, `winner`, `bracket`, `clear`). Anonymous users have only SELECT when the corresponding tournament is published.
- `matches_emit_tv_cue` runs after status transitions to `live` and `done` and inserts cinematic cues only for the selected Main Stage; winner cues require a confirmed winner. A cup counter reaching 0 has **no effect** on the status or winner.
- `public.cimbria_tv_control` is a `SECURITY INVOKER` RPC with a trusted-admin check. It changes broadcast toggles, chooses Main Stage, or creates manually requested cues. Viewers cannot call this RPC.
- `teams.icon_id` accepts only one of twelve built-in emblem IDs. The four-argument, service-role-only registration RPC validates and stores this icon atomically along with the team/players.
- The deployed registration Edge Function was updated to include `p_icon_id`, and will reject disallowed icon IDs.
- Realtime publication includes `tv_cues`. TV also polls periodically to recover from temporary disconnections.
- The TV uses the **public** Supabase Publishable Key only. Never expose the service role credential in `tv.js` or the browser.
- V5 test scenes under `tv.html?preview=intro`, `?preview=winner` and `?preview=bracket` use fictional data exclusively in browser memory; they do not write to Supabase.


## Turnierstart ab 12 Teams (20.10.2026)
- Die gültige Mindestteilnehmerzahl ist **12 Teams**. Die Obergrenze bleibt über **Admin → Turnier** individuell einstellbar (12–512 Teams).
- Mit **12–15 Anmeldungen** werden vier Gruppen (A–D) mit mindestens drei Teams ausgelost. Die beiden Bestplatzierten jeder Gruppe qualifizieren sich für ein **8er-Viertelfinale** mit sieben Playoff-Begegnungen (Rundenindex 1, 2, 3).
- Ab **16 Anmeldungen** wird der bisherige Modus mit acht Gruppen (A–H), 16er-Achtelfinale und 15 Playoff-Begegnungen verwendet.
- Beim Auslosen speichert `cimbria_admin_save_state` die passenden Werte in `group_count` und `playoff_teams` atomar. Die Datenbank überprüft Mindestanzahl, Gruppenbelegung und die richtige Anzahl der Playoff-Spiele.
- Die Hauptwebsite zeigt ausschließlich ausgeloste Gruppen. Der Turnierbaum blendet im 8er-Modus das Achtelfinale aus, ebenso die TV-Ansicht.
- Die aktuellen Registrierungen und Turnierergebnisse wurden durch diese Migration **nicht** zurückgesetzt oder verändert. Die Auslosung wird nicht automatisch gestartet.


## V6: Sicheres Zurücksetzen des gesamten Turniers

- Der neue Bereich **Admin → Turnier → Turnier zurücksetzen** ist ausschließlich für bestätigte **Hauptadmins** sichtbar. Die Datenbank überprüft zusätzlich die aktive Hauptadmin-Rolle und die gültige E-Mail-Freigabe.
- Optional lässt sich vorab eine lokale **JSON-Sicherung** mit Teams, Spielern, Gruppen, Spielen, Tischkonfiguration und zuletzt sichtbaren Änderungen herunterladen. Achtung: persönliche Spielernamen vertraulich aufbewahren.
- Ein Reset erfordert die exakt eingetippte Bestätigung `CIMBRIA RESET`, ein Bestätigungs-Häkchen und eine weitere Browser-Sicherheitsfrage.
- Die RPC `public.cimbria_reset_tournament(p_slug,p_expected_revision,p_confirmation)` überprüft den aktuellen Revisionsstand und führt den Reset vollständig **transaktional** aus. Veraltete Browserstände werden zurückgewiesen.
- **Automatisches vollständiges Archiv vor dem Löschen:** `cimbria_private.tournament_reset_backups` speichert den Originalturnierstand mit allen Mannschaften, Spielern, Gruppenzuordnungen, Spielen, Ergebnissen, TV-Cues und Audit-Einträgen. Der Backup-Tabelle werden keine Rechte für `anon` und `authenticated` gewährt. Für eine Wiederherstellung wäre ein Datenbankadministrator und ein separater Restore-Prozess nötig; eine Ein-Klick-Wiederherstellung existiert nicht.
- Gelöscht werden aus dem *aktiven* Turnier: alle Teams, Spieler, Gruppenzuordnungen, Gruppenspiele, Entscheidungsrunden, Playoff-Spiele, Becherstände, Ergebnisse, TV-Ereignisse sowie frühere Audit-Einträge. Nach dem Reset bleibt eine neue Audit-Aktion zurück.
- **Nicht gelöscht:** Supabase-Auth-Benutzer, Admin-Freigaben, Admin-Passwörter, Tischkonfigurationen, die acht Gruppen-Stammdaten, Teamobergrenze und allgemeine TV-Einstellungen.
- Das Turnier wechselt in die Phase `registration`, mit `registration_open=false` und `tv_main_match_id=null`. Die öffentliche Website bleibt erreichbar; die Teamanmeldung muss der Admin selbst öffnen.
- **Migrationen installieren oder Code deployen löst niemals einen Reset aus.** Nur der explizite bestätigte Admin-Aufruf führt ihn aus.
- Der Reset wurde an einer künstlichen Testturnierkopie innerhalb `BEGIN ... ROLLBACK` überprüft; die realen Teilnehmer wurden dabei nicht verändert.


## Offizielle Spielregeln (Webseite, PDF und TV; Oktober 2026)

- Standalone-Seite `regeln.html` + `css/rules.css` im Cimbria-Design, verlinkt als zusätzlicher Bereich unter **Infos & FAQ**.
- Einseitiges A4-Dokument unter `assets/Cimbria_Bierpong_Cup_Spielregeln.pdf` als direkter PDF-Download. Browserdruck auf `regeln.html` unterstützt.
- `tv_cues.kind` gestattet zusätzlich den serverseitig verifizierten Wert `rules`. Die bestehende, durch `cimbria_private.is_cimbria_admin()` geschützte Regie-RPC `cimbria_tv_control('rules', null, null)` sendet ihn ohne Matchbezug und ohne Änderung von Mannschaften oder Ergebnissen.
- `tv.html` und `js/tv.js` enthalten die acht Regeln als statische öffentliche Vollbildszene. Die Regel-Einblendung bleibt bis `clear` oder bis zu einem nachfolgenden Cue geöffnet; sie wird bei einem Neuladen der TV-Seite aus dem jüngsten `rules`-Cue rekonstruiert. Andere Animationen behalten ihre bisherige Zeitbegrenzung.
- Vorschau `tv.html?preview=rules` benötigt keinen Admin-Aufruf und schreibt keine Datenbankdaten.
- Die Datenbankmigration wurde ausgeführt und `rules` / `clear` ausschließlich in einer zurückgerollten Testtransaktion geprüft. Echte Turnierteams und Resultate blieben unverändert.
