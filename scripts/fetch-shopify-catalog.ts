/**
 * Build-time script: fetches fabric/color catalog from Shopify Admin API.
 * Only includes fabrics/colors that have ACTIVE module products
 * (Sofa Seat XS-XL, Sofa Side S-L).
 * Also fetches material spec notes and HQ texture images.
 *
 * Usage: pnpm tsx scripts/fetch-shopify-catalog.ts
 */

import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { resolve } from 'path';

const SHOPIFY_DOMAIN = 'de-vetsak.myshopify.com';
const API_VERSION = '2024-01';
const TOKEN = process.env.SHOPIFY_ADMIN_TOKEN ?? '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';
const CATALOG_PATH = resolve(__dirname, '../src/lib/config/fabric-catalog.json');
const SWATCH_DIR = resolve(__dirname, '../public/images/swatches');
const TEXTURE_DIR = resolve(__dirname, '../public/textures/shopify');
const MODULE_IMG_DIR = resolve(__dirname, '../public/images/modules');
const ACCESSORY_IMG_DIR = resolve(__dirname, '../public/images/accessories');

const MODULE_SEARCHES = [
  'Sofa Seat XLarge', 'Sofa Seat Large', 'Sofa Seat Medium',
  'Sofa Seat Small', 'Sofa Seat XSmall',
  'Sofa Side Large', 'Sofa Side Medium', 'Sofa Side Small',
];

const ACCESSORY_SEARCHES = [
  'Noodle', 'Pillow', 'Big Pillow', 'Jumbo Pillow',
  'Lounge Pillow', 'Footsak', 'Blanket',
];

// Map Shopify product title patterns → local slug (for image filenames)
const TITLE_TO_MODULE_SLUG: Record<string, string> = {
  'sofa seat xlarge': 'seat-xl',
  'sofa seat large': 'seat-l',
  'sofa seat medium': 'seat-m',
  'sofa seat small': 'seat-s',
  'sofa seat xsmall': 'seat-xs',
  'sofa side large': 'side-l',
  'sofa side medium': 'side-m',
  'sofa side small': 'side-s',
};

// Accessory title patterns → slug. Order matters: longer matches first.
const TITLE_TO_ACCESSORY_SLUG: Record<string, string> = {
  'lounge pillow': 'lounge-pillow',
  'jumbo pillow': 'jumbo-pillow',
  'big pillow': 'big-pillow',
  'pillow': 'pillow',
  'noodle': 'noodle',
  'footsak': 'footsak',
  'blanket': 'blanket',
};

function getModuleSlug(title: string): string | null {
  const lower = title.toLowerCase();
  for (const [pattern, slug] of Object.entries(TITLE_TO_MODULE_SLUG)) {
    if (lower.includes(pattern) && !lower.includes('cover')) return slug;
  }
  return null;
}

function getAccessorySlug(title: string): string | null {
  const lower = title.toLowerCase();
  // Skip covers
  if (lower.includes('cover')) return null;
  for (const [pattern, slug] of Object.entries(TITLE_TO_ACCESSORY_SLUG)) {
    if (lower.includes(pattern)) return slug;
  }
  return null;
}

// ── API helper ─────────────────────────────────────────────────

async function gql<T>(query: string, variables: Record<string, unknown> = {}): Promise<T> {
  const res = await fetch(
    `https://${SHOPIFY_DOMAIN}/admin/api/${API_VERSION}/graphql.json`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Shopify-Access-Token': TOKEN },
      body: JSON.stringify({ query, variables }),
    }
  );
  if (!res.ok) throw new Error(`API ${res.status}`);
  const json = await res.json() as { data: T; errors?: Array<{ message: string }> };
  if (json.errors?.length) throw new Error(json.errors[0].message);
  return json.data;
}

// ── Queries ────────────────────────────────────────────────────

const COLORS_QUERY = `
  query Colors($cursor: String) {
    metaobjects(type: "color", first: 100, after: $cursor) {
      pageInfo { hasNextPage endCursor }
      edges {
        node {
          handle
          fields {
            key value
            reference { ... on MediaImage { image { url width height } } }
            references(first: 10) {
              edges {
                node {
                  ... on Metaobject { handle type }
                  ... on MediaImage { image { url width height } }
                }
              }
            }
          }
        }
      }
    }
  }
`;

const MATERIALS_QUERY = `
  query Materials {
    metaobjects(type: "material", first: 50) {
      edges { node { handle fields { key value } } }
    }
  }
`;

