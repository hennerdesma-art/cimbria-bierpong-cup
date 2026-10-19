# Cimbria Bierpong Cup – Supabase Backend

Stand: 20. Oktober 2026

## Status
- Projekt: **Cimbria Bierpong Cup** (Supabase, Region `eu-central-1` / Frankfurt).
- Status: Datenbankschema vorhanden, Migrationen angewendet, RLS aktiv, Realtime-Publikation eingerichtet.
- Website: **noch lokale Demo** in `js/app.js` mit `localStorage`. Noch keine produktive Datenbankanbindung.
- Das Turnier startet mit `is_published = false` und `registration_open = false`.
- Die Datenbank enthält acht leere Gruppen (A–H) und keine echten Teams, Spieler oder Begegnungen.

## Tabellen
| Tabelle / View | Zweck |
| --- | --- |
| `tournaments` | Turnierphasen, Anmeldung, Konfiguration und Veröffentlichung |
| `teams` | 24–32 Teams, eindeutige Namen je Turnier |
| `players` | Maximal vier Spieler je Team (Slot 1–4); personenbezogene Daten |
| `groups` | Gruppencodes und Reihenfolge |
| `group_members` | Eindeutige Gruppenzuordnung jedes Teams |
| `matches` | Gruppenphase, Entscheidungsspiele, Playoffs, Sieger, Tisch und Status |
| `game_tables` | Dynamische Tische und Aktivierung |
| `admin_users` | Zuordnung bestehender Supabase-Auth-Accounts zu Admin-/Supervisor-Rollen |
| `audit_events` | Nachvollziehbarkeit von Team-, Spiel-, Tisch- und Turnieränderungen |
| `group_standings` (View) | Aus regulären Gruppenspielen berechnete Siege, Niederlagen und Spiele |

## Zugriff und Datenschutz
- Sämtliche Tabellen besitzen Row Level Security (RLS).
- Unangemeldete Besucher haben nur **lesenden** Zugriff auf öffentliche Turnierdaten und nur wenn das jeweilige Turnier veröffentlicht ist.
- `players`, `admin_users` und `audit_events` sind nicht öffentlich abrufbar.
- Nur angemeldete und freigeschaltete Admin-Accounts dürfen Turnierdaten ändern; niemand besitzt durch eine öffentliche Registrierung automatisch Adminrechte.
- `cimbria_private` enthält interne Sicherheits- und Triggerfunktionen außerhalb der öffentlichen API.
- Für die spätere öffentliche **Teamanmeldung** eine eigene validierte serverseitige Edge Function mit Rate-Limiting/Anti-Spam-Schutz vorsehen. **Kein** offenes `anon INSERT` auf `teams` oder `players`.
- Niemals den `service_role`-Schlüssel, private Schlüssel, Passwörter oder Token in dieses öffentliche Repository oder in Browser-JavaScript schreiben.

## Bereits eingebaute Regeln
- Ergebnis nur Sieg/Niederlage; Sieger muss eines der beiden tatsächlich spielenden Teams sein.
- Ein Spiel im Status `ready` oder `live` benötigt einen aktiven Tisch und zwei Teams.
- Je Tisch nur ein aktives Spiel; ein Team darf nicht in zwei gleichzeitigen Spielen antreten.
- Belegte Tische können nicht deaktiviert werden.
- Gruppentabellen berücksichtigen nur reguläre Gruppenspiele; Tiebreak-Spiele bleiben eigenständig.
- Maximale Teamanzahl wird serverseitig erzwungen.

## Migrationen
Die exakt angewendeten SQL-Dateien liegen unter `supabase/migrations/`. Reihenfolge:
1. `20261019232411_cimbria_initial_secure_tournament_schema.sql`
2. `20261019232515_cimbria_harden_internal_functions.sql`
3. `20261019232600_cimbria_strict_match_result_validation.sql`

Nicht erneut auf demselben Projekt ausführen – die Supabase-Migrationstabelle zeichnet diese Migrationen bereits auf.

## Nächste Schritte
1. Supabase Auth für die Turnierleitung konfigurieren und ersten Admin **vertrauenswürdig** zuordnen. Dazu eine echte Auth-User-UUID verwenden, nicht eine im Code fest kodierte ID.
2. Sicheren Registrierungs-Endpunkt (mit Prüfung von Teamgröße, Teamzahl und Einwilligung) entwickeln.
3. Website auf Supabase API umstellen, `localStorage`-Demo vom Live-Betrieb trennen.
4. Realtime-Updates testen; zuerst mit Testdaten, dann veröffentlichen.
5. Erst nach gesichertem Admin-Login und bestandenen Tests `is_published` und `registration_open` aktivieren.
