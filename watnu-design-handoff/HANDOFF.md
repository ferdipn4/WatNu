# WatNu — Design-Handoff für Cursor

Dieses Paket ist das komplette Design als Dateien, so dass Cursor (oder jeder andere Agent) es ohne Rückfragen 1:1 umsetzen kann. Stack wie von `create-next-app` angelegt: Next.js 16 (App Router), React 19, Tailwind v4 (CSS-first, kein `tailwind.config.ts`).

## Einbauen (PowerShell, im Projektordner mit der package.json)

```powershell
# 1. Zip entpacken (Pfad zur Zip ggf. anpassen)
Expand-Archive -Path "$env:USERPROFILE\Downloads\watnu-design-handoff.zip" -DestinationPath "$env:USERPROFILE\Downloads\watnu-handoff" -Force
$h = "$env:USERPROFILE\Downloads\watnu-handoff\watnu-design-handoff"

# 2. design/ und .cursor/ ins Projekt-Root
Copy-Item -Recurse -Force "$h\design" .\design
Copy-Item -Recurse -Force "$h\.cursor" .\.cursor

# 3. Die drei Dateien, die die App direkt braucht
New-Item -ItemType Directory -Force .\lib | Out-Null
Copy-Item -Force .\design\features.ts .\lib\features.ts
Copy-Item -Force .\design\globals.css .\app\globals.css
Copy-Item -Force .\design\layout.snippet.tsx .\app\layout.tsx

# 4. Icons, dann starten
npm install lucide-react
npm run dev    # http://localhost:3000 muss ohne Fehler laden – Tokens und Fonts sind damit aktiv
```

Dann `lib/features.ts` öffnen und jede Zeile auf das setzen, was das Backend wirklich kann (`live` / `local` / `soon` / `off`). Das ist der einzige Ort, an dem „noch nicht da“ definiert wird — jedes betroffene Control liest den Flag und zeigt sich gestrichelt mit „Soon“-Tag (siehe `design/screenshots/FeatureStates-light.png`).

## Cursor

Den Projektordner (der mit der `package.json`) in Cursor öffnen, Agent-Modus (Ctrl+I), diesen Prompt einfügen:

```
Read design/README.md, design/screens.md, design/components/index.d.ts and lib/features.ts first. app/globals.css and app/layout.tsx are already in place (tokens, Tailwind v4 theme, fonts): do not change them.
Then build the app in this order, one commit per step:
1. The 9 UI components in components/ui/ with exactly the props in design/components/index.d.ts and the CSS values in design/components/bundle.css, mapped to the Tailwind utilities defined in app/globals.css. Check each against design/screenshots/<Name>-light.png and -dark.png.
2. The five screens, implemented 1:1 from design/components/{Home,Organizers,CreateUpload,CreateReview,MyWatNu,EventDetail}/preview.html: same structure, copy, spacing and components; routes and states from design/screens.md. Compare with design/screenshots/<Screen>-light.png and -dark.png at 390px.
3. Wire every backend-dependent control to lib/features.ts; anything the backend does not have yet is 'soon' (dashed + Soon tag + info toast), never faked and never hidden silently.
Use the sample data from the previews as fixtures until the API is connected. Do not redesign anything.
```

Die Rule `.cursor/rules/watnu-design.mdc` ist `alwaysApply: true` — Cursor liest sie bei jeder Anfrage und hält sich an Tokens, Komponenten, Screens und Wording. Bei späteren Aufgaben reicht: „Halte dich an `.cursor/rules/watnu-design.mdc` und `design/screens.md`.“ Optional: in die von Next angelegte `AGENTS.md` eine Zeile „UI: follow .cursor/rules/watnu-design.mdc and design/“ eintragen.

## Prüfen

`npm run dev`, Browser auf 390px (DevTools → Device Toolbar), daneben `design/screenshots/Home-light.png`. Dark Mode: in den DevTools `data-theme="dark"` auf `<html>` setzen. Die Originale zum Vergleichen: `design/previews-standalone/index.html` direkt im Browser öffnen (`?theme=dark` für Dark Mode; braucht Internet für die Google Fonts).

## Was drin ist

- `design/README.md` — das Brand Book: Prinzipien, Copy-Regeln, Farbe, Typo, Abstände, Radien, States, Icons/Logo, Komponenten, Feature-States, am Ende die Token-Tabelle (Hex, Fonts, Radius, Spacing) und die Tailwind-Zuordnung.
- `design/screens.md` — jeder der fünf Screens von oben nach unten, mit Komponente pro Element, Routen, Zuständen, Datenmodell und den Feature-Flags pro Screen.
- `design/tokens.json` + `design/tokens.css` — die Tokens als Daten und als CSS-Variablen (light + dark).
- `design/globals.css` (Tailwind v4: Tokens + `@theme inline` + Base) und `design/layout.snippet.tsx` (Fonts via next/font) — nach `app/` kopieren, fertig.
- `design/features.ts` — die Flags (Vorlage; Werte anpassen) → `lib/features.ts`.
- `design/components/` — `bundle.css` (die exakten Werte), `bundle.js` (Referenz-Implementierung in React), `index.d.ts` (Props), pro Komponente ein `README.md` (Regeln) und ein `preview.html` (Zustände; bei den Screens die ganze Seite).
- `design/previews-standalone/` — dieselben Previews, direkt im Browser zu öffnen.
- `design/screenshots/` — jede Preview als PNG in light und dark (2x). Die Screens: Home, Organizers, CreateUpload, CreateReview, MyWatNu, EventDetail; das Muster für fehlende Features: FeatureStates.
- `design/assets/Logos/` — Mark, Stern und Wortmarke als SVG.

## Was Cursor entscheidet vs. was fest ist

Fest: Tokens, Komponenten-Props, Screen-Aufbau, Wording, Abstände, beide Themes. Frei: Ordnerstruktur im Repo, State-Management, API-Anbindung, Fixtures. Wenn Cursor etwas „verbessern“ will: nein, erst bauen wie in den Previews — Änderungen gehen zurück ins Design-System, nicht in den Code.
