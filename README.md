# Cimbria Bierpong Cup
Interaktive Beer-Pong-Turnierwebsite im Cimbria-Design (Violett, Bordeaux und Gold).

**Website:** https://hennerdesma-art.github.io/cimbria-bierpong-cup/

## Funktionen
- Öffentliche Teamanmeldung ohne Account (2–4 Spieler); keine Gast-Bearbeitungslinks, kein CAPTCHA.
- Gruppenphase (acht Gruppen), dynamische Tische, Live-Spielplan und 16er-Playoff-Baum.
- Nur Siege/Niederlagen; Entscheidungsspiele bei nicht auflösbaren Gruppengleichständen.
- Geschützter Admin-Zugang mit E-Mail und Passwort sowie serverseitiger E-Mail-Freigabe.
- Daten in Supabase PostgreSQL, automatische Live-Aktualisierungen.

## Dateien
- `index.html`, `css/*`, `js/app.js`: Responsive V2-Oberfläche und Spielverwaltung.
- `js/cloud.js`: Supabase-Anbindung; enthält nur einen **öffentlichen Publishable Key**.
- `assets/*`: Hintergrundvideo, Poster und Cimbria-Zirkel.
- `supabase/migrations/*`: In Supabase bereits ausgeführte SQL-Migrationen.
- `supabase/functions/cimbria-register-team/index.ts`: öffentlicher Backend-Registrierungsendpunkt.
- `docs/SUPABASE.md`: Konfiguration und wichtige Betriebshinweise.

## Admin-Anmeldung
- Die freigegebene E-Mail-Adresse verfügt bereits über einen bestätigten Supabase-Auth-Benutzer mit Admin-Berechtigung.
- Öffne `https://hennerdesma-art.github.io/cimbria-bierpong-cup/#/admin` und melde dich mit deiner Admin-E-Mail und deinem persönlichen Passwort an.
- **Kein Magic Link, keine erneute E-Mail-Bestätigung und kein E-Mail-Rate-Limit erforderlich.**
- Das Passwort wird serverseitig durch Supabase Auth geprüft. Es darf niemals in HTML/JavaScript/SQL-Migrationen oder im öffentlichen GitHub-Repository stehen.
- Nach erfolgreichem Login kannst du in der Admin-Oberfläche die Gast-Anmeldung freigeben.

**Ausgangsstatus:** Keine echten Teams, vier freie Tische, acht leere Gruppen. Die Anmeldung bleibt bis zur Freigabe durch den Admin geschlossen.

## Sicherheit
RLS schützt alle Tabellen. Gastzugriff kann veröffentlichte Spiele und Teamnamen lesen, aber keine Daten verändern und keine Spielernamen auslesen. Adminmutationen werden transaktionssicher mit Revisionsprüfung ausgeführt. Niemals `service_role`, SMTP-Passwörter, JWT-Secrets oder sonstige Zugangsdaten im öffentlichen Repository veröffentlichen.

**Bewusst nicht umgesetzt:** CAPTCHA, IP-Rate-Limits und nachträgliche Bearbeitungslinks für Gäste. Dadurch besteht bei geöffneter öffentlicher Anmeldung ein höheres Spam-Risiko; Anmeldungen zunächst geschlossen lassen und vor dem Event testen.
