/**
 * Scroll-Story-Engine — Sticky-Sphere + statische Step-Liste.
 *
 * Markup-Vertrag:
 *   <section data-scroll-story>
 *     <div data-story-stage>… 3D / Visual …</div>
 *     <ol data-story-steps>
 *       <li><button data-story-step data-step-index="0">…</button></li>
 *       …
 *     </ol>
 *   </section>
 *
 * Verhalten:
 *   - Kein Pin, kein erzwungenes Step-Swap. Alle Steps stehen permanent
 *     untereinander; die Sphere ist `position: sticky` daneben.
 *   - Der "aktive" Step wird bestimmt von:
 *       a) Hover oder Klick (User-Override mit kurzer Cooldown-Phase),
 *       b) sonst dem Step, dessen Mitte dem Viewport-Center am nächsten ist.
 *   - Bei Aktiv-Wechsel wird `story:progress` mit
 *       progress = activeIndex / (count - 1)
 *     dispatcht — die Sphere reagiert wie gewohnt.
 *
 * Reduced-motion: User kann immer noch hovern/klicken, aber keine
 * Auto-Detection per IntersectionObserver (würde sonst beim Scrollen
 * zappeln, ohne Animation kaschiert).
 */

import { prefersReducedMotion } from './utils';

type Cleanup = () => void;

const setActive = (
  steps: HTMLElement[],
  phaseNum: HTMLElement | null,
  phaseLabel: HTMLElement | null,
  section: HTMLElement,
  idx: number,
) => {
  steps.forEach((step, i) => {
    const isActive = i === idx;
    step.classList.toggle('is-active', isActive);
    step.setAttribute('aria-current', isActive ? 'step' : 'false');
  });

  const activeStep = steps[idx];
  if (phaseNum) {
    const idxAttr = activeStep?.dataset.stepIndex;
    const num = idxAttr ? String(Number(idxAttr) + 1).padStart(2, '0') : '01';
    phaseNum.textContent = num;
  }
  if (phaseLabel) {
    phaseLabel.textContent = activeStep?.dataset.stepMeta ?? '';
  }

  // Sphere-Stage benachrichtigen — Progress 0..1 anhand Index
  const progress = steps.length > 1 ? idx / (steps.length - 1) : 0;
  section.dispatchEvent(
    new CustomEvent('story:progress', { detail: { progress } }),
  );
};

export const initScrollStories = (
  selector = '[data-scroll-story]',
): Cleanup => {
  const sections = Array.from(
    document.querySelectorAll<HTMLElement>(selector),
  );
  if (sections.length === 0) return () => {};

  const teardowns: Cleanup[] = [];

  sections.forEach((section) => {
    const steps = Array.from(
      section.querySelectorAll<HTMLElement>('[data-story-step]'),
    );
    if (steps.length === 0) return;

    const phaseNum = section.querySelector<HTMLElement>('[data-story-current]');
    const phaseLabel = section.querySelector<HTMLElement>(
      '[data-story-current-label]',
    );

    let activeIndex = 0;
    let userPinned = false;
    let pinTimer: number | null = null;

    const apply = (idx: number) => {
      if (idx === activeIndex) return;
      activeIndex = idx;
      setActive(steps, phaseNum, phaseLabel, section, idx);
    };

    // Initial-State setzen
    setActive(steps, phaseNum, phaseLabel, section, 0);

    // ---- User Override: Hover / Click / Focus ---------------------------
    const pinUser = (idx: number) => {
      userPinned = true;
      if (pinTimer != null) window.clearTimeout(pinTimer);
      // Nach 2.5s wieder Auto-Detection erlauben
      pinTimer = window.setTimeout(() => {
        userPinned = false;
        pinTimer = null;
      }, 2500);
      apply(idx);
    };

    steps.forEach((step, idx) => {
      const onEnter = () => pinUser(idx);
      step.addEventListener('mouseenter', onEnter);
      step.addEventListener('focus', onEnter);
      step.addEventListener('click', onEnter);

      teardowns.push(() => {
        step.removeEventListener('mouseenter', onEnter);
        step.removeEventListener('focus', onEnter);
        step.removeEventListener('click', onEnter);
      });
    });

    // ---- Auto-Detection: Step im Viewport-Center ------------------------
    if (!prefersReducedMotion() && 'IntersectionObserver' in window) {
      // Wir tracken pro Step, ob er den "aktiven Streifen" (40-60% vom Viewport)
      // schneidet. Statt IO-Threshold-Magie fahren wir auf Scroll/Resize ein
      // einfaches RAF-Throttle + getBoundingClientRect — robuster mit Lenis.
      let rafId: number | null = null;

      const tick = () => {
        rafId = null;
        if (userPinned) return;

        const vh = window.innerHeight;
        const targetY = vh * 0.5;

        let bestIdx = activeIndex;
        let bestDist = Infinity;

        steps.forEach((step, idx) => {
          const rect = step.getBoundingClientRect();
          // Ignoriere Steps die komplett außer Sicht sind
          if (rect.bottom < 0 || rect.top > vh) return;
          const center = rect.top + rect.height / 2;
          const dist = Math.abs(center - targetY);
          if (dist < bestDist) {
            bestDist = dist;
            bestIdx = idx;
          }
        });

        if (bestIdx !== activeIndex) apply(bestIdx);
      };

      const onScroll = () => {
        if (rafId != null) return;
        rafId = window.requestAnimationFrame(tick);
      };

      window.addEventListener('scroll', onScroll, { passive: true });
      window.addEventListener('resize', onScroll, { passive: true });
      // Initial check
      onScroll();

      teardowns.push(() => {
        window.removeEventListener('scroll', onScroll);
        window.removeEventListener('resize', onScroll);
        if (rafId != null) window.cancelAnimationFrame(rafId);
      });
    }

    teardowns.push(() => {
      if (pinTimer != null) {
        window.clearTimeout(pinTimer);
        pinTimer = null;
      }
    });
  });

  return () => {
    teardowns.forEach((fn) => fn());
  };
};
