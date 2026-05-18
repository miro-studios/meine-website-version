# Webdev Studio — Projekt-Brief

> Diese Datei ist der **Master-Brief** für Claude Code. Lies sie vollständig bevor du Code schreibst. Befolge die Design-, Code- und Qualitätsstandards in jedem Commit.

---

## 1. Kontext

miro-studios ist ein **Solo-Studio** in Kierspe, NRW (Inhaber: David Rost, Kleinunternehmer nach § 19 UStG). Wir bauen Websites für lokale Geschäfte — Gastronomie, Handwerk, Friseure, Dienstleister. Stärke: **Design-Qualität, die kleine Studios in dieser Preisklasse normalerweise nicht erreichen.**

Dieses Repo enthält:
- **Die Portfolio-Seite** (verkauft das Studio an potenzielle Kunden)
- **Drei Live-Demo-Websites** (Café Nordlicht, Bella Notte, Atelier Vossen — jede stilistisch unverwechselbar)
- **Templates** (interne Basis-Templates für Kundenprojekte)

Die Demos liegen unter `/demos/<name>/` auf der Hauptdomain `miro-studios.de`. Sie sind unser stärkstes Verkaufsargument — wenn sie nicht beeindrucken, bekommen wir keine Aufträge.

Sprachregelung im Portfolio-Text: „wir" als Studio-Pluralis ist erlaubt (passt zum Studio-Auftritt). Im Impressum und in der Datenschutzerklärung dagegen strikt „ich" — beides sind Pflichtangaben für eine konkrete natürliche Person.

---

## 2. Qualitätsstandard — wichtigster Abschnitt

**Wir wollen Awwwards-Niveau, nicht Wordpress-Theme-Niveau.**

Konkret heißt das:

- Jede Demo hat eine **klar erkennbare gestalterische Handschrift**. Nicht alle vier dürfen gleich aussehen, nur mit anderen Farben. Verschiedene Schriften, verschiedene Layouts, verschiedene Energie.
- **Mutige typografische Entscheidungen.** Riesige Display-Schriften (clamp(80px, 14vw, 240px) ist normal). Mix aus Display- und Mono-Akzenten. Keine Inter, kein Roboto, kein Helvetica.
- **Scroll als Erlebnis.** Nicht nur Fade-In bei Section-Reveal — sondern Pin-Sections, Parallax, horizontale Scrolls, Text-Splitting, Image-Reveals mit Clip-Path, Stagger-Animationen.
- **Hover-Zustände sind Pflicht, nicht Kür.** Jeder Button, jede Karte, jedes Bild reagiert. Magnetic-Cursor-Effekte auf wichtigen CTAs. Tilt auf Bildkarten.
- **Mikro-Details.** Custom-Cursor, animierte Logos, Marquee-Ticker, Number-Counter, Live-Indikatoren, Easter Eggs. Diese Details unterscheiden uns vom Mittelmaß.
- **Smooth Scroll** (Lenis) ist Standard, nicht optional.
- **Page-Transitions** zwischen Routen, wo möglich (View Transitions API oder GSAP).

**Referenzniveau:** Sites die auf Awwwards SOTD gewinnen, Studios wie Locomotive, Active Theory, Resn, Hello Monday, Studio Mesmer, Outsider Studio, Robin Mastromarino.

**Was wir NICHT wollen:**
- Bootstrap- oder Material-UI-Look
- Generische "AI-Slop"-Aesthetics (lila Gradients auf weiß, Stockfoto-Hero, Card-Grid mit Icons aus Lucide)
- Standard-Tailwind-Component-Beispiele
- "Modern Minimalist Clean" als Faulheits-Ausrede

Wenn du dabei bist, ein Standard-Layout zu produzieren — **stop. Push das Design weiter.** Frag dich: Würde ein Senior Designer bei Pentagram das so abgeben?

---

## 3. Tech-Stack

