/**
 * Dummy data for the UI shell.
 * This file centralises all placeholder content so it's easy to swap
 * with real Shopify / API data later.
 */

// ── Module thumbnails ─────────────────────────────────────────────
export const MODULE_IMAGES: Record<string, string> = {
  'seat-xl': '/images/modules/seat-xl.jpg',
  'seat-l': '/images/modules/seat-l.jpg',
  'seat-m': '/images/modules/seat-m.jpg',
  'seat-s': '/images/modules/seat-s.jpg',
  'seat-xs': '/images/modules/seat-xs.jpg',
  'side-l': '/images/modules/side-l.jpg',
  'side-m': '/images/modules/side-m.jpg',
  'side-s': '/images/modules/side-s.jpg',
};

export const MODULE_DISPLAY_NAMES: Record<string, string> = {
  'seat-xl': 'sofa seat\nxlarge',
  'seat-l': 'sofa seat\nlarge',
  'seat-m': 'sofa seat\nmedium',
  'seat-s': 'sofa seat\nsmall',
  'seat-xs': 'sofa seat\nxsmall',
  'side-l': 'sofa side\nlarge',
  'side-m': 'sofa side\nmedium',
  'side-s': 'sofa side\nsmall',
};

// ── Size options ───────────────────────────────────────────────────
export interface SizeOption {
  id: string;
  label: string;
  widthCm: number;
}

export const DEPTH_OPTIONS: SizeOption[] = [
  { id: 'depth-63', label: '63cm', widthCm: 63 },
  { id: 'depth-84', label: '84cm', widthCm: 84 },
  { id: 'depth-105', label: '105cm', widthCm: 105 },
];

// ── Fabric tag filters ────────────────────────────────────────────
export const FABRIC_TAGS = [
  { id: 'all', label: 'All materials' },
  { id: 'indoor', label: 'Indoor materials' },
  { id: 'outdoor', label: 'Outdoor materials' },
  { id: 'cord', label: 'cord velour' },
  { id: 'suave', label: 'suave' },
  { id: 'loop', label: 'loop loop' },
  { id: 'doodle', label: 'doodle' },
  { id: 'leather', label: 'leather' },
];

// ── Color swatches ────────────────────────────────────────────────
export interface SwatchItem {
  id: string;
  name: string;
  image: string;
}

export const COLOR_SWATCHES: SwatchItem[] = Array.from({ length: 19 }, (_, i) => ({
  id: `swatch-${String(i + 1).padStart(2, '0')}`,
  name: `Color ${i + 1}`,
  image: `/images/swatches/swatch-${String(i + 1).padStart(2, '0')}.jpg`,
}));

// ── Pillow sets (visual selector) ─────────────────────────────────
export interface PillowSet {
  id: string;
  name: string;
  description?: string;
  price: number;
  image: string;
  selected?: boolean;
}

export const PILLOW_SETS: PillowSet[] = [
  {
    id: 'pillow-set-1',
    name: 'Pillow set 1',
    description: '1 x Noodle, 1 x Big Pillow, 1 x Jumbo Pillow',
    price: 460,
    image: '/images/accessories/pillow-set-1.jpg',
    selected: true,
  },
  {
    id: 'lounge-pillow',
    name: 'Lounge Pillow',
    price: 380,
    image: '/images/accessories/lounge-pillow.jpg',
  },
  {
    id: 'blanket-ted',
    name: 'blanket \u2013 ted - woodland',
    price: 325,
    image: '/images/accessories/blanket-ted.jpg',
  },
];

// ── Accessories ────────────────────────────────────────────────────
export interface DummyAccessory {
  id: string;
  name: string;
  image: string;
}

export const DUMMY_ACCESSORIES: DummyAccessory[] = [
  { id: 'noodle', name: 'Noodle', image: '/images/accessories/noodle.jpg' },
  { id: 'pillow', name: 'Pillow', image: '/images/accessories/pillow.jpg' },
  { id: 'big-pillow', name: 'Big Pillow', image: '/images/accessories/big-pillow.jpg' },
  { id: 'jumbo-pillow', name: 'Jumbo Pillow', image: '/images/accessories/jumbo-pillow.jpg' },
  { id: 'lounge-pillow-acc', name: 'Lounge pillow', image: '/images/accessories/lounge-pillow.jpg' },
  { id: 'blanket', name: 'Blanket', image: '/images/accessories/blanket.jpg' },
  { id: 'footsak', name: 'Footsak', image: '/images/accessories/footsak.jpg' },
];
