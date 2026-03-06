import { AnchorPoint, ModuleType, SeatSize, SideSize, PillowType } from './configurator';

export interface ModuleDimensions {
  width: number;
  depth: number;
  height: number;
}

export interface ModuleCatalogEntry {
  id: string;
  type: ModuleType;
  size: SeatSize | SideSize | PillowType | 'noodle';
  name: string;
  sku: string;
  dimensions: ModuleDimensions;
  modelPath: string;
  anchorTemplate: AnchorPoint[];
  materialSlots: string[];
  basePrice: number;
}

export type ModuleCatalog = Record<string, ModuleCatalogEntry>;
