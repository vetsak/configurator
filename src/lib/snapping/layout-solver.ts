import type { PlacedModule } from '@/types/configurator';
import type { Preset } from '@/types/configurator';
import { MODULE_CATALOG } from '@/lib/config/modules';
import { PRESETS } from '@/lib/config/presets';
import { createPlacedModule, connectModules } from './engine';
import type { SofaShape } from './shape-detector';
import { computeSideSnap } from './side-placement';

/**
 * Build a linear (left-to-right) sofa using cursor-based placement.
 *
 * Uses a simple X cursor for positioning (proven flush alignment),
 * then connects adjacent modules via the anchor graph.
 *
 * O(n) where n = number of modules
 */
export function buildLinear(moduleIds: string[]): PlacedModule[] {
  if (moduleIds.length === 0) return [];

  const placed: PlacedModule[] = [];
  let cursor = 0; // tracks the right edge X position

  for (let i = 0; i < moduleIds.length; i++) {
    const moduleId = moduleIds[i];
    const catalog = MODULE_CATALOG[moduleId];
    if (!catalog) throw new Error(`Module not found: ${moduleId}`);

    const isLeftSide = i === 0 && catalog.type === 'side';
    const isRightSide = i === moduleIds.length - 1 && catalog.type === 'side' && i > 0;
    const isSide = catalog.type === 'side';

    // Sides rotated 90deg: their depth becomes X extent after rotation
    const extentX = isSide ? catalog.dimensions.depth / 2 : catalog.dimensions.width / 2;

    let rotation: [number, number, number] = [0, 0, 0];
    if (isLeftSide) {
      rotation = [0, -Math.PI / 2, 0];
    } else if (isRightSide) {
      rotation = [0, Math.PI / 2, 0];
    }

    const x = cursor + extentX;
    const mod = createPlacedModule(moduleId, [x, 0, 0], rotation);
    placed.push(mod);
    cursor = x + extentX;
  }

  // Connect adjacent modules via anchor graph
  for (let i = 0; i < placed.length - 1; i++) {
    const left = placed[i];
    const right = placed[i + 1];
    const leftCatalog = MODULE_CATALOG[left.moduleId];
    const rightCatalog = MODULE_CATALOG[right.moduleId];
    if (!leftCatalog || !rightCatalog) continue;

    const leftAnchorId = leftCatalog.type === 'side' ? 'inner' : 'right';
    const rightAnchorId = rightCatalog.type === 'side' ? 'inner' : 'left';

    connectModules(left, leftAnchorId, right, rightAnchorId);
  }

  // Center the sofa around origin X
  if (placed.length > 0) {
    const totalWidth = cursor;
    const offset = totalWidth / 2;
    for (const mod of placed) {
      mod.position[0] -= offset;
    }
  }

  return placed;
}

/**
 * Resolve a preset into an ordered list of module IDs for linear layout.
 * Convention: sides go on the outside, seats in the middle.
 */
function presetToModuleIds(preset: Preset): string[] {
  const sides = preset.modules.filter((m) => m.moduleId.startsWith('side-'));
  const seats = preset.modules.filter((m) => m.moduleId.startsWith('seat-'));

  const moduleIds: string[] = [];

  // Left side
  if (sides.length > 0) {
    moduleIds.push(sides[0].moduleId);
  }

  // Seats in the middle
  for (const seat of seats) {
    for (let i = 0; i < seat.count; i++) {
      moduleIds.push(seat.moduleId);
    }
  }

  // Right side
  if (sides.length > 0) {
    const rightSide = sides.length > 1 ? sides[1] : sides[0];
    moduleIds.push(rightSide.moduleId);
  }

  return moduleIds;
}