const MODULE_PRODUCTS_QUERY = `
  query ModuleProducts($query: String!, $cursor: String) {
    products(first: 50, after: $cursor, query: $query) {
      pageInfo { hasNextPage endCursor }
      edges {
        node {
          id title tags productType status
          priceRangeV2 { minVariantPrice { amount currencyCode } }
          variants(first: 20) {
            edges { node { id title price selectedOptions { name value } } }
          }
          images(first: 1) {
            edges { node { url width height } }
          }
        }
      }
    }
  }
`;

// ── Lookups ────────────────────────────────────────────────────

const COLOR_HEX: Record<string, string> = {
  platinum: '#b8b0a8', sand: '#c4b498', forest: '#4a5e4a', navy: '#2c3e5a',
  stone: '#a09890', beige: '#d4c4a8', caramel: '#a0704a', creme: '#f0e8d8',
  dark_grey: '#4a4a4a', light_grey: '#c0c0c0', grey: '#808080', anthracite: '#383838',
  brown: '#6b4226', duck_egg: '#8ab8b0', dune: '#c8b898', khaki: '#8a8860',
  mint: '#a0d8c0', olive: '#6b7040', mocha: '#785040', peach: '#f0c0a0',
  moss: '#6b7850', ivory: '#f5f0e0', cedar: '#8b6040', clay: '#b87850',
  espresso: '#3a2010', orange_blaze: '#e06020', pearl: '#e8dcd0', pine: '#2a5030',
  duna: '#c8a878', mousse: '#c8b8a0', taupe: '#a09080', dark_blue: '#1a2848',
  light_blue: '#7090b0', cacao: '#5a3828', bounty: '#a08858', gem: '#4a3040',
  raven: '#2a2a2a',
};

const FABRIC_DEFAULTS: Record<string, { name: string; roughness: number; metalness: number; normalScale: number }> = {
  cord_velour: { name: 'Cord Velour', roughness: 0.9, metalness: 0.0, normalScale: 1.0 },
  velvet: { name: 'Velvet', roughness: 0.6, metalness: 0.0, normalScale: 0.9 },
  leather: { name: 'Leather', roughness: 0.5, metalness: 0.05, normalScale: 0.6 },
  canvas: { name: 'Canvas', roughness: 0.75, metalness: 0.0, normalScale: 0.8 },
  linen: { name: 'Linen', roughness: 0.8, metalness: 0.0, normalScale: 0.7 },
  knit: { name: 'Knit', roughness: 0.85, metalness: 0.0, normalScale: 0.9 },
  faux_fur: { name: 'Faux Fur', roughness: 0.95, metalness: 0.0, normalScale: 1.1 },
  flokati: { name: 'Flokati', roughness: 0.95, metalness: 0.0, normalScale: 1.0 },
  suave: { name: 'Suave', roughness: 0.7, metalness: 0.0, normalScale: 0.8 },
  loop_loop: { name: 'Loop Loop', roughness: 0.85, metalness: 0.0, normalScale: 0.9 },
  doodle: { name: 'Doodle', roughness: 0.8, metalness: 0.0, normalScale: 0.7 },
  herringbone: { name: 'Herringbone', roughness: 0.8, metalness: 0.0, normalScale: 0.85 },
  pique: { name: 'Piqué', roughness: 0.75, metalness: 0.0, normalScale: 0.8 },
  aspesi: { name: 'Aspesi', roughness: 0.8, metalness: 0.0, normalScale: 1.0 },
};

