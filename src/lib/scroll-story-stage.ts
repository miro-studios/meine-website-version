/**
 * Scroll-Story-Stage — kleine Three.js-Bühne für die Pin-Section.
 *
 * Setzt sich auf jedes `[data-story-canvas]` und reagiert auf das
 * `story:progress`-Event vom umliegenden `[data-scroll-story]`.
 *
 * Visual: drahtgittriger Icosahedron, dessen Form/Rotation mit dem
 * Story-Fortschritt morpht. Bewusst minimal — wir wollen das Kontrast-
 * Profil zur shaderlastigen Hero-Sphere setzen, nicht ein zweites Hero.
 */

import * as THREE from 'three';
import gsap from 'gsap';
import { ThreeScene } from './three-scene';
import { prefersReducedMotion } from './utils';

type Cleanup = () => void;

interface Stage {
  scene: ThreeScene;
  mesh: THREE.Mesh;
  group: THREE.Group;
  baseGeometry: THREE.IcosahedronGeometry;
  /** Ziel-Werte, vom Story-Progress gesetzt; tickrate-unabhängiger Lerp im Tick. */
  target: { rotX: number; rotY: number; scale: number; emissive: number };
}

const stages = new Map<HTMLElement, Stage>();

const buildStage = (canvas: HTMLCanvasElement, sectionEl: HTMLElement): Stage | null => {
  const scene = new ThreeScene(canvas, {
    fov: 42,
    cameraPosition: [0, 0, 5.6],
    antialias: 'auto',
    background: null,
  });

  const ambient = new THREE.AmbientLight(0xffffff, 0.35);
  const key = new THREE.DirectionalLight(0xffe0c4, 1.4);
  key.position.set(2.5, 3, 4);
  const accent = new THREE.PointLight(0xff4d1c, 6, 12, 1.5);
  accent.position.set(-2, -1, 2);

  scene.add(ambient, key, accent);

  const baseGeometry = new THREE.IcosahedronGeometry(1.55, 1);
  const wireframeMat = new THREE.MeshStandardMaterial({
    color: 0xf4f2ee,
    metalness: 0.4,
    roughness: 0.3,
    wireframe: true,
    emissive: 0xff4d1c,
    emissiveIntensity: 0.0,
  });
  const solidGeometry = new THREE.IcosahedronGeometry(1.4, 0);
  const solidMat = new THREE.MeshStandardMaterial({
    color: 0x1a1a1a,
    metalness: 0.6,
    roughness: 0.4,
    flatShading: true,
  });

  const mesh = new THREE.Mesh(baseGeometry, wireframeMat);
  const innerMesh = new THREE.Mesh(solidGeometry, solidMat);

  const group = new THREE.Group();
  group.add(innerMesh, mesh);
  scene.add(group);

  const stage: Stage = {
    scene,
    mesh,
    group,
    baseGeometry,
    target: { rotX: 0, rotY: 0, scale: 1, emissive: 0 },
  };

  // Story-Progress-Event vom umliegenden Section-Element abgreifen.
  const onProgress = (e: Event) => {
    const detail = (e as CustomEvent<{ progress: number }>).detail;
    const p = detail?.progress ?? 0;
    // Rotation linear über Story-Dauer
    stage.target.rotY = p * Math.PI * 2;
    stage.target.rotX = Math.sin(p * Math.PI) * 0.5;
    // Skala wächst zur Mitte
    stage.target.scale = 1 + Math.sin(p * Math.PI) * 0.18;
    // Akzent-Glow zum Ende
    stage.target.emissive = p * 0.5;
  };
  sectionEl.addEventListener('story:progress', onProgress);

  scene.onTick((delta) => {
    if (scene.reducedMotion) return;

    // Lerp Richtung target — tickrate-unabhängig
    const lerpFactor = 1 - Math.exp(-delta * 8);

    group.rotation.x += (stage.target.rotX - group.rotation.x) * lerpFactor;
    group.rotation.y += (stage.target.rotY - group.rotation.y) * lerpFactor;

    const currentScale = group.scale.x;
    const newScale =
      currentScale + (stage.target.scale - currentScale) * lerpFactor;
    group.scale.setScalar(newScale);

    const mat = mesh.material as THREE.MeshStandardMaterial;
    mat.emissiveIntensity +=
      (stage.target.emissive - mat.emissiveIntensity) * lerpFactor;

    // Idle-Bewegung
    group.rotation.z += delta * 0.05;
  });

  scene.start();

  // Indicator-Update — kleine Zahl unten links, "01..04"
  const indicator = sectionEl.querySelector<HTMLElement>('[data-story-current]');
  const stepCount =
    sectionEl.querySelectorAll<HTMLElement>('[data-story-step]').length;

  const onProgressIndicator = (e: Event) => {
    const detail = (e as CustomEvent<{ progress: number }>).detail;
    if (!indicator || !detail) return;
    const stepIndex = Math.min(
      stepCount - 1,
      Math.floor(detail.progress * stepCount),
    );
    indicator.textContent = String(stepIndex + 1).padStart(2, '0');
  };
  sectionEl.addEventListener('story:progress', onProgressIndicator);

  // Cleanup speichern, indem wir Listener am Stage hinten dran hängen
  (stage as Stage & { _teardown?: () => void })._teardown = () => {
    sectionEl.removeEventListener('story:progress', onProgress);
    sectionEl.removeEventListener('story:progress', onProgressIndicator);
    gsap.killTweensOf(group.rotation);
    scene.destroy();
    baseGeometry.dispose();
    solidGeometry.dispose();
    wireframeMat.dispose();
    solidMat.dispose();
  };

  return stage;
};

export const initStoryStage = (): Cleanup => {
  if (prefersReducedMotion()) return () => {};

  const sections = Array.from(
    document.querySelectorAll<HTMLElement>('[data-scroll-story]'),
  );
  if (sections.length === 0) return () => {};

  for (const section of sections) {
    const canvas = section.querySelector<HTMLCanvasElement>('[data-story-canvas]');
    if (!canvas) continue;
    const stage = buildStage(canvas, section);
    if (stage) stages.set(canvas, stage);
  }

  return () => {
    stages.forEach((stage) => {
      const teardown = (stage as Stage & { _teardown?: () => void })._teardown;
      teardown?.();
    });
    stages.clear();
  };
};