/**
 * Build a shaped sofa layout (L-shape, U-shape, or linear).
 *
 * Wing seats extend in +Z (forward) from the main row via "front" anchors.
 *
 * Anchor math for rotated wing seats:
 *   Right wing (rotY = PI/2): "right" at [halfW,0,0] → rotated [0,0,-halfW], dir → [0,0,-1] (opposes front's +Z)
 *   Left wing  (rotY = -PI/2): "left" at [-halfW,0,0] → rotated [0,0,-halfW], dir → [0,0,-1] (opposes front's +Z)
 *   So both wings connect to the main row's "front" anchor via their inward-facing anchor.
 */
export function buildShape(
  shape: SofaShape,
  mainRowIds: string[],
  leftWingIds: string[] = [],
  rightWingIds: string[] = [],
  _sideIds: string[] = []
): PlacedModule[] {
  if (shape === 'linear') {
    // Only place seats — sides are handled uniformly by autoPlaceSides()
    return buildLinear(mainRowIds);
  }

  const placed: PlacedModule[] = [];

  // 1. Build main row (left-to-right, no rotation)
  let cursor = 0;
  for (const moduleId of mainRowIds) {
    const catalog = MODULE_CATALOG[moduleId];
    if (!catalog) continue;
    const halfW = catalog.dimensions.width / 2;
    const x = cursor + halfW;
    placed.push(createPlacedModule(moduleId, [x, 0, 0]));
    cursor = x + halfW;
  }

  // Connect main row left-to-right
  for (let i = 0; i < placed.length - 1; i++) {
    connectModules(placed[i], 'right', placed[i + 1], 'left');
  }

  // 2. Build left wing (extends in +Z from first main row seat)
  //    Wing seats are NOT rotated — same orientation as main row.
  //    Corner "front" → wing "back", chained via "front" → "back".
  if (leftWingIds.length > 0 && placed.length > 0) {
    buildWing(placed, placed[0], leftWingIds, 0, 'front', 'back', 'front');
  }

  // 3. Build right wing (extends in +Z from last main row seat)
  if (rightWingIds.length > 0 && placed.length > 0) {
    buildWing(placed, placed[mainRowIds.length - 1], rightWingIds, 0, 'front', 'back', 'front');
  }

  // 4. Center all seats around bounding box center
  centerModules(placed);

  // Sides are NOT placed here — autoPlaceSides() handles backs + armrests uniformly
  return placed;
}

/**
 * Build a perpendicular wing from a corner seat, extending in +Z.
 *
 * @param placed - Array to push new modules into
 * @param cornerSeat - The main row seat where the wing starts
 * @param wingIds - Module IDs for the wing
 * @param rotY - Rotation for wing seats (PI/2 for right wing, -PI/2 for left)
 * @param cornerAnchor - Which anchor on the corner seat to connect (always "front")
 * @param firstWingAnchor - Which anchor on the first wing seat faces the main row
 * @param nextWingAnchor - Which anchor on subsequent wing seats faces away (+Z)
 */
function buildWing(
  placed: PlacedModule[],
  cornerSeat: PlacedModule,
  wingIds: string[],
  rotY: number,
  cornerAnchor: string,
  firstWingAnchor: string,
  nextWingAnchor: string
): void {
  let prevModule = cornerSeat;
  let prevAnchorId = cornerAnchor;
  let wingAnchorId = firstWingAnchor;

  for (const wingId of wingIds) {
    const catalog = MODULE_CATALOG[wingId];
    if (!catalog) continue;

    // Get the world position of the previous module's anchor
    const prevAnchor = prevModule.anchors.find((a) => a.id === prevAnchorId);
    if (!prevAnchor) continue;

    const cosP = Math.cos(prevModule.rotation[1]);
    const sinP = Math.sin(prevModule.rotation[1]);
    const anchorWorldX = prevModule.position[0] + prevAnchor.position[0] * cosP + prevAnchor.position[2] * sinP;
    const anchorWorldZ = prevModule.position[2] - prevAnchor.position[0] * sinP + prevAnchor.position[2] * cosP;

    // Get the wing anchor's local position and rotate it
    const wingAnchorTemplate = catalog.anchorTemplate.find((a) => a.id === wingAnchorId);
    if (!wingAnchorTemplate) continue;

    const cosW = Math.cos(rotY);
    const sinW = Math.sin(rotY);
    const rotatedAnchorX = wingAnchorTemplate.position[0] * cosW + wingAnchorTemplate.position[2] * sinW;
    const rotatedAnchorZ = -wingAnchorTemplate.position[0] * sinW + wingAnchorTemplate.position[2] * cosW;

    // Wing center = anchor world pos - rotated wing anchor offset
    const wingX = anchorWorldX - rotatedAnchorX;
    const wingZ = anchorWorldZ - rotatedAnchorZ;

    const wingMod = createPlacedModule(wingId, [wingX, 0, wingZ], [0, rotY, 0]);
    placed.push(wingMod);
    connectModules(prevModule, prevAnchorId, wingMod, wingAnchorId);

    prevModule = wingMod;
    // After the first connection, subsequent wing seats chain via the outward anchor
    prevAnchorId = nextWingAnchor;
    wingAnchorId = firstWingAnchor;
  }
}

