import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const allowedOrigins = new Set([
  "https://hennerdesma-art.github.io",
  "http://localhost:5173",
  "http://localhost:8000",
  "http://127.0.0.1:8000",
]);

function cors(origin: string | null): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": origin && allowedOrigins.has(origin)
      ? origin : "https://hennerdesma-art.github.io",
    "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    Vary: "Origin",
  };
}
function json(data: unknown, status: number, origin: string | null) {
  return new Response(JSON.stringify(data), {
    status, headers: { "Content-Type": "application/json; charset=utf-8", ...cors(origin) },
  });
}
Deno.serve(async (req: Request) => {
  const origin = req.headers.get("origin");
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors(origin) });
  if (req.method !== "POST") return json({ error: "Methode nicht erlaubt" }, 405, origin);
  // The Endpoint is intentionally public: guests do not need an account.
  // Browsers may only call from the designated website origin.
  if (origin && !allowedOrigins.has(origin))
    return json({ error: "Diese Website ist nicht freigegeben" }, 403, origin);
  if (!req.headers.get("content-type")?.toLowerCase().includes("application/json"))
    return json({ error: "JSON erforderlich" }, 415, origin);
  if (Number(req.headers.get("content-length") || "0") > 5000)
    return json({ error: "Eingabe zu groß" }, 413, origin);
  try {
    const body = await req.json();
    const name = typeof body?.teamName === "string"
      ? body.teamName.trim().replace(/\s+/g, " ") : "";
    const players = Array.isArray(body?.players) ? body.players : [];
    const allowedIcons = new Set(["crown","skull","flame","bolt","target","rocket",
      "shield","star","anchor","dragon","cup","phoenix"]);
    const iconId = typeof body?.iconId === "string" ? body.iconId : "crown";
    if (name.length < 3 || name.length > 35 ||
        players.length < 2 || players.length > 4 ||
        !allowedIcons.has(iconId) ||
        players.some((p: unknown) => typeof p !== "string" ||
          p.trim().length < 2 || p.trim().length > 50)) {
      return json({ error: "Bitte Teamname und 2–4 vollständige Spielernamen prüfen." }, 400, origin);
    }
    const url = Deno.env.get("SUPABASE_URL");
    const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!url || !service) {
      console.error("Edge registration missing backend configuration");
      return json({ error: "Die Registrierung ist derzeit nicht verfügbar." }, 503, origin);
    }
    const answer = await fetch(url + "/rest/v1/rpc/cimbria_guest_register_team", {
      method: "POST",
      headers: {
        "apikey": service,
        "Authorization": "Bearer " + service,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        p_slug: "cimbria-bierpong-cup",
        p_name: name,
        p_players: players.map((p: string) => p.trim().replace(/\s+/g, " ")),
        p_icon_id: iconId,
      }),
    });
    const result = await answer.json().catch(() => ({}));
    if (!answer.ok) {
      const err = String(result?.message || "");
      const allowed = [
        "Die Anmeldung ist geschlossen", "Das Teilnehmerlimit ist erreicht",
        "Dieser Teamname ist bereits vergeben", "Teamname muss",
        "Das Team muss", "Spielername muss",
      ];
      return json({ error: allowed.some(s => err.includes(s)) ? err :
        "Anmeldung fehlgeschlagen. Bitte erneut versuchen." }, 400, origin);
    }
    return json({ success: true, team: result.team_name, total: result.team_count }, 201, origin);
  } catch (err) {
    console.error("Guest registration failed", err);
    return json({ error: "Die Anmeldung konnte nicht abgeschlossen werden." }, 500, origin);
  }
});
