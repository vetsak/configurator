// Unit: 1 unit = 1 meter in Three.js
export const UNIT_SCALE = 0.01; // cm to meters

export const CAMERA_DEFAULTS = {
  position: [2.5, 1.8, 2.5] as [number, number, number],
  target: [0, 0.2, 0] as [number, number, number],
  fov: 40,
  near: 0.1,
  far: 100,
  minDistance: 1.0,
  maxDistance: 10,
  minPolarAngle: Math.PI * 0.1,
  maxPolarAngle: Math.PI * 0.48,
  enablePan: false,
  dampingFactor: 0.05,
};

export const SCENE_DEFAULTS = {
  ambientIntensity: 0.3,
  directionalIntensity: 0.8,
  hemisphereIntensity: 0.3,
  shadowMapSize: 2048,
  groundSize: 20,
  backgroundColor: '#f5f5f0',
};

export const TEXTURE_CACHE_SIZE = 12;

export const MODULE_MATERIAL_SLOTS = {
  CORD: 'Cord',
  ETIKETT: 'etikett',
  LEGS: 'legs',
} as const;

export const LEGS_COLOR = '#1a1a1a';
export const ETIKETT_COLOR = '#c8b89a';
