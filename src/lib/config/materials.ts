import type { FabricDefinition } from '@/types/materials';

export const FABRICS: Record<string, FabricDefinition> = {
  cord: {
    id: 'cord',
    name: 'Cord',
    description: 'Soft corduroy fabric with fine ribbing',
    roughness: 0.9,
    metalness: 0.0,
    normalScale: 1.0,
    colours: [
      {
        id: 'platinum',
        name: 'Platinum',
        hex: '#b8b0a8',
        texturePath: '/textures/cord/platinum/diffuse.webp',
        normalMapPath: '/textures/cord/platinum/normal.webp',
        swatchPath: '/textures/cord/platinum/swatch.webp',
      },
      {
        id: 'sand',
        name: 'Sand',
        hex: '#c4b498',
        texturePath: '/textures/cord/sand/diffuse.webp',
        normalMapPath: '/textures/cord/sand/normal.webp',
        swatchPath: '/textures/cord/sand/swatch.webp',
      },
      {
        id: 'forest',
        name: 'Forest',
        hex: '#4a5e4a',
        texturePath: '/textures/cord/forest/diffuse.webp',
        normalMapPath: '/textures/cord/forest/normal.webp',
        swatchPath: '/textures/cord/forest/swatch.webp',
      },
      {
        id: 'navy',
        name: 'Navy',
        hex: '#2c3e5a',
        texturePath: '/textures/cord/navy/diffuse.webp',
        normalMapPath: '/textures/cord/navy/normal.webp',
        swatchPath: '/textures/cord/navy/swatch.webp',
      },
    ],
  },
};

export const DEFAULT_MATERIAL = {
  fabricId: 'cord',
  colourId: 'platinum',
};

export function getFabric(fabricId: string): FabricDefinition | undefined {
  return FABRICS[fabricId];
}

export function getColour(fabricId: string, colourId: string) {
  const fabric = FABRICS[fabricId];
  return fabric?.colours.find((c) => c.id === colourId);
}
