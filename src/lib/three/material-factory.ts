import * as THREE from 'three';
import { MODULE_MATERIAL_SLOTS, LEGS_COLOR, ETIKETT_COLOR } from '@/lib/config/constants';
import { FABRICS } from '@/lib/config/materials';
import type { MaterialSelection, FabricDefinition } from '@/types/materials';
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

// Texture caches — keyed by path, loaded once and reused
const textureCache = new Map<string, THREE.Texture>();
let preloadPromise: Promise<void> | null = null;

/** Load a texture (cached). */
function loadTextureCached(path: string, linear = false): Promise<THREE.Texture> {
  const cached = textureCache.get(path);
  if (cached) return Promise.resolve(cached);
  return textureManager.load(path).then((tex) => {
    if (linear) tex.colorSpace = THREE.LinearSRGBColorSpace;
    textureCache.set(path, tex);
    return tex;
  });
}

/**
 * Preload default cord textures. Call early (e.g. in Providers)
 * so they're available synchronously when materials are first created.
 */
export function preloadCordNormalMap(): Promise<void> {
  if (preloadPromise) return preloadPromise;
  // Preload the default (platinum) textures
  const defaultColour = FABRICS.cord_velour?.colours[0];
  if (!defaultColour) return Promise.resolve();
  const loads: Promise<any>[] = [];
  if (defaultColour.texturePath) loads.push(loadTextureCached(defaultColour.texturePath));
  if (defaultColour.normalMapPath) loads.push(loadTextureCached(defaultColour.normalMapPath, true));
  if (loads.length === 0) return Promise.resolve();
  preloadPromise = Promise.all(loads).then(() => {}).catch(() => { preloadPromise = null; });
  return preloadPromise;
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

// Store catalog reference — updated by setFabricCatalogForMaterials
let _catalogFabrics: FabricDefinition[] = [];

/** Call from the store after catalog loads to make Shopify textures available. */
export function setFabricCatalogForMaterials(fabrics: FabricDefinition[]): void {
  _catalogFabrics = fabrics;
}

function getCordMaterial(selection: MaterialSelection): THREE.MeshStandardMaterial {
  const key = `${selection.fabricId}-${selection.colourId}`;

  const cached = cordMaterialCache.get(key);
  if (cached) return cached;

  // Prefer Shopify catalog (has texture paths), fall back to hardcoded
  const catalogFabric = _catalogFabrics.find((f) => f.id === selection.fabricId);
  const fabric = catalogFabric ?? FABRICS[selection.fabricId];
  const colour = fabric?.colours.find((c) => c.id === selection.colourId);

  const material = new THREE.MeshStandardMaterial({
    color: new THREE.Color(colour?.hex ?? '#b8b0a8'),
    roughness: fabric?.roughness ?? 0.9,
    metalness: fabric?.metalness ?? 0.0,
    envMapIntensity: 0.4,
  });

  if (colour) {
    const normalScale = fabric?.normalScale ?? 1.0;

    // Diffuse map
    if (colour.texturePath) {
      const cachedDiffuse = textureCache.get(colour.texturePath);
      if (cachedDiffuse) {
        material.map = cachedDiffuse;
      } else {
        loadTextureCached(colour.texturePath).then((map) => {
          material.map = map;
          material.needsUpdate = true;
        }).catch(() => {});
      }
    }

    // Normal map (only if path exists)
    if (colour.normalMapPath) {
      const cachedNormal = textureCache.get(colour.normalMapPath);
      if (cachedNormal) {
        material.normalMap = cachedNormal;
        material.normalScale.set(normalScale, normalScale);
      } else {
        loadTextureCached(colour.normalMapPath, true).then((normalMap) => {
          material.normalMap = normalMap;
          material.normalScale.set(normalScale, normalScale);
          material.needsUpdate = true;
        }).catch(() => {});
      }
    }
  }

  cordMaterialCache.set(key, material);
  return material;
}

/**
 * Pre-load all textures for a given material selection and resolve once they are
 * in the cache. Call before `buildExportScene` to guarantee materials are fully
 * textured when the scene is built synchronously.
 */
export async function ensureTexturesLoaded(
  selection: MaterialSelection
): Promise<void> {
  const catalogFabric = _catalogFabrics.find((f) => f.id === selection.fabricId);
  const fabric = catalogFabric ?? FABRICS[selection.fabricId];
  const colour = fabric?.colours.find((c) => c.id === selection.colourId);
  if (!colour) return;

  const loads: Promise<any>[] = [];
  if (colour.texturePath) loads.push(loadTextureCached(colour.texturePath));
  if (colour.normalMapPath) loads.push(loadTextureCached(colour.normalMapPath, true));
  if (loads.length > 0) await Promise.all(loads);
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
