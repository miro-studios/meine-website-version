/**
 * Generic utilities. No animation logic here — keep this file framework-free.
 */

export const prefersReducedMotion = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

export const isCoarsePointer = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(pointer: coarse)').matches;
};

export const isTouchDevice = (): boolean => {
  if (typeof window === 'undefined') return false;
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
};

export const clamp = (value: number, min: number, max: number): number =>
  Math.min(Math.max(value, min), max);

export const lerp = (start: number, end: number, alpha: number): number =>
  start + (end - start) * alpha;

export const mapRange = (
  value: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number,
): number => outMin + ((value - inMin) * (outMax - outMin)) / (inMax - inMin);

export const onReady = (callback: () => void): void => {
  if (typeof document === 'undefined') return;
  if (document.readyState !== 'loading') {
    callback();
  } else {
    document.addEventListener('DOMContentLoaded', callback, { once: true });
  }
};

/** Listens once. Returns a teardown fn. */
export const listen = <K extends keyof WindowEventMap>(
  target: Window | Document | HTMLElement,
  type: K,
  handler: (event: WindowEventMap[K]) => void,
  options?: AddEventListenerOptions,
): (() => void) => {
  target.addEventListener(type, handler as EventListener, options);
  return () => target.removeEventListener(type, handler as EventListener, options);
};

/** Returns a debounced version of `fn`. */
export const debounce = <Args extends unknown[]>(
  fn: (...args: Args) => void,
  wait = 200,
): ((...args: Args) => void) => {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  return (...args: Args) => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), wait);
  };
};

/** Returns a throttled version that fires at most once per `wait` ms. */
export const throttle = <Args extends unknown[]>(
  fn: (...args: Args) => void,
  wait = 16,
): ((...args: Args) => void) => {
  let last = 0;
  let scheduled: ReturnType<typeof setTimeout> | null = null;
  return (...args: Args) => {
    const now = performance.now();
    const remaining = wait - (now - last);
    if (remaining <= 0) {
      last = now;
      fn(...args);
    } else if (!scheduled) {
      scheduled = setTimeout(() => {
        last = performance.now();
        scheduled = null;
        fn(...args);
      }, remaining);
    }
  };
};
