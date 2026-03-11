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

// ---------------------------------------------------------------------------
// HQ Render — photorealistic studio shot
// ---------------------------------------------------------------------------

/** Vertical gradient background rendered as a fullscreen quad behind the sofa. */
function createGradientBackground(): THREE.Mesh {
  const geometry = new THREE.PlaneGeometry(2, 2);

  const vertexShader = /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = vec4(position.xy, 0.9999, 1.0);
    }
  `;

  const fragmentShader = /* glsl */ `
    varying vec2 vUv;
    uniform vec3 colorTop;
    uniform vec3 colorBottom;
    void main() {
      // Slight ease curve for a softer gradient
      float t = smoothstep(0.0, 1.0, vUv.y);
      vec3 col = mix(colorBottom, colorTop, t);
      gl_FragColor = vec4(col, 1.0);
    }
  `;

  const material = new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms: {
      colorTop: { value: new THREE.Color('#fafafa') },
      colorBottom: { value: new THREE.Color('#e8e4df') },
    },
    depthWrite: false,
    depthTest: false,
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.frustumCulled = false;
  mesh.renderOrder = -1;
  return mesh;
}

/** Create a PMREMGenerator environment map from the scene lights (no HDRI file needed). */
function createStudioEnvMap(renderer: THREE.WebGLRenderer): THREE.Texture {
  const pmrem = new THREE.PMREMGenerator(renderer);
  pmrem.compileEquirectangularShader();

  // Build a minimal "studio" scene for the env map:
  // warm overhead, cool fill, subtle ground bounce
  const envScene = new THREE.Scene();
  envScene.background = new THREE.Color('#e0ddd8');

  // Large area lights simulated as bright meshes
  const topGeo = new THREE.PlaneGeometry(6, 6);
  const topMat = new THREE.MeshBasicMaterial({
    color: new THREE.Color('#ffffff'),
    side: THREE.DoubleSide,
  });
  const topPanel = new THREE.Mesh(topGeo, topMat);
  topPanel.position.set(0, 4, 0);
  topPanel.rotation.x = Math.PI / 2;
  envScene.add(topPanel);

  // Side fill panel (warm)
  const sideMat = new THREE.MeshBasicMaterial({
    color: new THREE.Color('#fff5e6'),
    side: THREE.DoubleSide,
  });
  const sidePanel = new THREE.Mesh(new THREE.PlaneGeometry(4, 3), sideMat);
  sidePanel.position.set(-4, 2, 0);
  sidePanel.rotation.y = Math.PI / 2;
  envScene.add(sidePanel);

  // Back fill panel (cool)
  const backMat = new THREE.MeshBasicMaterial({
    color: new THREE.Color('#e0e8f0'),
    side: THREE.DoubleSide,
  });
  const backPanel = new THREE.Mesh(new THREE.PlaneGeometry(6, 3), backMat);
  backPanel.position.set(0, 2, -4);
  envScene.add(backPanel);

  // Ground plane (subtle warm)
  const groundMat = new THREE.MeshBasicMaterial({
    color: new THREE.Color('#d8d4ce'),
    side: THREE.DoubleSide,
  });
  const groundPlane = new THREE.Mesh(new THREE.PlaneGeometry(10, 10), groundMat);
  groundPlane.rotation.x = -Math.PI / 2;
  groundPlane.position.y = -0.01;
  envScene.add(groundPlane);

  const envMap = pmrem.fromScene(envScene, 0, 0.1, 100).texture;

  // Dispose helper scene
  pmrem.dispose();
  topGeo.dispose();
  topMat.dispose();
  sideMat.dispose();
  backMat.dispose();
  groundMat.dispose();
  sidePanel.geometry.dispose();
  backPanel.geometry.dispose();
  groundPlane.geometry.dispose();

  return envMap;
}

/**
 * High-quality offscreen render of the configured sofa.
 * Produces a photorealistic studio-style product shot.
 *
 * - 2048x1536 @ 2x pixel ratio (effective 4096x3072)
 * - PMREMGenerator environment map from a synthetic studio scene
 * - Soft gradient background
 * - Enhanced shadow map (4096x4096)
 * - Shadow-receiving ground plane
 * - Boosted fabric material properties for visible texture detail
 * - Low 3/4 camera angle, FOV 36
 */
export async function renderSofaHQ(
  modules: PlacedModule[],
  material: MaterialSelection
): Promise<string> {
  const WIDTH = 2048;
  const HEIGHT = 1536;
  const PIXEL_RATIO = 2;

  // --- Renderer ---
  const canvas = document.createElement('canvas');
  canvas.width = WIDTH * PIXEL_RATIO;
  canvas.height = HEIGHT * PIXEL_RATIO;

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    preserveDrawingBuffer: true,
    powerPreference: 'high-performance',
  });
  renderer.setSize(WIDTH, HEIGHT);
  renderer.setPixelRatio(PIXEL_RATIO);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  // --- Environment map ---
  const envMap = createStudioEnvMap(renderer);

  // --- Scene ---
  const scene = new THREE.Scene();
  scene.environment = envMap;

  // --- Gradient background (rendered as fullscreen quad) ---
  const bgQuad = createGradientBackground();
  scene.add(bgQuad);

  // --- Studio Lighting ---

  // Key light — main shadow caster, slightly boosted
  const keyLight = new THREE.DirectionalLight(0xffffff, 1.3);
  keyLight.position.set(5, 8, 3);
  keyLight.castShadow = true;
  keyLight.shadow.mapSize.width = 4096;
  keyLight.shadow.mapSize.height = 4096;
  keyLight.shadow.camera.far = 25;
  keyLight.shadow.camera.left = -6;
  keyLight.shadow.camera.right = 6;
  keyLight.shadow.camera.top = 6;
  keyLight.shadow.camera.bottom = -6;
  keyLight.shadow.bias = -0.0003;
  keyLight.shadow.normalBias = 0.02;
  keyLight.shadow.radius = 3; // soft shadow edge
  scene.add(keyLight);

  // Fill light — warm, no shadow
  const fillLight = new THREE.DirectionalLight(0xe8e4df, 0.5);
  fillLight.position.set(-4, 5, -1);
  scene.add(fillLight);

  // Rim light — cool back edge definition
  const rimLight = new THREE.DirectionalLight(0xd4e0f0, 0.35);
  rimLight.position.set(0, 3, -6);
  scene.add(rimLight);

  // Secondary fill from below-front for under-seat softness
  const bounceLight = new THREE.DirectionalLight(0xf0ece6, 0.2);
  bounceLight.position.set(2, 0.5, 4);
  scene.add(bounceLight);

  // Ambient — slightly higher for studio feel
  const ambient = new THREE.AmbientLight(0xffffff, 0.3);
  scene.add(ambient);

  // Hemisphere — sky/ground gradient
  const hemi = new THREE.HemisphereLight(0xc9dff0, 0xd4c8a8, 0.35);
  scene.add(hemi);

  // --- Build sofa ---
  const sofaGroup = await buildExportScene(modules, material);

  // Boost material properties for HQ render
  sofaGroup.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.castShadow = true;
      child.receiveShadow = true;

      const mat = child.material;
      if (mat instanceof THREE.MeshStandardMaterial) {
        mat.envMap = envMap;
        mat.envMapIntensity = 0.8;
        mat.needsUpdate = true;

        // Boost fabric roughness slightly for more visible texture
        const name = mat.name ?? '';
        if (name === 'Cord' || name === '') {
          // Only adjust fabric (Cord) materials, keep legs/etikett as-is
          mat.roughness = Math.min(mat.roughness * 1.05, 0.95);
        }
      }
    }
  });

  scene.add(sofaGroup);

  // --- Ground plane with shadow ---
  const sofaBox = new THREE.Box3().setFromObject(sofaGroup);
  const sofaCenter = sofaBox.getCenter(new THREE.Vector3());
  const sofaSize = sofaBox.getSize(new THREE.Vector3());
  const groundExtent = Math.max(sofaSize.x, sofaSize.z) * 3;

  const groundGeo = new THREE.PlaneGeometry(groundExtent, groundExtent);
  const groundMat = new THREE.ShadowMaterial({ opacity: 0.25 });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = sofaBox.min.y - 0.001; // just below sofa bottom
  ground.receiveShadow = true;
  scene.add(ground);

  // --- Camera ---
  const fov = 36;
  const maxDim = Math.max(sofaSize.x, sofaSize.z);
  // Distance to frame the sofa with some breathing room
  const distance = (maxDim * 1.2) / (2 * Math.tan((fov * Math.PI) / 360));

  const camera = new THREE.PerspectiveCamera(fov, WIDTH / HEIGHT, 0.01, 100);

  // Low 3/4 view: ~30 deg elevation, slight rightward offset
  const elevAngle = (30 * Math.PI) / 180;
  const azimuth = (35 * Math.PI) / 180; // slight offset from front
  camera.position.set(
    sofaCenter.x + distance * Math.sin(azimuth) * Math.cos(elevAngle),
    sofaCenter.y + distance * Math.sin(elevAngle),
    sofaCenter.z + distance * Math.cos(azimuth) * Math.cos(elevAngle)
  );
  // Look slightly below center for a grounded feel
  const lookTarget = sofaCenter.clone();
  lookTarget.y = sofaCenter.y - sofaSize.y * 0.1;
  camera.lookAt(lookTarget);

  // --- Render ---
  renderer.render(scene, camera);

  // --- Extract PNG ---
  const dataUrl = canvas.toDataURL('image/png');

  // --- Dispose everything to prevent WebGL context leak ---
  renderer.dispose();
  envMap.dispose();
  disposeExportScene(sofaGroup);
  groundGeo.dispose();
  groundMat.dispose();
  bgQuad.geometry.dispose();
  (bgQuad.material as THREE.ShaderMaterial).dispose();
  scene.clear();

  return dataUrl;
}
