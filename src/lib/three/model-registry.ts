import { MODULE_CATALOG } from '@/lib/config/modules';

/**
 * Registry mapping module IDs to their GLB paths and metadata.
 * Used by R3F components to load the correct model.
 */
export function getModelPath(moduleId: string): string {
  const entry = MODULE_CATALOG[moduleId];
  if (!entry) throw new Error(`Unknown module: ${moduleId}`);
  return entry.modelPath;
}

export function getModuleMaterialSlots(moduleId: string): string[] {
  const entry = MODULE_CATALOG[moduleId];
  return entry?.materialSlots ?? [];
}