| Bereich | Wahl | Warum |
|---------|------|-------|
| Framework | **Astro 4+** | Multi-Page, schnell, Component-Islands, perfekt für Multi-Site-Setup |
| Styling | **Tailwind CSS 3** | Schnell, plus eigene CSS-Variablen für Themes |
| Animationen | **GSAP 3 + ScrollTrigger** | Industriestandard für Scroll-Effekte, Premium-Tier nicht nötig |
| Smooth Scroll | **Lenis** | Buttery smooth scrolling, GSAP-kompatibel |
| Text-Splits | **Splitting.js** oder GSAP SplitText (Workaround) | Per-Char/Word-Animationen |
| Cursor-Effekte | **Custom JS** (kein Plugin nötig) | Lean halten |
| 3D-Tilt | **vanilla-tilt** wenn gebraucht | Lightweight |
| Icons | **Lucide** für UI, **Heroicons** für funktionale | Custom SVG für brand-spezifische |
| Forms | **Formspree** als Service oder Cloudflare Workers | Kein Backend nötig |
| Deploy | **Cloudflare Pages** | Kostenlos, unbegrenzte Sites |

### NPM-Setup (initial)

```bash
npm create astro@latest -- --template minimal --typescript strict
npm install -D tailwindcss @astrojs/tailwind
npm install gsap @studio-freight/lenis splitting
npm install lucide-astro
npx astro add tailwind
```

### Astro-Config Hinweise

- View Transitions in Layout aktivieren: `<ViewTransitions />`
- Image-Optimization: Astro `<Image />` Component nutzen, nicht raw `<img>`
- Prefetch aktivieren in `astro.config.mjs`: `prefetch: true`

---

## 4. Projekt-Struktur

```
webdev-studio/
├── CLAUDE.md                      ← diese Datei
├── README.md
├── package.json
├── astro.config.mjs
├── tailwind.config.mjs
├── tsconfig.json
├── public/
│   ├── fonts/                     ← lokale Webfonts (selfhosted, performance)
│   ├── images/
│   │   ├── portfolio/
│   │   ├── pizzeria/
│   │   ├── elektro/
│   │   ├── friseur/
│   │   └── handwerker/
│   └── favicon.svg
├── src/
│   ├── pages/
│   │   ├── index.astro            ← Portfolio Homepage
│   │   ├── about.astro
│   │   ├── kontakt.astro
│   │   ├── impressum.astro
│   │   ├── datenschutz.astro
│   │   └── demos/
│   │       ├── pizzeria/
│   │       │   ├── index.astro
│   │       │   ├── speisekarte.astro
│   │       │   └── reservierung.astro
│   │       ├── elektro/
│   │       │   ├── index.astro
│   │       │   ├── leistungen.astro
│   │       │   └── kontakt.astro
│   │       ├── friseur/
│   │       │   ├── index.astro
│   │       │   ├── team.astro
│   │       │   └── buchen.astro
│   │       └── handwerker/
│   │           ├── index.astro
│   │           ├── projekte.astro
│   │           └── anfrage.astro
│   ├── layouts/
│   │   ├── BaseLayout.astro       ← shared head, fonts, smooth scroll setup
│   │   ├── PortfolioLayout.astro
│   │   ├── PizzeriaLayout.astro
│   │   ├── ElektroLayout.astro
│   │   ├── FriseurLayout.astro
│   │   └── HandwerkerLayout.astro
│   ├── components/
│   │   ├── shared/                ← cross-demo
│   │   │   ├── SmoothScroll.astro
│   │   │   ├── CustomCursor.astro
│   │   │   ├── Marquee.astro
│   │   │   ├── ScrollProgress.astro
│   │   │   ├── PageTransition.astro
│   │   │   ├── SplitText.astro
│   │   │   ├── MagneticButton.astro
│   │   │   ├── RevealOnScroll.astro
│   │   │   └── NumberCounter.astro
│   │   ├── portfolio/
│   │   ├── pizzeria/
│   │   ├── elektro/
│   │   ├── friseur/
│   │   └── handwerker/
│   ├── styles/
│   │   ├── global.css             ← reset, base, fonts, lenis styles
│   │   ├── tokens.css             ← global CSS-Variables (rare)
│   │   └── themes/
│   │       ├── pizzeria.css       ← demo-spezifische Theme-Tokens
│   │       ├── elektro.css
│   │       ├── friseur.css
│   │       └── handwerker.css
│   ├── lib/
│   │   ├── animations.ts          ← shared GSAP-Setups (split-text, reveal, etc.)
│   │   ├── cursor.ts              ← magnetic cursor, follower
│   │   ├── lenis.ts               ← smooth scroll initialization
│   │   └── utils.ts
│   └── content/                   ← optional content collections
├── templates/                     ← Basis-Templates für Kundenprojekte
│   ├── one-pager-base/
│   ├── multi-page-base/
│   └── README.md
└── docs/
    └── client-handover.md         ← Anleitung zum Übergabe-Prozess
```

