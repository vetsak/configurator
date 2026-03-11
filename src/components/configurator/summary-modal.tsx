'use client';

import { useMemo } from 'react';
import { useStore } from '@/stores';
import { MODULE_CATALOG } from '@/lib/config/modules';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';

/* ── Spec dimensions ─────────────────────────────────────── */

const MODULE_SPECS: Record<string, { height: number; length: number; width: number }> = {
  'seat-xs': { height: 37, length: 84, width: 63 },
  'seat-s':  { height: 37, length: 105, width: 63 },
  'seat-m':  { height: 37, length: 84, width: 84 },
  'seat-l':  { height: 37, length: 105, width: 84 },
  'seat-xl': { height: 37, length: 105, width: 105 },
  'side-s':  { height: 60, length: 63, width: 31 },
  'side-m':  { height: 60, length: 84, width: 31 },
  'side-l':  { height: 60, length: 105, width: 31 },
};

const SIZE_LABEL: Record<string, string> = {
  xs: 'XS', s: 'S', m: 'M', l: 'L', xl: 'XL',
};

/* ── Isometric renderer ──────────────────────────────────── */

const COS30 = Math.cos(Math.PI / 6);
const SIN30 = 0.5;

function isoProject(x: number, y: number, z: number): [number, number] {
  return [
    (x - z) * COS30,
    (x + z) * SIN30 - y,
  ];
}

interface IsoBox {
  x: number; z: number; // center position (cm)
  w: number; d: number; h: number; // dimensions (cm)
  type: 'seat' | 'side';
}

const COLORS = {
  seat: { top: '#d4c5a9', left: '#c1b294', right: '#ae9f80', stroke: '#9a8d72' },
  side: { top: '#c8b99a', left: '#b5a688', right: '#a29377', stroke: '#8e8068' },
};

function renderIsoBox(box: IsoBox, scale: number) {
  const { x, z, w, d, h, type } = box;
  const hw = (w / 2) * scale;
  const hd = (d / 2) * scale;
  const sh = h * scale;
  const c = COLORS[type];

  // 8 corners
  const tfl = isoProject(x * scale - hw, sh, z * scale - hd);
  const tfr = isoProject(x * scale + hw, sh, z * scale - hd);
  const tbl = isoProject(x * scale - hw, sh, z * scale + hd);
  const tbr = isoProject(x * scale + hw, sh, z * scale + hd);
  const bfl = isoProject(x * scale - hw, 0, z * scale - hd);
  const bfr = isoProject(x * scale + hw, 0, z * scale - hd);
  const bbl = isoProject(x * scale - hw, 0, z * scale + hd);

  const topPath = `M${tfl[0]},${tfl[1]} L${tfr[0]},${tfr[1]} L${tbr[0]},${tbr[1]} L${tbl[0]},${tbl[1]} Z`;
  const leftPath = `M${tfl[0]},${tfl[1]} L${tbl[0]},${tbl[1]} L${bbl[0]},${bbl[1]} L${bfl[0]},${bfl[1]} Z`;
  const rightPath = `M${tfl[0]},${tfl[1]} L${tfr[0]},${tfr[1]} L${bfr[0]},${bfr[1]} L${bfl[0]},${bfl[1]} Z`;

  return (
    <>
      <path d={leftPath} fill={c.left} stroke={c.stroke} strokeWidth={0.8} />
      <path d={rightPath} fill={c.right} stroke={c.stroke} strokeWidth={0.8} />
      <path d={topPath} fill={c.top} stroke={c.stroke} strokeWidth={0.8} />
    </>
  );
}

interface Variation {
  name: string;
  boxes: IsoBox[];
  totalW: number;
  totalD: number;
}

