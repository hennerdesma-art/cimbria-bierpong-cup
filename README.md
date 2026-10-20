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

## Other features

Guests can register teams of 2–4 members without an account. The admin dashboard supports a configurable team cap, eight groups, automatic fixtures, live cup counters (10 to 0), table assignments, results and the 16-team knockout stage. Authorized administrators sign in with email/password; trusted head admins can approve further admin email addresses. Real data stays in Supabase.

## Project structure

- \`index.html\`: main responsive tournament website
- \`tv.html\`, \`css/tv.css\`, \`js/tv.js\`: independent public cinematic broadcast
- \`js/app.js\`: tournament UI, admin controls, team icon selector
- \`js/cloud.js\`: Supabase data adapter, including RLS-guarded TV commands
- \`css/base.css\`, \`css/v2.css\`, \`css/cloud.css\`: existing visual system + V5 components
- \`assets/background-bierpong.mp4\`: **same original video**, reused on both pages
- \`assets/team-icons/*.svg\`: twelve curated built-in crest files
- \`supabase/functions/cimbria-register-team/index.ts\`: publicly callable registration Edge Function with server-side validation
- \`supabase/migrations/\`: SQL schema/migrations as already applied to the live database
- \`docs/SUPABASE.md\`, \`docs/TV_MODUS.md\`: technical operation and configuration

## Security and operating notes

The public TV display is read-only and does not receive participant names stored in \`players\`. Only **team names**, approved team icons, fixtures, cup counters and results are broadcast. A broadcast cue is inserted on the server **only** when an admin manually starts/completes the current Main Stage match, or deliberately sends a cue in the admin controls.

**Automatic intro/win animations are enabled initially**, and can be turned off individually in Admin Settings. A hidden or off-screen TV tab can miss browser animations due to throttling; keep the TV screen awake. Autoplay uses muted background video (browser-compatible).

**Test both the guest registration and full administrator match flow on two devices before event day.** The tournament registration itself remains closed until the admin deliberately opens it. No CAPTCHA, IP rate limiter or public guest editing link is included, as requested. Do not commit passwords, private keys or the Supabase service role token to this public repository.
