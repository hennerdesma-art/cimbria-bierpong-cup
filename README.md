# Cimbria Bierpong Cup – Design & Funktionsprototyp V2

Designumsetzung nach den freigegebenen Cimbria-Mockups mit dem **originalen weißen Cimbria-Zirkel** und dem vom Nutzer bereitgestellten Video **Background Bierpong.mp4**.

## Was fertig ist

- Cinematic Background-Video mit dunklem Violett-Overlay und goldenem Akzentdesign
- Responsive Header / Navigationsmenü, mobile Bottom Navigation
- Startseite mit animiertem Hintergrund, Zirkel, Hero und dynamischen Übersichtskarten
- Teamanmeldung für 2–4 Personen (standardmäßig 2), Name- und Duplikatprüfung
- Teamübersicht mit Suche
- Live-Dashboard mit laufenden Spielen, freien Tischen, kommenden Begegnungen und Gruppenständen
- Spielplan/Turnierphasen, Playoff-Baum und Turnierinfos / FAQ
- Admin Control Center mit Tischverwaltung, Hybrid-Vorschlägen, Ergebnisbestätigung, Teambearbeitung und Turniersteuerung
- Bestehende Spiellogik: 8 Gruppen, jeder gegen jeden, nur Sieg/Niederlage, direkter Vergleich und Entscheidungsspiele, 16er K.-o.-Phase
- Poster-Fallback und Berücksichtigung von `prefers-reduced-motion`

## Sofort testen

**Variante A – eine Datei:** `Cimbria_Bierpong_Cup_V2_Demo.html` aus dem Download öffnen (alles eingebettet, auch das Video).

**Variante B – Projektordner:** Entpacken und `index.html` mit Edge/Chrome öffnen. Für die Entwicklung ist ein lokaler Server empfehlenswert:

```
py -m http.server 5173
```

Danach `http://localhost:5173` aufrufen.

### Testablauf

1. Startseite ansehen und die mobile Ansicht testen.
2. Unter **Teamanmeldung** ein Team registrieren. Es sind 24 Beispielteams voreingetragen, sodass 8 Plätze verfügbar sind.
3. Unter **Admin → Turnier** die Gruppenphase starten.
4. Unter **Admin → Spieltische** einen automatischen Vorschlag annehmen oder selbst ein Spiel auswählen und es starten.
5. Einen Sieger bestätigen; unter **Live** und **Spielplan** werden die Daten entsprechend angezeigt.
6. Um die Playoffs schneller zu testen: **Admin → Turnier → Restliche Spiele simulieren → Playoffs starten**.
7. Unter **Admin → Turnier** kann die Demo zurückgesetzt werden.

## Achtung: Noch keine produktive Website

Diese V2 ist absichtlich ein **lokaler, funktionsfähiger Designprototyp** ohne Server. Die Daten liegen im `localStorage` des jeweiligen Browsers und werden **nicht zwischen Geräten geteilt**. Die öffentliche Teamregistrierung und die Admin-Funktionen sind **noch nicht abgesichert**. Auf keinen Fall als offizielle Veranstaltungswebsite veröffentlichen, bevor Backend, Admin-Authentifizierung und Datenschutz umgesetzt sind.

Die Mockups zeigten teilweise Spielstände. Wie besprochen wertet die echte Demo **ausschließlich Siege und Niederlagen**, also keine erfundenen oder ungewollten Becherpunkte.

Die Mockup-Daten (Datum, Uhrzeit, Ort, Gebühren) werden bewusst nicht erfunden. Konkrete Angaben können später eingesetzt werden.

## Dateien

```
cimbria-cup-v2/
  index.html
  css/base.css
  css/v2.css
  js/app.js
  assets/background-bierpong.mp4
  assets/background-poster.jpg
  assets/zirkel-cimbria.png
  docs/ARCHITEKTUR.md
  README.md
```

## Nächste Phase

1. Finale Designfreigabe und evtl. letzte Textersetzungen.
2. Offiziellen Titel sowie Datum, Uhrzeit, Ort und verbindliche Turnier-/Teilnahmebedingungen abstimmen.
3. Projekt in GitHub versionieren und öffentlich unter passender Domain bereitstellen.
4. Datenbank + Realtime über Supabase anbinden, mit Admin-Login, serverseitiger Validierung, Row-Level Security (RLS), Audit-Log sowie Spam-/Missbrauchsschutz für die Anmeldung.
5. Öffentlich und mobil mit mehreren Browsern/Geräten testen; erst danach für echte Anmeldungen freigeben.

Technologie in V2: HTML, CSS, JavaScript ohne Build-Schritt, um die schon funktionierende V1-Turnierlogik bei der Designüberarbeitung nicht zu beschädigen. Die spätere Produktionsumsetzung kann in React/Vite mit Supabase erfolgen.