function generateVariations(
  seatCount: number,
  seatId: string,
  sideId: string,
): Variation[] {
  const ss = MODULE_SPECS[seatId] ?? { height: 37, length: 84, width: 84 };
  const sd = MODULE_SPECS[sideId] ?? { height: 60, length: 84, width: 31 };
  const seatW = ss.length; // x-extent
  const seatD = ss.width;  // z-extent
  const sideW = sd.length;
  const sideD = sd.width;
  const seatH = ss.height;
  const sideH = sd.height;

  const variations: Variation[] = [];

  // Helper: build a linear arrangement
  const buildLinear = (n: number): IsoBox[] => {
    const boxes: IsoBox[] = [];
    const totalSeatsW = n * seatW;
    const startX = -totalSeatsW / 2 + seatW / 2;
    for (let i = 0; i < n; i++) {
      boxes.push({ x: startX + i * seatW, z: 0, w: seatW, d: seatD, h: seatH, type: 'seat' });
    }
    // Side left
    boxes.push({ x: startX - seatW / 2 - sideD / 2, z: 0, w: sideW, d: sideD, h: sideH, type: 'side' });
    // Side right
    boxes.push({ x: startX + (n - 1) * seatW + seatW / 2 + sideD / 2, z: 0, w: sideW, d: sideD, h: sideH, type: 'side' });
    return boxes;
  };

  // Helper: build L-shape (right)
  const buildLRight = (mainCount: number, wingCount: number): IsoBox[] => {
    const boxes: IsoBox[] = [];
    const totalMainW = mainCount * seatW;
    const startX = -totalMainW / 2 + seatW / 2;
    // Main row
    for (let i = 0; i < mainCount; i++) {
      boxes.push({ x: startX + i * seatW, z: 0, w: seatW, d: seatD, h: seatH, type: 'seat' });
    }
    // Right wing (going forward, +Z)
    const wingX = startX + (mainCount - 1) * seatW;
    for (let i = 0; i < wingCount; i++) {
      boxes.push({ x: wingX, z: seatD / 2 + seatW / 2 + i * seatW, w: seatD, d: seatW, h: seatH, type: 'seat' });
    }
    // Sides: left of main, back of wing
    boxes.push({ x: startX - seatW / 2 - sideD / 2, z: 0, w: sideW, d: sideD, h: sideH, type: 'side' });
    const lastWingZ = seatD / 2 + seatW / 2 + (wingCount - 1) * seatW;
    boxes.push({ x: wingX, z: lastWingZ + seatW / 2 + sideD / 2, w: sideW, d: sideD, h: sideH, type: 'side' });
    return boxes;
  };

  // Helper: build L-shape (left)
  const buildLLeft = (mainCount: number, wingCount: number): IsoBox[] => {
    const boxes: IsoBox[] = [];
    const totalMainW = mainCount * seatW;
    const startX = -totalMainW / 2 + seatW / 2;
    // Main row
    for (let i = 0; i < mainCount; i++) {
      boxes.push({ x: startX + i * seatW, z: 0, w: seatW, d: seatD, h: seatH, type: 'seat' });
    }
    // Left wing (going forward, +Z)
    for (let i = 0; i < wingCount; i++) {
      boxes.push({ x: startX, z: seatD / 2 + seatW / 2 + i * seatW, w: seatD, d: seatW, h: seatH, type: 'seat' });
    }
    // Sides: right of main, back of wing
    boxes.push({ x: startX + (mainCount - 1) * seatW + seatW / 2 + sideD / 2, z: 0, w: sideW, d: sideD, h: sideH, type: 'side' });
    const lastWingZ = seatD / 2 + seatW / 2 + (wingCount - 1) * seatW;
    boxes.push({ x: startX, z: lastWingZ + seatW / 2 + sideD / 2, w: sideW, d: sideD, h: sideH, type: 'side' });
    return boxes;
  };

  // Helper: compute total W & D
  const computeDims = (boxes: IsoBox[]) => {
    let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
    for (const b of boxes) {
      minX = Math.min(minX, b.x - b.w / 2);
      maxX = Math.max(maxX, b.x + b.w / 2);
      minZ = Math.min(minZ, b.z - b.d / 2);
      maxZ = Math.max(maxZ, b.z + b.d / 2);
    }
    return { totalW: Math.round(maxX - minX), totalD: Math.round(maxZ - minZ) };
  };

  if (seatCount >= 1) {
    const linear = buildLinear(seatCount);
    const d = computeDims(linear);
    variations.push({ name: `${seatCount}-Seat Linear`, boxes: linear, ...d });
  }

  if (seatCount >= 3) {
    const lr = buildLRight(seatCount - 1, 1);
    const d = computeDims(lr);
    variations.push({ name: 'L-Shape Right', boxes: lr, ...d });
  }

  if (seatCount >= 3) {
    const ll = buildLLeft(seatCount - 1, 1);
    const d = computeDims(ll);
    variations.push({ name: 'L-Shape Left', boxes: ll, ...d });
  }

  if (seatCount >= 5) {
    // U-shape: main row (n-2), 1 left wing, 1 right wing
    const mainN = seatCount - 2;
    const uBoxes: IsoBox[] = [];
    const totalMainW = mainN * seatW;
    const startX = -totalMainW / 2 + seatW / 2;
    for (let i = 0; i < mainN; i++) {
      uBoxes.push({ x: startX + i * seatW, z: 0, w: seatW, d: seatD, h: seatH, type: 'seat' });
    }
    // Left wing
    uBoxes.push({ x: startX, z: seatD / 2 + seatW / 2, w: seatD, d: seatW, h: seatH, type: 'seat' });
    // Right wing
    uBoxes.push({ x: startX + (mainN - 1) * seatW, z: seatD / 2 + seatW / 2, w: seatD, d: seatW, h: seatH, type: 'seat' });
    // Sides at end of wings
    const wingZ = seatD / 2 + seatW / 2;
    uBoxes.push({ x: startX, z: wingZ + seatW / 2 + sideD / 2, w: sideW, d: sideD, h: sideH, type: 'side' });
    uBoxes.push({ x: startX + (mainN - 1) * seatW, z: wingZ + seatW / 2 + sideD / 2, w: sideW, d: sideD, h: sideH, type: 'side' });
    const d = computeDims(uBoxes);
    variations.push({ name: 'U-Shape', boxes: uBoxes, ...d });
  }

  return variations;
}

