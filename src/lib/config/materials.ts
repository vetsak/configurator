import type { FabricDefinition } from '@/types/materials';

export const FABRICS: Record<string, FabricDefinition> = {
  cord_velour: {
    id: 'cord_velour',
    name: 'Cord Velours',
    description: 'Soft corduroy fabric with fine ribbing',
    roughness: 0.9,
    metalness: 0.0,
    normalScale: 1.0,
    colours: [
      {
        id: 'platinum',
        name: 'Platinum',
        hex: '#b8b0a8',
        texturePath: '/textures/shopify/cord_velour-platinum.jpg',
        normalMapPath: '/textures/cord/platinum/normal.webp',
        swatchPath: '/textures/cord/platinum/swatch.webp',
      },
      {
        id: 'sand',
        name: 'Sand',
        hex: '#c4b498',
        texturePath: '/textures/shopify/cord_velour-sand.jpg',
        normalMapPath: '',
        swatchPath: '',
      },
      {
        id: 'forest',
        name: 'Forest',
        hex: '#4a5e4a',
        texturePath: '',
        normalMapPath: '',
        swatchPath: '',
      },
      {
        id: 'navy',
        name: 'Navy',
        hex: '#2c3e5a',
        texturePath: '',
        normalMapPath: '',
        swatchPath: '',
      },
    ],
  },
};

export const DEFAULT_MATERIAL = {
  fabricId: 'cord_velour',
  colourId: 'platinum',
};

/**
 * Resolves a fabric definition from the Shopify catalog first,
 * then falls back to the hardcoded FABRICS.
 */
export function getFabricById(
  fabricId: string,
  catalog?: FabricDefinition[]
): FabricDefinition | undefined {
  if (catalog?.length) {
    const fromCatalog = catalog.find((f) => f.id === fabricId);
    if (fromCatalog) return fromCatalog;
  }
  return FABRICS[fabricId];
}

export function getFabric(fabricId: string): FabricDefinition | undefined {
  return FABRICS[fabricId];
}

export function getColour(fabricId: string, colourId: string) {
  const fabric = FABRICS[fabricId];
  return fabric?.colours.find((c) => c.id === colourId);
}

/**
 * Returns all available fabrics — prefers catalog, falls back to hardcoded.
 */
export function getAllFabrics(catalog?: FabricDefinition[]): FabricDefinition[] {
  if (catalog?.length) return catalog;
  return Object.values(FABRICS);
}
