import type { ModuleCatalog } from '@/types/modules';

/**
 * Module catalog with real dimensions from 3D models (in meters).
 * Anchor positions are at model edges for edge-to-edge snapping.
 * Seats have left/right/front/back anchors for 2D configurations.
 */
export const MODULE_CATALOG: ModuleCatalog = {
  // Seats — anchors at left/right/front/back edges
  'seat-xs': {
    id: 'seat-xs',
    type: 'seat',
    size: 'xs',
    name: 'Seat XS',
    sku: 'FETSAC-SEAT-XS',
    dimensions: { width: 0.84, depth: 0.63, height: 0.386 },
    modelPath: '/models/seat-xs.glb',
    anchorTemplate: [
      { id: 'left', position: [-0.42, 0, 0], direction: [-1, 0, 0], compatible: ['seat', 'side'], occupied: false },
      { id: 'right', position: [0.42, 0, 0], direction: [1, 0, 0], compatible: ['seat', 'side'], occupied: false },
      { id: 'front', position: [0, 0, 0.315], direction: [0, 0, 1], compatible: ['seat', 'side'], occupied: false },
      { id: 'back', position: [0, 0, -0.315], direction: [0, 0, -1], compatible: ['seat', 'side'], occupied: false },
    ],
    materialSlots: ['Cord', 'etikett', 'legs'],
    basePrice: 449,
  },
  'seat-s': {
    id: 'seat-s',
    type: 'seat',
    size: 's',
    name: 'Seat S',
    sku: 'FETSAC-SEAT-S',
    dimensions: { width: 1.05, depth: 0.63, height: 0.386 },
    modelPath: '/models/seat-s.glb',
    anchorTemplate: [
      { id: 'left', position: [-0.525, 0, 0], direction: [-1, 0, 0], compatible: ['seat', 'side'], occupied: false },
      { id: 'right', position: [0.525, 0, 0], direction: [1, 0, 0], compatible: ['seat', 'side'], occupied: false },
      { id: 'front', position: [0, 0, 0.315], direction: [0, 0, 1], compatible: ['seat', 'side'], occupied: false },
      { id: 'back', position: [0, 0, -0.315], direction: [0, 0, -1], compatible: ['seat', 'side'], occupied: false },
    ],
    materialSlots: ['Cord', 'etikett', 'legs'],
    basePrice: 499,
  },
  'seat-m': {
    id: 'seat-m',
    type: 'seat',
    size: 'm',
    name: 'Seat M',
    sku: 'FETSAC-SEAT-M',
    dimensions: { width: 0.84, depth: 0.84, height: 0.385 },
    modelPath: '/models/seat-m.glb',
    anchorTemplate: [
      { id: 'left', position: [-0.42, 0, 0], direction: [-1, 0, 0], compatible: ['seat', 'side'], occupied: false },
      { id: 'right', position: [0.42, 0, 0], direction: [1, 0, 0], compatible: ['seat', 'side'], occupied: false },
      { id: 'front', position: [0, 0, 0.42], direction: [0, 0, 1], compatible: ['seat', 'side'], occupied: false },
      { id: 'back', position: [0, 0, -0.42], direction: [0, 0, -1], compatible: ['seat', 'side'], occupied: false },
    ],
    materialSlots: ['Cord', 'etikett', 'legs'],
    basePrice: 549,
  },
  'seat-l': {
    id: 'seat-l',
    type: 'seat',
    size: 'l',
    name: 'Seat L',
    sku: 'FETSAC-SEAT-L',
    dimensions: { width: 1.05, depth: 0.84, height: 0.386 },
    modelPath: '/models/seat-l.glb',
    anchorTemplate: [
      { id: 'left', position: [-0.525, 0, 0], direction: [-1, 0, 0], compatible: ['seat', 'side'], occupied: false },
      { id: 'right', position: [0.525, 0, 0], direction: [1, 0, 0], compatible: ['seat', 'side'], occupied: false },
      { id: 'front', position: [0, 0, 0.42], direction: [0, 0, 1], compatible: ['seat', 'side'], occupied: false },
      { id: 'back', position: [0, 0, -0.42], direction: [0, 0, -1], compatible: ['seat', 'side'], occupied: false },
    ],
    materialSlots: ['Cord', 'etikett', 'legs'],
    basePrice: 599,
  },
  'seat-xl': {
    id: 'seat-xl',
    type: 'seat',
    size: 'xl',
    name: 'Seat XL',
    sku: 'FETSAC-SEAT-XL',
    dimensions: { width: 1.05, depth: 1.05, height: 0.386 },
    modelPath: '/models/seat-xl.glb',
    anchorTemplate: [
      { id: 'left', position: [-0.525, 0, 0], direction: [-1, 0, 0], compatible: ['seat', 'side'], occupied: false },
      { id: 'right', position: [0.525, 0, 0], direction: [1, 0, 0], compatible: ['seat', 'side'], occupied: false },
      { id: 'front', position: [0, 0, 0.525], direction: [0, 0, 1], compatible: ['seat', 'side'], occupied: false },
      { id: 'back', position: [0, 0, -0.525], direction: [0, 0, -1], compatible: ['seat', 'side'], occupied: false },
    ],
    materialSlots: ['Cord', 'etikett', 'legs'],
    basePrice: 649,
  },
  // Sides — "inner" anchor at [0, 0, -halfDepth] so that after rotation
  // the anchor world position lands exactly at the host module's edge.
  // direction [0, 0, -1] rotates to face the host (e.g. [1,0,0] after -PI/2).
  'side-s': {
    id: 'side-s',
    type: 'side',
    size: 's',
    name: 'Side S',
    sku: 'FETSAC-SIDE-S',
    dimensions: { width: 0.63, depth: 0.31, height: 0.611 },
    modelPath: '/models/side-s.glb',
    anchorTemplate: [
      { id: 'inner', position: [0, 0, -0.155], direction: [0, 0, -1], compatible: ['seat'], occupied: false },
    ],
    materialSlots: ['Cord', 'etikett', 'legs'],
    basePrice: 249,
  },
  'side-m': {
    id: 'side-m',
    type: 'side',
    size: 'm',
    name: 'Side M',
    sku: 'FETSAC-SIDE-M',
    dimensions: { width: 0.84, depth: 0.31, height: 0.603 },
    modelPath: '/models/side-m.glb',
    anchorTemplate: [
      { id: 'inner', position: [0, 0, -0.155], direction: [0, 0, -1], compatible: ['seat'], occupied: false },
    ],
    materialSlots: ['Cord', 'etikett', 'legs'],
    basePrice: 279,
  },
  'side-l': {
    id: 'side-l',
    type: 'side',
    size: 'l',
    name: 'Side L',
    sku: 'FETSAC-SIDE-L',
    dimensions: { width: 1.05, depth: 0.31, height: 0.592 },
    modelPath: '/models/side-l.glb',
    anchorTemplate: [
      { id: 'inner', position: [0, 0, -0.155], direction: [0, 0, -1], compatible: ['seat'], occupied: false },
    ],
    materialSlots: ['Cord', 'etikett', 'legs'],
    basePrice: 299,
  },
  // Pillows
  'pillow-back': {
    id: 'pillow-back',
    type: 'pillow',
    size: 'back',
    name: 'Back Pillow',
    sku: 'FETSAC-PILLOW-BACK',
    dimensions: { width: 0.551, depth: 0.138, height: 0.250 },
    modelPath: '/models/pillow-back.glb',
    anchorTemplate: [],
    materialSlots: ['Cord'],
    basePrice: 89,
  },
  'pillow-deco-s': {
    id: 'pillow-deco-s',
    type: 'pillow',
    size: 'deco-s',
    name: 'Lounge Pillow',
    sku: 'FETSAC-PILLOW-DECO-S',
    dimensions: { width: 0.889, depth: 0.386, height: 0.291 },
    modelPath: '/models/pillow-deco-s.glb',
    anchorTemplate: [],
    materialSlots: ['Cord'],
    basePrice: 59,
  },
  'pillow-deco-l': {
    id: 'pillow-deco-l',
    type: 'pillow',
    size: 'deco-l',
    name: 'Big Pillow',
    sku: 'FETSAC-PILLOW-DECO-L',
    dimensions: { width: 0.557, depth: 0.282, height: 0.495 },
    modelPath: '/models/pillow-deco-l.glb',
    anchorTemplate: [],
    materialSlots: ['Cord'],
    basePrice: 79,
  },
  'noodle': {
    id: 'noodle',
    type: 'noodle',
    size: 'noodle',
    name: 'Noodle Pillow',
    sku: 'FETSAC-NOODLE',
    dimensions: { width: 0.427, depth: 0.153, height: 0.152 },
    modelPath: '/models/noodle.glb',
    anchorTemplate: [],
    materialSlots: ['Cord'],
    basePrice: 69,
  },
};

export function getModule(moduleId: string) {
  return MODULE_CATALOG[moduleId];
}

export function getModulesByType(type: string) {
  return Object.values(MODULE_CATALOG).filter((m) => m.type === type);
}
