'use client';

import type { PlacedModule, ModuleType } from '@/types/configurator';
import { MODULE_CATALOG } from '@/lib/config/modules';

interface ModuleRect {
  cx: number;
  cz: number;
  halfW: number;
  halfD: number;
  type: ModuleType;
  w: number;
  d: number;
  rotY: number;
}

interface ConfigSchematicProps {
  modules: PlacedModule[];
  width?: number;
  height?: number;
  className?: string;
}

/**
 * Top-down SVG schematic of a sofa configuration.
 * Draws each module as a rectangle at its world position, scaled to fit the viewport.
 */
export function ConfigSchematic({
  modules,
  width = 200,
  height = 120,
  className,
}: ConfigSchematicProps) {
  if (modules.length === 0) return null;

  // Compute world-space bounding boxes for each module
  const rects = modules.map((mod) => {
    const catalog = MODULE_CATALOG[mod.moduleId];
    if (!catalog) return null;

    const { width: w, depth: d } = catalog.dimensions;
    const rotY = mod.rotation[1];
    const cosR = Math.cos(rotY);
    const sinR = Math.sin(rotY);

    // After Y-rotation, effective extents in world X and Z
    const halfW = Math.abs(w * cosR / 2) + Math.abs(d * sinR / 2);
    const halfD = Math.abs(w * sinR / 2) + Math.abs(d * cosR / 2);

    return {
      cx: mod.position[0],
      cz: mod.position[2],
      halfW,
      halfD,
      type: catalog.type,
      // For drawing the rotated rectangle
      w,
      d,
      rotY,
    };
  }).filter((r): r is ModuleRect => r !== null);

  if (rects.length === 0) return null;

  // Compute bounding box (using axis-aligned extents)
  let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
  for (const r of rects) {
    minX = Math.min(minX, r.cx - r.halfW);
    maxX = Math.max(maxX, r.cx + r.halfW);
    minZ = Math.min(minZ, r.cz - r.halfD);
    maxZ = Math.max(maxZ, r.cz + r.halfD);
  }

  const worldW = maxX - minX || 0.1;
  const worldD = maxZ - minZ || 0.1;

  // Scale to fit viewport with padding
  const pad = 16;
  const innerW = width - pad * 2;
  const innerH = height - pad * 2;
  const scale = Math.min(innerW / worldW, innerH / worldD);

  // Transform world coords → SVG coords
  const toSvgX = (wx: number) => pad + (wx - minX) * scale + (innerW - worldW * scale) / 2;
  const toSvgY = (wz: number) => pad + (wz - minZ) * scale + (innerH - worldD * scale) / 2;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={className}
      aria-label="Sofa configuration preview"
    >
      {rects.map((r, i) => {
        const cx = toSvgX(r.cx);
        const cy = toSvgY(r.cz);
        const sw = r.w * scale;
        const sd = r.d * scale;
        const rotDeg = -(r.rotY * 180) / Math.PI;

        const fill = r.type === 'seat' ? '#d4c9b8' : '#a89880';
        const stroke = r.type === 'seat' ? '#b8a894' : '#8c7d6a';

        return (
          <rect
            key={i}
            x={cx - sw / 2}
            y={cy - sd / 2}
            width={sw}
            height={sd}
            rx={2}
            fill={fill}
            stroke={stroke}
            strokeWidth={1}
            transform={`rotate(${rotDeg}, ${cx}, ${cy})`}
          />
        );
      })}
    </svg>
  );
}
