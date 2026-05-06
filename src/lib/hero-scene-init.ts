import * as THREE from 'three';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ThreeScene } from '@lib/three-scene';
import { prefersReducedMotion } from '@lib/utils';

gsap.registerPlugin(ScrollTrigger);

let scene: ThreeScene | null = null;
let scrollTriggerInstance: ScrollTrigger | null = null;
let mouseHandler: ((e: MouseEvent) => void) | null = null;

/**
 * Hero-Scene — Mehrere überlappende Punkte-Netz-Sphären.
 *
 * Inspiriert vom Web3-Look: filigrane Drahtgitter-Globen die sich
 * teilweise durchdringen, weiße Punkte auf den Vertices, dünne
 * verbindende Linien. Mehrere Sphären in unterschiedlichen Größen
 * und Positionen — kein solider Kern.
 */

interface SphereConfig {
  radius: number;
  detail: number;
  position: [number, number, number];
  pointSize: number;
  pointOpacity: number;
  lineOpacity: number;
  rotSpeed: { x: number; y: number; z: number };
  accent?: boolean;
}

interface SphereInstance {
  group: THREE.Group;
  pointMat: THREE.PointsMaterial;
  lineMat: THREE.LineBasicMaterial;
  rotSpeed: { x: number; y: number; z: number };
  basePosition: THREE.Vector3;
}

