import type { StateCreator } from 'zustand';
import type { FabricDefinition, MaterialSelection } from '@/types/materials';
import catalogData from '@/lib/config/fabric-catalog.json';

// ── Build baked-in catalog at module load ──────────────────────

function loadBakedCatalog(): { fabrics: FabricDefinition[]; priceLookup: Map<string, number> } {
  const fabrics: FabricDefinition[] = catalogData.fabrics.map((f: any) => ({
    id: f.id,
    name: f.name,
    description: '',
    roughness: f.roughness,
    metalness: f.metalness,
    normalScale: f.normalScale,
    badge: f.badge ?? null,
    specs: f.specs ?? [],
    colours: f.colours.map((c: any) => ({
      id: c.id,
      name: c.name,
      hex: c.hex,
      texturePath: c.textureLocal ?? '',
      normalMapPath: '',
      swatchPath: c.swatchLocal ?? '',
      swatchUrl: c.swatchUrl ?? c.swatchLocal ?? null,
      textureLocal: c.textureLocal ?? null,
      textureUrl: c.textureUrl ?? null,
      shopifyProductId: c.shopifyProductId,
      shopifyVariantId: c.shopifyVariantId,
    })),
  }));

  const priceLookup = new Map<string, number>();
  for (const entry of catalogData.prices) {
    priceLookup.set(entry.key, entry.price);
  }

  return { fabrics, priceLookup };
}

const baked = loadBakedCatalog();

// ── Slice ──────────────────────────────────────────────────────

export interface MaterialSlice {
  selectedMaterial: MaterialSelection;
  fabricCatalog: FabricDefinition[];
  priceLookup: Map<string, number>;
  catalogLoading: boolean;
  catalogError: string | null;
  setMaterial: (material: MaterialSelection) => void;
  setFabricCatalog: (fabrics: FabricDefinition[]) => void;
  setPriceLookup: (lookup: Map<string, number>) => void;
  loadCatalog: () => Promise<void>;
}

export const createMaterialSlice: StateCreator<MaterialSlice, [], [], MaterialSlice> = (set) => ({
  selectedMaterial: {
    fabricId: 'cord_velour',
    colourId: 'platinum',
  },
  fabricCatalog: baked.fabrics,
  priceLookup: baked.priceLookup,
  catalogLoading: false,
  catalogError: null,

  setMaterial: (material) => set({ selectedMaterial: material }),

  setFabricCatalog: (fabrics) => set({ fabricCatalog: fabrics }),

  setPriceLookup: (lookup) => set({ priceLookup: lookup }),

  // No-op — catalog is baked in at build time
  loadCatalog: async () => {},
});