function centerModules(modules: PlacedModule[]): void {
  if (modules.length === 0) return;

  let minX = Infinity, maxX = -Infinity;
  let minZ = Infinity, maxZ = -Infinity;
  for (const mod of modules) {
    const catalog = MODULE_CATALOG[mod.moduleId];
    if (!catalog) continue;
    const cos = Math.abs(Math.cos(mod.rotation[1]));
    const sin = Math.abs(Math.sin(mod.rotation[1]));
    const halfExtentX = (catalog.dimensions.width * cos + catalog.dimensions.depth * sin) / 2;
    const halfExtentZ = (catalog.dimensions.width * sin + catalog.dimensions.depth * cos) / 2;
    minX = Math.min(minX, mod.position[0] - halfExtentX);
    maxX = Math.max(maxX, mod.position[0] + halfExtentX);
    minZ = Math.min(minZ, mod.position[2] - halfExtentZ);
    maxZ = Math.max(maxZ, mod.position[2] + halfExtentZ);
  }
  const offsetX = (minX + maxX) / 2;
  const offsetZ = (minZ + maxZ) / 2;
  for (const mod of modules) {
    mod.position[0] -= offsetX;
    mod.position[2] -= offsetZ;
  }
}

/**
 * Place side modules on exposed (unoccupied) left/right edges of the sofa.
 * Finds the two most "outer" free anchors and places sides there.
 */
