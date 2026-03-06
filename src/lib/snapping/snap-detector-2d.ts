import type { PlacedModule, AnchorPoint, ModuleType } from '@/types/configurator';
import { MODULE_CATALOG } from '@/lib/config/modules';
import {
  transformAnchorToWorld,
  transformDirectionToWorld,
  distance2D,
  dot3,
} from './transform-utils';
import { checkCollision } from './collision';
import { computeSideSnap } from './side-placement';

/** Maximum distance (meters) for snap activation. */
const SNAP_THRESHOLD = 0.5;

/** Direction opposition tolerance (dot product must be <= this). */
const DIRECTION_OPPOSITION_THRESHOLD = -0.9;

export interface WorldAnchor {
  instanceId: string;
  anchorId: string;
  moduleType: ModuleType;
  worldPos: [number, number, number];
  worldDir: [number, number, number];
  compatible: ModuleType[];
}

export interface SnapResult {
  hostInstanceId: string;
  hostAnchorId: string;
  guestAnchorId: string;
  position: [number, number, number];
  rotation: [number, number, number];
}

/**
 * Build a list of all free (unoccupied) anchors in world space.
 *
 * O(n * a) where n = modules, a = anchors per module (max 4).
 */
export function buildFreeAnchors(
  modules: PlacedModule[],
  excludeInstanceId?: string
): WorldAnchor[] {
  const result: WorldAnchor[] = [];

  for (const mod of modules) {
    if (excludeInstanceId && mod.instanceId === excludeInstanceId) continue;

    const catalog = MODULE_CATALOG[mod.moduleId];
    if (!catalog) continue;

    const rotY = mod.rotation[1];

    for (const anchor of mod.anchors) {
      if (anchor.occupied) continue;

      result.push({
        instanceId: mod.instanceId,
        anchorId: anchor.id,
        moduleType: catalog.type,
        worldPos: transformAnchorToWorld(anchor.position, mod.position, rotY),
        worldDir: transformDirectionToWorld(anchor.direction, rotY),
        compatible: anchor.compatible,
      });
    }
  }

  return result;
}

/**
 * Find the best snap target for a module being dragged near existing modules.
 *
 * Scans all free world anchors, checks type compatibility + direction opposition,
 * computes snap position, runs collision check, returns the closest valid snap.
 *
 * O(n * a * a') ~ O(n * 16) worst case — negligible for ≤10 modules.
 */
export function findBestSnap(
  cursorWorldPos: [number, number, number],
  dragModuleId: string,
  modules: PlacedModule[],
  excludeInstanceId?: string
): SnapResult | null {
  const dragCatalog = MODULE_CATALOG[dragModuleId];
  if (!dragCatalog || modules.length === 0) return null;

  const freeAnchors = buildFreeAnchors(modules, excludeInstanceId);
  if (freeAnchors.length === 0) return null;

  const dragType = dragCatalog.type;
  const dragAnchors = dragCatalog.anchorTemplate;

  let bestSnap: SnapResult | null = null;
  let bestDist = SNAP_THRESHOLD;

  for (const hostAnchor of freeAnchors) {
    // Check if the host anchor is compatible with the drag module type
    if (!hostAnchor.compatible.includes(dragType)) continue;

    // For each anchor on the guest module, try to match
    for (const guestAnchorTemplate of dragAnchors) {
      // Guest anchor must be compatible with the host module type
      if (!guestAnchorTemplate.compatible.includes(hostAnchor.moduleType)) continue;

      let snapPos: [number, number, number];
      let snapRot: [number, number, number];

      if (dragType === 'side') {
        // Side modules use the special side-placement logic
        const sideResult = computeSideSnap(
          hostAnchor.worldPos,
          hostAnchor.worldDir,
          dragCatalog
        );
        snapPos = sideResult.position;
        snapRot = sideResult.rotation;
      } else {
        // Seat-to-seat: compute rotation from direction opposition
        // The guest anchor direction (in world space after rotation) must oppose the host direction
        const hostDir = hostAnchor.worldDir;

        // Compute the Y-rotation needed so that the guest anchor's direction
        // opposes the host anchor's direction
        // Host points in direction H, guest anchor template points in direction G
        // After rotation R, guest direction = rotate(G, R)
        // We need: rotate(G, R) = -H
        // So R = atan2(-H.x, -H.z) - atan2(G.x, G.z)
        const targetAngle = Math.atan2(-hostDir[0], -hostDir[2]);
        const guestAngle = Math.atan2(
          guestAnchorTemplate.direction[0],
          guestAnchorTemplate.direction[2]
        );
        const rotationY = targetAngle - guestAngle;

        // Verify opposition: compute the rotated guest direction and check dot product
        const cosR = Math.cos(rotationY);
        const sinR = Math.sin(rotationY);
        const rotatedGuestDir: [number, number, number] = [
          guestAnchorTemplate.direction[0] * cosR + guestAnchorTemplate.direction[2] * sinR,
          0,
          -guestAnchorTemplate.direction[0] * sinR + guestAnchorTemplate.direction[2] * cosR,
        ];

        const dotProduct = dot3(hostDir, rotatedGuestDir);
        if (dotProduct > DIRECTION_OPPOSITION_THRESHOLD) continue;

        // Compute guest anchor position in world space after rotation
        const rotatedGuestAnchorPos: [number, number, number] = [
          guestAnchorTemplate.position[0] * cosR + guestAnchorTemplate.position[2] * sinR,
          guestAnchorTemplate.position[1],
          -guestAnchorTemplate.position[0] * sinR + guestAnchorTemplate.position[2] * cosR,
        ];

        // Snap position: host anchor world pos - rotated guest anchor offset
        snapPos = [
          hostAnchor.worldPos[0] - rotatedGuestAnchorPos[0],
          hostAnchor.worldPos[1] - rotatedGuestAnchorPos[1],
          hostAnchor.worldPos[2] - rotatedGuestAnchorPos[2],
        ];
        snapRot = [0, rotationY, 0];
      }

      // Distance from cursor to snap position (use snap center, not anchor)
      const dist = distance2D(cursorWorldPos, snapPos);
      if (dist >= bestDist) continue;

      // Collision check
      if (checkCollision(snapPos, snapRot[1], dragModuleId, modules, excludeInstanceId)) {
        continue;
      }

      bestDist = dist;
      bestSnap = {
        hostInstanceId: hostAnchor.instanceId,
        hostAnchorId: hostAnchor.anchorId,
        guestAnchorId: guestAnchorTemplate.id,
        position: snapPos,
        rotation: snapRot,
      };
    }
  }

  return bestSnap;
}
