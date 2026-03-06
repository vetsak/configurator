import type { PlacedModule, AnchorPoint } from '@/types/configurator';
import type { ModuleCatalogEntry } from '@/types/modules';
import { MODULE_CATALOG } from '@/lib/config/modules';
import { cloneAnchors } from './anchor-points';

/**
 * Compute the snapped position for a new module attaching to an existing one.
 * Aligns the new module's anchor to the host module's free anchor.
 *
 * O(1) per snap — just vector addition from two anchor offsets.
 */
export function computeSnappedPosition(
  hostModule: PlacedModule,
  hostAnchorId: string,
  newCatalogEntry: ModuleCatalogEntry,
  newAnchorId: string
): [number, number, number] {
  const hostAnchor = hostModule.anchors.find((a) => a.id === hostAnchorId);
  const newAnchorTemplate = newCatalogEntry.anchorTemplate.find((a) => a.id === newAnchorId);

  if (!hostAnchor || !newAnchorTemplate) {
    throw new Error(
      `Anchor not found: host=${hostAnchorId}, new=${newAnchorId}`
    );
  }

  // World position of the host anchor
  const hostAnchorWorld: [number, number, number] = [
    hostModule.position[0] + hostAnchor.position[0],
    hostModule.position[1] + hostAnchor.position[1],
    hostModule.position[2] + hostAnchor.position[2],
  ];

  // New module position = host anchor world pos - new anchor local offset
  return [
    hostAnchorWorld[0] - newAnchorTemplate.position[0],
    hostAnchorWorld[1] - newAnchorTemplate.position[1],
    hostAnchorWorld[2] - newAnchorTemplate.position[2],
  ];
}

/**
 * Create a PlacedModule instance from a catalog entry at a given position.
 */
export function createPlacedModule(
  moduleId: string,
  position: [number, number, number] = [0, 0, 0],
  rotation: [number, number, number] = [0, 0, 0]
): PlacedModule {
  const entry = MODULE_CATALOG[moduleId];
  if (!entry) throw new Error(`Module not found: ${moduleId}`);

  return {
    instanceId: crypto.randomUUID(),
    moduleId: entry.id,
    type: entry.type,
    size: entry.size,
    position,
    rotation,
    anchors: cloneAnchors(entry.anchorTemplate),
    connectedTo: [],
  };
}

/**
 * Connect two modules at their anchors, marking both anchors as occupied.
 */
export function connectModules(
  hostModule: PlacedModule,
  hostAnchorId: string,
  newModule: PlacedModule,
  newAnchorId: string
): void {
  const hostAnchor = hostModule.anchors.find((a) => a.id === hostAnchorId);
  const newAnchor = newModule.anchors.find((a) => a.id === newAnchorId);

  if (hostAnchor) hostAnchor.occupied = true;
  if (newAnchor) newAnchor.occupied = true;

  hostModule.connectedTo.push({
    anchorId: hostAnchorId,
    targetInstanceId: newModule.instanceId,
    targetAnchorId: newAnchorId,
  });

  newModule.connectedTo.push({
    anchorId: newAnchorId,
    targetInstanceId: hostModule.instanceId,
    targetAnchorId: hostAnchorId,
  });
}
