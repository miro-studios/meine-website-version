import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { prefersReducedMotion } from './utils';

gsap.registerPlugin(ScrollTrigger);

type Cleanup = () => void;

export type SceneVariant =
  | 'default'
  | 'zoom'
  | 'slide-up'
  | 'slide-side'
  | 'rotate3d';

interface VariantTweens {
  enterFrom: gsap.TweenVars;
  enterTo: gsap.TweenVars;
  exitTo: gsap.TweenVars;
}

const ENTER_EASE = 'expo.out';
const EXIT_EASE = 'power2.in';

/* -------------------------------------------------------------------------- */
/*  Variant-Definitionen — konservative Werte, filmisch ohne overdone         */
/* -------------------------------------------------------------------------- */

const VARIANT_MAP: Record<SceneVariant, VariantTweens> = {
  default: {
    enterFrom: { opacity: 0, y: 60 },
    enterTo: { opacity: 1, y: 0 },
    exitTo: { opacity: 0.4, y: -40 },
  },
  zoom: {
    enterFrom: { opacity: 0, scale: 0.92, y: 40 },
    enterTo: { opacity: 1, scale: 1, y: 0 },
    exitTo: { opacity: 0.5, scale: 1.06, y: 0 },
  },
  'slide-up': {
    enterFrom: { opacity: 0, y: 120 },
    enterTo: { opacity: 1, y: 0 },
    exitTo: { opacity: 0.6, y: -80 },
  },
  'slide-side': {
    enterFrom: { opacity: 0, x: 80, scale: 0.97 },
    enterTo: { opacity: 1, x: 0, scale: 1 },
    exitTo: { opacity: 0.7, x: -50, scale: 1 },
  },
  rotate3d: {
    // transformPerspective NUR auf dem Wrapper-<div>, nicht auf body — sonst
    // kollidiert es mit position:fixed (Custom Cursor, Header).
    enterFrom: {
      opacity: 0,
      rotateX: 12,
      y: 70,
      scale: 0.95,
      transformPerspective: 1200,
    },
    enterTo: {
      opacity: 1,
      rotateX: 0,
      y: 0,
      scale: 1,
      transformPerspective: 1200,
    },
    exitTo: {
      opacity: 0.5,
      rotateX: -6,
      y: -40,
      scale: 1,
      transformPerspective: 1200,
    },
  },
};

const isSceneVariant = (v: string): v is SceneVariant =>
  v === 'default' ||
  v === 'zoom' ||
  v === 'slide-up' ||
  v === 'slide-side' ||
  v === 'rotate3d';

/* -------------------------------------------------------------------------- */
/*  Public API                                                                */
/* -------------------------------------------------------------------------- */

/**
 * Initialisiert für jeden `[data-scene]`-Wrapper eine scroll-gekoppelte
 * Timeline mit Enter- und Exit-Phase. Ein einziger ScrollTrigger pro Element
 * deckt den gesamten Lebenszyklus ab — kein Konflikt zwischen Tweens.
 *
 * Timeline-Phasen (relativ zum Scroll-Range "top bottom" → "bottom top"):
 *   0.0 – 0.3  Enter (filmisch rein)
 *   0.3 – 0.7  Hold  (Section voll sichtbar, kein Transform)
 *   0.7 – 1.0  Exit  (filmisch raus)
 *
 * Bei `prefers-reduced-motion: reduce` wird der Initial-State neutralisiert
 * (alle Wrapper bleiben statisch sichtbar) und keine Trigger registriert.
 */
export const initSceneTransitions = (): Cleanup => {
  const elements = Array.from(
    document.querySelectorAll<HTMLElement>('[data-scene]'),
  );
  if (elements.length === 0) return () => {};

  if (prefersReducedMotion()) {
    elements.forEach((el) => {
      gsap.set(el, {
        opacity: 1,
        x: 0,
        y: 0,
        scale: 1,
        rotateX: 0,
        clearProps: 'transformPerspective',
      });
    });
    return () => {};
  }

  const timelines: gsap.core.Timeline[] = [];

  elements.forEach((el) => {
    const variantAttr = el.dataset.sceneVariant ?? 'default';
    const variant: SceneVariant = isSceneVariant(variantAttr)
      ? variantAttr
      : 'default';
    const { enterFrom, enterTo, exitTo } = VARIANT_MAP[variant];

    const tl = gsap.timeline({
      defaults: { force3D: true },
      scrollTrigger: {
        trigger: el,
        // gesamter Lebenszyklus: section betritt von unten bis sie oben raus ist
        start: 'top bottom',
        end: 'bottom top',
        scrub: 0.6,
        invalidateOnRefresh: true,
      },
    });

    tl.fromTo(
      el,
      enterFrom,
      { ...enterTo, duration: 0.3, ease: ENTER_EASE },
      0,
    );
    tl.to(
      el,
      { ...exitTo, duration: 0.3, ease: EXIT_EASE },
      0.7,
    );

    timelines.push(tl);
  });

  return () => {
    timelines.forEach((tl) => {
      tl.scrollTrigger?.kill();
      tl.kill();
    });
    elements.forEach((el) => gsap.set(el, { clearProps: 'all' }));
  };
};
