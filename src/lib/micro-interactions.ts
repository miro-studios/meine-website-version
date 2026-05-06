/**
 * Micro-Interaction-System.
 *
 * Drei diskrete Effekte, alle opt-in via Data-Attribut:
 *
 *   data-float          Element schwebt subtil (sinus, vertikal),
 *                       Phase wird per Stagger versetzt → Gruppe atmet ungleich.
 *   data-depth-hover    Card-Tilt bei Maus (3D rotateX/Y, leicht).
 *                       data-depth-strength="…" steuert die Stärke (default 8°).
 *   data-button-depth   Button bekommt mini-Z-Lift + Schatten beim Hover, sinkt
 *                       beim Klick — Premium-Druckgefühl.
 *
 * prefers-reduced-motion: alle drei Effekte werden komplett übersprungen.
 *
 * Performance:
 *   - Float: ein einziger gsap.ticker-Loop für alle Float-Elemente,
 *     nicht pro-Element-RAF.
 *   - Depth-Hover: GSAP-quickTo (60-fps lerp, GPU-Layer).
 *   - Button-Depth: rein CSS, JS triggert nur Klassen-Toggle.
 */

import gsap from 'gsap';
import { prefersReducedMotion } from './utils';

type Cleanup = () => void;

/* -------------------------------------------------------------------------- */
/*  Float                                                                     */
/* -------------------------------------------------------------------------- */

interface FloatEntry {
  el: HTMLElement;
  amplitude: number;
  speed: number;
  phase: number;
}

const initFloat = (): Cleanup => {
  const elements = Array.from(
    document.querySelectorAll<HTMLElement>('[data-float]'),
  );
  if (elements.length === 0) return () => {};

  const entries: FloatEntry[] = elements.map((el, idx) => ({
    el,
    amplitude: Number(el.dataset.floatAmplitude ?? '6'),
    speed: Number(el.dataset.floatSpeed ?? '1'),
    phase: idx * 0.7 + Number(el.dataset.floatPhase ?? '0'),
  }));

  const tick = (t: number) => {
    for (const { el, amplitude, speed, phase } of entries) {
      const y = Math.sin(t * speed + phase) * amplitude;
      el.style.transform = `translate3d(0, ${y.toFixed(2)}px, 0)`;
    }
  };

  // gsap.ticker liefert `time` in Sekunden seit Loop-Start (gsap 3.12).
  const loop = (time: number) => tick(time);
  gsap.ticker.add(loop);

  return () => {
    gsap.ticker.remove(loop);
    entries.forEach(({ el }) => {
      el.style.transform = '';
    });
  };
};

/* -------------------------------------------------------------------------- */
/*  Depth-Hover (Card-Tilt)                                                   */
/* -------------------------------------------------------------------------- */

const initDepthHover = (): Cleanup => {
  const cards = Array.from(
    document.querySelectorAll<HTMLElement>('[data-depth-hover]'),
  );
  if (cards.length === 0) return () => {};

  const cleanups: Array<() => void> = [];

  cards.forEach((card) => {
    const strength = Number(card.dataset.depthStrength ?? '8');
    const qX = gsap.quickTo(card, 'rotationY', { duration: 0.5, ease: 'power3.out' });
    const qY = gsap.quickTo(card, 'rotationX', { duration: 0.5, ease: 'power3.out' });
    const qZ = gsap.quickTo(card, 'z', { duration: 0.5, ease: 'power3.out' });

    // 3D-Kontext nur am Card setzen — kein document-weiter perspective-Hack.
    gsap.set(card, {
      transformPerspective: 800,
      transformStyle: 'preserve-3d',
    });

    const onMove = (e: MouseEvent) => {
      const rect = card.getBoundingClientRect();
      const cx = (e.clientX - rect.left) / rect.width - 0.5;
      const cy = (e.clientY - rect.top) / rect.height - 0.5;
      qX(cx * strength);
      qY(-cy * strength);
      qZ(20);
    };
    const onLeave = () => {
      qX(0);
      qY(0);
      qZ(0);
    };

    card.addEventListener('mousemove', onMove);
    card.addEventListener('mouseleave', onLeave);

    cleanups.push(() => {
      card.removeEventListener('mousemove', onMove);
      card.removeEventListener('mouseleave', onLeave);
      gsap.set(card, { clearProps: 'all' });
    });
  });

  return () => cleanups.forEach((fn) => fn());
};

/* -------------------------------------------------------------------------- */
/*  Button-Depth (CSS-getrieben — JS toggelt nur Press-State)                 */
/* -------------------------------------------------------------------------- */

const initButtonDepth = (): Cleanup => {
  const buttons = Array.from(
    document.querySelectorAll<HTMLElement>('[data-button-depth]'),
  );
  if (buttons.length === 0) return () => {};

  const cleanups: Array<() => void> = [];

  buttons.forEach((btn) => {
    const onDown = () => btn.classList.add('is-pressed');
    const onUp = () => btn.classList.remove('is-pressed');

    btn.addEventListener('mousedown', onDown);
    btn.addEventListener('mouseup', onUp);
    btn.addEventListener('mouseleave', onUp);
    btn.addEventListener('touchstart', onDown, { passive: true });
    btn.addEventListener('touchend', onUp);

    cleanups.push(() => {
      btn.removeEventListener('mousedown', onDown);
      btn.removeEventListener('mouseup', onUp);
      btn.removeEventListener('mouseleave', onUp);
      btn.removeEventListener('touchstart', onDown);
      btn.removeEventListener('touchend', onUp);
    });
  });

  return () => cleanups.forEach((fn) => fn());
};

/* -------------------------------------------------------------------------- */
/*  Combined                                                                  */
/* -------------------------------------------------------------------------- */

export const initMicroInteractions = (): Cleanup => {
  if (prefersReducedMotion()) return () => {};

  const cleanups = [initFloat(), initDepthHover(), initButtonDepth()];

  return () => cleanups.forEach((fn) => fn());
};