function placeSidesOnExposedEdges(
  seats: PlacedModule[],
  sideIds: string[]
): PlacedModule[] {
  const sides: PlacedModule[] = [];

  // Collect all free left/right anchors from seats
  const freeEdges: { module: PlacedModule; anchorId: string; worldX: number; worldZ: number }[] = [];

  for (const seat of seats) {
    for (const anchor of seat.anchors) {
      if (anchor.occupied) continue;
      if (anchor.id !== 'left' && anchor.id !== 'right') continue;

      const cosR = Math.cos(seat.rotation[1]);
      const sinR = Math.sin(seat.rotation[1]);
      const wx = seat.position[0] + anchor.position[0] * cosR + anchor.position[2] * sinR;
      const wz = seat.position[2] - anchor.position[0] * sinR + anchor.position[2] * cosR;
      const wdx = anchor.direction[0] * cosR + anchor.direction[2] * sinR;
      const wdz = -anchor.direction[0] * sinR + anchor.direction[2] * cosR;

      freeEdges.push({ module: seat, anchorId: anchor.id, worldX: wx, worldZ: wz });
    }
  }

  if (freeEdges.length === 0) return sides;

  // Sort by world X to find leftmost and rightmost exposed edges
  freeEdges.sort((a, b) => a.worldX - b.worldX);

  // Place first side at the leftmost free edge
  if (sideIds.length >= 1) {
    const leftEdge = freeEdges[0];
    const sideId = sideIds[0];
    const sideCatalog = MODULE_CATALOG[sideId];
    if (sideCatalog) {
      const anchor = leftEdge.module.anchors.find((a) => a.id === leftEdge.anchorId);
      if (anchor) {
        const cosR = Math.cos(leftEdge.module.rotation[1]);
        const sinR = Math.sin(leftEdge.module.rotation[1]);
        const anchorWorldPos: [number, number, number] = [
          leftEdge.module.position[0] + anchor.position[0] * cosR + anchor.position[2] * sinR,
          0,
          leftEdge.module.position[2] - anchor.position[0] * sinR + anchor.position[2] * cosR,
        ];
        const anchorWorldDir: [number, number, number] = [
          anchor.direction[0] * cosR + anchor.direction[2] * sinR,
          0,
          -anchor.direction[0] * sinR + anchor.direction[2] * cosR,
        ];
        const hostCatalog = MODULE_CATALOG[leftEdge.module.moduleId];
        const snap = computeSideSnap(anchorWorldPos, anchorWorldDir, sideCatalog, hostCatalog?.dimensions.depth, leftEdge.module.rotation[1]);
        const sideMod = createPlacedModule(sideId, snap.position, snap.rotation);
        connectModules(leftEdge.module, leftEdge.anchorId, sideMod, 'inner');
        sides.push(sideMod);
      }
    }
  }

  // Place second side at the rightmost free edge
  if (sideIds.length >= 2 && freeEdges.length >= 2) {
    const rightEdge = freeEdges[freeEdges.length - 1];
    const sideId = sideIds[1];
    const sideCatalog = MODULE_CATALOG[sideId];
    if (sideCatalog) {
      const anchor = rightEdge.module.anchors.find((a) => a.id === rightEdge.anchorId);
      if (anchor) {
        const cosR = Math.cos(rightEdge.module.rotation[1]);
        const sinR = Math.sin(rightEdge.module.rotation[1]);
        const anchorWorldPos: [number, number, number] = [
          rightEdge.module.position[0] + anchor.position[0] * cosR + anchor.position[2] * sinR,
          0,
          rightEdge.module.position[2] - anchor.position[0] * sinR + anchor.position[2] * cosR,
        ];
        const anchorWorldDir: [number, number, number] = [
          anchor.direction[0] * cosR + anchor.direction[2] * sinR,
          0,
          -anchor.direction[0] * sinR + anchor.direction[2] * cosR,
        ];
        const hostCatalog = MODULE_CATALOG[rightEdge.module.moduleId];
        const snap = computeSideSnap(anchorWorldPos, anchorWorldDir, sideCatalog, hostCatalog?.dimensions.depth, rightEdge.module.rotation[1]);
        const sideMod = createPlacedModule(sideId, snap.position, snap.rotation);
        connectModules(rightEdge.module, rightEdge.anchorId, sideMod, 'inner');
        sides.push(sideMod);
      }
    }
  }

  return sides;
}

/**
 * Pick side module ID whose width matches a given dimension (cm).
 *   63cm → side-s (63cm), 84cm → side-m (84cm), 105cm → side-l (105cm)
 */
function pickSideForDimension(cm: number): string {
  if (cm <= 63) return 'side-s';
  if (cm <= 84) return 'side-m';
  return 'side-l';
}

/**
 * Place a single side module on a seat's anchor. Returns the placed side.
 * @param backDepth  Depth of backrest behind this seat (meters), for armrest back-alignment.
 */
