/**
 * Ambient Backdrop — filmischer fixed-position Background-Layer.
 *
 * Drei aufeinander gelegte Render-Layer auf einem einzelnen Canvas:
 *  1) Aurora-Orbs — radial-gradient blobs in additive blending
 *  2) Stars / Particles — tiered (tiny/medium/hero) mit Halo + Twinkle
 *  3) Wireframe-Ikosaeder — sehr subtil, rotiert langsam
 *
 * Zusätzlich (via CSS):
 *  - Dot-Grid (background-image) mit Scroll-coupled Shift
 *  - Vertikale Vignette die zu Header/Footer schwarz aus läuft
 *
 * Aktivierung:
 *  - IntersectionObserver auf einem Trigger-Element
 *  - Layer faded in via .is-active class
 *
 * Mobile-Optimierung:
 *  - Reduzierte Particle-Count
 *  - Kein Wireframe (zu rechenintensiv für Low-End)
 *  - Niedrigere Intensity-Defaults
 *
 * prefers-reduced-motion: Intensity auf 0.3, keine Orbit-Bewegung
 *
 * Origin: extrahiert aus dem User-gelieferten "Ambient Backdrop.html" und
 * für die Studio-Aesthetik angepasst (Akzent-Farbe aus Theme-Token).
 */

import { prefersReducedMotion, isCoarsePointer } from './utils';

type Cleanup = () => void;

interface AmbientOptions {
  /** Primärfarbe als rgb-Triple. Default: Theme-Accent-resolved. */
  primary?: [number, number, number];
  /** Sekundärfarbe (für Stars). Default: text-color resolved. */
  secondary?: [number, number, number];
  /** Intensity 0..1. Default 0.55 desktop, 0.4 mobile. */
  intensity?: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  depth: number;
  size: number;
  tier: 0 | 1 | 2;
  tint: [number, number, number];
  twPhase: number;
  twSpeed: number;
  twAmt: number;
}

const PHI = (1 + Math.sqrt(5)) / 2;

// Ikosaeder-Vertices
const ICO_V: [number, number, number][] = [
  [-1, PHI, 0], [1, PHI, 0], [-1, -PHI, 0], [1, -PHI, 0],
  [0, -1, PHI], [0, 1, PHI], [0, -1, -PHI], [0, 1, -PHI],
  [PHI, 0, -1], [PHI, 0, 1], [-PHI, 0, -1], [-PHI, 0, 1],
];

// Ikosaeder-Kanten
const ICO_E: [number, number][] = [
  [0, 1], [0, 5], [0, 7], [0, 10], [0, 11],
  [1, 5], [1, 7], [1, 8], [1, 9],
  [2, 3], [2, 4], [2, 6], [2, 10], [2, 11],
  [3, 4], [3, 6], [3, 8], [3, 9],
  [4, 5], [4, 9], [4, 11],
  [5, 9], [5, 11],
  [6, 7], [6, 8], [6, 10],
  [7, 8], [7, 10],
  [8, 9], [10, 11],
];

