# CIMBRIA BIERPONG CUP

Cinematic responsive tournament platform in the Cimbria colors **violet · burgundy · gold**, with the original Zirkel and background beer-pong video.

**Live website:** https://hennerdesma-art.github.io/cimbria-bierpong-cup/  
**Public Live-TV display:** https://hennerdesma-art.github.io/cimbria-bierpong-cup/tv.html

## V5 – Live-TV and team emblems

- **Independent read-only TV page** at \`tv.html\`; open once on the projector or television and press F11 for fullscreen.
- **Original video** \`assets/background-bierpong.mp4\` plays behind the TV dashboard and cinematic takeovers.
- **Main Stage control:** admins choose the featured ready/live match in **Admin → Turnier → Live-TV & Animationen**, or from an assigned table.
- **Automatic VS intro (10 seconds):** shown on the TV when the selected Main Stage match starts.
- **Automatic winner cinematic (11 seconds):** shown only after the admin **manually** confirms the winner. Beaker counts do not automatically end matches.
- **Playoff bracket cinematic:** admin-triggered at any time, and optionally rotated into the TV display while playoffs are running.
- **Independent Admin toggles:** automatic intros, automatic winner animation and automatic bracket rotation can each be disabled without disrupting live match tracking.
- **12 curated team emblems:** crown, skull, flame, bolt, target, rocket, shield, star, anchor, dragon, cup, phoenix. Guests pick one at registration. The approved SVG images are included under \`assets/team-icons/\` and appear in team lists, match cards, brackets and TV mode.
- **No client secrets:** all readers use a public Supabase publishable key. RLS and protected admin RPCs enforce writes.

### Try the cinematics before any real game

These isolated previews do **not** write to Supabase and use explicitly fictional teams:
- [VS Intro](https://hennerdesma-art.github.io/cimbria-bierpong-cup/tv.html?preview=intro)
- [Winner Animation](https://hennerdesma-art.github.io/cimbria-bierpong-cup/tv.html?preview=winner)
- [Animated Bracket](https://hennerdesma-art.github.io/cimbria-bierpong-cup/tv.html?preview=bracket)

Open the normal \`tv.html\` for the real tournament. Leave it running on a separate screen.


## Technische Ablaufsteuerung
1. Website auf dem Admin-PC öffnen und anmelden.
2. Unter **Admin → Turnier** auf **Live-TV öffnen** klicken und den neuen Tab am Fernseher in den Vollbildmodus setzen.
3. Eines der bereitgestellten Spiele als **Main Stage** auswählen.
4. Bei aktiviertem Auto-Intro löst **Spiel starten** serverseitig eine VS-Animation aus. Der TV wechselt danach zurück zur Übersicht.
5. Admins aktualisieren während des Spiels den Becherstand. Das ist **kein** Sieg-Ereignis.
6. Erst **Sieger bestätigen** setzt das Ergebnis und löst bei aktiviertem Sieger-Effekt die goldene Siegeranimation aus.
7. In den Playoffs lässt sich der Turnierbaum manuell senden oder automatisch zwischendurch einblenden.

## Verproben
Öffne eine der drei Vorschauadressen aus der README. Testdaten existieren nur in diesem einen TV-Browserfenster und werden nicht in Supabase geschrieben. Bei einem echten TV-Betrieb ohne Preview-Parameter liest die Seite ausschließlich den Live-Stand.

## Performance
Die Regie nutzt Realtime plus periodische Aktualisierung. Animationen sind absichtlich auf etwa 10–16 Sekunden begrenzt. Vollbildmodus aktivieren (F11) und Energiesparen/Display-Standby vor dem Event deaktivieren.
