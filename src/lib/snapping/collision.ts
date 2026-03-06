import type { PlacedModule } from '@/types/configurator';
import { MODULE_CATALOG } from '@/lib/config/modules';

interface AABB {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

/** Epsilon shrink to allow flush edges without false positives. */
const EPSILON = 0.005;

/**
 * Compute the world-space axis-aligned bounding box for a module,
 * accounting for Y-rotation swapping width/depth for sides.
 */
export function computeWorldAABB(
  pos: [number, number, number],
  rotationY: number,
  dimensions: { width: number; depth: number }
): AABB {
  const cos = Math.abs(Math.cos(rotationY));
  const sin = Math.abs(Math.sin(rotationY));

  // After rotation, the effective extents along X and Z change
  const halfExtentX = (dimensions.width * cos + dimensions.depth * sin) / 2;
  const halfExtentZ = (dimensions.width * sin + dimensions.depth * cos) / 2;

  return {
    minX: pos[0] - halfExtentX + EPSILON,
    maxX: pos[0] + halfExtentX - EPSILON,
    minZ: pos[2] - halfExtentZ + EPSILON,
    maxZ: pos[2] + halfExtentZ - EPSILON,
  };
}

/** Check if two AABBs overlap. */
function aabbOverlap(a: AABB, b: AABB): boolean {
  return a.minX < b.maxX && a.maxX > b.minX && a.minZ < b.maxZ && a.maxZ > b.minZ;
}

/**
 * Check whether placing a new module at the given position/rotation
 * would collide with any existing module.
 *
 * @param excludeId - Optional instance ID to exclude (for reposition)
 * @returns true if there IS a collision (placement is invalid)
 */
export function checkCollision(
  newPos: [number, number, number],
  newRotationY: number,
  newModuleId: string,
  modules: PlacedModule[],
  excludeId?: string
): boolean {
  const newCatalog = MODULE_CATALOG[newModuleId];
  if (!newCatalog) return false;

  const newAABB = computeWorldAABB(newPos, newRotationY, newCatalog.dimensions);

  for (const mod of modules) {
    if (excludeId && mod.instanceId === excludeId) continue;

    const catalog = MODULE_CATALOG[mod.moduleId];
    if (!catalog) continue;

    const modAABB = computeWorldAABB(mod.position, mod.rotation[1], catalog.dimensions);

    if (aabbOverlap(newAABB, modAABB)) {
      return true;
    }
  }

  return false;
}
