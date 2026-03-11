export interface SpecEntry {
  label: string;
  value: string;
}

export interface ColourVariant {
  id: string;
  name: string;
  hex: string;
  texturePath: string;
  normalMapPath: string;
  swatchPath: string;
  /** Shopify CDN swatch image URL */
  swatchUrl?: string | null;
  /** Local HQ texture path (downloaded from Shopify) */
  textureLocal?: string | null;
  /** Shopify CDN HQ texture URL */
  textureUrl?: string | null;
  /** Shopify product GID */
  shopifyProductId?: string | null;
  /** Shopify variant GID (first/default variant) */
  shopifyVariantId?: string | null;
}

export interface FabricDefinition {
  id: string;
  name: string;
  description: string;
  roughness: number;
  metalness: number;
  normalScale: number;
  /** Special badge e.g. "Waterproof" */
  badge?: string | null;
  /** Specification table from Shopify metaobject notes */
  specs?: SpecEntry[];
  /** CDN URL for fabric texture (from Shopify) */
  textureUrl?: string | null;
  colours: ColourVariant[];
}

export interface ShopifyFabricCatalog {
  fabrics: FabricDefinition[];
  priceLookup: Map<string, number>;
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