function placeSideOnAnchor(
  seat: PlacedModule,
  anchorId: string,
  sideId: string,
  backDepth: number = 0
): PlacedModule | null {
  const sideCatalog = MODULE_CATALOG[sideId];
  const anchor = seat.anchors.find((a) => a.id === anchorId);
  if (!sideCatalog || !anchor) return null;

  const cosR = Math.cos(seat.rotation[1]);
  const sinR = Math.sin(seat.rotation[1]);
  const anchorWorldPos: [number, number, number] = [
    seat.position[0] + anchor.position[0] * cosR + anchor.position[2] * sinR,
    0,
    seat.position[2] - anchor.position[0] * sinR + anchor.position[2] * cosR,
  ];
  const anchorWorldDir: [number, number, number] = [
    anchor.direction[0] * cosR + anchor.direction[2] * sinR,
    0,
    -anchor.direction[0] * sinR + anchor.direction[2] * cosR,
  ];

  const seatCatalog = MODULE_CATALOG[seat.moduleId];
  const snap = computeSideSnap(
    anchorWorldPos,
    anchorWorldDir,
    sideCatalog,
    seatCatalog?.dimensions.depth,
    seat.rotation[1],
    backDepth
  );
  const sideMod = createPlacedModule(sideId, snap.position, snap.rotation);
  connectModules(seat, anchorId, sideMod, 'inner');
  return sideMod;
}

/**
 * Auto-place side modules matching vetsak website presets:
 *   1. BACKS — one side per seat on every free "back" anchor
 *      (side width matches seat WIDTH for flush backrest)
 *   2. ARMRESTS — sides on the two outermost free left/right edges
 *      (side width matches seat DEPTH for flush armrests)
 *
 * Strips existing sides first, then rebuilds from scratch.
 * Returns the full module array (seats + new sides).
 */
