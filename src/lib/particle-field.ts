/**
 * High-end Canvas Particle-Field.
 *
 *  - Pure Canvas 2D — keine WebGL/Three.js Penalty
 *  - GPU-friendly: keine layout thrash, nur transform + alpha
 *  - Layered depth (parallax: near particles bewegen sich schneller)
 *  - Optional Connection-Lines wenn zwei Particles nah sind ("constellation")
 *  - Scroll-Velocity-Coupling: Particles driften in Scroll-Richtung
 *  - Maus-Interaktion (Desktop): Particles werden sanft weggeschoben
 *  - Mobile: reduzierte Particle-Anzahl, keine Connections, kein Maus-Event
 *  - prefers-reduced-motion: Particles stehen still
 *  - Pausiert wenn Element off-screen (IntersectionObserver) oder Tab hidden
 */

export interface ParticleFieldOptions {
  /** Anzahl Particles (Desktop). Mobile wird automatisch reduziert. */
  count?: number;
  /** Particle-Radius in px (variiert ±50%) */
  size?: number;
  /** Farbe — hex oder rgb. Alpha wird über depth gesteuert. */
  color?: string;
  /** Connection-Lines zwischen nahen Particles (nur Desktop) */
  connections?: boolean;
  /** Max Distanz für Connections in px */
  connectionDistance?: number;
  /** Maus-Repulsion-Radius in px (nur Desktop) */
  interactionRadius?: number;
  /** Reagiert auf Scroll-Velocity */
  reactive?: boolean;
  /** Particle-Basis-Geschwindigkeit (px/s) */
  speed?: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  depth: number; // 0..1 (0 = far, 1 = near)
  size: number;
  baseAlpha: number;
}

type Cleanup = () => void;

const isReducedMotion = (): boolean =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const isCoarsePointer = (): boolean =>
  typeof window !== 'undefined' &&
  window.matchMedia('(pointer: coarse)').matches;