function IsometricVariation({ variation }: { variation: Variation }) {
  const { boxes, totalW, totalD } = variation;

  // Get bounding box of all boxes in cm
  let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
  let maxH = 0;
  for (const b of boxes) {
    minX = Math.min(minX, b.x - b.w / 2);
    maxX = Math.max(maxX, b.x + b.w / 2);
    minZ = Math.min(minZ, b.z - b.d / 2);
    maxZ = Math.max(maxZ, b.z + b.d / 2);
    maxH = Math.max(maxH, b.h);
  }
  const cmW = maxX - minX;
  const cmD = maxZ - minZ;

  // Scale to fit in ~220px wide isometric view
  const targetPx = 180;
  const isoExtentW = (cmW + cmD) * COS30;
  const scale = targetPx / (isoExtentW || 1);

  // Center the boxes
  const centerX = (minX + maxX) / 2;
  const centerZ = (minZ + maxZ) / 2;
  const centered = boxes.map(b => ({ ...b, x: b.x - centerX, z: b.z - centerZ }));

  // Project bounding corners to get SVG bounds
  const projections: [number, number][] = [];
  for (const b of centered) {
    const corners = [
      [b.x - b.w / 2, 0, b.z - b.d / 2],
      [b.x + b.w / 2, 0, b.z - b.d / 2],
      [b.x - b.w / 2, 0, b.z + b.d / 2],
      [b.x + b.w / 2, 0, b.z + b.d / 2],
      [b.x - b.w / 2, b.h, b.z - b.d / 2],
      [b.x + b.w / 2, b.h, b.z - b.d / 2],
      [b.x - b.w / 2, b.h, b.z + b.d / 2],
      [b.x + b.w / 2, b.h, b.z + b.d / 2],
    ];
    for (const c of corners) {
      projections.push(isoProject(c[0] * scale, c[1] * scale, c[2] * scale));
    }
  }

  let svgMinX = Infinity, svgMaxX = -Infinity, svgMinY = Infinity, svgMaxY = -Infinity;
  for (const [px, py] of projections) {
    svgMinX = Math.min(svgMinX, px);
    svgMaxX = Math.max(svgMaxX, px);
    svgMinY = Math.min(svgMinY, py);
    svgMaxY = Math.max(svgMaxY, py);
  }

  const pad = 40;
  const svgW = svgMaxX - svgMinX + pad * 2;
  const svgH = svgMaxY - svgMinY + pad * 2;
  const offsetX = -svgMinX + pad;
  const offsetY = -svgMinY + pad;

  // Sort boxes: back-to-front for painter's algorithm (higher z + higher x drawn last)
  const sorted = [...centered].sort((a, b) => (a.z + a.x) - (b.z + b.x));

  // Dimension lines positions
  // Width line: across the top-front
  const wLeft = isoProject((-cmW / 2) * scale, 0, (-cmD / 2) * scale);
  const wRight = isoProject((cmW / 2) * scale, 0, (-cmD / 2) * scale);
  const wMid = [(wLeft[0] + wRight[0]) / 2, (wLeft[1] + wRight[1]) / 2];
  // Depth line: along the left side
  const dFront = isoProject((-cmW / 2) * scale, 0, (-cmD / 2) * scale);
  const dBack = isoProject((-cmW / 2) * scale, 0, (cmD / 2) * scale);
  const dMid = [(dFront[0] + dBack[0]) / 2, (dFront[1] + dBack[1]) / 2];

  const lineOff = 14;

  return (
    <div className="flex flex-col items-center">
      <svg
        width={svgW}
        height={svgH + 10}
        viewBox={`0 0 ${svgW} ${svgH + 10}`}
        className="max-w-full"
      >
        <g transform={`translate(${offsetX}, ${offsetY + 5})`}>
          {/* Depth dimension (left side) */}
          <g>
            <line
              x1={dFront[0] - lineOff} y1={dFront[1]}
              x2={dBack[0] - lineOff} y2={dBack[1]}
              stroke="#333" strokeWidth={0.8}
            />
            <line
              x1={dFront[0] - lineOff - 4} y1={dFront[1]}
              x2={dFront[0] - lineOff + 4} y2={dFront[1]}
              stroke="#333" strokeWidth={0.8}
            />
            <line
              x1={dBack[0] - lineOff - 4} y1={dBack[1]}
              x2={dBack[0] - lineOff + 4} y2={dBack[1]}
              stroke="#333" strokeWidth={0.8}
            />
            <text
              x={dMid[0] - lineOff - 4}
              y={dMid[1] - 6}
              textAnchor="middle"
              fill="#333"
              fontSize={11}
              fontStyle="italic"
              fontFamily="inherit"
            >
              {totalD}
            </text>
          </g>

          {/* Width dimension (bottom-right) */}
          <g>
            <line
              x1={wLeft[0]} y1={wLeft[1] + lineOff}
              x2={wRight[0]} y2={wRight[1] + lineOff}
              stroke="#333" strokeWidth={0.8}
            />
            <line
              x1={wLeft[0]} y1={wLeft[1] + lineOff - 4}
              x2={wLeft[0]} y2={wLeft[1] + lineOff + 4}
              stroke="#333" strokeWidth={0.8}
            />
            <line
              x1={wRight[0]} y1={wRight[1] + lineOff - 4}
              x2={wRight[0]} y2={wRight[1] + lineOff + 4}
              stroke="#333" strokeWidth={0.8}
            />
            <text
              x={wMid[0]}
              y={wMid[1] + lineOff + 16}
              textAnchor="middle"
              fill="#333"
              fontSize={11}
              fontStyle="italic"
              fontFamily="inherit"
            >
              {totalW}
            </text>
          </g>

          {/* Isometric boxes */}
          {sorted.map((box, i) => (
            <g key={i}>{renderIsoBox(box, scale)}</g>
          ))}
        </g>
      </svg>
    </div>
  );
}

