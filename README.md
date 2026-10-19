# Cimbria Bierpong Cup
Interaktive Beer-Pong-Turnierwebsite im Cimbria-Design (Violett, Bordeaux und Gold).

**Website:** https://hennerdesma-art.github.io/cimbria-bierpong-cup/

## Funktionen
- Öffentliche Teamanmeldung ohne Account (2–4 Spieler); keine Gast-Bearbeitungslinks, kein CAPTCHA.
- Gruppenphase (acht Gruppen), dynamische Tische, Live-Spielplan und 16er-Playoff-Baum.
- Nur Siege/Niederlagen; Entscheidungsspiele bei nicht auflösbaren Gruppengleichständen.
- Geschützter Admin-Zugang per Supabase-Magic-Link und serverseitiger E-Mail-Freigabe.
- Daten in Supabase PostgreSQL, automatische Live-Aktualisierungen.

## Dateien
- `index.html`, `css/*`, `js/app.js`: Responsive V2-Oberfläche und Spielverwaltung.
- `js/cloud.js`: Supabase-Anbindung; enthält nur einen **öffentlichen Publishable Key**.
- `assets/*`: Hintergrundvideo, Poster und Cimbria-Zirkel.
- `supabase/migrations/*`: In Supabase bereits ausgeführte SQL-Migrationen.
- `supabase/functions/cimbria-register-team/index.ts`: öffentlicher Backend-Registrierungsendpunkt.
- `docs/SUPABASE.md`: Konfiguration und wichtige Betriebshinweise.

## Einmalige Einrichtung
1. Öffne [Supabase Auth URL Configuration](https://supabase.com/dashboard/project/cxjhlaavfsavokqflxti/auth/url-configuration).
2. Setze **Site URL** und **Redirect URLs** auf `https://hennerdesma-art.github.io/cimbria-bierpong-cup/`.
3. Öffne die Website unter `#/admin` und fordere einen Anmeldelink an `Henner@desma.africa` an.
4. Folge dem Magic Link aus deiner E-Mail. Erst dann wird der Supabase-Auth-Benutzer mit bestätigter Identität angelegt/freigeschaltet.
5. Öffne in der Admin-Oberfläche nach einem Test die Gast-Anmeldung.

**Ausgangsstatus:** Keine echten Teams, vier freie Tische, acht leere Gruppen. Die Anmeldung bleibt bis zur Freigabe durch den Admin geschlossen.

## Sicherheit
RLS schützt alle Tabellen. Gastzugriff kann veröffentlichte Spiele und Teamnamen lesen, aber keine Daten verändern und keine Spielernamen auslesen. Adminmutationen werden transaktionssicher mit Revisionsprüfung ausgeführt. Niemals `service_role`, SMTP-Passwörter, JWT-Secrets oder sonstige Zugangsdaten im öffentlichen Repository veröffentlichen.

**Bewusst nicht umgesetzt:** CAPTCHA, IP-Rate-Limits und nachträgliche Bearbeitungslinks für Gäste. Dadurch besteht bei geöffneter öffentlicher Anmeldung ein höheres Spam-Risiko; Anmeldungen zunächst geschlossen lassen und vor dem Event testen.
