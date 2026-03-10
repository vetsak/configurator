import * as THREE from 'three';
import type { PlacedModule } from '@/types/configurator';
import type { MaterialSelection } from '@/types/materials';
import { buildExportScene, disposeExportScene } from './scene-builder';

/**
 * Render the configured sofa to a transparent PNG using an offscreen WebGL renderer.
 * Creates and immediately disposes the renderer to avoid leaking WebGL contexts.
 */
export async function renderSofaToPNG(
  modules: PlacedModule[],
  material: MaterialSelection,
  width = 1024,
  height = 768
): Promise<string> {
  const scene = new THREE.Scene();
  scene.background = null; // transparent

  // Replicate lighting from lighting.tsx
  const keyLight = new THREE.DirectionalLight(0xffffff, 1.0);
  keyLight.position.set(5, 8, 3);
  scene.add(keyLight);

  const fillLight = new THREE.DirectionalLight(0xe8e4df, 0.4);
  fillLight.position.set(-3, 5, -2);
  scene.add(fillLight);

  const rimLight = new THREE.DirectionalLight(0xd4e0f0, 0.3);
  rimLight.position.set(0, 3, -5);
  scene.add(rimLight);

  const ambient = new THREE.AmbientLight(0xffffff, 0.35);
  scene.add(ambient);

  const hemi = new THREE.HemisphereLight(0xc9dff0, 0xd4c8a8, 0.4);
  scene.add(hemi);

  // Build sofa group from placed modules
  const sofaGroup = await buildExportScene(modules, material);
  scene.add(sofaGroup);

  // Auto-fit camera to sofa bounding box
  const box = new THREE.Box3().setFromObject(sofaGroup);
  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());
  const maxDim = Math.max(size.x, size.y, size.z);
  const fov = 45;
  const distance = maxDim / (2 * Math.tan((fov * Math.PI) / 360));

  const camera = new THREE.PerspectiveCamera(fov, width / height, 0.01, 100);
  // Position camera slightly above and in front for a natural 3/4 view
  camera.position.set(
    center.x + distance * 0.3,
    center.y + distance * 0.5,
    center.z + distance * 0.9
  );
  camera.lookAt(center);

  // Create a regular canvas (OffscreenCanvas lacks .style which Three.js requires)
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
    preserveDrawingBuffer: true,
  });
  renderer.setSize(width, height);
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;

  // Render
  renderer.render(scene, camera);

  // Extract PNG
  const base64 = canvas.toDataURL('image/png');

  // Dispose everything immediately
  renderer.dispose();
  disposeExportScene(sofaGroup);
  scene.clear();

  return base64;
}