/* ── Top-down schematic (existing) ───────────────────────── */

function TopDownSchematic({ data }: { data: SchematicData }) {
  const DRAW_W = 260;
  const padding = 40;
  const scale = Math.min(
    (DRAW_W - padding) / (data.sofaW || 1),
    (DRAW_W - padding) / (data.sofaD || 1),
  );
  const drawH = data.sofaD * scale + padding;
  const dimLineOffset = 16;

  const leftEdge = data.rects.length > 0
    ? padding / 2 + Math.min(...data.rects.map(r => (r.cx - data.minX - r.halfW) * scale))
    : padding / 2;
  const rightEdge = data.rects.length > 0
    ? padding / 2 + Math.max(...data.rects.map(r => (r.cx - data.minX + r.halfW) * scale))
    : DRAW_W - padding / 2;

  return (
    <svg
      width={DRAW_W}
      height={drawH + dimLineOffset * 2 + 20}
      viewBox={`0 0 ${DRAW_W} ${drawH + dimLineOffset * 2 + 20}`}
    >
      {/* Width dimension (top) */}
      <g transform={`translate(0, ${dimLineOffset})`}>
        <line x1={leftEdge} y1={0} x2={rightEdge} y2={0} stroke="#333" strokeWidth={1} />
        <line x1={leftEdge} y1={-4} x2={leftEdge} y2={4} stroke="#333" strokeWidth={1} />
        <line x1={rightEdge} y1={-4} x2={rightEdge} y2={4} stroke="#333" strokeWidth={1} />
        <text x={(leftEdge + rightEdge) / 2} y={-6} textAnchor="middle" fill="#333" fontSize={12}>{data.totalW}</text>
      </g>

      {/* Modules */}
      <g transform={`translate(${padding / 2}, ${dimLineOffset * 2 + 10})`}>
        {data.rects.map((r, i) => {
          const x = (r.cx - data.minX - r.halfW) * scale;
          const y = (r.cz - data.minZ - r.halfD) * scale;
          const w = r.halfW * 2 * scale;
          const h = r.halfD * 2 * scale;
          return (
            <g key={i}>
              <rect x={x} y={y} width={w} height={h} rx={4} fill="#f5f5ef" stroke="#ccc" strokeWidth={1} />
              <text x={x + w / 2} y={y + h / 2} textAnchor="middle" dominantBaseline="central" fill="#333" fontSize={13} fontWeight={600}>{r.label}</text>
            </g>
          );
        })}
      </g>

      {/* Depth dimension (left) */}
      <g transform={`translate(${padding / 2 - dimLineOffset}, ${dimLineOffset * 2 + 10})`}>
        {(() => {
          const topY = data.rects.length > 0 ? Math.min(...data.rects.map(r => (r.cz - data.minZ - r.halfD) * scale)) : 0;
          const botY = data.rects.length > 0 ? Math.max(...data.rects.map(r => (r.cz - data.minZ + r.halfD) * scale)) : 0;
          const midY = (topY + botY) / 2;
          return (
            <>
              <line x1={0} y1={topY} x2={0} y2={botY} stroke="#333" strokeWidth={1} />
              <line x1={-4} y1={topY} x2={4} y2={topY} stroke="#333" strokeWidth={1} />
              <line x1={-4} y1={botY} x2={4} y2={botY} stroke="#333" strokeWidth={1} />
              <text x={-2} y={midY} textAnchor="middle" dominantBaseline="central" fill="#333" fontSize={12} transform={`rotate(-90, -2, ${midY})`}>{data.totalD}</text>
            </>
          );
        })()}
      </g>
    </svg>
  );
}

