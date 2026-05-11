/**
 * Scroll-Depth — subtile 3D-Tiefenwirkung für gemarkete Elemente.
 *
 *  - Element kippt in den 3D-Raum als Funktion seiner Scroll-Position
 *  - perspective wird auf das Parent gesetzt
 *  - Aktiv nur in einem konfigurierbaren scroll-range
 *  - Linear blend zwischen "vor viewport" → "im viewport" → "danach"
 *  - GPU-only Transform (transform3d), kein Layout-Reflow
 *  - prefers-reduced-motion: deaktiviert
 *  - IntersectionObserver: pause wenn off-screen
 *
 * Verwendung in HTML:
 *   <h2 data-scroll-depth data-depth-strength="0.6">…</h2>
 *
 * Optionen pro Element (data-*):
 *   data-depth-strength    Stärke (0..1, default 0.5)
 *   data-depth-rotate-x    Max rotateX in deg (default 12)
 *   data-depth-translate-z Max translateZ in px (default -120)
 */

import { prefersReducedMotion } from './utils';

type Cleanup = () => void;

interface ElementState {
  el: HTMLElement;
  strength: number;
  maxRotateX: number;
  maxTranslateZ: number;
  visible: boolean;
}

export const initScrollDepth = (selector = '[data-scroll-depth]'): Cleanup => {
  if (typeof window === 'undefined') return () => {};
  if (prefersReducedMotion()) return () => {};

  const elements = Array.from(
    document.querySelectorAll<HTMLElement>(selector),
  );
  if (elements.length === 0) return () => {};

  // Perspective auf Parent setzen — sonst hat rotateX keinen Tiefen-Effekt
  const states: ElementState[] = elements.map((el) => {
    const parent = el.parentElement;
    if (parent && !parent.style.perspective) {
      parent.style.perspective = '1200px';
      parent.style.transformStyle = 'preserve-3d';
    }
    el.style.willChange = 'transform';
    el.style.backfaceVisibility = 'hidden';

    return {
      el,
      strength: parseFloat(el.dataset.depthStrength ?? '0.5'),
      maxRotateX: parseFloat(el.dataset.depthRotateX ?? '12'),
      maxTranslateZ: parseFloat(el.dataset.depthTranslateZ ?? '-120'),
      visible: true,
    };
  });

  // ── IntersectionObserver: spare CPU wenn off-screen ───────────────
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        const state = states.find((s) => s.el === e.target);
        if (state) state.visible = e.isIntersecting;
      }
    },
    { rootMargin: '200px' },
  );
  for (const s of states) io.observe(s.el);

  // ── Render-Loop ────────────────────────────────────────────────────
  let rafId = 0;
  let isRunning = true;

  const update = () => {
    if (!isRunning) return;
    const vh = window.innerHeight;

    for (const s of states) {
      if (!s.visible) continue;
      const rect = s.el.getBoundingClientRect();
      const elCenter = rect.top + rect.height / 2;
      const viewCenter = vh / 2;

      // -1 (oben) ... 0 (mittig) ... +1 (unten) — clamped
      const offset = Math.max(-1, Math.min(1, (elCenter - viewCenter) / vh));

      // Wenn Element MITTIG ist: rotateX = 0, translateZ = 0
      // Wenn weiter oben/unten: kippt + rückt nach hinten
      const rotateX = -offset * s.maxRotateX * s.strength;
      const translateZ = -Math.abs(offset) * Math.abs(s.maxTranslateZ) * s.strength;

      s.el.style.transform = `translateZ(${translateZ}px) rotateX(${rotateX}deg)`;
    }

    rafId = requestAnimationFrame(update);
  };

  rafId = requestAnimationFrame(update);

  // Pause bei Tab hidden
  const visibilityHandler = () => {
    if (document.hidden) {
      isRunning = false;
      cancelAnimationFrame(rafId);
    } else {
      isRunning = true;
      rafId = requestAnimationFrame(update);
    }
  };
  document.addEventListener('visibilitychange', visibilityHandler);

  return () => {
    isRunning = false;
    cancelAnimationFrame(rafId);
    io.disconnect();
    document.removeEventListener('visibilitychange', visibilityHandler);
    for (const s of states) {
      s.el.style.transform = '';
      s.el.style.willChange = '';
    }
  };
};
