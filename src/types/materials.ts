export interface ColourVariant {
  id: string;
  name: string;
  hex: string;
  texturePath: string;
  normalMapPath: string;
  swatchPath: string;
}

export interface FabricDefinition {
  id: string;
  name: string;
  description: string;
  roughness: number;
  metalness: number;
  normalScale: number;
  colours: ColourVariant[];
}

export interface MaterialSelection {
  fabricId: string;
  colourId: string;
}

export type MaterialSlot = 'cord' | 'etikett' | 'legs';

export interface MaterialOverride {
  slot: MaterialSlot;
  color?: string;
  map?: string;
  normalMap?: string;
  roughness?: number;
  metalness?: number;
}
