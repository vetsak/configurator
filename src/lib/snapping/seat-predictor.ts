import type { PlacedModule } from '@/types/configurator';
import type { SnapTarget } from '@/stores/slices/drag-slice';
import { MODULE_CATALOG } from '@/lib/config/modules';
import { buildFreeAnchors, type WorldAnchor } from './snap-detector-2d';
import { checkCollision } from './collision';
import { computeSideSnap } from './side-placement';
import { analyzeShape } from './shape-detector';

/**
 * Predict the best placement position for a new module.
 *
 * Scoring heuristic:
 * 1. Extending the main row (left/right anchors) → highest score
 * 2. Creating a perpendicular wing (front/back anchors) → medium score
 * 3. Avoid positions that would collide
 *
 * O(n * a) where n = existing modules, a = anchors per module.
 */
export function predictBestPlacement(
  moduleId: string,
  modules: PlacedModule[]
): SnapTarget | null {
  const catalog = MODULE_CATALOG[moduleId];
  if (!catalog) return null;

  const freeAnchors = buildFreeAnchors(modules);
  if (freeAnchors.length === 0) return null;

  const dragType = catalog.type;
  const dragAnchors = catalog.anchorTemplate;
  const shape = analyzeShape(modules);

  let bestSnap: SnapTarget | null = null;
  let bestScore = -Infinity;

  for (const hostAnchor of freeAnchors) {
    if (!hostAnchor.compatible.includes(dragType)) continue;

    for (const guestTemplate of dragAnchors) {
      if (!guestTemplate.compatible.includes(hostAnchor.moduleType)) continue;

      let snapPos: [number, number, number];
      let snapRot: [number, number, number];

      if (dragType === 'side') {
        const sideResult = computeSideSnap(
          hostAnchor.worldPos,
          hostAnchor.worldDir,
          catalog
        );
        snapPos = sideResult.position;
        snapRot = sideResult.rotation;
      } else {
        // Compute rotation to oppose host anchor direction
        const hostDir = hostAnchor.worldDir;
        const targetAngle = Math.atan2(-hostDir[0], -hostDir[2]);
        const guestAngle = Math.atan2(guestTemplate.direction[0], guestTemplate.direction[2]);
        const rotationY = targetAngle - guestAngle;

        const cosR = Math.cos(rotationY);
        const sinR = Math.sin(rotationY);

        // Verify direction opposition
        const rotatedDir: [number, number, number] = [
          guestTemplate.direction[0] * cosR + guestTemplate.direction[2] * sinR,
          0,
          -guestTemplate.direction[0] * sinR + guestTemplate.direction[2] * cosR,
        ];
        const dot = hostDir[0] * rotatedDir[0] + hostDir[2] * rotatedDir[2];
        if (dot > -0.9) continue;

        // Compute snap position
        const rotatedPos: [number, number, number] = [
          guestTemplate.position[0] * cosR + guestTemplate.position[2] * sinR,
          guestTemplate.position[1],
          -guestTemplate.position[0] * sinR + guestTemplate.position[2] * cosR,
        ];
        snapPos = [
          hostAnchor.worldPos[0] - rotatedPos[0],
          hostAnchor.worldPos[1] - rotatedPos[1],
          hostAnchor.worldPos[2] - rotatedPos[2],
        ];
        snapRot = [0, rotationY, 0];
      }

      // Collision check
      if (checkCollision(snapPos, snapRot[1], moduleId, modules)) continue;

      // Score this placement
      const score = scorePlacement(hostAnchor, guestTemplate.id, shape);

      if (score > bestScore) {
        bestScore = score;
        bestSnap = {
          hostInstanceId: hostAnchor.instanceId,
          hostAnchorId: hostAnchor.anchorId,
          guestAnchorId: guestTemplate.id,
          position: snapPos,
          rotation: snapRot,
        };
      }
    }
  }

  return bestSnap;
}

/**
 * Score a potential placement. Higher = better.
 */
function scorePlacement(
  hostAnchor: WorldAnchor,
  guestAnchorId: string,
  shape: string
): number {
  let score = 0;

  // Extending the main row (left/right connections) is preferred
  if (hostAnchor.anchorId === 'right' && guestAnchorId === 'left') {
    score += 100; // Extend row to the right
  } else if (hostAnchor.anchorId === 'left' && guestAnchorId === 'right') {
    score += 90; // Extend row to the left
  }

  // Front/back connections create perpendicular wings
  if (hostAnchor.anchorId === 'back' || hostAnchor.anchorId === 'front') {
    score += 50;
  }

  // Prefer connecting to seats over sides
  if (hostAnchor.moduleType === 'seat') {
    score += 10;
  }

  return score;
}
