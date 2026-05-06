/**
 * Wiederverwendbare Three.js-Scene-Engine.
 *
 * Verantwortlich für:
 *   - Renderer + Scene + Camera Setup
 *   - Resize-Handling via ResizeObserver
 *   - RAF-Loop mit Auto-Pause wenn der Canvas off-screen ist (IntersectionObserver)
 *   - Tick-Callbacks (deltaSeconds, time) registrierbar
 *   - Scroll-Progress-API (`setScroll(0..1)`) für ScrollTrigger-Coupling
 *   - prefers-reduced-motion: rendert nur einen Frame, kein RAF-Loop
 *   - Sauberes destroy() das alle Listener entfernt
 *
 * Spezifische Meshes/Lighting kommen in der konsumierenden Komponente
 * via `scene.add(...)`.
 */

import * as THREE from 'three';
import { prefersReducedMotion } from './utils';

export interface ThreeSceneOptions {
  /** Field of view in Grad. Default 45. */
  fov?: number;
  /** Camera-Position als [x, y, z]. Default [0, 0, 5]. */
  cameraPosition?: [number, number, number];
  /** Antialiasing. Auto: an auf Desktop, aus auf Mobile. */
  antialias?: 'auto' | boolean;
  /** Maximale Device Pixel Ratio. Default 2. */
  maxDpr?: number;
  /** Hintergrund-Farbe (oder null für transparent). Default null. */
  background?: THREE.ColorRepresentation | null;
  /** Wenn true, läuft die Scene auch wenn Canvas off-screen ist. Default false. */
  alwaysAnimate?: boolean;
  /** Wenn true, ignoriert prefers-reduced-motion. Default false. */
  ignoreReducedMotion?: boolean;
}

export type TickCallback = (deltaSeconds: number, time: number) => void;

export class ThreeScene {
  public readonly scene: THREE.Scene;
  public readonly camera: THREE.PerspectiveCamera;
  public readonly renderer: THREE.WebGLRenderer;
  public scrollProgress = 0;

  private canvas: HTMLCanvasElement;
  private clock = new THREE.Clock();
  private rafId: number | null = null;
  private isVisible = true;
  private isRunning = false;
  private isReducedMotion = false;
  private alwaysAnimate: boolean;
  private tickCallbacks = new Set<TickCallback>();
  private resizeObserver: ResizeObserver | null = null;
  private intersectionObserver: IntersectionObserver | null = null;
  private cleanupFns: Array<() => void> = [];

  constructor(canvas: HTMLCanvasElement, options: ThreeSceneOptions = {}) {
    this.canvas = canvas;

    const {
      fov = 45,
      cameraPosition = [0, 0, 5],
      antialias = 'auto',
      maxDpr = 2,
      background = null,
      alwaysAnimate = false,
      ignoreReducedMotion = false,
    } = options;

    this.alwaysAnimate = alwaysAnimate;
    this.isReducedMotion = !ignoreReducedMotion && prefersReducedMotion();

    // -- Renderer --
    const isMobile =
      typeof window !== 'undefined' &&
      window.matchMedia('(max-width: 768px)').matches;
    const useAntialias = antialias === 'auto' ? !isMobile : antialias;

    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: useAntialias,
      alpha: background === null,
      powerPreference: 'high-performance',
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, maxDpr));

    if (background !== null) {
      this.renderer.setClearColor(background, 1);
    } else {
      this.renderer.setClearColor(0x000000, 0);
    }

    // -- Scene --
    this.scene = new THREE.Scene();

    // -- Camera --
    const initialAspect = canvas.clientWidth / Math.max(canvas.clientHeight, 1);
    this.camera = new THREE.PerspectiveCamera(fov, initialAspect, 0.1, 100);
    this.camera.position.set(...cameraPosition);
    this.camera.lookAt(0, 0, 0);

    // -- Initial Resize --
    this.handleResize();

    // -- Resize Observer (universally available in evergreen browsers) --
    this.resizeObserver = new ResizeObserver(() => this.handleResize());
    this.resizeObserver.observe(canvas);

    // -- IntersectionObserver für Auto-Pause --
    if (!this.alwaysAnimate && 'IntersectionObserver' in window) {
      this.intersectionObserver = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            this.isVisible = entry.isIntersecting;
          }
        },
        { threshold: 0 },
      );
      this.intersectionObserver.observe(canvas);
    }
  }

  /** Fügt ein Object3D in die Scene ein. */
  add(...objects: THREE.Object3D[]): void {
    for (const obj of objects) this.scene.add(obj);
  }

  /** Entfernt ein Object3D aus der Scene. */
  remove(...objects: THREE.Object3D[]): void {
    for (const obj of objects) this.scene.remove(obj);
  }

  /** Registriert einen Tick-Callback. Gibt eine Teardown-Funktion zurück. */
  onTick(cb: TickCallback): () => void {
    this.tickCallbacks.add(cb);
    return () => this.tickCallbacks.delete(cb);
  }

  /** Setzt den Scroll-Progress (0..1). Callbacks lesen diesen Wert. */
  setScroll(progress: number): void {
    this.scrollProgress = Math.max(0, Math.min(1, progress));
  }

  /** Startet den RAF-Loop. */
  start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.clock.start();

    if (this.isReducedMotion) {
      // Bei reduced motion: einen Frame rendern, keine Animation
      this.renderOnce();
      return;
    }

    const tick = () => {
      if (!this.isRunning) return;
      this.rafId = requestAnimationFrame(tick);

      // Auto-Pause wenn off-screen (und alwaysAnimate ist false)
      if (!this.alwaysAnimate && !this.isVisible) return;

      const delta = this.clock.getDelta();
      const time = this.clock.getElapsedTime();
      for (const cb of this.tickCallbacks) cb(delta, time);

      this.renderer.render(this.scene, this.camera);
    };

    tick();
  }

  /** Stoppt den RAF-Loop. */
  stop(): void {
    this.isRunning = false;
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.clock.stop();
  }

  /** Rendert einen einzelnen Frame. */
  renderOnce(): void {
    const delta = this.clock.getDelta();
    const time = this.clock.getElapsedTime();
    for (const cb of this.tickCallbacks) cb(delta, time);
    this.renderer.render(this.scene, this.camera);
  }

  /** Räumt alle Ressourcen auf (Listener, GL-Buffers). */
  destroy(): void {
    this.stop();

    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }
    if (this.intersectionObserver) {
      this.intersectionObserver.disconnect();
      this.intersectionObserver = null;
    }
    for (const fn of this.cleanupFns) fn();
    this.cleanupFns.length = 0;

    this.tickCallbacks.clear();

    // Geometry/Material-Cleanup
    this.scene.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        obj.geometry?.dispose();
        const material = obj.material;
        if (Array.isArray(material)) {
          material.forEach((m) => m.dispose());
        } else if (material) {
          material.dispose();
        }
      }
    });

    this.renderer.dispose();
  }

  /** Gibt zurück, ob reduced-motion aktiv ist. */
  get reducedMotion(): boolean {
    return this.isReducedMotion;
  }

  private handleResize(): void {
    const width = this.canvas.clientWidth;
    const height = this.canvas.clientHeight;
    if (width === 0 || height === 0) return;

    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }
}