function buildWireSphere(cfg: SphereConfig): SphereInstance {
  const group = new THREE.Group();
  group.position.set(...cfg.position);

  // Vertices der Icosahedron-Topologie deduplizieren
  const baseGeo = new THREE.IcosahedronGeometry(cfg.radius, cfg.detail);
  const posAttr = baseGeo.getAttribute('position') as THREE.BufferAttribute;
  const uniqueVerts: THREE.Vector3[] = [];
  const seen = new Map<string, number>();
  const indexMap: number[] = [];
  for (let i = 0; i < posAttr.count; i++) {
    const v = new THREE.Vector3().fromBufferAttribute(posAttr, i);
    const key = `${v.x.toFixed(3)}|${v.y.toFixed(3)}|${v.z.toFixed(3)}`;
    if (seen.has(key)) {
      indexMap.push(seen.get(key)!);
    } else {
      const idx = uniqueVerts.length;
      seen.set(key, idx);
      uniqueVerts.push(v);
      indexMap.push(idx);
    }
  }

  // Kanten aus Triangles ableiten — IcosahedronGeometry hat KEINE
  // index-Attribute, sondern nicht-indizierte Triangles (je 3 aufeinanderfolgende Vertices).
  const edgeSet = new Set<string>();
  const edges: Array<[number, number]> = [];
  const idxAttr = baseGeo.index;
  const triCount = idxAttr ? idxAttr.count / 3 : posAttr.count / 3;
  for (let t = 0; t < triCount; t++) {
    const rawA = idxAttr ? idxAttr.getX(t * 3) : t * 3;
    const rawB = idxAttr ? idxAttr.getX(t * 3 + 1) : t * 3 + 1;
    const rawC = idxAttr ? idxAttr.getX(t * 3 + 2) : t * 3 + 2;
    const a = indexMap[rawA];
    const b = indexMap[rawB];
    const c = indexMap[rawC];
    for (const [p, q] of [[a, b], [b, c], [c, a]] as Array<[number, number]>) {
      const lo = Math.min(p, q);
      const hi = Math.max(p, q);
      const k = `${lo}-${hi}`;
      if (!edgeSet.has(k)) {
        edgeSet.add(k);
        edges.push([lo, hi]);
      }
    }
  }
  baseGeo.dispose();

  // Punkte (weiße Knoten)
  const pointPositions = new Float32Array(uniqueVerts.length * 3);
  for (let i = 0; i < uniqueVerts.length; i++) {
    pointPositions[i * 3] = uniqueVerts[i].x;
    pointPositions[i * 3 + 1] = uniqueVerts[i].y;
    pointPositions[i * 3 + 2] = uniqueVerts[i].z;
  }
  const pointGeo = new THREE.BufferGeometry();
  pointGeo.setAttribute('position', new THREE.BufferAttribute(pointPositions, 3));
  const pointMat = new THREE.PointsMaterial({
    color: 0xff6a1f,
    size: cfg.pointSize,
    sizeAttenuation: true,
    transparent: true,
    opacity: cfg.pointOpacity,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const points = new THREE.Points(pointGeo, pointMat);
  group.add(points);

  // Verbindungs-Linien (sehr fein)
  const linePositions = new Float32Array(edges.length * 6);
  for (let i = 0; i < edges.length; i++) {
    const [a, b] = edges[i];
    const va = uniqueVerts[a];
    const vb = uniqueVerts[b];
    linePositions[i * 6 + 0] = va.x;
    linePositions[i * 6 + 1] = va.y;
    linePositions[i * 6 + 2] = va.z;
    linePositions[i * 6 + 3] = vb.x;
    linePositions[i * 6 + 4] = vb.y;
    linePositions[i * 6 + 5] = vb.z;
  }
  const lineGeo = new THREE.BufferGeometry();
  lineGeo.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
  const lineMat = new THREE.LineBasicMaterial({
    color: 0xff5a1f,
    transparent: true,
    opacity: cfg.lineOpacity,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const lines = new THREE.LineSegments(lineGeo, lineMat);
  group.add(lines);

  return {
    group,
    pointMat,
    lineMat,
    rotSpeed: cfg.rotSpeed,
    basePosition: new THREE.Vector3(...cfg.position),
  };
}

export function buildHeroScene() {
  const canvas = document.querySelector<HTMLCanvasElement>('[data-hero-scene-canvas]');
  const heroEl = document.querySelector<HTMLElement>('.hero');
  if (!canvas || !heroEl) return;

  const isMobile = window.matchMedia('(max-width: 768px)').matches;

  scene = new ThreeScene(canvas, {
    fov: 38,
    cameraPosition: [0, 0, 5.4],
    antialias: 'auto',
    maxDpr: 2,
    background: null,
  });

  // Reines AmbientLight reicht — die Punkte/Linien sind unbeleuchtet
  scene.add(new THREE.AmbientLight(0xffffff, 1.0));

  const networkGroup = new THREE.Group();
  networkGroup.position.set(0.5, 0.05, 0);
  scene.add(networkGroup);

  // -- Drei konzentrische Punkte-Netz-Sphären (alle zentriert) --
  const detailInner = isMobile ? 2 : 3;
  const detailMid = isMobile ? 1 : 2;
  const detailOuter = isMobile ? 1 : 2;

  // Innen — kleine, dichte Kugel
  const main = buildWireSphere({
    radius: 0.65,
    detail: detailInner,
    position: [0, 0, 0],
    pointSize: 0.024,
    pointOpacity: 1.0,
    lineOpacity: 0.30,
    rotSpeed: { x: 0.02, y: 0.10, z: 0 },
  });
  networkGroup.add(main.group);

  // Mittlere Hülle
  const side1 = buildWireSphere({
    radius: 1.05,
    detail: detailMid,
    position: [0, 0, 0],
    pointSize: 0.020,
    pointOpacity: 0.85,
    lineOpacity: 0.18,
    rotSpeed: { x: -0.03, y: -0.06, z: 0 },
  });
  networkGroup.add(side1.group);

  // Äußere Hülle
  const side2 = buildWireSphere({
    radius: 1.45,
    detail: detailOuter,
    position: [0, 0, 0],
    pointSize: 0.018,
    pointOpacity: 0.65,
    lineOpacity: 0.12,
    rotSpeed: { x: 0.04, y: 0.05, z: 0 },
  });
  networkGroup.add(side2.group);

  // (vierte Sphäre entfernt — alles zentriert auf einer Achse)
  const side3 = side2; // Alias damit unten kein Code bricht

  const spheres: SphereInstance[] = [main, side1, side2];

  // Maus-Parallax
  const mouseTarget = new THREE.Vector2(0, 0);
  const mouseLerp = new THREE.Vector2(0, 0);
  mouseHandler = (e: MouseEvent) => {
    const rect = heroEl.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    mouseTarget.set(x, y);
  };
  heroEl.addEventListener('mousemove', mouseHandler);

  scene.onTick((_delta, time) => {
    if (!scene) return;
    const reduced = scene.reducedMotion;
    const sp = scene.scrollProgress;

    if (!reduced) {
      // Jede Sphäre rotiert eigenständig
      for (const s of spheres) {
        s.group.rotation.x = time * s.rotSpeed.x;
        s.group.rotation.y = time * s.rotSpeed.y;
        s.group.rotation.z = time * s.rotSpeed.z;
      }

      // (Schweben entfernt — alle Sphären bleiben zentriert)

      // Maus-Parallax auf die ganze Gruppe
      mouseLerp.x += (mouseTarget.x - mouseLerp.x) * 0.04;
      mouseLerp.y += (mouseTarget.y - mouseLerp.y) * 0.04;
      networkGroup.rotation.y = mouseLerp.x * 0.30;
      networkGroup.rotation.x = -mouseLerp.y * 0.20;
    }

    // Scroll: Konstrukt schrumpft + driftet leicht weg
    const scale = 1 - sp * 0.15;
    networkGroup.scale.setScalar(scale);
    networkGroup.position.z = -sp * 0.6;

    // Fade beim Scrollen
    for (const s of spheres) {
      s.lineMat.opacity = s.lineMat.opacity * 0.995 + (s.lineMat.opacity * (1 - sp * 0.5)) * 0.005;
    }

    if (!reduced) {
      scene.camera.position.x = Math.sin(time * 0.10) * 0.08;
      scene.camera.position.y = Math.cos(time * 0.08) * 0.04;
      scene.camera.lookAt(0.5, 0, 0);
    } else {
      scene.camera.lookAt(0.5, 0, 0);
    }
  });

  scene.start();

  if (!prefersReducedMotion()) {
    scrollTriggerInstance = ScrollTrigger.create({
      trigger: heroEl,
      start: 'top top',
      end: 'bottom top',
      scrub: 0.8,
      onUpdate: (self) => {
        scene?.setScroll(self.progress);
      },
    });
  } else {
    scene.setScroll(0);
  }
}

function teardown() {
  const heroEl = document.querySelector<HTMLElement>('.hero');
  if (mouseHandler && heroEl) {
    heroEl.removeEventListener('mousemove', mouseHandler);
    mouseHandler = null;
  }
  if (scrollTriggerInstance) {
    scrollTriggerInstance.kill();
    scrollTriggerInstance = null;
  }
  if (scene) {
    scene.destroy();
    scene = null;
  }
}

export function initHeroScene() {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', buildHeroScene);
  } else {
    buildHeroScene();
  }
  document.addEventListener('astro:page-load', buildHeroScene);
  document.addEventListener('astro:before-swap', teardown);
}
