# Webdev Studio

Portfolio + vier Demo-Sites für unser Webdesign-Studio in Lüdenscheid.

> Master-Brief: siehe [`CLAUDE.md`](./CLAUDE.md). Diese README ist der Quick-Start für Entwickler.

## Stack

- **Astro 4** (Multi-Page, Component-Islands)
- **Tailwind CSS 3** (mit Design-Tokens via CSS-Variablen)
- **GSAP 3 + ScrollTrigger** (Scroll-Animationen)
- **Lenis** (Smooth Scroll)
- **Splitting.js** (Per-Char/Word Text-Animationen)
- **TypeScript** (strict)

## Setup

```bash
npm install
npm run dev
```

Dev-Server läuft auf `http://localhost:4321`.

## Skripte

| Skript | Zweck |
|--------|-------|
| `npm run dev` | Dev-Server mit HMR |
| `npm run build` | Type-Check + Production-Build (`dist/`) |
| `npm run preview` | Preview des Production-Builds |

## Struktur (Kurzform)

```
src/
├── pages/           Routes (Portfolio + /demos/*)
├── layouts/         Per-Demo Layouts erben von BaseLayout
├── components/
│   ├── shared/      Wiederverwendbare Effekte (Cursor, Marquee, SplitText…)
│   └── <demo>/      Demo-spezifische Sections
├── styles/
│   ├── global.css   Reset, base, scrollbar
│   ├── tokens.css   Globale CSS-Variablen (type-scale, spacing, easings)
│   └── themes/      Pro-Demo Theme-Tokens (Farben, Fonts)
└── lib/             GSAP-Helpers, Lenis-Init, Cursor-Engine
```

Vollständige Erklärung: [`CLAUDE.md` Abschnitt 4](./CLAUDE.md).

## Konventionen

- Astro-Components, **kein** React/Vue
- Tailwind für Layout-Utilities, CSS-Files für Animationen + Theme-Tokens
- Selfhosted Webfonts in `public/fonts/` — **keine** Google-Fonts via `<link>`
- `prefers-reduced-motion` wird in jeder Animation respektiert
- Pro Section ein Commit, pro Demo ein Branch (`feature/demo-<name>`)

## Hinweise zu Abweichungen vom Brief

- Lenis-Package: Wir nutzen `lenis` (offizieller neuer Name) statt `@studio-freight/lenis` (deprecated alias). API ist identisch.
- Imports: `import Lenis from 'lenis'` statt `from '@studio-freight/lenis'`.

## OneDrive-Hinweis

Dieses Projekt liegt in einem OneDrive-Ordner. **`node_modules/` ist via `.gitignore` ausgeschlossen** — empfehle zusätzlich, den Ordner in OneDrive vom Sync auszunehmen (Rechtsklick → "Immer auf diesem Gerät behalten" deaktivieren oder via Selective Sync ausschließen), sonst wird beim ersten `npm install` ein paar GB synchronisiert.

## Deployment

→ Cloudflare Pages, siehe [`CLAUDE.md` Abschnitt 12](./CLAUDE.md).
