import type { PlacedModule } from '@/types/configurator';
import { MODULE_CATALOG } from '@/lib/config/modules';

export type SofaShape = 'linear' | 'l-right' | 'l-left' | 'u-shape';

/**
 * Analyze the current module layout to determine the sofa shape.
 *
 * Walks the seat connection graph and checks if any seats are
 * connected via front/back anchors (perpendicular turns).
 *
 * O(n) where n = number of seat modules.
 */
export function analyzeShape(modules: PlacedModule[]): SofaShape {
  const seats = modules.filter((m) => m.type === 'seat');
  if (seats.length <= 1) return 'linear';

  // Build an instanceId lookup
  const byId = new Map(modules.map((m) => [m.instanceId, m]));

  // Check if any seat has a front/back connection to another seat
  let hasLeftWing = false;
  let hasRightWing = false;

  // Find the main row: seats connected left-to-right
  // Start from the leftmost seat (the one with no left connection to another seat)
  const leftmostSeat = findLeftmostSeat(seats, byId);
  if (!leftmostSeat) return 'linear';

  // Walk the main row left-to-right
  const mainRow = walkMainRow(leftmostSeat, byId);

  // Check front/back connections on the first and last seats in the main row
  const firstSeat = mainRow[0];
  const lastSeat = mainRow[mainRow.length - 1];

  // Check if first seat has a back-connected seat (left wing extends in +Z)
  if (hasPerpSeatConnection(firstSeat, byId)) {
    hasLeftWing = true;
  }

  // Check if last seat has a back-connected seat (right wing extends in +Z)
  if (hasPerpSeatConnection(lastSeat, byId)) {
    hasRightWing = true;
  }

  if (hasLeftWing && hasRightWing) return 'u-shape';
  if (hasRightWing) return 'l-right';
  if (hasLeftWing) return 'l-left';
  return 'linear';
}

/**
 * Get the main row seats (connected via left/right anchors) and
 * the wing seats (connected via front/back anchors).
 */
export function getShapeParts(modules: PlacedModule[]): {
  mainRow: PlacedModule[];
  leftWing: PlacedModule[];
  rightWing: PlacedModule[];
  sides: PlacedModule[];
} {
  const seats = modules.filter((m) => m.type === 'seat');
  const sides = modules.filter((m) => m.type === 'side');
  const byId = new Map(modules.map((m) => [m.instanceId, m]));

  if (seats.length === 0) {
    return { mainRow: [], leftWing: [], rightWing: [], sides };
  }

  const leftmostSeat = findLeftmostSeat(seats, byId);
  if (!leftmostSeat) {
    return { mainRow: seats, leftWing: [], rightWing: [], sides };
  }

  const mainRow = walkMainRow(leftmostSeat, byId);
  const mainRowIds = new Set(mainRow.map((m) => m.instanceId));

  // Wings are seats not in the main row
  const leftWing: PlacedModule[] = [];
  const rightWing: PlacedModule[] = [];

  // Walk from first seat's back to find left wing
  const firstSeat = mainRow[0];
  const firstBackConn = firstSeat.connectedTo.find(
    (c) => (c.anchorId === 'back' || c.anchorId === 'front') && byId.get(c.targetInstanceId)?.type === 'seat'
  );
  if (firstBackConn) {
    let current = byId.get(firstBackConn.targetInstanceId);
    while (current && !mainRowIds.has(current.instanceId)) {
      leftWing.push(current);
      const next = current.connectedTo.find(
        (c) => (c.anchorId === 'back' || c.anchorId === 'front') &&
               byId.get(c.targetInstanceId)?.type === 'seat' &&
               !mainRowIds.has(c.targetInstanceId) &&
               !leftWing.some((w) => w.instanceId === c.targetInstanceId)
      );
      current = next ? byId.get(next.targetInstanceId) : undefined;
    }
  }

  // Walk from last seat's back to find right wing
  const lastSeat = mainRow[mainRow.length - 1];
  const lastBackConn = lastSeat.connectedTo.find(
    (c) => (c.anchorId === 'back' || c.anchorId === 'front') && byId.get(c.targetInstanceId)?.type === 'seat'
  );
  if (lastBackConn) {
    let current = byId.get(lastBackConn.targetInstanceId);
    while (current && !mainRowIds.has(current.instanceId)) {
      rightWing.push(current);
      const next = current.connectedTo.find(
        (c) => (c.anchorId === 'back' || c.anchorId === 'front') &&
               byId.get(c.targetInstanceId)?.type === 'seat' &&
               !mainRowIds.has(c.targetInstanceId) &&
               !rightWing.some((w) => w.instanceId === c.targetInstanceId)
      );
      current = next ? byId.get(next.targetInstanceId) : undefined;
    }
  }

  return { mainRow, leftWing, rightWing, sides };
}

function findLeftmostSeat(
  seats: PlacedModule[],
  byId: Map<string, PlacedModule>
): PlacedModule | undefined {
  // The leftmost seat has no "left" anchor connected to another seat
  return seats.find((seat) => {
    const leftConn = seat.connectedTo.find(
      (c) => c.anchorId === 'left' && byId.get(c.targetInstanceId)?.type === 'seat'
    );
    return !leftConn;
  });
}

function walkMainRow(
  start: PlacedModule,
  byId: Map<string, PlacedModule>
): PlacedModule[] {
  const row: PlacedModule[] = [start];
  let current = start;

  // Walk right via "right" anchor connections
  while (true) {
    const rightConn = current.connectedTo.find(
      (c) => c.anchorId === 'right' && byId.get(c.targetInstanceId)?.type === 'seat'
    );
    if (!rightConn) break;
    const next = byId.get(rightConn.targetInstanceId);
    if (!next) break;
    row.push(next);
    current = next;
  }

  return row;
}

function hasPerpSeatConnection(
  seat: PlacedModule,
  byId: Map<string, PlacedModule>
): boolean {
  return seat.connectedTo.some(
    (c) => (c.anchorId === 'back' || c.anchorId === 'front') &&
           byId.get(c.targetInstanceId)?.type === 'seat'
  );
}
