import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import type { PlacedModule } from '@/types/configurator';
import type { MaterialSelection } from '@/types/materials';
import { MODULE_CATALOG } from '@/lib/config/modules';
import { MODULE_MATERIAL_SLOTS, UNIT_SCALE } from '@/lib/config/constants';
import { getMaterialForSlot } from './material-factory';

const loader = new GLTFLoader();

function loadGLB(path: string): Promise<THREE.Group> {
  return new Promise((resolve, reject) => {
    loader.load(path, (gltf) => resolve(gltf.scene), undefined, reject);
  });
}

/**
 * Build a standalone THREE.Group from current placed modules + material selection.
 * Used for USDZ export — no R3F dependency.
 */
export async function buildExportScene(
  modules: PlacedModule[],
  material: MaterialSelection
): Promise<THREE.Group> {
  const root = new THREE.Group();

  for (const mod of modules) {
    const catalog = MODULE_CATALOG[mod.moduleId];
    if (!catalog) continue;

    const scene = await loadGLB(catalog.modelPath);
    const clone = scene.clone(true);

    clone.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const matName = (child.material as THREE.Material)?.name ?? '';

        if (matName === 'Cord') {
          child.material = getMaterialForSlot(MODULE_MATERIAL_SLOTS.CORD, material).clone();
        } else if (matName === 'legs') {
          child.material = getMaterialForSlot(MODULE_MATERIAL_SLOTS.LEGS, material).clone();
        } else if (matName === 'etikett') {
          child.material = getMaterialForSlot(MODULE_MATERIAL_SLOTS.ETIKETT, material).clone();
        } else {
          child.material = (child.material as THREE.Material).clone();
        }

        // Strip any selection highlight
        const mat = child.material;
        if (mat instanceof THREE.MeshStandardMaterial) {
          mat.emissive = new THREE.Color('#000000');
          mat.emissiveIntensity = 0;
        }
      }
    });

    const wrapper = new THREE.Group();
    wrapper.add(clone);
    clone.scale.set(UNIT_SCALE, UNIT_SCALE, UNIT_SCALE);
    wrapper.position.set(...mod.position);
    wrapper.rotation.set(...mod.rotation);
    root.add(wrapper);
  }

  return root;
}

/**
 * Dispose all geometries and materials in a group to prevent memory leaks.
 */
export function disposeExportScene(group: THREE.Group): void {
  group.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.geometry?.dispose();
      const mat = child.material;
      if (Array.isArray(mat)) {
        mat.forEach((m) => m.dispose());
      } else {
        mat?.dispose();
      }
    }
  });
}
