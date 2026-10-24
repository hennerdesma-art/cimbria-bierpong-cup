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


## Turnier vollständig zurücksetzen (Hauptadmin)

Unter **Admin → Turnier → Turnier zurücksetzen** gibt es einen gesonderten Sicherheitsbereich. Die Leitung kann zunächst eine lokale JSON-Sicherung herunterladen. Nach Eingabe von `CIMBRIA RESET`, Bestätigung per Checkbox und einer zweiten Warnung werden Teamanmeldungen, Spielerlisten, Gruppenzuordnungen, Spiele, Ergebnisse und alte TV-Einblendungen aus dem aktuellen Turnier gelöscht.

**Supabase archiviert den vollständigen bisherigen Turnierstand automatisch vor jeder Löschung in einer privaten Tabelle.** Das Turnier kehrt anschließend zur Anmeldephase zurück; die Registrierung bleibt zunächst geschlossen. Admin-Zugänge und eingerichtete Spieltische bleiben bestehen. Eine Rücksicherung des privaten Archivs müsste ein Datenbankadministrator durchführen.

**Nur Hauptadmins dürfen zurücksetzen.** Ein normales Mitglied oder ein Turnieradmin mit der Rolle Supervisor hat weder den Menüpunkt noch die serverseitige Berechtigung. Das Bereitstellen neuer Website-Dateien setzt das Turnier **nicht** zurück.


## Offizielle Spielregeln (Website, PDF und Live-TV)

Die acht verbindlichen Cimbria-Regeln findest du auf **Infos → FAQs → Spielregeln** oder direkt unter [regeln.html](https://hennerdesma-art.github.io/cimbria-bierpong-cup/regeln.html). Über **PDF herunterladen** lässt sich das einseitige A4-Regelblatt `assets/Cimbria_Bierpong_Cup_Spielregeln.pdf` direkt öffnen und speichern. Die Website zeigt weiterhin das ursprüngliche Bierpong-Hintergrundvideo und den Cimbria-Zirkel.

Für strittige Spielsituationen befindet sich unter **Admin → Turnier → Live-TV & Animationen → Jetzt auf dem TV anzeigen** der Button **Spielregeln auf TV anzeigen**. Dadurch wird die Regelseite als gut lesbare Vollbild-Einblendung auf dem separat geöffneten TV sichtbar. Sie **bleibt stehen**, bis ein Admin **Einblendung beenden** drückt oder eine neue manuelle/automatische Sendung sie ersetzt. Test ohne Datenänderung: [TV-Regel-Vorschau](https://hennerdesma-art.github.io/cimbria-bierpong-cup/tv.html?preview=rules).

**Regelinhalt:** Ellenbogen hinter Tape, einmal Becher umstellen, zwei Würfe pro Runde unabhängig von der Teamgröße, Bombe (alle berührenden Becher), Balls Back bei zwei Treffern, Trickshots nach Rückrollen über die Tischmitte und Zurückholen auf dem Tisch, Aufsetzer zählen zwei Becher, kein Blasen/Fingern/Island. Nur die explizit genannten Regeln gelten; Streitfälle gehen an das Organisationsteam.


## Live-TV-Signalzuverlässigkeit (Oktober 2026)

Bei zeitweise schwachem WLAN konnten bisher VS-Intros und Siegeranimationen ausbleiben, obwohl die Main Stage weiter aktualisiert wurde. Ursache: Der TV-Client verwarf Regie-Cues bei mehr als ca. 13–14 Sekunden Verzögerung, obwohl die Spiellisten nur alle 12 Sekunden abgefragt wurden. Außerdem ignorierte ein TV-Tab mit `?preview=intro`, `?preview=winner` oder `?preview=bracket` nach Ende der Vorschau dauerhaft alle Live-Cues.

Die korrigierte V8 fragt `tv_cues` unabhängig vom Spielstand alle **2,5 Sekunden** ab, verarbeitet nach Start jede **neue Cue-ID** unabhängig von Gerätedatumsabweichungen und verliert parallele Realtime-Benachrichtigungen bei einem gerade laufenden Reload nicht mehr. Eine einmalige Vorschau wechselt nach ihrer Animation automatisch zum regulären Live-TV; eine dauerhafte Regel-Vorschau hat einen deutlichen Link **Echten Live-TV-Modus öffnen**.

Ein TV-Tab sollte als dauerhafter Bühnenbildschirm die Adresse `/tv.html` **ohne `?preview=`** verwenden. Nach Updates den Tab einmal neu laden; die Referenzen verwenden einen Cache-Buster.


## V9 – Teamverwaltung während des laufenden Cups (Admin)

**Admin Control Center → Teams → Bearbeiten**: Administratoren können einen Teamnamen auch nach bereits gespielten Spielen umbenennen sowie 2–4 Mitglieder hinzufügen, entfernen und korrigieren. Alle bisher bestätigten Ergebnisse, Match-IDs, Becherstände, Tischzuweisungen und Statistiken bleiben mit der **unveränderten Team-UUID** verknüpft. Zuschauer und Teilnehmer besitzen keinen Editier-Zugriff.

**Manuelle Gruppenkorrektur:** Während der **Gruppenphase** können Admins ein bislang ungespieltes und nicht einem Tisch zugewiesenes Team einer anderen Gruppe zuordnen oder es mit einem anderen noch nicht eingesetzten Team tauschen. Bei einfacher Verschiebung müssen beide Gruppen zwischen **2 und 4 Teams** behalten. Die Datenbank entfernt nur ungespielte, inzwischen ungültige Gruppenspiele und fügt die fehlenden Paarungen hinzu. Bereits bestätigte Ergebnisse bleiben erhalten. Wenn das betroffene Team bereits gespielt hat, ein Entscheidungsspiel in einer der Gruppen existiert oder die Playoffs begonnen haben, verhindert Supabase den Gruppenwechsel zum Schutz der Rangliste und des K.-o.-Baums. Teamnamen und Mitglieder bleiben in diesen Fällen weiterhin editierbar.

Die Änderung wird **atomar in Supabase** durchgeführt, über einen `SECURITY INVOKER`-RPC mit echter Admin-Prüfung und Turnier-Revisionskontrolle. Ein erfolgreiches Speichern aktualisiert auch die öffentliche Teamliste, Spielpläne und Live-Ansichten. Bestehende Turnierdaten werden beim Deploy nicht geändert. Tests siehe `tests/team-admin-edit.test.cjs` sowie den SQL-Regressionstest.
