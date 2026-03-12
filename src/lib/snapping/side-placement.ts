import type { ModuleCatalogEntry } from '@/types/modules';

/**
 * Maps host anchor world direction (quantized key) to the Y-rotation
 * the side module should use when snapping to that anchor.
 */
const SIDE_ROTATION_MAP: Record<string, number> = {
  '-1,0,0': -Math.PI / 2,
  '1,0,0': Math.PI / 2,
  '0,0,-1': Math.PI,
  '0,0,1': 0,
};

/**
 * Quantize a direction vector to the nearest cardinal direction string key.
 */
function quantizeDirection(dir: [number, number, number]): string {
  const ax = Math.abs(dir[0]);
  const az = Math.abs(dir[2]);

  if (ax > az) {
    return `${dir[0] > 0 ? '1' : '-1'},0,0`;
  } else {
    return `0,0,${dir[2] > 0 ? '1' : '-1'}`;
  }
}

export interface SideSnapResult {
  position: [number, number, number];
  rotation: [number, number, number];
}

/**
 * Compute the snap position and rotation for a side module attaching
 * to a host anchor.
 *
 * The side center is offset from the host anchor by depth/2 in the
 * host anchor's direction. This ensures the side's edge (after rotation)
 * is flush with the host module's edge.
 *
 * Example: host left anchor at [-0.542, 0, 0] dir [-1, 0, 0], side depth=0.430
 *   → side center at [-0.542 + (-1)*0.215, 0, 0] = [-0.757, 0, 0]
 *   → side right edge at -0.757 + 0.215 = -0.542 = flush with seat edge
 */
/**
 * @param hostAnchorWorldPos  Host anchor position in world space
 * @param hostAnchorWorldDir  Host anchor direction in world space
 * @param sideCatalog         Side module catalog entry
 * @param hostDepth           Host seat depth in meters (for back-alignment of armrests)
 * @param hostRotationY       Host seat Y rotation in radians (for back-alignment direction)
 * @param backDepth           Depth of the back side module behind the seat (meters), 0 if no back
 */
export function computeSideSnap(
  hostAnchorWorldPos: [number, number, number],
  hostAnchorWorldDir: [number, number, number],
  sideCatalog: ModuleCatalogEntry,
  hostDepth?: number,
  hostRotationY?: number,
  backDepth?: number
): SideSnapResult {
  const key = quantizeDirection(hostAnchorWorldDir);
  const rotationY = SIDE_ROTATION_MAP[key] ?? 0;

  // Offset the side center from the host anchor along the host direction
  // by half the side's depth (which becomes the X extent after rotation).
  // Subtract a small overlap (5mm) to close visual gaps from model bevels.
  const GAP_COMPENSATION = 0.005;
  const halfDepth = sideCatalog.dimensions.depth / 2 - GAP_COMPENSATION;

  const position: [number, number, number] = [
    hostAnchorWorldPos[0] + hostAnchorWorldDir[0] * halfDepth,
    hostAnchorWorldPos[1],
    hostAnchorWorldPos[2] + hostAnchorWorldDir[2] * halfDepth,
  ];

  // Align armrests with the seat's back edge.
  //
  // Top-down view (non-rotated seat):
  //            [BACK]
  //   [ARM] [  SEAT  ] [ARM]
  //
  // The armrest's back edge aligns with the seat's back edge.
  // This keeps the armrest flush with both front and back of the seat.
  // The backrest extends slightly further back — matching real sofa proportions.
  if (hostDepth != null && hostRotationY != null && (key === '-1,0,0' || key === '1,0,0')) {
    const armrestWidth = sideCatalog.dimensions.width; // becomes Z extent after rotation
    const shiftBackward = (hostDepth - armrestWidth) / 2;
    if (Math.abs(shiftBackward) > 0.001) {
      const cosH = Math.cos(hostRotationY);
      const sinH = Math.sin(hostRotationY);
      position[0] += -sinH * shiftBackward;
      position[2] += -cosH * shiftBackward;
    }
  }

  return {
    position,
    rotation: [0, rotationY, 0],
  };
}
