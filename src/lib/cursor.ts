import gsap from 'gsap';
import { isCoarsePointer, prefersReducedMotion } from './utils';

/* -------------------------------------------------------------------------- */
/*  Custom Cursor                                                             */
/*  - Kleiner Punkt folgt 1:1, größerer Ring mit Lerp-Verzögerung             */
/*  - Wächst auf Hover über interaktive Elemente                              */
/* -------------------------------------------------------------------------- */

export interface CustomCursorOptions {
  dotSelector?: string;
  ringSelector?: string;
  hoverSelector?: string;
  /** Lerp-Faktor für den Ring (0 = kein Follow, 1 = sofort) */
  ringLerp?: number;
  /** Skala beim Hover über interaktive Elemente */
  hoverScale?: number;
}

export const initCustomCursor = (options: CustomCursorOptions = {}): (() => void) => {
  if (typeof window === 'undefined') return () => {};
  if (isCoarsePointer() || prefersReducedMotion()) return () => {};

  const {
    dotSelector = '[data-cursor-dot]',
    ringSelector = '[data-cursor-ring]',
    hoverSelector = 'a, button, [data-cursor-hover]',
    ringLerp = 0.18,
    hoverScale = 2.2,
  } = options;

  const dot = document.querySelector<HTMLElement>(dotSelector);
  const ring = document.querySelector<HTMLElement>(ringSelector);
  if (!dot || !ring) return () => {};

  document.documentElement.setAttribute('data-cursor-active', '');

  const target = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
  const ringPos = { x: target.x, y: target.y };
  let isVisible = false;

  const onMove = (event: MouseEvent) => {
    target.x = event.clientX;
    target.y = event.clientY;
    if (!isVisible) {
      isVisible = true;
      gsap.to([dot, ring], { autoAlpha: 1, duration: 0.2 });
    }
    gsap.set(dot, { x: target.x, y: target.y });
  };

  const onLeave = () => {
    isVisible = false;
    gsap.to([dot, ring], { autoAlpha: 0, duration: 0.2 });
  };

  const onEnter = (event: MouseEvent) => {
    target.x = event.clientX;
    target.y = event.clientY;
    isVisible = true;
    gsap.to([dot, ring], { autoAlpha: 1, duration: 0.2 });
  };

  const tick = () => {
    ringPos.x += (target.x - ringPos.x) * ringLerp;
    ringPos.y += (target.y - ringPos.y) * ringLerp;
    gsap.set(ring, { x: ringPos.x, y: ringPos.y });
  };
  gsap.ticker.add(tick);

  const onHoverEnter = () => {
    gsap.to(ring, { scale: hoverScale, duration: 0.4, ease: 'power3.out' });
    ring.setAttribute('data-cursor-state', 'hover');
  };
  const onHoverLeave = () => {
    gsap.to(ring, { scale: 1, duration: 0.4, ease: 'power3.out' });
    ring.removeAttribute('data-cursor-state');
  };

  const hoverables = document.querySelectorAll<HTMLElement>(hoverSelector);
  hoverables.forEach((el) => {
    el.addEventListener('mouseenter', onHoverEnter);
    el.addEventListener('mouseleave', onHoverLeave);
  });

  document.addEventListener('mousemove', onMove);
  document.addEventListener('mouseleave', onLeave);
  document.addEventListener('mouseenter', onEnter);

  return () => {
    document.documentElement.removeAttribute('data-cursor-active');
    document.removeEventListener('mousemove', onMove);
    document.removeEventListener('mouseleave', onLeave);
    document.removeEventListener('mouseenter', onEnter);
    hoverables.forEach((el) => {
      el.removeEventListener('mouseenter', onHoverEnter);
      el.removeEventListener('mouseleave', onHoverLeave);
    });
    gsap.ticker.remove(tick);
  };
};

/* -------------------------------------------------------------------------- */
/*  Magnetic Button                                                           */
/* -------------------------------------------------------------------------- */

export interface MagneticOptions {
  /** Wie stark der Button zum Cursor "gezogen" wird (0..1) */
  strength?: number;
  /** Aktivierungs-Radius in Pixeln (0 = gesamtes Element) */
  radius?: number;
  /** Reset-Easing nach mouseleave */
  resetEase?: string;
}

export const initMagnetic = (
  element: HTMLElement,
  options: MagneticOptions = {},
): (() => void) => {
  if (isCoarsePointer() || prefersReducedMotion()) return () => {};

  const { strength = 0.3, resetEase = 'elastic.out(1, 0.4)' } = options;

  const onMove = (event: MouseEvent) => {
    const rect = element.getBoundingClientRect();
    const x = event.clientX - rect.left - rect.width / 2;
    const y = event.clientY - rect.top - rect.height / 2;
    gsap.to(element, {
      x: x * strength,
      y: y * strength,
      duration: 0.4,
      ease: 'power3.out',
    });
  };

  const onLeave = () => {
    gsap.to(element, { x: 0, y: 0, duration: 0.6, ease: resetEase });
  };

  element.addEventListener('mousemove', onMove);
  element.addEventListener('mouseleave', onLeave);

  return () => {
    element.removeEventListener('mousemove', onMove);
    element.removeEventListener('mouseleave', onLeave);
    gsap.set(element, { clearProps: 'transform' });
  };
};

export const initAllMagnetics = (
  selector = '[data-magnetic]',
): (() => void) => {
  const elements = document.querySelectorAll<HTMLElement>(selector);
  const cleanups = Array.from(elements).map((el) => {
    const strength = parseFloat(el.dataset.magneticStrength ?? '0.3');
    return initMagnetic(el, { strength });
  });
  return () => cleanups.forEach((fn) => fn());
};