---

## 5. Design-Tokens (global)

### Typografie

Wir kuratieren Fonts pro Demo. Keine Default-Fallbacks. **Selfhosted via `public/fonts/`** für Performance — keine Google-Fonts-Links.

| Demo | Display | Body | Akzent |
|------|---------|------|--------|
| Portfolio | Editorial Old, Migra, oder PP Editorial New | Geist oder Söhne | JetBrains Mono |
| Pizzeria | Recoleta, Tiempos, oder Cheee | Inter Tight | Caveat (handwritten) |
| Elektro | Anton, Druk Wide, oder Migra Italic | Manrope | JetBrains Mono |
| Friseur | PP Editorial New, Boska, oder Tobias | Söhne | — |
| Handwerker | Söhne Breit, Untitled Serif, oder Domaine Display | Inter Tight | — |

**Wenn ein Font kostenpflichtig ist:** entweder über Adobe Fonts / Use & Modify (gratis) eine Alternative finden, oder bei kostenlosen Pendants bleiben (z. B. Fraunces statt Recoleta, Bebas Neue statt Druk Wide). **Nicht** auf Inter zurückfallen — das wäre Designversagen.

### Globale CSS-Tokens (`tokens.css`)

```css
:root {
  /* Type-Scale (fluid via clamp) */
  --text-xs: clamp(0.75rem, 0.5vw + 0.6rem, 0.875rem);
  --text-sm: clamp(0.875rem, 0.5vw + 0.75rem, 1rem);
  --text-base: clamp(1rem, 0.5vw + 0.875rem, 1.125rem);
  --text-lg: clamp(1.25rem, 1vw + 1rem, 1.5rem);
  --text-xl: clamp(1.5rem, 2vw + 1rem, 2.25rem);
  --text-2xl: clamp(2rem, 4vw + 1rem, 3.5rem);
  --text-display: clamp(3rem, 8vw + 1rem, 7rem);
  --text-mega: clamp(4rem, 14vw, 14rem);

  /* Spacing (8px-Basis) */
  --space-1: 0.5rem;
  --space-2: 1rem;
  --space-3: 1.5rem;
  --space-4: 2rem;
  --space-6: 4rem;
  --space-8: 6rem;
  --space-12: 9rem;

  /* Easings */
  --ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1);
  --ease-in-out-quart: cubic-bezier(0.76, 0, 0.24, 1);

  /* Radius */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 16px;

  /* Z-Index Scale */
  --z-cursor: 9999;
  --z-modal: 1000;
  --z-header: 100;
}
```

Theme-spezifische Variablen kommen jeweils in `themes/*.css` und werden im Demo-Layout geladen.

---

## 6. Animations-System

Diese Helper-Komponenten und -Funktionen werden in `src/lib/` und `src/components/shared/` zentral gepflegt. Jede Demo kann sie einbinden.

### 6.1 Lenis Smooth Scroll Setup (`src/lib/lenis.ts`)

```typescript
import Lenis from '@studio-freight/lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function initLenis() {
  const lenis = new Lenis({
    duration: 1.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
    wheelMultiplier: 1,
    touchMultiplier: 2,
  });

  lenis.on('scroll', ScrollTrigger.update);

  gsap.ticker.add((time) => {
    lenis.raf(time * 1000);
  });

  gsap.ticker.lagSmoothing(0);

  return lenis;
}
```

### 6.2 Split Text Reveal (`src/components/shared/SplitText.astro`)

Animation: Buchstaben/Wörter werden bei Scroll-Eintritt von unten nach oben mit Stagger eingeblendet.

```typescript
// Beispiel-Logik (Detail in der Komponente)
const split = new SplitType(element, { types: 'lines, words, chars' });

gsap.from(split.chars, {
  yPercent: 100,
  opacity: 0,
  stagger: 0.02,
  duration: 1,
  ease: 'expo.out',
  scrollTrigger: { trigger: element, start: 'top 80%' }
});
```

