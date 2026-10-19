# Supabase Backend – Cimbria Bierpong Cup

**Projekt:** https://supabase.com/dashboard/project/cxjhlaavfsavokqflxti (Frankfurt, `eu-central-1`).

## Status
- SQL-Migrationen angewendet; RLS, Realtime, serverseitige Validierung und Admin-Allowlist eingerichtet.
- Die E-Mail `henner@desma.africa` ist in `cimbria_private.admin_email_allowlist` freigegeben.
- Ein Auth-Benutzer unter dieser E-Mail existiert **erst nach der ersten bestätigten Anmeldung per Magic Link**.
- Der Registrierungs-Endpunkt `cimbria-register-team` ist aktiv. Die Anmeldung ist standardmäßig geschlossen.
- Vier freie Spieltische und Gruppen A–H sind angelegt; keine echten Teilnehmer.

## Admin-Einrichtung
In [Supabase Authentication → URL Configuration](https://supabase.com/dashboard/project/cxjhlaavfsavokqflxti/auth/url-configuration):
- **Site URL:** `https://hennerdesma-art.github.io/cimbria-bierpong-cup/`
- **Redirect URLs:** `https://hennerdesma-art.github.io/cimbria-bierpong-cup/`

Danach `#/admin` öffnen und Anmeldelink an die freigegebene E-Mail senden. Nach der Verifikation legt ein Trigger den `admin_users`-Datensatz an. E-Mail und Bestätigung werden bei jedem Admin-Zugriff geprüft; andere angemeldete Benutzer erhalten keine Adminrechte.

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