/* ── Types ────────────────────────────────────────────────── */

interface SchematicData {
  totalW: number;
  totalD: number;
  totalH: number;
  counts: Array<{ count: number; name: string; dimLabel: string }>;
  rects: Array<{ cx: number; cz: number; halfW: number; halfD: number; label: string }>;
  minX: number; minZ: number;
  sofaW: number; sofaD: number;
  seatCount: number;
  primarySeatId: string;
  primarySideId: string;
}

/* ── Main modal ──────────────────────────────────────────── */

interface SummaryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SummaryModal({ open, onOpenChange }: SummaryModalProps) {
  const modules = useStore((s) => s.modules);

  const data = useMemo((): SchematicData | null => {
    if (modules.length === 0) return null;

    let minX = Infinity, maxX = -Infinity;
    let minZ = Infinity, maxZ = -Infinity;
    let maxHeight = 0;

    const counts: Record<string, { count: number; name: string; dimLabel: string }> = {};
    const rects: SchematicData['rects'] = [];

    // Track most common seat/side for variation generation
    const seatCounts: Record<string, number> = {};
    const sideCounts: Record<string, number> = {};
    let totalSeats = 0;

    for (const mod of modules) {
      const catalog = MODULE_CATALOG[mod.moduleId];
      if (!catalog) continue;
      if (catalog.type !== 'seat' && catalog.type !== 'side') continue;

      const spec = MODULE_SPECS[mod.moduleId];
      const ry = mod.rotation[1];
      const cosR = Math.abs(Math.cos(ry));
      const sinR = Math.abs(Math.sin(ry));

      const lenCm = spec?.length ?? Math.round(catalog.dimensions.width * 100);
      const widCm = spec?.width ?? Math.round(catalog.dimensions.depth * 100);
      const hCm = spec?.height ?? Math.round(catalog.dimensions.height * 100);

      const halfX = (lenCm * cosR + widCm * sinR) / 2;
      const halfZ = (lenCm * sinR + widCm * cosR) / 2;
      const cx = mod.position[0] * 100;
      const cz = mod.position[2] * 100;

      minX = Math.min(minX, cx - halfX);
      maxX = Math.max(maxX, cx + halfX);
      minZ = Math.min(minZ, cz - halfZ);
      maxZ = Math.max(maxZ, cz + halfZ);
      maxHeight = Math.max(maxHeight, hCm);

      const key = mod.moduleId;
      if (!counts[key]) {
        const sizeLabel = SIZE_LABEL[catalog.size] ?? catalog.size.toUpperCase();
        const typeName = catalog.type === 'seat' ? 'Seat' : 'Side';
        counts[key] = { count: 0, name: `${typeName} ${sizeLabel}`, dimLabel: `(${lenCm} x ${widCm})` };
      }
      counts[key].count++;

      if (catalog.type === 'seat') {
        seatCounts[mod.moduleId] = (seatCounts[mod.moduleId] || 0) + 1;
        totalSeats++;
      }
      if (catalog.type === 'side') {
        sideCounts[mod.moduleId] = (sideCounts[mod.moduleId] || 0) + 1;
      }

      const sizeLabel = SIZE_LABEL[catalog.size] ?? catalog.size.toUpperCase();
      rects.push({ cx, cz, halfW: halfX, halfD: halfZ, label: sizeLabel });
    }

    // Most common seat/side module
    const primarySeatId = Object.entries(seatCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'seat-m';
    const primarySideId = Object.entries(sideCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'side-m';

    return {
      totalW: Math.round(maxX - minX),
      totalD: Math.round(maxZ - minZ),
      totalH: maxHeight,
      counts: Object.values(counts),
      rects,
      minX, minZ,
      sofaW: maxX - minX,
      sofaD: maxZ - minZ,
      seatCount: totalSeats,
      primarySeatId,
      primarySideId,
    };
  }, [modules]);

  const variations = useMemo(() => {
    if (!data || data.seatCount < 2) return [];
    return generateVariations(data.seatCount, data.primarySeatId, data.primarySideId);
  }, [data]);

  if (!data) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton
        className="max-w-[430px] rounded-[16px] border-none p-0 max-h-[90vh] overflow-y-auto"
      >
        <div className="px-[24px] pt-[24px] pb-[32px]">
          <DialogTitle className="sr-only">Sofa Details</DialogTitle>

          {/* Top-down schematic */}
          <div className="flex justify-center mb-[28px]">
            <TopDownSchematic data={data} />
          </div>

          {/* Dimensions */}
          <div className="mb-[24px]">
            <p className="text-[14px] font-medium text-black mb-[6px]">
              Dimensions (W x D x H) (cm):
            </p>
            <p className="text-[14px] text-black">
              {data.totalW} cm x {data.totalD} cm x {data.totalH} cm (seating height)
            </p>
          </div>

          {/* Module count */}
          <div className="mb-[24px]">
            <p className="text-[14px] font-medium text-black mb-[6px]">
              Number of modules:
            </p>
            {data.counts.map((c, i) => (
              <p key={i} className="text-[14px] text-black">
                {c.count} x {c.name} {c.dimLabel}
              </p>
            ))}
          </div>

          {/* What's in the box */}
          <div className="mb-[24px]">
            <p className="text-[14px] font-medium text-black mb-[6px]">
              What&apos;s in the box?
            </p>
            <ul className="list-disc pl-[20px] text-[14px] text-black space-y-[2px]">
              <li>EPP sofa foundation form</li>
              <li>Sofa inner foam pad</li>
              <li>Foam-filled inner sofa quilt</li>
              <li>Sofa cover</li>
            </ul>
          </div>

          {/* Possible product variations */}
          {variations.length > 1 && (
            <div>
              <p className="text-[14px] font-medium text-black italic mb-[12px]">
                Possible product variations
              </p>
              <div className="flex flex-col gap-[8px]">
                {variations.map((v, i) => (
                  <IsometricVariation key={i} variation={v} />
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