export const initParticleField = (
  canvas: HTMLCanvasElement,
  options: ParticleFieldOptions = {},
): Cleanup => {
  const ctx = canvas.getContext('2d', { alpha: true });
  if (!ctx) return () => {};

  const reduced = isReducedMotion();
  const mobile = isCoarsePointer() || window.innerWidth <= 768;

  // Auf Mobile: drastisch reduzieren für 60fps
  const baseCount = options.count ?? 90;
  const count = mobile ? Math.floor(baseCount * 0.4) : baseCount;
  const baseSize = options.size ?? 1.6;
  const color = options.color ?? '#F0EDE4';
  const allowConnections = (options.connections ?? true) && !mobile;
  const connectionDistance = options.connectionDistance ?? 130;
  const interactionRadius = options.interactionRadius ?? 120;
  const reactive = options.reactive ?? true;
  const speed = options.speed ?? 18;

  // ── DPI-Scaling für scharfe Particles ─────────────────────────────
  let dpr = Math.min(window.devicePixelRatio || 1, 2);
  let width = 0;
  let height = 0;

  const resize = () => {
    const rect = canvas.parentElement?.getBoundingClientRect() ?? {
      width: window.innerWidth,
      height: window.innerHeight,
    };
    width = rect.width;
    height = rect.height;
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };

  resize();

  // ── Particles initialisieren ───────────────────────────────────────
  const particles: Particle[] = [];
  const rand = (min: number, max: number) => Math.random() * (max - min) + min;

  for (let i = 0; i < count; i++) {
    const depth = Math.random(); // 0..1
    particles.push({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: rand(-1, 1),
      vy: rand(-1, 1),
      depth,
      size: baseSize * (0.6 + depth * 0.8) + rand(-0.2, 0.2),
      baseAlpha: 0.15 + depth * 0.65,
    });
  }

  // RGB für Connection-Linien (akzent-frei, da color schon hex/rgb)
  const parseRgb = (c: string): [number, number, number] => {
    if (c.startsWith('#')) {
      const hex = c.slice(1);
      const r = parseInt(hex.length === 3 ? hex[0] + hex[0] : hex.slice(0, 2), 16);
      const g = parseInt(hex.length === 3 ? hex[1] + hex[1] : hex.slice(2, 4), 16);
      const b = parseInt(hex.length === 3 ? hex[2] + hex[2] : hex.slice(4, 6), 16);
      return [r, g, b];
    }
    const m = c.match(/\d+/g);
    return m ? [+m[0], +m[1], +m[2]] : [240, 237, 228];
  };
  const [cR, cG, cB] = parseRgb(color);

  // ── Maus-Tracking (nur Desktop) ────────────────────────────────────
  const mouse = { x: -9999, y: -9999, active: false };
  let mouseHandler: ((e: PointerEvent) => void) | null = null;
  let mouseLeaveHandler: (() => void) | null = null;
  if (!mobile && !reduced) {
    mouseHandler = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
      mouse.active = true;
    };
    mouseLeaveHandler = () => {
      mouse.active = false;
      mouse.x = -9999;
      mouse.y = -9999;
    };
    window.addEventListener('pointermove', mouseHandler, { passive: true });
    window.addEventListener('pointerleave', mouseLeaveHandler);
  }

  // ── Scroll-Velocity-Tracking ───────────────────────────────────────
  let scrollVelocity = 0;
  let lastScroll = window.scrollY;
  let scrollHandler: (() => void) | null = null;
  if (reactive && !reduced) {
    scrollHandler = () => {
      const now = window.scrollY;
      const dy = now - lastScroll;
      // Smoothing
      scrollVelocity = scrollVelocity * 0.7 + dy * 0.3;
      lastScroll = now;
    };
    window.addEventListener('scroll', scrollHandler, { passive: true });
  }

  // ── Resize-Observer ────────────────────────────────────────────────
  let resizeFrame = 0;
  const onResize = () => {
    cancelAnimationFrame(resizeFrame);
    resizeFrame = requestAnimationFrame(() => {
      resize();
      // Particles ggf. in Bounds halten
      for (const p of particles) {
        if (p.x > width) p.x = width;
        if (p.y > height) p.y = height;
      }
    });
  };
  window.addEventListener('resize', onResize, { passive: true });

  // ── IntersectionObserver: pause wenn off-screen ───────────────────
  let inView = true;
  let io: IntersectionObserver | null = null;
  if ('IntersectionObserver' in window && canvas.parentElement) {
    io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          inView = e.isIntersecting;
        }
      },
      { rootMargin: '100px' },
    );
    io.observe(canvas.parentElement);
  }

  // ── Pause wenn Tab hidden ──────────────────────────────────────────
  const visibilityHandler = () => {
    if (document.hidden) {
      isRunning = false;
    } else if (inView) {
      isRunning = true;
      lastFrameTime = performance.now();
      requestAnimationFrame(tick);
    }
  };
  document.addEventListener('visibilitychange', visibilityHandler);

  // ── Render-Loop ────────────────────────────────────────────────────
  let lastFrameTime = performance.now();
  let isRunning = !reduced;
  let rafId = 0;

  const tick = (t: number) => {
    if (!isRunning) return;
    const deltaSec = Math.min((t - lastFrameTime) / 1000, 0.05); // cap 50ms
    lastFrameTime = t;

    if (!inView) {
      rafId = requestAnimationFrame(tick);
      return;
    }

    // ── Update ─────────
    const scrollPush = scrollVelocity * 0.02;
    for (const p of particles) {
      // Base-Drift
      const depthSpeed = speed * (0.4 + p.depth * 0.8);
      p.x += p.vx * deltaSec * depthSpeed;
      p.y += p.vy * deltaSec * depthSpeed;

      // Scroll-Coupling: tiefere Particles werden schneller "weggepustet"
      p.y -= scrollPush * (0.4 + p.depth * 0.6);

      // Maus-Repulsion (Desktop)
      if (mouse.active) {
        const dx = p.x - mouse.x;
        const dy = p.y - mouse.y;
        const distSq = dx * dx + dy * dy;
        if (distSq < interactionRadius * interactionRadius && distSq > 0) {
          const dist = Math.sqrt(distSq);
          const force = (1 - dist / interactionRadius) * 60;
          p.x += (dx / dist) * force * deltaSec;
          p.y += (dy / dist) * force * deltaSec;
        }
      }

      // Wrap-around
      if (p.x < -10) p.x = width + 10;
      else if (p.x > width + 10) p.x = -10;
      if (p.y < -10) p.y = height + 10;
      else if (p.y > height + 10) p.y = -10;
    }

    // ── Draw ─────────
    ctx.clearRect(0, 0, width, height);

    // Connections (nur Desktop, vor den Particles damit Particles drauf liegen)
    if (allowConnections) {
      const maxDistSq = connectionDistance * connectionDistance;
      for (let i = 0; i < particles.length; i++) {
        const a = particles[i];
        for (let j = i + 1; j < particles.length; j++) {
          const b = particles[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const distSq = dx * dx + dy * dy;
          if (distSq < maxDistSq) {
            const alpha = (1 - distSq / maxDistSq) * 0.12 * Math.min(a.depth, b.depth);
            if (alpha < 0.01) continue;
            ctx.strokeStyle = `rgba(${cR}, ${cG}, ${cB}, ${alpha})`;
            ctx.lineWidth = 0.6;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }
    }

    // Particles
    for (const p of particles) {
      ctx.fillStyle = `rgba(${cR}, ${cG}, ${cB}, ${p.baseAlpha})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }

    // Velocity decay
    scrollVelocity *= 0.92;

    rafId = requestAnimationFrame(tick);
  };

  // Reduced-Motion: einmal statisch zeichnen, dann beenden
  if (reduced) {
    // Particles in fixed deterministic positions zeichnen
    ctx.clearRect(0, 0, width, height);
    for (const p of particles) {
      ctx.fillStyle = `rgba(${cR}, ${cG}, ${cB}, ${p.baseAlpha * 0.7})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
  } else {
    rafId = requestAnimationFrame(tick);
  }

  // ── Cleanup ───────────────────────────────────────────────────────
  return () => {
    isRunning = false;
    cancelAnimationFrame(rafId);
    cancelAnimationFrame(resizeFrame);
    window.removeEventListener('resize', onResize);
    if (mouseHandler) window.removeEventListener('pointermove', mouseHandler);
    if (mouseLeaveHandler) window.removeEventListener('pointerleave', mouseLeaveHandler);
    if (scrollHandler) window.removeEventListener('scroll', scrollHandler);
    document.removeEventListener('visibilitychange', visibilityHandler);
    io?.disconnect();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };
};