export function autoPlaceSides(modules: PlacedModule[], skipArmrests = false): PlacedModule[] {
  // Deep-clone non-side modules, freeing anchors that were connected to sides
  const seats: PlacedModule[] = [];
  const sideInstanceIds = new Set(
    modules.filter((m) => MODULE_CATALOG[m.moduleId]?.type === 'side').map((m) => m.instanceId)
  );

  for (const mod of modules) {
    const catalog = MODULE_CATALOG[mod.moduleId];
    if (!catalog || catalog.type === 'side') continue;

    const cloned: PlacedModule = {
      ...mod,
      anchors: mod.anchors.map((a) => ({ ...a })),
      connectedTo: [...mod.connectedTo],
    };

    // Free anchors that were connected to sides
    for (const anchor of cloned.anchors) {
      if (!anchor.occupied) continue;
      const conn = cloned.connectedTo.find((c) => c.anchorId === anchor.id);
      if (conn && sideInstanceIds.has(conn.targetInstanceId)) {
        anchor.occupied = false;
      }
    }
    cloned.connectedTo = cloned.connectedTo.filter(
      (c) => !sideInstanceIds.has(c.targetInstanceId)
    );

    seats.push(cloned);
  }

  if (seats.length === 0) return seats;

  const newSides: PlacedModule[] = [];

  // 1. BACKS — place a side behind every seat with a free "back" anchor.
  //    Wing seats naturally skip this because their "back" anchor is occupied
  //    (connected to the corner seat's "front").
  for (const seat of seats) {
    const catalog = MODULE_CATALOG[seat.moduleId];
    if (!catalog || catalog.type !== 'seat') continue;

    const backAnchor = seat.anchors.find((a) => a.id === 'back' && !a.occupied);
    if (!backAnchor) continue;

    const widthCm = Math.round(catalog.dimensions.width * 100);
    const sideId = pickSideForDimension(widthCm);
    const side = placeSideOnAnchor(seat, 'back', sideId);
    if (side) newSides.push(side);
  }

  // 2. ARMRESTS — sides on outermost edges of main row + ends of wings
  if (skipArmrests) return [...seats, ...newSides];

  // Helper: detect if a seat is a wing seat (its "back" connects to another seat)
  const isWingSeat = (seat: PlacedModule): boolean => {
    const backConn = seat.connectedTo.find((c) => c.anchorId === 'back');
    if (!backConn) return false;
    const target = seats.find((s) => s.instanceId === backConn.targetInstanceId);
    return target?.type === 'seat';
  };

  // Helper: find backDepth for armrest alignment
  const getBackDepth = (seat: PlacedModule): number => {
    const backAnchor = seat.anchors.find((a) => a.id === 'back');
    if (!backAnchor?.occupied) return 0;
    const backConn = seat.connectedTo.find((c) => c.anchorId === 'back');
    if (!backConn) return 0;
    const backMod = newSides.find((s) => s.instanceId === backConn.targetInstanceId);
    if (!backMod) return 0;
    const backCatalog = MODULE_CATALOG[backMod.moduleId];
    return backCatalog?.dimensions.depth ?? 0;
  };

  // 2a. Main row armrests — outermost free left/right anchors (excluding wing seats)
  const freeEdges: { module: PlacedModule; anchorId: string; worldX: number }[] = [];
  for (const seat of seats) {
    const catalog = MODULE_CATALOG[seat.moduleId];
    if (!catalog || catalog.type !== 'seat') continue;
    if (isWingSeat(seat)) continue; // skip wing seats

    for (const anchor of seat.anchors) {
      if (anchor.occupied) continue;
      if (anchor.id !== 'left' && anchor.id !== 'right') continue;
      const cosR = Math.cos(seat.rotation[1]);
      const sinR = Math.sin(seat.rotation[1]);
      const wx = seat.position[0] + anchor.position[0] * cosR + anchor.position[2] * sinR;
      freeEdges.push({ module: seat, anchorId: anchor.id, worldX: wx });
    }
  }

  if (freeEdges.length > 0) {
    freeEdges.sort((a, b) => a.worldX - b.worldX);

    const placeMainRowArmrest = (edge: typeof freeEdges[0]) => {
      const seatCatalog = MODULE_CATALOG[edge.module.moduleId];
      if (!seatCatalog) return;

      const depthCm = Math.round(seatCatalog.dimensions.depth * 100);
      const sideId = pickSideForDimension(depthCm);
      const backDepth = getBackDepth(edge.module);

      const side = placeSideOnAnchor(edge.module, edge.anchorId, sideId, backDepth);
      if (!side) return;
      newSides.push(side);
    };

    // Leftmost armrest
    placeMainRowArmrest(freeEdges[0]);

    // Rightmost armrest
    if (freeEdges.length >= 2) {
      placeMainRowArmrest(freeEdges[freeEdges.length - 1]);
    }
  }

  // 2b. Wing-end armrests — free "front" anchor on wing seats (open end of wing)
  for (const seat of seats) {
    const catalog = MODULE_CATALOG[seat.moduleId];
    if (!catalog || catalog.type !== 'seat') continue;
    if (!isWingSeat(seat)) continue; // only wing seats

    const frontAnchor = seat.anchors.find((a) => a.id === 'front' && !a.occupied);
    if (!frontAnchor) continue;

    const widthCm = Math.round(catalog.dimensions.width * 100);
    const sideId = pickSideForDimension(widthCm);
    const side = placeSideOnAnchor(seat, 'front', sideId);
    if (side) newSides.push(side);
  }

  return [...seats, ...newSides];
}

/**
 * Apply a preset by name — resolves it to placed modules.
 */
export function applyPreset(presetId: string): PlacedModule[] {
  const preset = PRESETS[presetId];
  if (!preset) throw new Error(`Preset not found: ${presetId}`);

  // Non-linear presets use buildShape (seats only — autoPlaceSides adds sides)
  if (preset.shape && preset.shape !== 'linear') {
    return buildShape(
      preset.shape,
      preset.mainRowIds ?? [],
      preset.leftWingIds ?? [],
      preset.rightWingIds ?? [],
      [] // no sides — autoPlaceSides() handles them uniformly
    );
  }

  // Linear: only seat IDs — autoPlaceSides() adds backs + armrests
  const seatIds = preset.modules
    .filter((m) => !m.moduleId.startsWith('side-'))
    .flatMap((m) => Array(m.count).fill(m.moduleId));
  return buildLinear(seatIds);
}
