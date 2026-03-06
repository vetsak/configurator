import * as THREE from 'three';
import { MODULE_MATERIAL_SLOTS, LEGS_COLOR, ETIKETT_COLOR } from '@/lib/config/constants';
import { FABRICS } from '@/lib/config/materials';
import type { MaterialSelection } from '@/types/materials';
import { textureManager } from './texture-manager';

/**
 * Maps material slot names to Three.js materials.
 * 3 slots per module: "Cord" (swappable fabric), "etikett" (static label), "legs" (solid dark).
 * Only Cord changes on material swap.
 */

const legsMaterial = new THREE.MeshStandardMaterial({
  color: new THREE.Color(LEGS_COLOR),
  roughness: 0.4,
  metalness: 0.1,
  envMapIntensity: 0.3,
});

const etikettMaterial = new THREE.MeshStandardMaterial({
  color: new THREE.Color(ETIKETT_COLOR),
  roughness: 0.8,
  metalness: 0.0,
  envMapIntensity: 0.2,
});

// Cache for cord materials keyed by `${fabricId}-${colourId}`
const cordMaterialCache = new Map<string, THREE.MeshStandardMaterial>();

// Shared normal map for cord fabric — preloaded once, applied to all colors
const CORD_NORMAL_PATH = '/textures/cord/platinum/normal.webp';
let sharedCordNormalMap: THREE.Texture | null = null;
let normalMapLoading = false;

/**
 * Preload the cord normal map. Call this early (e.g. in Providers)
 * so it's available synchronously when materials are first created.
 */
export function preloadCordNormalMap(): Promise<void> {
  if (sharedCordNormalMap || normalMapLoading) return Promise.resolve();
  normalMapLoading = true;
  return textureManager.load(CORD_NORMAL_PATH).then((normalMap) => {
    normalMap.colorSpace = THREE.LinearSRGBColorSpace;
    sharedCordNormalMap = normalMap;
  }).catch(() => {
    normalMapLoading = false;
  });
}

export function getMaterialForSlot(
  slotName: string,
  selection: MaterialSelection
): THREE.Material {
  switch (slotName) {
    case MODULE_MATERIAL_SLOTS.LEGS:
      return legsMaterial;
    case MODULE_MATERIAL_SLOTS.ETIKETT:
      return etikettMaterial;
    case MODULE_MATERIAL_SLOTS.CORD:
      return getCordMaterial(selection);
    default:
      return getCordMaterial(selection);
  }
}

function getCordMaterial(selection: MaterialSelection): THREE.MeshStandardMaterial {
  const key = `${selection.fabricId}-${selection.colourId}`;

  const cached = cordMaterialCache.get(key);
  if (cached) return cached;

  const fabric = FABRICS[selection.fabricId];
  const colour = fabric?.colours.find((c) => c.id === selection.colourId);

  const material = new THREE.MeshStandardMaterial({
    color: new THREE.Color(colour?.hex ?? '#b8b0a8'),
    roughness: fabric?.roughness ?? 0.9,
    metalness: fabric?.metalness ?? 0.0,
    envMapIntensity: 0.4,
  });

  if (colour) {
    // Load diffuse texture only for platinum (other colors don't have diffuse maps)
    if (colour.id === 'platinum') {
      textureManager.load(colour.texturePath).then((map) => {
        material.map = map;
        material.needsUpdate = true;
      }).catch(() => {});
    }

    // Apply shared cord normal map synchronously if preloaded
    if (sharedCordNormalMap) {
      material.normalMap = sharedCordNormalMap;
      material.normalScale.set(fabric?.normalScale ?? 1.0, fabric?.normalScale ?? 1.0);
    } else {
      // Fallback: load async (won't affect already-cloned materials)
      textureManager.load(CORD_NORMAL_PATH).then((normalMap) => {
        normalMap.colorSpace = THREE.LinearSRGBColorSpace;
        sharedCordNormalMap = normalMap;
        material.normalMap = normalMap;
        material.normalScale.set(fabric?.normalScale ?? 1.0, fabric?.normalScale ?? 1.0);
        material.needsUpdate = true;
      }).catch(() => {});
    }
  }

  cordMaterialCache.set(key, material);
  return material;
}

/**
 * Clear cached cord materials — call when switching colours.
 */
export function invalidateCordMaterials(): void {
  for (const mat of cordMaterialCache.values()) {
    mat.dispose();
  }
  cordMaterialCache.clear();
}
