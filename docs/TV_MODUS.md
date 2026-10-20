# Live-TV-Modus – Cimbria Bierpong Cup

## So öffnet sich der TV-Modus

Unter **Admin → Turnier → Live-TV & Animationen** öffnet **Live-TV öffnen** einen eigenen Browser-Tab unter [tv.html](https://hennerdesma-art.github.io/cimbria-bierpong-cup/tv.html). Dieser Tab ist öffentlich und benötigt keine Admin-Anmeldung. Mit F11 auf dem Fernseher oder Beamer in den Vollbildmodus wechseln.

Die TV-Seite nutzt dasselbe Video `assets/background-bierpong.mp4` wie die Hauptwebsite. Sie zeigt zentral das Main-Stage-Spiel, Becherstände, aktive Tische, kommende Partien, vier Gruppentabellen und die Playoff-Übersicht.

## Automatische Einblendungen

- **Match-Intro (10 Sekunden):** Wird ausgelöst, sobald ein als Main Stage markiertes Spiel von `ready` nach `live` wechselt, sofern der Schalter **Automatische VS-Intros** aktiviert ist.
- **Siegeranimation (11 Sekunden):** Wird ausgelöst, sobald der Admin den Sieger des Main-Stage-Spiels bestätigt und das Spiel dadurch `done` wird, sofern **Automatische Siegeranimation** aktiv ist.
- **Turnierbaum (15 Sekunden):** Während der Playoffs kann die TV-Ansicht bei aktiviertem Schalter **Turnierbaum automatisch zeigen** zwischendurch zur animierten K.-o.-Übersicht wechseln.

Die Becherwerte sind dabei **keine** automatische Ergebnisentscheidung. Nur die explizite Siegerbestätigung im Admin-Dashboard schließt eine Partie ab.

## Manuelle Regie

Die Turnierleitung kann in demselben Admin-Abschnitt die Main Stage festlegen, ein VS-Intro oder die bereits bestätigte Siegeranimation direkt senden, den Turnierbaum einblenden oder eine laufende Einblendung beenden. Nur Hauptadmins/Turnieradmins mit freigeschalteter Supabase-Identität dürfen dies.

## Gefahrlos ausprobieren

Die drei Vorschau-Links enthalten fiktive Namen und Embleme ausschließlich im aktuellen TV-Fenster. Sie verändern **keine** Teams oder Ergebnisse:

- [Intro](https://hennerdesma-art.github.io/cimbria-bierpong-cup/tv.html?preview=intro)
- [Sieg](https://hennerdesma-art.github.io/cimbria-bierpong-cup/tv.html?preview=winner)
- [Turnierbaum](https://hennerdesma-art.github.io/cimbria-bierpong-cup/tv.html?preview=bracket)

## Technik und Hinweise

Supabase `tv_cues` veröffentlicht die Regie-Ereignisse über Realtime; ein periodischer Abruf dient als Fallback. Der TV-Client besitzt **nur** einen öffentlichen Publishable Key. In einem ruhenden Browser-Tab oder bei aktivem Energiesparen können Animationen verzögert oder übersprungen werden. Das TV-Fenster vor dem Turnier auf dem tatsächlichen Ausgabegerät testen und Standby deaktivieren.

Das TV-Modul verwendet das unveränderte bestehende Video; es braucht keine zusätzliche Server- oder Hosting-Konfiguration außer der vorhandenen GitHub-Pages-Veröffentlichung.