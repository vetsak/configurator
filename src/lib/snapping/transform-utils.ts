/**
 * Y-rotation math utilities for 2D anchor-based snapping.
 * All rotations are around the Y axis (XZ plane movement).
 */

/** Apply a Y-axis rotation to a 3D point. */
export function applyYRotation(
  point: [number, number, number],
  angle: number
): [number, number, number] {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return [
    point[0] * cos + point[2] * sin,
    point[1],
    -point[0] * sin + point[2] * cos,
  ];
}

/** Transform a local anchor position to world space given module position and Y-rotation. */
export function transformAnchorToWorld(
  anchorPos: [number, number, number],
  modulePos: [number, number, number],
  moduleRotationY: number
): [number, number, number] {
  const rotated = applyYRotation(anchorPos, moduleRotationY);
  return [
    modulePos[0] + rotated[0],
    modulePos[1] + rotated[1],
    modulePos[2] + rotated[2],
  ];
}

/** Transform a local anchor direction to world space given module Y-rotation. */
export function transformDirectionToWorld(
  anchorDir: [number, number, number],
  moduleRotationY: number
): [number, number, number] {
  return applyYRotation(anchorDir, moduleRotationY);
}

/** XZ-plane distance between two 3D points (ignores Y). */
export function distance2D(
  a: [number, number, number],
  b: [number, number, number]
): number {
  const dx = a[0] - b[0];
  const dz = a[2] - b[2];
  return Math.sqrt(dx * dx + dz * dz);
}

/** Compute the dot product of two 3D vectors. */
export function dot3(
  a: [number, number, number],
  b: [number, number, number]
): number {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}
