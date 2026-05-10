/**
 * Zentrale Liste aller Paket-Demos (Showcase-Sites).
 *
 * Eine Demo pro miro-studios-Paket — sie veranschaulicht Interessenten,
 * wie ihre Website aussehen könnte, wenn sie das jeweilige Paket buchen.
 *
 * Wenn eine Demo fertig ist:
 *  - `status` auf 'live' setzen
 *  - `href` auf die Live-URL setzen
 *  - Zusätzlich (optional) `screenshotUrl` ergänzen
 */

export type DemoTheme =
  | 'cafe-starter'
  | 'pizzeria'
  | 'elektro'
  | 'friseur'
  | 'handwerker';

export type PackageFormat = 'one-pager' | 'multi-page';
export type PackageTier = 'starter' | 'featured' | 'premium';

export interface Demo {
  /** Eindeutiger Slug — auch URL-Path-Segment */
  slug: string;
  /** Demo-Geschäftsname (z. B. "Café Nordlicht") */
  name: string;
  /** Branche / Sub-Label (z. B. "Specialty Coffee · Lüdenscheid") */
  category: string;
  /** Headline auf dem Vorschau-Visual */
  headline: string;
  /** 1-Satz-Beschreibung worum es geht */
  blurb: string;
  /** Theme — bestimmt Farbe & Typo der Vorschau */
  theme: DemoTheme;
  /** 'live' = Demo ist fertig + verlinkt; 'in-progress' = bald verfügbar */
  status: 'live' | 'in-progress';
  /** URL zur Live-Demo (nur wenn status === 'live') */
  href?: string;
  /** Welches Paket diese Demo zeigt */
  package: {
    format: PackageFormat;
    tier: PackageTier;
    /** Anzeige-Name des Pakets (z. B. "Starter") */
    name: string;
    /** Preis-String (z. B. "599 €") */
    price: string;
    /** Lieferzeit (z. B. "5–7 Werktage") */
    delivery: string;
  };
}

export const demos: readonly Demo[] = [
  {
    slug: 'cafe-starter',
    name: 'Café Nordlicht',
    category: 'Specialty Coffee · Lüdenscheid',
    headline: 'Bohne. Brot. Begegnung.',
    blurb:
      'Specialty-Coffee-Café mit eigener Röstung. Editorial-warm, Sauerteig-Aesthetic, integriertes Reservierungsformular.',
    theme: 'cafe-starter',
    status: 'live',
    href: '/demos/cafe-starter/',
    package: {
      format: 'one-pager',
      tier: 'starter',
      name: 'Starter',
      price: '599 €',
      delivery: '5–7 Werktage',
    },
  },
  {
    slug: 'pizzeria',
    name: 'Bella Notte',
    category: 'Italienisches Restaurant',
    headline: 'La Vera Pizza.',
    blurb:
      'Familiengeführte Pizzeria. Editorial-Magazine-Aesthetic mit warmen Terracotta-Tönen, Speisekarte als interaktives Magazin.',
    theme: 'pizzeria',
    status: 'in-progress',
    package: {
      format: 'one-pager',
      tier: 'featured',
      name: 'Growth',
      price: '1.299 €',
      delivery: '7–12 Werktage',
    },
  },
  {
    slug: 'friseur',
    name: 'Studio Sept',
    category: 'High-End Friseursalon',
    headline: 'Ein Schnitt, kein Trend.',
    blurb:
      'Editorial / Fashion-Magazine-Look. Riesige Italic-Display-Schriften, Mode-Fotografie-Energie, online buchbar.',
    theme: 'friseur',
    status: 'in-progress',
    package: {
      format: 'one-pager',
      tier: 'premium',
      name: 'Premium',
      price: '2.299 €',
      delivery: '10–16 Werktage',
    },
  },
  {
    slug: 'handwerker',
    name: 'Kruse Bau',
    category: 'Handwerksbetrieb · Sanierung',
    headline: 'Bauen mit Verstand.',
    blurb:
      'Handwerksbetrieb mit Erdton-Palette. Vorher-Nachher-Slider als Highlight, Projektgalerie mit Case-Studies.',
    theme: 'handwerker',
    status: 'in-progress',
    package: {
      format: 'multi-page',
      tier: 'starter',
      name: 'Basic',
      price: '1.499 €',
      delivery: '14–21 Werktage',
    },
  },
  {
    slug: 'elektro',
    name: 'Holtkamp',
    category: 'Elektrotechnik · Meisterbetrieb',
    headline: 'Strom. Wärme. Zukunft.',
    blurb:
      'Industrial Brutalism mit Premium-Touch. Schwarz, scharf, technisch — mit elektrisch-gelbem Akzent.',
    theme: 'elektro',
    status: 'in-progress',
    package: {
      format: 'multi-page',
      tier: 'featured',
      name: 'Business',
      price: '2.799 €',
      delivery: '4–6 Wochen',
    },
  },
  {
    slug: 'studio-sept-pro',
    name: 'Studio Sept · Multi-Location',
    category: 'Friseur-Kette · Booking-System',
    headline: 'Drei Salons, eine Sprache.',
    blurb:
      'Multi-Location-Auftritt mit Standortwahl, Stylisten-Profilen und integriertem Booking. Awwwards-Ambition.',
    theme: 'friseur',
    status: 'in-progress',
    package: {
      format: 'multi-page',
      tier: 'premium',
      name: 'Pro',
      price: '4.499 €',
      delivery: '6–8 Wochen',
    },
  },
];

export function demosByFormat(format: PackageFormat): readonly Demo[] {
  return demos.filter((d) => d.package.format === format);
}
