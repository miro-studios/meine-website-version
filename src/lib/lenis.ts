import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { prefersReducedMotion } from './utils';

let instance: Lenis | null = null;

gsap.registerPlugin(ScrollTrigger);

export const initLenis = (): Lenis | null => {
  if (typeof window === 'undefined') return null;
  if (instance) return instance;

  if (prefersReducedMotion()) {
    document.documentElement.classList.add('lenis-disabled');
    return null;
  }

  instance = new Lenis({
    duration: 1.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
    wheelMultiplier: 1,
    touchMultiplier: 2,
    lerp: 0.1,
  });

  instance.on('scroll', ScrollTrigger.update);

  gsap.ticker.add((time) => {
    instance?.raf(time * 1000);
  });
  gsap.ticker.lagSmoothing(0);

  return instance;
};

export const getLenis = (): Lenis | null => instance;

export const stopLenis = (): void => instance?.stop();

export const startLenis = (): void => instance?.start();

export const scrollTo = (
  target: string | HTMLElement | number,
  options?: { offset?: number; duration?: number; immediate?: boolean },
): void => {
  if (!instance) {
    if (typeof target === 'number') {
      window.scrollTo({ top: target, behavior: 'smooth' });
    } else if (target instanceof HTMLElement) {
      target.scrollIntoView({ behavior: 'smooth' });
    } else if (typeof target === 'string') {
      const el = document.querySelector(target);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
    return;
  }
  instance.scrollTo(target, {
    offset: options?.offset ?? 0,
    duration: options?.duration,
    immediate: options?.immediate,
  });
};

export const destroyLenis = (): void => {
  instance?.destroy();
  instance = null;
};
