# Sicherheit – Cimbria Cup
- GitHub ist **öffentlich**. Keine Passwörter, Service-Role-Keys, SMTP-Credentials, GitHub-Tokens oder Supabase-Serversecrets veröffentlichen.
- Der Supabase Publishable Key in `js/cloud.js` ist bewusst öffentlich; RLS setzt Zugriffsrechte durch.
- Neun Tabellen verfügen über RLS; keine anonymen Schreibrechte auf Datenbanktabellen. Private Spielernamen können nur verifizierte Admins lesen.
- Die öffentliche Edge Function erlaubt atomare Gast-Anmeldungen mit Datenprüfung und Kapazitätslimit.
- Die Admin-Funktionen erfordern verifizierte Auth-Identität und Eintrag in der privaten E-Mail-Allowlist.
- Die Auth Redirect URLs müssen konfiguriert sein.
- Kein CAPTCHA/Rate-Limiting/Gast-Bearbeitungslink nach Entscheidung des Auftraggebers. Nicht ohne Aufsicht offen schalten.