function formatName(slug: string): string {
  return slug.split(/[_-]/).map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

async function downloadFile(url: string, dir: string, filename: string): Promise<boolean> {
  const path = resolve(dir, filename);
  if (existsSync(path)) return true;
  try {
    const res = await fetch(url);
    if (!res.ok) return false;
    writeFileSync(path, Buffer.from(await res.arrayBuffer()));
    return true;
  } catch { return false; }
}

// ── Types ──────────────────────────────────────────────────────

interface SpecEntry { label: string; value: string }

interface CatalogColour {
  id: string;
  name: string;
  hex: string;
  swatchUrl: string;
  swatchLocal: string;
  /** HQ close-up texture image (2800x2000+) */
  textureUrl: string | null;
  textureLocal: string | null;
  shopifyProductId: string | null;
  shopifyVariantId: string | null;
}

interface CatalogFabric {
  id: string;
  name: string;
  category: 'indoor' | 'outdoor';
  roughness: number;
  metalness: number;
  normalScale: number;
  /** Special note e.g. "Waterproof" */
  badge: string | null;
  /** Specification table from metaobject notes */
  specs: SpecEntry[];
  colours: CatalogColour[];
}

// ── Main ────────────────────────────────────────────────────────

async function main() {
  mkdirSync(SWATCH_DIR, { recursive: true });
  mkdirSync(TEXTURE_DIR, { recursive: true });

  // 1. Fetch active module products
  console.log('Fetching active module products...');
  const activeCombos = new Set<string>();
  const activeFabrics = new Set<string>();
  const productIdMap = new Map<string, { productId: string; variantId: string | null }>();
  // module-slug + fabric-colour → product image URL (for module thumbnails)
  const moduleImageMap = new Map<string, string>();
  const priceEntries: Array<{ key: string; price: number }> = [];
  let totalProducts = 0;

  for (const search of MODULE_SEARCHES) {
    const q = `${search} status:active product_type:Sofa`;
    let cursor: string | null = null;
    while (true) {
      const data = await gql<any>(MODULE_PRODUCTS_QUERY, { query: q, cursor });
      for (const { node: product } of data.products.edges) {
        if (!product.title.toLowerCase().includes(search.toLowerCase())) continue;
        totalProducts++;
        const fabricTag = product.tags.find((t: string) => t.startsWith('fabric_'));
        const colorTag = product.tags.find((t: string) => t.startsWith('color_') && !t.startsWith('color_group_'));
        if (!fabricTag || !colorTag) continue;
        const fabricId = fabricTag.replace('fabric_', '');
        const colorId = colorTag.replace('color_', '');
        const combo = `${fabricId}-${colorId}`;
        activeCombos.add(combo);
        activeFabrics.add(fabricId);
        if (!productIdMap.has(combo)) {
          productIdMap.set(combo, { productId: product.id, variantId: product.variants.edges[0]?.node.id ?? null });
        }
        const basePrice = parseFloat(product.priceRangeV2.minVariantPrice.amount);
        if (!isNaN(basePrice)) priceEntries.push({ key: combo, price: basePrice });
        for (const { node: v } of product.variants.edges) {
          const sizeOpt = v.selectedOptions.find((o: any) => o.name.toLowerCase() === 'size' || o.name.toLowerCase() === 'module');
          if (sizeOpt) priceEntries.push({ key: `${combo}-${sizeOpt.value.toLowerCase().replace(/\s+/g, '-')}`, price: parseFloat(v.price) });
        }
        // Collect product image for module thumbnails
        const moduleSlug = getModuleSlug(product.title);
        const imgUrl = product.images?.edges?.[0]?.node?.url;
        if (moduleSlug && imgUrl) {
          const imgKey = `${moduleSlug}-${fabricId}-${colorId}`;
          if (!moduleImageMap.has(imgKey)) {
            moduleImageMap.set(imgKey, imgUrl);
          }
        }
      }
      if (!data.products.pageInfo.hasNextPage) break;
      cursor = data.products.pageInfo.endCursor;
    }
  }
  console.log(`  ${totalProducts} products, ${activeFabrics.size} fabrics, ${activeCombos.size} combos`);

  // 2. Fetch Material metaobjects (with notes for specs)
  console.log('Fetching Material metaobjects...');
  const matData = await gql<any>(MATERIALS_QUERY);
  const materials = new Map<string, {
    title: string; tag: string; indoor: boolean; outdoor: boolean;
    badge: string | null; specs: SpecEntry[];
  }>();
  for (const { node } of matData.metaobjects.edges) {
    const fields = Object.fromEntries(node.fields.map((f: any) => [f.key, f.value]));
    // Parse notes pairs: [label, value, label, value, ...]
    const specs: SpecEntry[] = [];
    if (fields.notes) {
      try {
        const items: string[] = JSON.parse(fields.notes);
        for (let i = 0; i < items.length - 1; i += 2) {
          specs.push({ label: items[i], value: items[i + 1] });
        }
      } catch {}
    }
    materials.set(node.handle, {
      title: fields.title ?? formatName(node.handle),
      tag: fields.tag ?? `fabric_${node.handle}`,
      indoor: fields.indoor === 'true',
      outdoor: fields.outdoor === 'true',
      badge: fields.note || null,
      specs,
    });
  }

  // 3. Fetch Color metaobjects (swatch + HQ images)
  console.log('Fetching Color metaobjects...');
  const colorNodes: any[] = [];
  let cursor: string | null = null;
  while (true) {
    const data = await gql<any>(COLORS_QUERY, { cursor });
    for (const { node } of data.metaobjects.edges) colorNodes.push(node);
    if (!data.metaobjects.pageInfo.hasNextPage) break;
    cursor = data.metaobjects.pageInfo.endCursor;
  }
  console.log(`  ${colorNodes.length} color metaobjects`);

  // 4. Build fabric catalog
  const fabricMap = new Map<string, CatalogFabric>();

  for (const colorNode of colorNodes) {
    const fields: Record<string, any> = {};
    for (const f of colorNode.fields) fields[f.key] = f;

    const title = fields.title?.value ?? '';
    const tag = fields.tag?.value ?? '';
    const colorSlug = tag.replace('color_', '');
    const swatchUrl = fields.image?.reference?.image?.url ?? null;

    // HQ texture: large_image or first from images list
    let textureUrl: string | null = null;
    const largeRef = fields.large_image?.reference;
    if (largeRef?.image?.url) {
      textureUrl = largeRef.image.url;
    } else if (fields.images?.references?.edges) {
      for (const ref of fields.images.references.edges) {
        if (ref.node?.image?.url && ref.node.image.width >= 1000) {
          textureUrl = ref.node.image.url;
          break;
        }
      }
    }

    const materialHandles: string[] = [];
    if (fields.materials?.references?.edges) {
      for (const ref of fields.materials.references.edges) {
        materialHandles.push(ref.node.handle);
      }
    }

    for (const matHandle of materialHandles) {
      const mat = materials.get(matHandle);
      const fabricTag = mat?.tag ?? `fabric_${matHandle}`;
      const fabricId = fabricTag.replace('fabric_', '');
      const combo = `${fabricId}-${colorSlug}`;
      if (!activeCombos.has(combo)) continue;
      if (!swatchUrl) continue;

      const defaults = FABRIC_DEFAULTS[fabricId];
      if (!fabricMap.has(fabricId)) {
        fabricMap.set(fabricId, {
          id: fabricId,
          name: mat?.title ?? defaults?.name ?? formatName(fabricId),
          category: mat?.outdoor ? 'outdoor' : 'indoor',
          roughness: defaults?.roughness ?? 0.8,
          metalness: defaults?.metalness ?? 0.0,
          normalScale: defaults?.normalScale ?? 1.0,
          badge: mat?.badge ?? null,
          specs: mat?.specs ?? [],
          colours: [],
        });
      }

      const fabric = fabricMap.get(fabricId)!;
      if (fabric.colours.some((c) => c.id === colorSlug)) continue;

      const swatchExt = swatchUrl.includes('.png') ? 'png' : 'jpg';
      const swatchFilename = `${fabricId}-${colorSlug}.${swatchExt}`;
      const productIds = productIdMap.get(combo);

      let textureLocal: string | null = null;
      if (textureUrl) {
        const texExt = textureUrl.includes('.png') ? 'png' : textureUrl.includes('.webp') ? 'webp' : 'jpg';
        textureLocal = `/textures/shopify/${fabricId}-${colorSlug}.${texExt}`;
      }

      fabric.colours.push({
        id: colorSlug,
        name: title || formatName(colorSlug),
        hex: COLOR_HEX[colorSlug] ?? '#b8b0a8',
        swatchUrl,
        swatchLocal: `/images/swatches/${swatchFilename}`,
        textureUrl,
        textureLocal,
        shopifyProductId: productIds?.productId ?? null,
        shopifyVariantId: productIds?.variantId ?? null,
      });
    }
  }

  // Sort
  const fabrics = Array.from(fabricMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  for (const f of fabrics) f.colours.sort((a, b) => a.name.localeCompare(b.name));

  // Dedup prices
  const seen = new Set<string>();
  const prices = priceEntries.filter((p) => { if (seen.has(p.key)) return false; seen.add(p.key); return true; });

  const totalColours = fabrics.reduce((n, f) => n + f.colours.length, 0);
  const withTextures = fabrics.reduce((n, f) => n + f.colours.filter((c) => c.textureUrl).length, 0);
  console.log(`\nCatalog: ${fabrics.length} fabrics, ${totalColours} colours (${withTextures} with HQ textures), ${prices.length} prices`);

  // 5. Download swatches
  console.log('Downloading swatches...');
  let swatchOk = 0, swatchFail = 0;
  for (const fabric of fabrics) {
    for (const colour of fabric.colours) {
      const filename = colour.swatchLocal.replace('/images/swatches/', '');
      const ok = await downloadFile(colour.swatchUrl, SWATCH_DIR, filename);
      if (ok) { swatchOk++; }
      else {
        const altExt = filename.endsWith('.png') ? '.jpg' : '.png';
        const altFilename = filename.replace(/\.\w+$/, altExt);
        const ok2 = await downloadFile(colour.swatchUrl, SWATCH_DIR, altFilename);
        if (ok2) { colour.swatchLocal = `/images/swatches/${altFilename}`; swatchOk++; }
        else { swatchFail++; console.log(`  FAIL swatch: ${filename}`); }
      }
    }
  }
  console.log(`  Swatches: ${swatchOk} ok, ${swatchFail} failed`);

  // 6. Download HQ textures
  console.log('Downloading HQ textures...');
  let texOk = 0, texFail = 0, texSkip = 0;
  for (const fabric of fabrics) {
    for (const colour of fabric.colours) {
      if (!colour.textureUrl || !colour.textureLocal) { texSkip++; continue; }
      const filename = colour.textureLocal.replace('/textures/shopify/', '');
      const ok = await downloadFile(colour.textureUrl, TEXTURE_DIR, filename);
      if (ok) texOk++;
      else { texFail++; console.log(`  FAIL texture: ${filename}`); }
    }
  }
  console.log(`  Textures: ${texOk} ok, ${texFail} failed, ${texSkip} skipped (no HQ available)`);

  // 7. Download module product images (resized to 200px wide via Shopify CDN)
  console.log('Downloading module product images...');
  let imgOk = 0, imgFail = 0;
  for (const [key, rawUrl] of moduleImageMap) {
    const resizedUrl = rawUrl.replace(/(\.\w+)(\?|$)/, '_200x$1$2');
    const filename = `${key}.jpg`;
    const ok = await downloadFile(resizedUrl, MODULE_IMG_DIR, filename);
    if (ok) imgOk++;
    else { imgFail++; console.log(`  FAIL module image: ${filename}`); }
  }
  console.log(`  Module images: ${imgOk} ok, ${imgFail} failed (${moduleImageMap.size} total)`);

  // 8. Fetch & download accessory product images
  console.log('Fetching accessory products...');
  mkdirSync(ACCESSORY_IMG_DIR, { recursive: true });
  const accessoryImageMap = new Map<string, string>();

  for (const search of ACCESSORY_SEARCHES) {
    const q = `${search} status:active product_type:Accessories`;
    let accCursor: string | null = null;
    while (true) {
      const data = await gql<any>(MODULE_PRODUCTS_QUERY, { query: q, cursor: accCursor });
      for (const { node: product } of data.products.edges) {
        const slug = getAccessorySlug(product.title);
        if (!slug) continue;
        const fabricTag = product.tags.find((t: string) => t.startsWith('fabric_'));
        const colorTag = product.tags.find((t: string) => t.startsWith('color_') && !t.startsWith('color_group_'));
        if (!fabricTag || !colorTag) continue;
        const fabricId = fabricTag.replace('fabric_', '');
        const colorId = colorTag.replace('color_', '');
        const imgUrl = product.images?.edges?.[0]?.node?.url;
        if (!imgUrl) continue;
        const imgKey = `${slug}-${fabricId}-${colorId}`;
        if (!accessoryImageMap.has(imgKey)) {
          accessoryImageMap.set(imgKey, imgUrl);
        }
      }
      if (!data.products.pageInfo.hasNextPage) break;
      accCursor = data.products.pageInfo.endCursor;
    }
  }

  console.log(`Downloading ${accessoryImageMap.size} accessory images...`);
  let accOk = 0, accFail = 0;
  for (const [key, rawUrl] of accessoryImageMap) {
    const resizedUrl = rawUrl.replace(/(\.\w+)(\?|$)/, '_200x$1$2');
    const filename = `${key}.jpg`;
    const ok = await downloadFile(resizedUrl, ACCESSORY_IMG_DIR, filename);
    if (ok) accOk++;
    else { accFail++; console.log(`  FAIL accessory image: ${filename}`); }
  }
  console.log(`  Accessory images: ${accOk} ok, ${accFail} failed`);

  // 9. Write catalog
  writeFileSync(CATALOG_PATH, JSON.stringify({ fabrics, prices }, null, 2));
  console.log(`\nWritten to ${CATALOG_PATH}`);
}

main().catch((err) => { console.error('Failed:', err); process.exit(1); });
