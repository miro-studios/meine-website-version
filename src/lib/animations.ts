import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Splitting from 'splitting';
import { prefersReducedMotion } from './utils';

gsap.registerPlugin(ScrollTrigger);

type Cleanup = () => void;

/* -------------------------------------------------------------------------- */
/*  Split-Text Reveal                                                         */
/* -------------------------------------------------------------------------- */

export interface SplitTextOptions {
  /** "chars" splits per character, "words" per word, "lines" per line. */
  by?: 'chars' | 'words' | 'lines';
  /** Stagger zwischen Items in Sekunden. */
  stagger?: number;
  /** Delay vor dem Start. */
  delay?: number;
  /** Easing-Curve. */
  ease?: string;
  /** Trigger-Punkt für ScrollTrigger. */
  start?: string;
  /** Wenn `true`: läuft beim Element-Einkommen. Wenn `false`: läuft sofort. */
  onScroll?: boolean;
}

export const splitTextReveal = (
  target: HTMLElement | string,
  options: SplitTextOptions = {},
): Cleanup => {
  const element =
    typeof target === 'string'
      ? (document.querySelector<HTMLElement>(target) ?? null)
      : target;
  if (!element) return () => {};

  const {
    by = 'chars',
    stagger = 0.02,
    delay = 0,
    ease = 'expo.out',
    start = 'top 80%',
    onScroll = true,
  } = options;

  // Splitting.js gibt ein Result-Objekt zurück mit chars/words/lines arrays
  const result = Splitting({ target: element, by });
  const split = Array.isArray(result) ? result[0] : result;
  const items =
    by === 'chars' ? split?.chars : by === 'words' ? split?.words : split?.lines;

  if (!items || items.length === 0) return () => {};

  if (prefersReducedMotion()) {
    gsap.set(items as gsap.TweenTarget, { yPercent: 0, opacity: 1 });
    return () => {};
  }

  const tween = gsap.fromTo(
    items as gsap.TweenTarget,
    { yPercent: 110, opacity: 0 },
    {
      yPercent: 0,
      opacity: 1,
      stagger,
      duration: 1.1,
      delay,
      ease,
      ...(onScroll
        ? {
            scrollTrigger: {
              trigger: element,
              start,
              toggleActions: 'play none none reverse',
            },
          }
        : {}),
    },
  );

  return () => {
    tween.scrollTrigger?.kill();
    tween.kill();
  };
};

/* -------------------------------------------------------------------------- */
/*  Image Reveal (Clip-Path)                                                  */
/* -------------------------------------------------------------------------- */

export type ImageRevealDirection = 'top' | 'bottom' | 'left' | 'right';

export const imageReveal = (
  target: HTMLElement | string,
  direction: ImageRevealDirection = 'bottom',
  start = 'top 75%',
): Cleanup => {
  const el =
    typeof target === 'string'
      ? (document.querySelector<HTMLElement>(target) ?? null)
      : target;
  if (!el) return () => {};

  const fromMap: Record<ImageRevealDirection, string> = {
    bottom: 'inset(100% 0 0 0)',
    top: 'inset(0 0 100% 0)',
    left: 'inset(0 0 0 100%)',
    right: 'inset(0 100% 0 0)',
  };

  if (prefersReducedMotion()) {
    gsap.set(el, { clipPath: 'inset(0 0 0 0)' });
    return () => {};
  }

  const tween = gsap.fromTo(
    el,
    { clipPath: fromMap[direction] },
    {
      clipPath: 'inset(0 0 0 0)',
      duration: 1.4,
      ease: 'expo.out',
      scrollTrigger: {
        trigger: el,
        start,
        toggleActions: 'play none none reverse',
      },
    },
  );

  return () => {
    tween.scrollTrigger?.kill();
    tween.kill();
  };
};

/* -------------------------------------------------------------------------- */
/*  Generic Reveal-on-Scroll (opacity + Y)                                    */
/* -------------------------------------------------------------------------- */

export interface RevealOptions {
  y?: number;
  duration?: number;
  ease?: string;
  start?: string;
  stagger?: number;
}

export const revealOnScroll = (
  target: HTMLElement | HTMLElement[] | string,
  options: RevealOptions = {},
): Cleanup => {
  let elements: HTMLElement[] = [];
  if (typeof target === 'string') {
    elements = Array.from(document.querySelectorAll<HTMLElement>(target));
  } else if (Array.isArray(target)) {
    elements = target;
  } else {
    elements = [target];
  }
  if (elements.length === 0) return () => {};

  const {
    y = 40,
    duration = 1,
    ease = 'expo.out',
    start = 'top 85%',
    stagger = 0.08,
  } = options;

  if (prefersReducedMotion()) {
    elements.forEach((el) => el.classList.add('is-revealed'));
    gsap.set(elements, { y: 0, opacity: 1 });
    return () => {};
  }

  const tweens = elements.map((el, index) =>
    gsap.fromTo(
      el,
      { y, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration,
        ease,
        delay: index * stagger,
        scrollTrigger: {
          trigger: el,
          start,
          toggleActions: 'play none none reverse',
          onEnter: () => el.classList.add('is-revealed'),
          onLeaveBack: () => el.classList.remove('is-revealed'),
        },
      },
    ),
  );

  return () => {
    tweens.forEach((t) => {
      t.scrollTrigger?.kill();
      t.kill();
    });
  };
};

/* -------------------------------------------------------------------------- */
/*  Number Counter                                                            */
/* -------------------------------------------------------------------------- */

export interface CounterOptions {
  from?: number;
  to: number;
  duration?: number;
  format?: (value: number) => string;
  start?: string;
}

export const numberCounter = (
  target: HTMLElement | string,
  options: CounterOptions,
): Cleanup => {
  const el =
    typeof target === 'string'
      ? document.querySelector<HTMLElement>(target)
      : target;
  if (!el) return () => {};

  const {
    from = 0,
    to,
    duration = 2,
    format = (v) => Math.round(v).toLocaleString('de-DE'),
    start = 'top 80%',
  } = options;

  if (prefersReducedMotion()) {
    el.textContent = format(to);
    return () => {};
  }

  const counter = { value: from };
  el.textContent = format(from);

  const tween = gsap.to(counter, {
    value: to,
    duration,
    ease: 'power2.out',
    onUpdate: () => {
      el.textContent = format(counter.value);
    },
    scrollTrigger: {
      trigger: el,
      start,
      toggleActions: 'play none none none',
      once: true,
    },
  });

  return () => {
    tween.scrollTrigger?.kill();
    tween.kill();
  };
};

/* -------------------------------------------------------------------------- */
/*  Scroll Progress (top bar)                                                 */
/* -------------------------------------------------------------------------- */

export const scrollProgress = (target: HTMLElement | string): Cleanup => {
  const el =
    typeof target === 'string'
      ? document.querySelector<HTMLElement>(target)
      : target;
  if (!el) return () => {};

  const update = () => {
    const scrollY = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = docHeight > 0 ? scrollY / docHeight : 0;
    el.style.transform = `scaleX(${progress})`;
  };

  update();
  const handler = () => update();
  window.addEventListener('scroll', handler, { passive: true });
  window.addEventListener('resize', handler);

  return () => {
    window.removeEventListener('scroll', handler);
    window.removeEventListener('resize', handler);
  };
};

/* -------------------------------------------------------------------------- */
/*  Hinweis: Marquee läuft jetzt CSS-only (siehe Marquee.astro).              */
/*  Das vermeidet sichtbare Sprünge beim Wrap und entlastet den Main-Thread.  */
/* -------------------------------------------------------------------------- */