### 6.3 Magnetic Button (`src/components/shared/MagneticButton.astro`)

Button "zieht" zum Cursor wenn dieser in der Nähe ist. Standard-Effekt für Hero-CTAs.

```typescript
button.addEventListener('mousemove', (e) => {
  const rect = button.getBoundingClientRect();
  const x = e.clientX - rect.left - rect.width / 2;
  const y = e.clientY - rect.top - rect.height / 2;
  gsap.to(button, { x: x * 0.3, y: y * 0.3, duration: 0.4 });
});
button.addEventListener('mouseleave', () => {
  gsap.to(button, { x: 0, y: 0, duration: 0.6, ease: 'elastic.out(1, 0.4)' });
});
```

### 6.4 Custom Cursor (`src/components/shared/CustomCursor.astro`)

Ein kleiner Punkt + ein größerer Ring der dem Cursor folgt mit leichter Verzögerung. Bei Hover über Links/Buttons wächst der Ring. Auf Mobile deaktivieren.

### 6.5 Marquee (`src/components/shared/Marquee.astro`)

Endlos-Ticker mit konfigurierbarer Geschwindigkeit und Richtung. Pausiert auf Hover. Geschwindigkeit kann an Scroll-Velocity gekoppelt werden für extra Effekt.

### 6.6 Image Reveal (Clip-Path)

Bilder werden beim Scroll-Eintritt mit `clip-path` von unten oder einer Seite eingerollt. Standard-Effekt für Galerien.

```typescript
gsap.fromTo(image,
  { clipPath: 'inset(100% 0 0 0)' },
  { clipPath: 'inset(0% 0 0 0)', duration: 1.4, ease: 'expo.out',
    scrollTrigger: { trigger: image, start: 'top 75%' } }
);
```

### 6.7 Pin Sections

Sections die "kleben" während Sub-Inhalt animiert wird. Gut für Process-Steps, Feature-Stories.

### 6.8 Horizontal Scroll

Innerhalb einer Section horizontal scrollen statt vertikal. Stark in Galerien.

### 6.9 Reveal-on-Scroll Helper

Generischer Wrapper der Inhalte beim ersten In-View einblendet (`opacity 0 → 1` + `y 40px → 0`). Standard-Pattern.

### 6.10 Number Counter

Zahlen die hochzählen wenn sie ins Viewport kommen. Standard für Stats.

---

## 7. Shared Components

Diese Komponenten leben in `src/components/shared/` und werden in mehreren Demos verwendet:

- `BaseHead.astro` — meta, fonts, OG-tags
- `SmoothScroll.astro` — Lenis-Init-Wrapper
- `CustomCursor.astro` — global cursor (kann pro Demo deaktiviert werden)
- `Marquee.astro` — Ticker-Bar
- `MagneticButton.astro` — Magnetic-CTA
- `SplitText.astro` — Text-Reveal-Wrapper
- `RevealOnScroll.astro` — generic reveal-wrapper
- `NumberCounter.astro` — zählende Zahl
- `ScrollProgress.astro` — Progress-Bar oben
- `PageTransition.astro` — View Transition wrapper
- `ImageReveal.astro` — clip-path-reveal für Bilder

**Diese Komponenten dürfen sich nicht doppeln.** Wenn ein Demo einen Custom-Cursor mit anderem Look braucht, akzeptiert er Props (Größe, Farbe, Mix-Blend-Mode) — nicht eine zweite Komponente.

---

## 8. Demo-Briefs

Jede Demo hat eine **eigene Persönlichkeit**. Der Mut liegt im Commitment zu einer Richtung, nicht im Mischen.

### 8.1 Pizzeria — "Bella Notte"

**Kategorie:** Italienisches Restaurant, traditionell, familiengeführt

**Aesthetic:** Editorial-Magazine meets warmes Restaurant-Branding. Wie ein hochwertiger Bildband über italienische Küche. Texture, Wärme, Handarbeit.

