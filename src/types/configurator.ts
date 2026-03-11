export type ModuleType = 'seat' | 'side' | 'pillow' | 'noodle';

export type SeatSize = 'xs' | 's' | 'm' | 'l' | 'xl';
export type SideSize = 's' | 'l';
export type PillowType = 'back' | 'deco-s' | 'deco-l' | 'jumbo-folded' | 'jumbo-left' | 'jumbo-right' | 'noodle';

export interface AnchorPoint {
  id: string;
  position: [number, number, number];
  direction: [number, number, number];
  compatible: ModuleType[];
  occupied: boolean;
}

export interface ModuleConnection {
  anchorId: string;
  targetInstanceId: string;
  targetAnchorId: string;
}

export interface PlacedModule {
  instanceId: string;
  moduleId: string;
  type: ModuleType;
  size: SeatSize | SideSize | PillowType | 'noodle';
  position: [number, number, number];
  rotation: [number, number, number];
  anchors: AnchorPoint[];
  connectedTo: ModuleConnection[];
}

export type PresetId = 'single' | 'double' | 'triple' | 'l-right' | 'l-left' | 'u-shape' | 'corner';

export interface Preset {
  id: PresetId;
  name: string;
  description: string;
  modules: { moduleId: string; count: number }[];
  // For non-linear presets
  shape?: 'linear' | 'l-right' | 'l-left' | 'u-shape';
  mainRowIds?: string[];
  leftWingIds?: string[];
  rightWingIds?: string[];
  sideIds?: string[];
}

export interface ConfiguratorStep {
  id: string;
  label: string;
  icon: string;
}

export interface CartItem {
  moduleId: string;
  variantId: string;
  quantity: number;
  price: number;
  name: string;
}
