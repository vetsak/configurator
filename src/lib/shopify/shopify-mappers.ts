import type { FabricDefinition, ColourVariant } from '@/types/materials';

// ── Shopify response types ─────────────────────────────────────
interface ShopifyImage {
  url: string;
  altText: string | null;
  width: number;
  height: number;
}

interface ShopifyVariant {
  id: string;
  title: string;
  price: { amount: string; currencyCode: string };
  selectedOptions: Array<{ name: string; value: string }>;
}

interface ShopifyMetafield {
  key: string;
  value: string;
  namespace: string;
}

export interface ShopifyProduct {
  id: string;
  title: string;
  handle: string;
  tags: string[];
  productType: string;
  description: string;
  priceRange: { minVariantPrice: { amount: string; currencyCode: string } };
  variants: { edges: Array<{ node: ShopifyVariant }> };
  images: { edges: Array<{ node: ShopifyImage }> };
  metafields: (ShopifyMetafield | null)[];
}

export interface ShopifyProductsResponse {
  products: {
    pageInfo: { hasNextPage: boolean; endCursor: string | null };
    edges: Array<{ node: ShopifyProduct }>;
  };
}

export interface ShopifyCollectionResponse {
  collectionByHandle: {
    title: string;
    products: {
      pageInfo: { hasNextPage: boolean; endCursor: string | null };
      edges: Array<{ node: ShopifyProduct }>;
    };
  };
}

// ── Tag parsing helpers ────────────────────────────────────────

/** Known fabric type slugs from Shopify tags (e.g. "fabric_cord_velour") */
const FABRIC_SLUGS: Record<string, { name: string; roughness: number; metalness: number; normalScale: number }> = {
  cord_velour: { name: 'Cord Velour', roughness: 0.9, metalness: 0.0, normalScale: 1.0 },
  suave: { name: 'Suave', roughness: 0.7, metalness: 0.0, normalScale: 0.8 },
  loop_loop: { name: 'Loop Loop', roughness: 0.85, metalness: 0.0, normalScale: 0.9 },
  doodle: { name: 'Doodle', roughness: 0.8, metalness: 0.0, normalScale: 0.7 },
  leather: { name: 'Leather', roughness: 0.5, metalness: 0.05, normalScale: 0.6 },
  cord_velour_outdoor: { name: 'Cord Velour Outdoor', roughness: 0.9, metalness: 0.0, normalScale: 1.0 },
  loop_loop_outdoor: { name: 'Loop Loop Outdoor', roughness: 0.85, metalness: 0.0, normalScale: 0.9 },
  teddy: { name: 'Teddy', roughness: 0.95, metalness: 0.0, normalScale: 1.1 },
  canvas: { name: 'Canvas', roughness: 0.75, metalness: 0.0, normalScale: 0.8 },
  linen: { name: 'Linen', roughness: 0.8, metalness: 0.0, normalScale: 0.7 },
  velvet: { name: 'Velvet', roughness: 0.6, metalness: 0.0, normalScale: 0.9 },
  woven: { name: 'Woven', roughness: 0.85, metalness: 0.0, normalScale: 0.85 },
};

function parseFabricTag(tags: string[]): string | null {
  for (const tag of tags) {
    const lower = tag.toLowerCase();
    if (lower.startsWith('fabric_')) {
      return lower.replace('fabric_', '');
    }
  }
  return null;
}

function parseColorTag(tags: string[]): string | null {
  for (const tag of tags) {
    const lower = tag.toLowerCase();
    if (lower.startsWith('color_')) {
      return lower.replace('color_', '');
    }
  }
  return null;
}

function parseModuleSizeTag(tags: string[]): string | null {
  for (const tag of tags) {
    const lower = tag.toLowerCase();
    if (lower.startsWith('module_')) {
      return lower.replace('module_', '');
    }
  }
  return null;
}

function getMetafieldValue(product: ShopifyProduct, key: string): string | null {
  const mf = product.metafields?.find((m) => m?.key === key);
  return mf?.value ?? null;
}

// ── Main mapper ─────────────────────────────────────────────────

export interface MappedCatalog {
  fabrics: FabricDefinition[];
  priceLookup: Map<string, number>;
}

/**
 * Maps an array of Shopify products into FabricDefinitions and a price lookup.
 * Groups products by fabric type, extracts colors as ColourVariants.
 */
export function mapProductsToFabricCatalog(products: ShopifyProduct[]): MappedCatalog {
  const fabricMap = new Map<string, FabricDefinition>();
  const priceLookup = new Map<string, number>();

  for (const product of products) {
    const fabricSlug = getMetafieldValue(product, 'fabric_type') ?? parseFabricTag(product.tags);
    if (!fabricSlug) continue;

    const colorSlug = getMetafieldValue(product, 'color_name') ?? parseColorTag(product.tags);
    if (!colorSlug) continue;

    const fabricMeta = FABRIC_SLUGS[fabricSlug];
    const fabricId = fabricSlug;

    // Get or create fabric definition
    if (!fabricMap.has(fabricId)) {
      fabricMap.set(fabricId, {
        id: fabricId,
        name: fabricMeta?.name ?? fabricSlug.replace(/_/g, ' '),
        description: product.description || '',
        roughness: fabricMeta?.roughness ?? 0.8,
        metalness: fabricMeta?.metalness ?? 0.0,
        normalScale: fabricMeta?.normalScale ?? 1.0,
        textureUrl: null,
        colours: [],
      });
    }

    const fabric = fabricMap.get(fabricId)!;

    // Skip duplicate colors
    if (fabric.colours.some((c) => c.id === colorSlug)) continue;

    // Extract swatch image: metafield > first product image
    const swatchUrl =
      getMetafieldValue(product, 'swatch_image') ??
      product.images.edges[0]?.node.url ??
      '';

    // Extract hex from first image alt text or use a neutral default
    const hex = extractHexFromTitle(product.title) ?? '#b8b0a8';

    const colourVariant: ColourVariant = {
      id: colorSlug,
      name: formatColorName(colorSlug),
      hex,
      texturePath: '',
      normalMapPath: '',
      swatchPath: '',
      swatchUrl: swatchUrl,
      shopifyProductId: product.id,
      shopifyVariantId: product.variants.edges[0]?.node.id ?? null,
    };

    fabric.colours.push(colourVariant);

    // Build price lookup entries per variant (fabric-color-moduleSize)
    for (const { node: variant } of product.variants.edges) {
      const sizeOption = variant.selectedOptions.find(
        (o) => o.name.toLowerCase() === 'size' || o.name.toLowerCase() === 'module'
      );
      const moduleSize = sizeOption?.value?.toLowerCase() ?? getMetafieldValue(product, 'module_size') ?? parseModuleSizeTag(product.tags) ?? 'default';
      const priceKey = `${fabricId}-${colorSlug}-${moduleSize}`;
      priceLookup.set(priceKey, parseFloat(variant.price.amount));
    }

    // Also set a base price for fabric-color (without module size)
    const basePrice = parseFloat(product.priceRange.minVariantPrice.amount);
    if (!isNaN(basePrice)) {
      priceLookup.set(`${fabricId}-${colorSlug}`, basePrice);
    }
  }

  return {
    fabrics: Array.from(fabricMap.values()),
    priceLookup,
  };
}

function formatColorName(slug: string): string {
  return slug
    .split(/[_-]/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function extractHexFromTitle(_title: string): string | null {
  // Could parse hex from title patterns like "... #A1B2C3" — for now return null
  return null;
}
