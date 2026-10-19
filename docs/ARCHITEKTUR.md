# Cimbria Bierpong Cup V2 – Technische Struktur

## Render-Architektur

- `index.html` hält das fest positionierte Video **außerhalb** des dynamisch gerenderten `#app`-Containers. Das Video bleibt bei Seitenwechseln erhalten und startet nicht erneut.
- `css/base.css` enthält stabile Formular-, Spielplan- und Turnieransichten aus V1.
- `css/v2.css` implementiert neue Gold/Violett/Bordeaux-Optik, Glassmorphism, responsive Raster und mobile Navigation.
- `js/app.js` enthält UI-Routing (`#/home`, `#/registration`, `#/live`, `#/teams`, `#/playoffs`, `#/schedule`, `#/info`, `#/admin`), Zustand sowie Spiel- und Turniersteuerung.
- `assets/zirkel-cimbria.png` ist das vom Nutzer gelieferte weiße Original.
- `assets/background-bierpong.mp4` ist das vom Nutzer gelieferte Hintergrundvideo.
- `assets/background-poster.jpg` zeigt einen Standbild-Fallback.

## Daten (Browser-Demo)

- `teams`: ID, Teamname, 2–4 Mitglieder, Zeitpunkt
- `groups`: A–H, zugewiesene Teams
- `matches`: Gruppen- und Entscheidungsspiele inkl. Sieger, Status, Tisch und Runde
- `playoffMatches`: 16er-Bracket, Gewinner ziehen automatisch weiter
- `tables`: Name, aktiv/inaktiv; gleichzeitig maximal eine zugewiesene Partie pro Tisch
- `log`: lokale Aktivitätshistorie

Die **Ergebnisse bestehen nur aus Sieger-ID und Status**. Keine numerischen Becherstände.

## Wichtige Regeln

- Gruppe mit 3–4 Teams: jeder gegen jeden.
- Rangfolge: Siege > bei genau zwei punktgleichen Teams der direkte Vergleich; nicht auflösbare Dreiergleichstände führen zu Entscheidungsspielen.
- Die beiden besten Teams jeder der acht Gruppen qualifizieren sich für die Playoffs.
- Admin-Hybridmodus: Empfehlungen für freie Tische; manuelle Zuweisung möglich. Aktive Teams können nicht gleichzeitig ein zweites Spiel bestreiten.
- Spielstatus: Offen → Bereit → Läuft → Abgeschlossen.
- Bei unaufgelösten Platzierungen lassen sich die Playoffs nicht starten.

### Noch offen im Regelwerk

- Für 25–31 Teams variieren Gruppengrößen. Ein späteres überarbeitetes Fairness-Modell kann erforderlich werden.
- Entscheidungen bei langfristig zyklischen Dreiergleichständen brauchen bei wiederholten Runden eine organisatorische Eskalation.
- Exakte Startzeiten und verfügbare Hallen/Tische sind noch nicht mit der Veranstaltungsleitung abgestimmt.

## Produktionsmigration (geplant)

- React + Vite für Komponenten, HTML5 Video-Hero
- Supabase Postgres: tournaments, teams, registrations, players, groups, matches, tables, tournament_events, users, roles
- Supabase Realtime für öffentliche Live-Ansicht
- Authentifizierung für Admin und serverseitige Row-Level Security
- Serverseitige Transactions/RPC für Ergebnisfreigabe, Tischzuweisung, Playofffortschritt
- Absicherung öffentlicher Registrierungen: Validierung, Captcha/Rate-Limits, Datenschutzhinweise und Einwilligung
- Hosting über Vercel/Cloudflare/GitHub Pages, GitHub als Quellcodeverwaltung

**Nicht produktiv nutzen, solange keine sichere gemeinsame Datenhaltung und Administrator-Authentifizierung existieren.**