export const initAmbientBackdrop = (
  root: HTMLElement,
  triggerElement: HTMLElement | null,
  options: AmbientOptions = {},
): Cleanup => {
  if (typeof window === 'undefined') return () => {};

  const canvas = root.querySelector<HTMLCanvasElement>('[data-ambient-canvas]');
  const gridEl = root.querySelector<HTMLElement>('[data-ambient-grid]');
  if (!canvas) return () => {};

  const ctx = canvas.getContext('2d', { alpha: true });
  if (!ctx) return () => {};

  const reduced = prefersReducedMotion();
  const mobile = isCoarsePointer() || window.innerWidth <= 768;

  // ── Theme-Farben aus CSS-Vars resolven (yellow accent für Portfolio) ──
  const cs = getComputedStyle(document.documentElement);
  const parseRgb = (val: string, fallback: [number, number, number]): [number, number, number] => {
    const v = val.trim();
    if (v.startsWith('#')) {
      const hex = v.slice(1);
      const h = hex.length === 3
        ? hex.split('').map((c) => c + c).join('')
        : hex.slice(0, 6);
      return [
        parseInt(h.slice(0, 2), 16),
        parseInt(h.slice(2, 4), 16),
        parseInt(h.slice(4, 6), 16),
      ];
    }
    return fallback;
  };
  const primary = options.primary ?? parseRgb(cs.getPropertyValue('--color-accent'), [255, 214, 10]);
  const secondary = options.secondary ?? parseRgb(cs.getPropertyValue('--color-text'), [240, 237, 228]);

  // Intensity tuning
  const baseIntensity = options.intensity ?? (mobile ? 0.4 : 0.55);
  let intensity = reduced ? 0.3 : baseIntensity;

  // ── Canvas-Resizing mit DPR ─────────────────────────────────────────
  let W = 0, H = 0;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);

  const resize = () => {
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = `${W}px`;
    canvas.style.height = `${H}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    initParticles();
  };

  // ── Aurora-Orbs ─────────────────────────────────────────────────────
  const orbs = [
    { x: 0.25, y: 0.30, r: 0.45, vx: 0.012, vy: 0.008, role: 'primary' },
    { x: 0.75, y: 0.65, r: 0.55, vx: -0.010, vy: -0.011, role: 'secondary' },
    { x: 0.55, y: 0.20, r: 0.40, vx: 0.014, vy: -0.009, role: 'primary' },
  ];

  const updateOrbs = (dt: number) => {
    if (reduced) return;
    for (const o of orbs) {
      o.x += o.vx * dt * 0.06;
      o.y += o.vy * dt * 0.06;
      if (o.x < 0.1 || o.x > 0.9) o.vx *= -1;
      if (o.y < 0.1 || o.y > 0.9) o.vy *= -1;
    }
  };

  const drawAurora = (intsy: number) => {
    ctx.globalCompositeOperation = 'lighter';
    for (const o of orbs) {
      const cx = o.x * W;
      const cy = o.y * H;
      const radius = o.r * Math.min(W, H);
      const [r, g, b] = o.role === 'primary' ? primary : secondary;
      const alpha = intsy * (o.role === 'primary' ? 0.18 : 0.07);
      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
      grad.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${alpha})`);
      grad.addColorStop(0.5, `rgba(${r}, ${g}, ${b}, ${alpha * 0.3})`);
      grad.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);
    }
    ctx.globalCompositeOperation = 'source-over';
  };

  // ── Stars / Particles ───────────────────────────────────────────────
  let particles: Particle[] = [];

  const initParticles = () => {
    // Mobile: deutlich weniger Stars für 60fps
    const density = mobile ? 22 : 14;
    const count = Math.floor(Math.min(W, H) / density);
    particles = [];
    for (let i = 0; i < count; i++) {
      const roll = Math.random();
      let tier: 0 | 1 | 2, size: number, depth: number;
      if (roll < 0.78) {
        tier = 0;
        size = 0.4 + Math.random() * 0.55;
        depth = 0.15 + Math.random() * 0.35;
      } else if (roll < 0.96) {
        tier = 1;
        size = 1.0 + Math.random() * 0.8;
        depth = 0.45 + Math.random() * 0.4;
      } else {
        tier = 2;
        size = 1.8 + Math.random() * 1.0;
        depth = 0.8 + Math.random() * 0.2;
      }
      const tempRoll = Math.random();
      let tint: [number, number, number];
      if (tempRoll < 0.7) tint = [248, 246, 240];
      else if (tempRoll < 0.88) tint = [255, 220, 180];
      else tint = [200, 220, 255];

      particles.push({
        x: Math.random() * W,
        y: Math.random() * H,
        vx: (Math.random() - 0.5) * 3,
        vy: (Math.random() - 0.5) * 3,
        depth,
        size,
        tier,
        tint,
        twPhase: Math.random() * Math.PI * 2,
        twSpeed: 0.0006 + Math.random() * 0.0018,
        twAmt: tier === 0 ? 0.55 : tier === 1 ? 0.4 : 0.3,
      });
    }
  };

  const drawParticles = (dt: number, intsy: number, time: number) => {
    const scrollPush = Math.min(Math.abs(scrollDelta), 50) * Math.sign(scrollDelta) * 0.012;

    for (const p of particles) {
      const ds = (0.3 + p.depth * 0.5);
      p.x += p.vx * dt * 0.0008 * ds;
      p.y += p.vy * dt * 0.0008 * ds - scrollPush * (0.3 + p.depth * 0.8);
      if (p.x < -10) p.x = W + 10;
      else if (p.x > W + 10) p.x = -10;
      if (p.y < -10) p.y = H + 10;
      else if (p.y > H + 10) p.y = -10;
    }

    ctx.globalCompositeOperation = 'lighter';

    for (const p of particles) {
      const [r, g, b] = p.tint;
      const tw = reduced ? 1 : 1 - p.twAmt * (0.5 - 0.5 * Math.cos(time * p.twSpeed + p.twPhase));
      const baseA = intsy * (0.35 + p.depth * 0.55) * tw;

      // Halo nur für tier 1+
      if (p.tier >= 1) {
        const haloR = p.size * (p.tier === 2 ? 9 : 5.5);
        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, haloR);
        grad.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${baseA * 0.35})`);
        grad.addColorStop(0.4, `rgba(${r}, ${g}, ${b}, ${baseA * 0.10})`);
        grad.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(p.x, p.y, haloR, 0, Math.PI * 2);
        ctx.fill();
      }

      // Cross-flare auf den hellsten Stars
      if (p.tier === 2) {
        const flareLen = p.size * 7 * tw;
        const flareA = baseA * 0.55;
        ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${flareA})`;
        ctx.lineWidth = 0.6;
        ctx.beginPath();
        ctx.moveTo(p.x - flareLen, p.y);
        ctx.lineTo(p.x + flareLen, p.y);
        ctx.moveTo(p.x, p.y - flareLen);
        ctx.lineTo(p.x, p.y + flareLen);
        ctx.stroke();
      }

      // Core
      ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${Math.min(1, baseA * 1.4)})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.globalCompositeOperation = 'source-over';
  };

  // ── Wireframe-Ikosaeder ─────────────────────────────────────────────
  const drawWireframe = (t: number, intsy: number) => {
    if (mobile) return; // zu rechenintensiv auf Mobile
    const [r, g, b] = primary;
    const cx = W * 0.78;
    const cy = H * 0.5;
    const scale = Math.min(W, H) * 0.32;
    const ay = reduced ? 0 : t * 0.00012;
    const ax = reduced ? 0 : t * 0.00007;

    const cosY = Math.cos(ay), sinY = Math.sin(ay);
    const cosX = Math.cos(ax), sinX = Math.sin(ax);

    const proj = ICO_V.map(([x, y, z]) => {
      let xr = x * cosY + z * sinY;
      let zr = -x * sinY + z * cosY;
      let yr = y * cosX - zr * sinX;
      zr = y * sinX + zr * cosX;
      const persp = 1 / (4 - zr);
      return {
        x: cx + xr * scale * persp,
        y: cy + yr * scale * persp,
        z: zr,
      };
    });

    ctx.lineWidth = 0.75;
    for (const [i, j] of ICO_E) {
      const a = proj[i], b2 = proj[j];
      const avgZ = (a.z + b2.z) / 2;
      const depth = (avgZ + PHI) / (2 * PHI);
      const alpha = intsy * (0.04 + depth * 0.16);
      ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b2.x, b2.y);
      ctx.stroke();
    }

    for (const p of proj) {
      const depth = (p.z + PHI) / (2 * PHI);
      const alpha = intsy * (0.1 + depth * 0.4);
      ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 1.4 + depth * 0.9, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  // ── Scroll-Tracking ─────────────────────────────────────────────────
  let lastScroll = window.scrollY;
  let scrollDelta = 0;
  const onScroll = () => {
    const dy = window.scrollY - lastScroll;
    scrollDelta = scrollDelta * 0.7 + dy * 0.3;
    lastScroll = window.scrollY;
    // Grid-Shift
    if (gridEl) {
      gridEl.style.setProperty('--grid-shift', `${(window.scrollY * 0.08) % 42}px`);
    }
  };
  window.addEventListener('scroll', onScroll, { passive: true });

  // ── Activation via IntersectionObserver ─────────────────────────────
  let active = false;
  let io: IntersectionObserver | null = null;
  if (triggerElement) {
    io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          active = e.isIntersecting || e.boundingClientRect.top < 0;
          root.classList.toggle('is-active', active);
        }
      },
      { rootMargin: '0px 0px -50% 0px' },
    );
    io.observe(triggerElement);
  } else {
    // Fallback: immer aktiv
    active = true;
    root.classList.add('is-active');
  }

  // ── Resize ─────────────────────────────────────────────────────────
  let resizeFrame = 0;
  const onResize = () => {
    cancelAnimationFrame(resizeFrame);
    resizeFrame = requestAnimationFrame(resize);
  };
  window.addEventListener('resize', onResize, { passive: true });

  // ── visibilitychange ────────────────────────────────────────────────
  let running = true;
  const onVisibility = () => {
    running = !document.hidden;
  };
  document.addEventListener('visibilitychange', onVisibility);

  // ── Main Loop ──────────────────────────────────────────────────────
  let last = performance.now();
  let rafId = 0;

  const frame = (t: number) => {
    const dt = Math.min(t - last, 50);
    last = t;

    if (active && running) {
      ctx.clearRect(0, 0, W, H);
      updateOrbs(dt);
      drawAurora(intensity);
      drawParticles(dt, intensity * 0.85, t);
      drawWireframe(t, intensity);
      scrollDelta *= 0.94;
    } else {
      ctx.clearRect(0, 0, W, H);
    }

    rafId = requestAnimationFrame(frame);
  };

  resize();
  rafId = requestAnimationFrame(frame);

  // ── Cleanup ────────────────────────────────────────────────────────
  return () => {
    cancelAnimationFrame(rafId);
    cancelAnimationFrame(resizeFrame);
    window.removeEventListener('scroll', onScroll);
    window.removeEventListener('resize', onResize);
    document.removeEventListener('visibilitychange', onVisibility);
    io?.disconnect();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    root.classList.remove('is-active');
  };
};
