import type { Preset } from '@/types/configurator';

export const PRESETS: Record<string, Preset> = {
  single: {
    id: 'single',
    name: 'Single',
    description: 'One seat with two sides',
    modules: [
      { moduleId: 'side-s', count: 2 },
      { moduleId: 'seat-m', count: 1 },
    ],
  },
  double: {
    id: 'double',
    name: 'Double',
    description: 'Two seats with two sides',
    modules: [
      { moduleId: 'side-s', count: 2 },
      { moduleId: 'seat-m', count: 2 },
    ],
  },
  triple: {
    id: 'triple',
    name: 'Triple',
    description: 'Three seats with two sides',
    modules: [
      { moduleId: 'side-s', count: 2 },
      { moduleId: 'seat-m', count: 3 },
    ],
  },
  'l-right': {
    id: 'l-right',
    name: 'L-Shape Right',
    description: 'L-shape with right corner',
    modules: [
      { moduleId: 'side-m', count: 2 },
      { moduleId: 'seat-m', count: 4 },
    ],
    shape: 'l-right',
    mainRowIds: ['seat-m', 'seat-m', 'seat-m'],
    rightWingIds: ['seat-m'],
    sideIds: ['side-m', 'side-m'],
  },
  'l-left': {
    id: 'l-left',
    name: 'L-Shape Left',
    description: 'L-shape with left corner',
    modules: [
      { moduleId: 'side-m', count: 2 },
      { moduleId: 'seat-m', count: 4 },
    ],
    shape: 'l-left',
    mainRowIds: ['seat-m', 'seat-m', 'seat-m'],
    leftWingIds: ['seat-m'],
    sideIds: ['side-m', 'side-m'],
  },
  'u-shape': {
    id: 'u-shape',
    name: 'U-Shape',
    description: 'U-shape with both corners',
    modules: [
      { moduleId: 'side-m', count: 2 },
      { moduleId: 'seat-m', count: 5 },
    ],
    shape: 'u-shape',
    mainRowIds: ['seat-m', 'seat-m', 'seat-m'],
    leftWingIds: ['seat-m'],
    rightWingIds: ['seat-m'],
    sideIds: ['side-m', 'side-m'],
  },
};

export function getPreset(presetId: string): Preset | undefined {
  return PRESETS[presetId];
}
