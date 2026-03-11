import type { PlacedModule } from '@/types/configurator';
import { MODULE_CATALOG } from '@/lib/config/modules';

/**
 * Compute a position for an accessory (pillow/noodle) on top of a seat.
 *
 * Strategy:
 * - Accessories sit on the seat surface (y = seat height)
 * - Back pillows & noodles go toward the rear (negative Z in local space)
 * - Deco pillows go center or slightly forward
 * - Jumbo pillows go center, slightly elevated
 * - Multiple accessories on the same seat spread left-to-right
 */

/** Seat surface height in meters (models are in cm, UNIT_SCALE=0.01) */
const SEAT_SURFACE_Y = 0.385;

/** How far from seat center to push back pillows (fraction of half-depth) */
const BACK_OFFSET_RATIO = 0.6;

interface PlacementResult {
  position: [number, number, number];
  rotation: [number, number, number];
  parentSeatId: string;
}

/**
 * Find the best seat to place an accessory on and compute its position.
 * Prefers the selected seat, then distributes evenly across seats.
 */
export function computeAccessoryPlacement(
  accessoryCatalogId: string,
  modules: PlacedModule[],
  selectedSeatId: string | null,
): PlacementResult | null {
  const accessory = MODULE_CATALOG[accessoryCatalogId];
  if (!accessory) return null;

  // Get all seat modules
  const seats = modules.filter((m) => m.type === 'seat');
  if (seats.length === 0) return null;

  // Get existing accessories
  const accessories = modules.filter(
    (m) => m.type === 'pillow' || m.type === 'noodle'
  );

  // Count accessories per seat (by proximity to seat center)
  const accessoriesPerSeat = new Map<string, PlacedModule[]>();
  for (const seat of seats) {
    accessoriesPerSeat.set(seat.instanceId, []);
  }
  for (const acc of accessories) {
    const closest = findClosestSeat(acc.position, seats);
    if (closest) {
      accessoriesPerSeat.get(closest.instanceId)?.push(acc);
    }
  }

  // Pick target seat: selected > least accessories > first
  let targetSeat: PlacedModule;
  if (selectedSeatId) {
    const selected = seats.find((s) => s.instanceId === selectedSeatId);
    targetSeat = selected ?? pickLeastLoadedSeat(seats, accessoriesPerSeat);
  } else {
    targetSeat = pickLeastLoadedSeat(seats, accessoriesPerSeat);
  }

  const seatCatalog = MODULE_CATALOG[targetSeat.moduleId];
  if (!seatCatalog) return null;

  const existingOnSeat = accessoriesPerSeat.get(targetSeat.instanceId) ?? [];
  const position = computePositionOnSeat(
    accessoryCatalogId,
    targetSeat,
    seatCatalog.dimensions,
    existingOnSeat.length,
  );

  return {
    position,
    rotation: [0, targetSeat.rotation[1], 0],
    parentSeatId: targetSeat.instanceId,
  };
}

function findClosestSeat(
  pos: [number, number, number],
  seats: PlacedModule[],
): PlacedModule | null {
  let closest: PlacedModule | null = null;
  let minDist = Infinity;
  for (const seat of seats) {
    const dx = pos[0] - seat.position[0];
    const dz = pos[2] - seat.position[2];
    const dist = dx * dx + dz * dz;
    if (dist < minDist) {
      minDist = dist;
      closest = seat;
    }
  }
  return closest;
}

function pickLeastLoadedSeat(
  seats: PlacedModule[],
  accessoriesPerSeat: Map<string, PlacedModule[]>,
): PlacedModule {
  let best = seats[0];
  let minCount = Infinity;
  for (const seat of seats) {
    const count = accessoriesPerSeat.get(seat.instanceId)?.length ?? 0;
    if (count < minCount) {
      minCount = count;
      best = seat;
    }
  }
  return best;
}

function computePositionOnSeat(
  accessoryId: string,
  seat: PlacedModule,
  seatDims: { width: number; depth: number; height: number },
  existingCount: number,
): [number, number, number] {
  const seatY = seat.position[1];
  const surfaceY = seatY + SEAT_SURFACE_Y;

  // Base position is seat center at surface height
  let localX = 0;
  let localZ = 0;

  // Determine placement zone based on accessory type
  const isNoodle = accessoryId === 'noodle';
  const isBack = accessoryId === 'pillow-back';
  const isJumbo = accessoryId.startsWith('jumbo-');

  if (isNoodle || isBack) {
    // Back pillows and noodles go toward the rear of the seat
    localZ = -seatDims.depth * BACK_OFFSET_RATIO * 0.5;
  } else if (isJumbo) {
    // Jumbo pillows centered
    localZ = 0;
  } else {
    // Deco pillows go slightly forward
    localZ = seatDims.depth * 0.1;
  }

  // Spread multiple accessories left-to-right
  if (existingCount > 0) {
    const spread = seatDims.width * 0.3;
    // Alternate left/right from center
    const offset = existingCount % 2 === 0 ? spread : -spread;
    localX = offset * Math.ceil(existingCount / 2) * 0.5;
  }

  // Apply seat rotation to local offset
  const seatRot = seat.rotation[1];
  const cosR = Math.cos(seatRot);
  const sinR = Math.sin(seatRot);
  const worldX = seat.position[0] + localX * cosR - localZ * sinR;
  const worldZ = seat.position[2] + localX * sinR + localZ * cosR;

  return [worldX, surfaceY, worldZ];
}
