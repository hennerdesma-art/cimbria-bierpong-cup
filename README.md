# CIMBRIA BIERPONG CUP

Interaktive Turnierplattform im Cimbria-Design (Violett, Bordeaux und Gold) mit originalem Zirkel und dem bestehenden Bierpong-Hintergrundvideo.

**Website:** https://hennerdesma-art.github.io/cimbria-bierpong-cup/
**Live-TV:** https://hennerdesma-art.github.io/cimbria-bierpong-cup/tv.html

## V5: Live-TV und Team-Embleme

- **Eigener TV-Modus:** `tv.html` einmal am Fernseher oder Beamer öffnen und mit F11 in den Vollbildmodus wechseln.
- **Gleiches Hintergrundvideo:** `assets/background-bierpong.mp4` wird auch in der TV-Ansicht verwendet.
- **Main Stage:** Im geschützten Admin-Bereich ein startbereites oder laufendes Spiel als Main Stage wählen.
- **Dramatisches VS-Intro:** Beim Start dieses Spiels erscheint bei aktivierter Automatik eine etwa zehnsekündige Animation auf dem TV.
- **Siegeranimation:** Nach der **manuellen** Siegerbestätigung erscheint bei aktivierter Automatik eine etwa elfsekündige Siegereinblendung. Das Herunterzählen der Becher allein beendet kein Spiel.
- **Animierter Playoff-Baum:** Kann vom Admin jederzeit eingeblendet werden und während der Playoffs optional selbstständig erscheinen.
- **Drei unabhängige Schalter:** Automatische Match-Intros, Siegeranimationen und Turnierbaum-Einblendungen lassen sich im Admin-Reiter **Turnier** ein- und ausschalten.
- **Zwölf Team-Embleme:** Krone, Totenkopf, Flamme, Blitz, Bullseye, Rakete, Schild, Stern, Anker, Drache, Pokal und Phönix. Gäste wählen ihr Emblem bei der Anmeldung; die SVG-Grafiken erscheinen anschließend bei Teams, Begegnungen und im TV.

## Animationen ohne echte Teams ausprobieren

Die folgenden Vorschauen verwenden nur fiktive Teams **im jeweiligen Browserfenster** und verändern keine Supabase-Daten:

- [VS-Intro testen](https://hennerdesma-art.github.io/cimbria-bierpong-cup/tv.html?preview=intro)
- [Siegeranimation testen](https://hennerdesma-art.github.io/cimbria-bierpong-cup/tv.html?preview=winner)
- [Animierten Turnierbaum testen](https://hennerdesma-art.github.io/cimbria-bierpong-cup/tv.html?preview=bracket)

## Ablauf für die Turnierleitung

1. Auf der Website unter `#/admin` mit dem persönlichen Admin-Konto anmelden.
2. Unter **Turnier → Live-TV & Animationen** die drei Automatikschalter nach Wunsch einstellen.
3. **Live-TV öffnen** klicken und den TV-Tab auf den Fernseher oder Beamer verschieben.
4. Ein zugewiesenes Spiel als **Main Stage** auswählen.
5. Als Admin auf **Spiel starten** klicken: Bei aktivierter Automatik erscheint das VS-Intro.
6. Während des Spiels die Becherstände per `+`/`−` aktualisieren.
7. Den Sieger **manuell bestätigen**: Bei aktivierter Automatik erscheint die Siegereinblendung.

Es gibt zusätzlich manuelle Regie-Buttons für Intro, Siegeranimation, Turnierbaum und Abbrechen.

## Weitere Funktionen

Öffentliche Gastanmeldungen ohne Konto (2–4 Spieler), konfigurierbare Teamobergrenze, vier oder acht Gruppen, Spiel- und Tischverwaltung, 8er-/16er-K.-o.-Baum, Live-Becherzähler und verschiedene Admin-Rollen. Alle echten Daten werden zentral in Supabase PostgreSQL gespeichert.

## Projektstruktur

- `index.html`, `js/app.js`, `js/cloud.js`: Hauptwebsite, Turnierlogik und Supabase-Anbindung.
- `tv.html`, `js/tv.js`, `css/tv.css`: Eigenständiger öffentlicher Live-TV-Modus.
- `css/base.css`, `css/v2.css`, `css/cloud.css`: Cimbria-Design und Admin-Elemente.
- `assets/background-bierpong.mp4`: Unverändertes Video für Website und TV.
- `assets/team-icons/`: Zwölf fest hinterlegte SVG-Embleme.
- `supabase/functions/cimbria-register-team/index.ts`: Geschützte serverseitige Team-Registrierungslogik.
- `supabase/migrations/`: Bereits angewendete SQL-Migrationen.
- `docs/TV_MODUS.md`, `docs/SUPABASE.md`, `SECURITY.md`: Bedienung und technische Hinweise.

## Sicherheit und Teststatus

Der TV-Modus hat nur **Leserechte** und zeigt keine privaten Spielernamen, sondern Teamnamen, Embleme und Turnierdaten. Admin-Regieaktionen sind über Supabase-RLS und serverseitige Berechtigungsprüfung abgesichert. Weder Passwörter noch der Supabase-Service-Role-Schlüssel gehören in dieses öffentliche Repository.

Automatische Backend-Ereignisse sowie der Quellcode wurden geprüft. Der vollständige visuelle Test mit mehreren echten Endgeräten steht vor dem Event noch aus. Die Gastanmeldung wird nicht automatisch geöffnet. Auf CAPTCHA, IP-Rate-Limit und Gast-Bearbeitungslinks wurde wie gewünscht verzichtet.
## Start ab 12 Mannschaften

Bei 12–15 Teams spielt der Cup in **vier Gruppen (A–D)** und danach im **8er-Viertelfinale**. Ab 16 Teams werden **acht Gruppen (A–H)** und ein **16er-Achtelfinale** ausgelost. Jeweils die ersten zwei Mannschaften jeder Gruppe qualifizieren sich. Die maximale Teilnehmerzahl ist im Admin-Bereich auf 12–512 einstellbar. Die Auslosung und Schließung der Anmeldung erfolgen erst nach bewusster Bestätigung des Admins.
