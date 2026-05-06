/**
 * Parallax-System für gestapelte Tiefen-Layer (Background / Midground / Foreground).
 *
 * Funktionsweise:
 *   - Jedes Element mit `[data-parallax]` wird beim Scroll vertikal verschoben,
 *     mit Speed-Faktor aus `data-parallax-speed` (z. B. 0.2 = langsamer als
 *     der Scroll, 0.6 = leicht hinterher, 1.0 = neutral, 1.2 = schneller).
 *   - Optional: `data-parallax-scale` skaliert das Element leicht beim Scrollen
 *     für mehr Tiefen-Wirkung (Foreground größer/hereinkommend).
 *   - Optional: `data-parallax-blur` blurrt Background-Layer am Rand des
 *     Scroll-Ranges (Tiefen-Realismus).
 *
 * Performance:
 *   - Ein einziger ScrollTrigger pro Element, scrub via GSAP-Tween (GPU-Layer).
 *   - `will-change: transform` wird vom Component gesetzt, nicht von uns.
 *   - prefers-reduced-motion: keine Trigger, Element bleibt statisch.
 */

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { prefersReducedMotion } from './utils';

gsap.registerPlugin(ScrollTrigger);

type Cleanup = () => void;

interface ParallaxConfig {
  /** Speed-Faktor. < 1 = langsamer (background), > 1 = schneller (foreground). */
  speed: number;
  /** Optional: Skala-Hub von 1 → 1+scale am Ende des Scroll-Ranges. */
  scale: number;
  /** Optional: Blur-Hub in px. */
  blur: number;
  /** Trigger-Element (default: das Element selbst, klettert dann zum nächsten <section>). */
  trigger: HTMLElement | null;
}

const readConfig = (el: HTMLElement): ParallaxConfig => ({
  speed: Number(el.dataset.parallaxSpeed ?? '0.5'),
  scale: Number(el.dataset.parallaxScale ?? '0'),
  blur: Number(el.dataset.parallaxBlur ?? '0'),
  trigger: el.closest<HTMLElement>('[data-parallax-trigger]') ?? el.parentElement,
});

export const initParallaxLayers = (
  selector = '[data-parallax]',
): Cleanup => {
  const elements = Array.from(document.querySelectorAll<HTMLElement>(selector));
  if (elements.length === 0) return () => {};

  if (prefersReducedMotion()) {
    elements.forEach((el) => {
      gsap.set(el, { clearProps: 'all' });
    });
    return () => {};
  }

  const tweens: gsap.core.Tween[] = [];

  elements.forEach((el) => {
    const { speed, scale, blur, trigger } = readConfig(el);
    if (!trigger) return;

    // Wie weit das Element relativ zum Viewport bewegt wird:
    // Translation in % der Trigger-Höhe — weicher als Pixel-basiert beim Resize.
    const yShift = (1 - speed) * 100;

    const vars: gsap.TweenVars = {
      yPercent: yShift,
      ease: 'none',
      scrollTrigger: {
        trigger,
        start: 'top bottom',
        end: 'bottom top',
        scrub: 0.6,
        invalidateOnRefresh: true,
      },
    };

    if (scale !== 0) {
      vars.scale = 1 + scale;
    }
    if (blur !== 0) {
      vars.filter = `blur(${blur}px)`;
    }

    const tween = gsap.to(el, vars);
    tweens.push(tween);
  });

  return () => {
    tweens.forEach((t) => {
      t.scrollTrigger?.kill();
      t.kill();
    });
    elements.forEach((el) => gsap.set(el, { clearProps: 'all' }));
  };
};

/* -------------------------------------------------------------------------- */
/*  Mouse-based subtle parallax (Cursor-Tilt) — für Hero-Decor                */
/* -------------------------------------------------------------------------- */

/**
 * Bindet einen sanften Maus-Parallax-Effekt an alle Elemente unter `container`,
 * die `[data-mouse-parallax]` und einen `data-mouse-strength` (0..1) haben.
 *
 * Bewegung wird via GSAP-quickTo geliefert (60 fps lerp, GPU-friendly).
 */
export const initMouseParallax = (
  container: HTMLElement | string = document.body,
): Cleanup => {
  const root =
    typeof container === 'string'
      ? document.querySelector<HTMLElement>(container)
      : container;
  if (!root) return () => {};

  if (prefersReducedMotion()) return () => {};

  const items = Array.from(
    root.querySelectorAll<HTMLElement>('[data-mouse-parallax]'),
  );
  if (items.length === 0) return () => {};

  const setters = items.map((el) => {
    const strength = Number(el.dataset.mouseStrength ?? '15');
    return {
      el,
      strength,
      qX: gsap.quickTo(el, 'x', { duration: 0.6, ease: 'power3.out' }),
      qY: gsap.quickTo(el, 'y', { duration: 0.6, ease: 'power3.out' }),
    };
  });

  const handler = (e: MouseEvent) => {
    const rect = root.getBoundingClientRect();
    const cx = (e.clientX - rect.left) / rect.width - 0.5; // -0.5..0.5
    const cy = (e.clientY - rect.top) / rect.height - 0.5;

    for (const { qX, qY, strength } of setters) {
      qX(cx * strength);
      qY(cy * strength);
    }
  };

  root.addEventListener('mousemove', handler, { passive: true });

  return () => {
    root.removeEventListener('mousemove', handler);
    items.forEach((el) => gsap.set(el, { clearProps: 'transform' }));
  };
};