**Farbpalette:**
- Primär: Tiefes Tomatenrot (#A8261B) oder gebranntes Terracotta (#C44536)
- Sekundär: Cremeweiß (#F5EFE6), Olivgrün (#5C6B3D)
- Akzent: Goldgelb für Pasta-Highlights (#E8B547)
- Hintergrund-Option: Off-White mit warmen Untertönen (#F8F2E8)

**Typografie:**
- Display: Recoleta, Fraunces oder Tiempos Headline (serifig, charaktervoll)
- Body: Inter Tight oder einen warmen Sans
- Akzent: Caveat oder Homemade Apple (handgeschrieben für Notizen, Preise)

**Hero-Idee:** Riesige italienische Headline ("La Vera Pizza"), kombiniert mit kleinem Tagline-Text auf Deutsch. Pizzeria-Daten als kleine Mono-Labels (gegründet, Standort). Hintergrund: subtle Papier-Textur oder ein einzelnes Hero-Bild einer Pizza die langsam parallax-rotiert.

**Sections:**
- Hero mit Split-Text-Reveal und parallax Pizza-Bild
- Über uns (Familie Caruso seit 1972) mit Zeitstrahl
- Speisekarte als interaktives Magazin (horizontaler Scroll oder Buch-Pagination)
- Galerie mit Bildern aus dem Restaurant (Clip-Path-Reveals)
- Reservierungs-Section (Termin wählen, Personenanzahl, mit Bestätigung)
- Standort + Kontakt mit eingebetteter Karte
- Footer mit Öffnungszeiten

**Spezifische Effekte:**
- Pizza-Bilder rotieren langsam wenn man drüberhovert (transform: rotate)
- Beim Scroll: Speisekarten-Items fliegen leicht versetzt rein
- Logo-Wortmarke in Display-Schrift, mit subtiler "kerning"-Animation beim Hover
- Footer mit großem Marquee "BUONA PIZZA · BUONA VITA · BUONA SERA · BUONA NOTTE"

**Anti-Pattern:** Keine Pizza-Emojis, keine grün-weiß-rote Italo-Klischee-Flagge, kein "Mamma Mia" Branding-Witz.

### 8.2 Elektrotechnik — "Holtkamp"

**Kategorie:** Elektriker / Heizungsbauer, Meisterbetrieb, NRW

**Aesthetic:** Industrial Brutalism mit Premium-Touch. Schwarz, scharf, technisch. Wie eine moderne Engineering-Firma.

**Farbpalette:**
- Hintergrund: Tiefes Warmschwarz (#0E0E0C)
- Surface: #161614, #1F1F1C
- Text: Warmer Cream (#F0EDE4)
- Akzent: Elektrisches Gelb (#FFD60A) — sparsam aber bold

**Typografie:**
- Display: Anton, Druk Wide oder Bebas Neue (extra condensed, all-caps)
- Body: Manrope (clean, geometrisch)
- Akzent: JetBrains Mono für technische Labels, IDs, Stats

**Hero-Idee:** Drei Wörter, jedes auf eigener Zeile, riesig. "Strom, / Wärme, / Zukunft." Mittlere Zeile in Gelb. Buchstaben slidet von unten rein. Live-Indikator "24h Notdienst aktiv" mit pulsierendem Dot.

**Sections:**
- Hero mit Split-Text + Live-Indicator
- Marquee in Gelb mit Leistungs-Keywords
- Leistungen als 3x2 Grid mit Hover-zu-Gelb
- Projekt-Galerie mit großen Bildern und Clip-Path-Reveals
- Prozess in 4 nummerierten Schritten
- Stats-Counter (37 Jahre, 2400+ Projekte, etc.)
- Testimonials in Card-Layout
- Buchungsformular auf gelbem Hintergrund (kompletter Farb-Flip!)
- Footer mit gigantischem "HOLTKAMP." Wortmarke

**Spezifische Effekte:**
- Service-Cards: bei Hover komplett zu Gelb flip
- Pin-Section beim Prozess-Bereich (4 Steps werden bei Scroll gefadet)
- Magnetic CTAs auf alle Buttons
- Custom-Cursor: kleiner gelber Punkt + Ring
- Marquee koppelt sich an Scroll-Velocity (schneller = schneller)

### 8.3 Friseur — "Studio Sept"

**Kategorie:** High-End Friseursalon und Beauty-Studio

**Aesthetic:** Editorial / Fashion-Magazine. Wie Vogue oder Document Journal. Riesige Typografie, dramatische Whitespace, Mode-Fotografie-Energie. Refined, weich, weiblich aber nicht klischeehaft.

**Farbpalette:**
- Primär: Off-White / Bone (#F8F4ED)
- Sekundär: Tiefes Pflaume (#3A2438) oder Mocha (#54382F)
- Akzent: Pastel Coral (#F4C5B5) oder Sage (#B5C4A8)
- Text: Anthrazit (#1A1716)

**Typografie:**
- Display: PP Editorial New, Boska oder Tobias (high-contrast Serif, Italic ist key)
- Body: Söhne, Inter Tight (clean Sans)
- Kein Mono-Akzent — bleib editorial

**Hero-Idee:** Riesige italische Display-Schrift. Wort-für-Wort Reveal. Asymmetrisches Layout: Logo links oben klein, Mega-Headline mittig-versetzt, Tagline rechts unten. Background ein einzelnes großes Mode-Fotos-style Bild (Person + Haar-Detail) mit Clip-Path-Reveal beim Laden.

**Sections:**
- Hero (siehe oben)
- Services als Editorial-Layout: jedes Service in eigener "Spread" mit großem Bild + kurzem Text + Preis
- Team-Section: Stylisten-Portraits in Grid, mit großen Namen die bei Hover auf das Bild "fallen"
- Galerie als horizontales Scroll-Carousel (Lookbook-Stil)
- Online-Buchung (Datum, Service, Stylist, Uhrzeit)
- Press / Awards (kleine Logos in Reihe, schwarz-weiß)
- Footer extrem reduziert

**Spezifische Effekte:**
- Bilder fade-in mit slow-blur-out (von blurry zu scharf)
- Hovers auf Bildern: leichtes Tilt + Skala 1.03
- Page-Transitions zwischen Routen mit Slide-Up-Cover-Mask
- Sehr großzügiger Whitespace — die Seite atmet
- Cursor wird zu "Pfeil" wenn über Bildern
- Text "rollt" beim Hover über Stylisten-Namen (Mask-Reveal)

**Anti-Pattern:** Kein Pink-Pastell-Flowery-Gedöns. Kein Roségold-Glitter. Kein "Beauty"-Klischee. Editorial bedeutet nüchtern, nicht süß.

### 8.4 Handwerker — "Kruse Bau"

**Kategorie:** Handwerksbetrieb für Sanierung, Anbauten, Trockenbau, Innenausbau

**Aesthetic:** Solid, vertrauenswürdig, "echtes Handwerk". Erdtöne, robust, mit handgemachtem Detail. Inspiriert von Schweizer Bauernhof-Ästhetik mit moderner Note. Tactile, materiell.

**Farbpalette:**
- Hintergrund: Warmweiß / Papier (#EFEAE0) oder Beton-Grau (#D8D4CC)
- Primär: Tiefes Holzbraun (#3A2C1F) oder Anthrazit (#26221E)
- Akzent: Gebranntes Orange (#C75D2F) oder Moosgrün (#5A6E4F)

**Typografie:**
- Display: Söhne Breit, Untitled Serif Bold oder Domaine Display
- Body: Inter Tight oder Söhne
- Optional Letterpress-Texture-Effekt für Display

**Hero-Idee:** Statische, gewichtige Headline. Großes Bild eines fertigen Projekts (Holzbalken-Anbau o.ä.) mit subtiler Paper-Texture-Overlay. "Bauen mit Verstand" + Untertitel mit Werte-Statement.

**Sections:**
- Hero mit Project-Hero-Image
- Über uns: Geschichte des Familienbetriebs mit Zeitstrahl, alte Fotos in Schwarzweiß
- Leistungen als nummerierte Liste mit Detailseiten
- Vorher-Nachher-Slider in Galerie (drag-to-reveal)
- Projekt-Case-Studies mit großen Hero-Images pro Projekt
- Werte-Section (z. B. "Ehrlich. Pünktlich. Sauber.") in Mega-Display-Type
- Anfrageformular (was, wann, wo, Budget)
- Footer mit Handschrift-Element

**Spezifische Effekte:**
- Vorher-Nachher-Slider in der Galerie ist das Highlight
- Texturen: subtile Paper-Grain-Overlay über der ganzen Seite (`mix-blend-mode: multiply`)
- Schrift fade-in mit subtle blur-to-sharp
- Bilder haben dezente "weight" / shadow die beim Hover anwächst
- Numbers (Jahre, Projekte) in handschriftlicher Mono daneben

---

## 9. Portfolio-Seite ("studio")

Unsere eigene Marke. Muss am stärksten wirken — sie verkauft uns.

**Aesthetic:** Editorial-Studio meets Tech-Forward. Schwarz oder sehr dunkel als Default. Smart, bold, mit Persönlichkeit. Die Seite muss wirken als hätte ein Senior-Studio sie gebaut.

**Sections:**
1. Hero mit Studio-Manifest (Mega-Display-Type, animiert)
2. Showcase-Reel: 4 Demo-Karten mit Live-Hover-Preview (iframe-thumbnail oder animiertes Bild)
3. "Was wir können" als Grid (Web Design, Development, Branding, etc.)
4. Prozess in horizontalem Scroll
5. Über uns: zwei Portrait-Cards, mit kleinem Text pro Person
6. Pricing als drei klare Pakete (One-Pager, Multi-Page, Premium)
7. FAQ mit Accordions
8. Kontakt-Section / Anfrageformular
9. Footer mit großem Studio-Wortmarken-Text

**Pflicht-Effekte:**
- Custom Cursor (klein, weiß, mit blend-mode)
- Lenis Smooth Scroll
- Demo-Cards mit Live-Preview bei Hover (kann iframe sein)
- Page-Transitions
- Magnetic CTA auf "Anfrage starten"
- Studio-Wortmarke im Footer mit Hover-Animation

---

## 10. Templates-Ordner

`/templates/` enthält **interne** Basis-Templates die wir für Kundenprojekte nutzen. Nicht öffentlich, kein Routing.

- `one-pager-base/` — Astro-Template für einfache Single-Page-Sites
- `multi-page-base/` — Astro-Template für mehrseitige Sites
- `README.md` — Anleitung wie wir aus den Templates Kundenprojekte starten

Templates haben einen **klaren Konfigurationspunkt** (`site.config.ts`) wo Brand-Farben, Fonts und Inhalte definiert werden, damit Anpassung an Kunden schnell geht.

---

## 11. Performance & Accessibility

**Performance-Ziele:**
- Lighthouse Performance ≥ 90 mobil
- LCP < 2.0s
- CLS < 0.05
- Bilder via Astro `<Image />`, AVIF/WebP, lazy-loaded außer Hero
- Webfonts selfhosted, `font-display: swap`, woff2
- GSAP/Lenis nur auf Seiten laden die sie brauchen
- Kein jQuery, kein Bootstrap, keine ungenutzten Dependencies

**Accessibility:**
- Semantisches HTML (heading-Hierarchie, landmark-tags)
- Alle interaktiven Elemente keyboard-erreichbar
- Focus-States sichtbar (auch auf Custom-Cursor-Setups)
- `prefers-reduced-motion` respektieren — alle GSAP-Animationen müssen darauf reagieren
- Alt-Texte für alle Bilder
- Color-Contrast WCAG AA

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

In JS GSAP entsprechend deaktivieren wenn der User reduzierte Bewegung will.

---

## 12. Deployment auf Cloudflare Pages

**Setup:**
1. Repo auf GitHub pushen
2. Cloudflare Pages mit dem Repo verbinden
3. Build-Command: `npm run build`
4. Output-Directory: `dist`
5. Node-Version: 20
6. Environment-Variablen falls nötig

**Subdomain-Strategie:**
- Hauptdomain: `studio.de` → Portfolio
- Demos: `demo-pizzeria.studio.de`, `demo-elektro.studio.de`, etc.

Da dieses Repo eine einzige Astro-Site ist, lösen wir das via:
- Option A: Eine Site, alle Demos unter `/demos/...` Routes (einfacher)
- Option B: Multi-Site-Build mit Astro's `vite` config split (komplizierter, aber sauberere Subdomains)

**Empfehlung:** Start mit Option A. Migrate zu Option B sobald wir mehr als 4 Demos haben oder Performance-Probleme auftreten.

---

## 13. Workflow & Code-Conventions

### Component-Conventions

- Astro-Components für Layout/Markup, **keine React/Vue** außer es ist zwingend nötig
- Inline-Scripts in Astro-Components, hydration via `<script>` am Ende
- Tailwind für 90% der Styles, CSS-Files für Animations und Theme-Tokens
- TypeScript überall wo möglich
- Components klein halten — wenn eine Datei > 200 Zeilen wird, aufteilen

### Naming

- Komponenten: PascalCase (`HeroSection.astro`)
- Utilities: camelCase (`splitText.ts`)
- CSS-Variables: kebab-case mit Namespace (`--pizzeria-primary`)

### Git-Commits

- Konventional: `feat:`, `fix:`, `style:`, `refactor:`, `chore:`
- Pro Demo eigener Branch: `feature/demo-pizzeria`
- Kein direktes Pushen auf `main` — über PR

### Was Claude Code tun soll

1. **Initiales Setup:** Astro + Tailwind + GSAP + Lenis installieren, Projekt-Struktur anlegen, Base-Layout und shared Components bauen.
2. **Eine Demo nach der anderen:** nicht alle vier parallel halbgar. Erst Pizzeria komplett (inkl. aller Effekte), dann nächste.
3. **Vor jeder Demo:** Theme-Tokens (Farben, Fonts) in `src/styles/themes/[demo].css` festlegen.
4. **Commit-Strategie:** Pro Section ein Commit. Kleine Einheiten.
5. **Vor Done-Marking:** Lighthouse-Check, Mobile-Test, Reduced-Motion-Test.

### Was Claude Code NICHT tun soll

- Nicht generische Tailwind-Component-Library-Patterns kopieren
- Nicht "minimal/clean" als Ausrede für fehlende Ideen nehmen
- Keine Stockfoto-Heroes ohne Verarbeitung
- Keine generischen Card-Grids aus shadcn/ui
- Nicht alle Demos im gleichen Stil bauen mit anderen Farben
- Nicht ohne `prefers-reduced-motion` Behandlung mergen
- Keine externen Fonts via `<link>` zu Google laden — selfhost

---

## 14. Erste Schritte (für Claude Code)

```bash
# 1. Projekt initialisieren
npm create astro@latest webdev-studio -- --template minimal --typescript strict --install --git
cd webdev-studio

# 2. Dependencies
npx astro add tailwind
npm install gsap @studio-freight/lenis splitting
npm install -D @types/splitting

# 3. Diese CLAUDE.md ins Repo legen

# 4. Projekt-Struktur anlegen (siehe Abschnitt 4)

# 5. Tokens, BaseLayout, shared Components bauen

# 6. Erste Demo: Pizzeria — komplett, mit allen Sections und Animationen

# 7. Deploy-Test auf Cloudflare Pages

# 8. Iterieren: nächste Demo
```

---

## 15. Definition of Done — pro Demo

Eine Demo gilt erst als fertig wenn:

- [ ] Alle Sections laut Brief vorhanden
- [ ] Hero hat aufwendige Entry-Animation (Split-Text + Stagger oder vergleichbar)
- [ ] Smooth Scroll (Lenis) aktiv
- [ ] Mindestens 3 verschiedene Scroll-Trigger-Animationen vorhanden (z. B. Reveal, Parallax, Pin)
- [ ] Custom Cursor oder Magnetic Buttons als Hover-Highlight
- [ ] Marquee oder vergleichbares "kinetisches" Element
- [ ] Demo-spezifische Page-Transition zwischen Routen
- [ ] Mobile vollständig responsiv (alles bricht sauber)
- [ ] `prefers-reduced-motion` getestet
- [ ] Lighthouse mobile ≥ 85
- [ ] Mindestens eine Form (Buchung, Reservierung, Anfrage) mit Success-State
- [ ] Footer mit Demo-Wortmarke groß und stilisch
- [ ] Auf Cloudflare Pages deployed und getestet

---

**Wenn etwas in diesem Brief unklar ist, frag nach bevor du baust. Lieber 5 Minuten klären als 5 Stunden falsche Richtung.**

**Qualität schlägt Geschwindigkeit. Wir verkaufen Design.**
