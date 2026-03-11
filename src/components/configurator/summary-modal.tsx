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

/* ── Isometric SVG Renderer ──────────────────────────────── */

const COS30 = Math.cos(Math.PI / 6); // 0.866
const SIN30 = 0.5;
const ISO_SCALE = 1.8; // px per cm
const FILL = '#B8AB8A';
const STROKE = '#1F1F1F';
const SW = 1.5;

/** Convert 3D (x, y, z) to 2D isometric screen coords */
function iso(x: number, y: number, z: number): [number, number] {
  return [
    (x - z) * COS30,
    (x + z) * SIN30 - y,
  ];
}

/** Build an isometric box path (top, right face, left face) for a module */
function isoBoxPaths(
  ox: number, oz: number,
  w: number, d: number, h: number,
): { top: string; right: string; left: string } {
  // 8 corners of the box
  const tfl = iso(ox, h, oz);
  const tfr = iso(ox + w, h, oz);
  const tbl = iso(ox, h, oz + d);
  const tbr = iso(ox + w, h, oz + d);
  const bfl = iso(ox, 0, oz);
  const bfr = iso(ox + w, 0, oz);
  const bbl = iso(ox, 0, oz + d);
  // const bbr = iso(ox + w, 0, oz + d); // hidden

  const top = `M${tfl[0]},${tfl[1]} L${tfr[0]},${tfr[1]} L${tbr[0]},${tbr[1]} L${tbl[0]},${tbl[1]} Z`;
  const right = `M${tfr[0]},${tfr[1]} L${bfr[0]},${bfr[1]} L${bbl[0]},${bbl[1]} L${tbr[0]},${tbr[1]} Z`;
  const left = `M${tfl[0]},${tfl[1]} L${bfl[0]},${bfl[1]} L${bbl[0]},${bbl[1]} L${tbl[0]},${tbl[1]} Z`;

  return { top, right, left };
}

/** Cushion crease line on top face (horizontal division) */
function topCreasePath(ox: number, oz: number, w: number, d: number, h: number, ratio: number): string {
  const p1 = iso(ox, h, oz + d * ratio);
  const p2 = iso(ox + w, h, oz + d * ratio);
  return `M${p1[0]},${p1[1]} L${p2[0]},${p2[1]}`;
}

/** Vertical crease on right face */
function rightCreasePath(ox: number, oz: number, w: number, d: number, h: number, ratio: number): string {
  const p1 = iso(ox + w, h, oz + d * ratio);
  const p2 = iso(ox + w, 0, oz + d * ratio);
  return `M${p1[0]},${p1[1]} L${p2[0]},${p2[1]}`;
}

interface IsoModule {
  ox: number; oz: number;
  w: number; d: number; h: number;
  type: 'seat' | 'side';
  label: string;
}

function IsometricSofa({ modules: isoModules, totalW, totalD }: {
  modules: IsoModule[];
  totalW: number;
  totalD: number;
}) {
  if (isoModules.length === 0) return null;

  // Compute all iso points to find bounding box
  const allPts: [number, number][] = [];
  for (const m of isoModules) {
    const s = ISO_SCALE;
    const corners = [
      iso(m.ox * s, m.h * s, m.oz * s),
      iso((m.ox + m.w) * s, m.h * s, m.oz * s),
      iso(m.ox * s, m.h * s, (m.oz + m.d) * s),
      iso((m.ox + m.w) * s, m.h * s, (m.oz + m.d) * s),
      iso(m.ox * s, 0, m.oz * s),
      iso((m.ox + m.w) * s, 0, m.oz * s),
      iso(m.ox * s, 0, (m.oz + m.d) * s),
      iso((m.ox + m.w) * s, 0, (m.oz + m.d) * s),
    ];
    allPts.push(...corners);
  }

  const xs = allPts.map(p => p[0]);
  const ys = allPts.map(p => p[1]);
  const minPx = Math.min(...xs);
  const maxPx = Math.max(...xs);
  const minPy = Math.min(...ys);
  const maxPy = Math.max(...ys);

  const pad = 50;
  const svgW = maxPx - minPx + pad * 2;
  const svgH = maxPy - minPy + pad * 2;
  const offsetX = -minPx + pad;
  const offsetY = -minPy + pad;

  // Dimension label positions
  const widthLabelAngle = -30;
  const depthLabelAngle = 30;

  // Front-left corner (for width dimension line)
  const frontLeftBottom = iso(isoModules[0].ox * ISO_SCALE, 0, isoModules[0].oz * ISO_SCALE);
  // We'll place dimension labels at corners
  const widthStart = iso(
    Math.min(...isoModules.map(m => m.ox)) * ISO_SCALE,
    0,
    Math.max(...isoModules.map(m => m.oz + m.d)) * ISO_SCALE
  );
  const widthEnd = iso(
    Math.max(...isoModules.map(m => m.ox + m.w)) * ISO_SCALE,
    0,
    Math.max(...isoModules.map(m => m.oz + m.d)) * ISO_SCALE
  );
  const depthStart = iso(
    Math.max(...isoModules.map(m => m.ox + m.w)) * ISO_SCALE,
    0,
    Math.min(...isoModules.map(m => m.oz)) * ISO_SCALE
  );
  const depthEnd = iso(
    Math.max(...isoModules.map(m => m.ox + m.w)) * ISO_SCALE,
    0,
    Math.max(...isoModules.map(m => m.oz + m.d)) * ISO_SCALE
  );

  return (
    <svg
      width="100%"
      viewBox={`0 0 ${Math.round(svgW)} ${Math.round(svgH)}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g transform={`translate(${offsetX}, ${offsetY})`}>
        {/* Render modules back-to-front (sort by oz desc then ox asc for proper overlap) */}
        {[...isoModules]
          .sort((a, b) => (a.oz + a.oz) - (b.oz + b.oz) || a.ox - b.ox)
          .map((m, i) => {
            const s = ISO_SCALE;
            const paths = isoBoxPaths(m.ox * s, m.oz * s, m.w * s, m.d * s, m.h * s);

            const isSide = m.type === 'side';
            const seatH = m.h * s;

            return (
              <g key={i}>
                {/* Left face (darker shade) */}
                <path d={paths.left} fill={FILL} stroke={STROKE} strokeWidth={SW} strokeMiterlimit={10} opacity={0.85} />
                {/* Right face */}
                <path d={paths.right} fill={FILL} stroke={STROKE} strokeWidth={SW} strokeMiterlimit={10} opacity={0.9} />
                {/* Top face */}
                <path d={paths.top} fill={FILL} stroke={STROKE} strokeWidth={SW} strokeMiterlimit={10} />

                {/* Cushion crease lines for seats */}
                {!isSide && (
                  <>
                    <path d={topCreasePath(m.ox * s, m.oz * s, m.w * s, m.d * s, seatH, 0.5)} stroke={STROKE} strokeWidth={0.8} opacity={0.4} />
                    <path d={rightCreasePath(m.ox * s, m.oz * s, m.w * s, m.d * s, seatH, 0.5)} stroke={STROKE} strokeWidth={0.8} opacity={0.3} />
                  </>
                )}

                {/* Side armrest has a curved top hint */}
                {isSide && (() => {
                  const cx = (m.ox + m.w / 2) * s;
                  const cz = (m.oz + m.d * 0.35) * s;
                  const topPt = iso(cx, m.h * s * 0.85, cz);
                  const leftPt = iso(m.ox * s, m.h * s * 0.6, cz);
                  const rightPt = iso((m.ox + m.w) * s, m.h * s * 0.6, cz);
                  return (
                    <path
                      d={`M${leftPt[0]},${leftPt[1]} Q${topPt[0]},${topPt[1]} ${rightPt[0]},${rightPt[1]}`}
                      stroke={STROKE} strokeWidth={0.8} fill="none" opacity={0.35}
                    />
                  );
                })()}
              </g>
            );
          })}

        {/* Width dimension line (bottom-front edge) */}
        <g opacity={0.7}>
          <line
            x1={widthStart[0]} y1={widthStart[1] + 15}
            x2={widthEnd[0]} y2={widthEnd[1] + 15}
            stroke="#333" strokeWidth={1.5}
          />
          <line x1={widthStart[0]} y1={widthStart[1] + 10} x2={widthStart[0]} y2={widthStart[1] + 20} stroke="#333" strokeWidth={1.5} />
          <line x1={widthEnd[0]} y1={widthEnd[1] + 10} x2={widthEnd[0]} y2={widthEnd[1] + 20} stroke="#333" strokeWidth={1.5} />
          <g transform={`translate(${(widthStart[0] + widthEnd[0]) / 2}, ${(widthStart[1] + widthEnd[1]) / 2 + 15})`}>
            <rect x={-24} y={-9} width={48} height={18} rx={9} fill="#FAFAF1" stroke="none" />
            <text
              textAnchor="middle" dominantBaseline="central"
              fill="#1F1F1F" fontSize={11} fontWeight={600}
              transform={`rotate(${widthLabelAngle})`}
            >
              {totalW}
            </text>
          </g>
        </g>

        {/* Depth dimension line (right edge) */}
        <g opacity={0.7}>
          <line
            x1={depthStart[0] + 15} y1={depthStart[1]}
            x2={depthEnd[0] + 15} y2={depthEnd[1]}
            stroke="#333" strokeWidth={1.5}
          />
          <line x1={depthStart[0] + 10} y1={depthStart[1]} x2={depthStart[0] + 20} y2={depthStart[1]} stroke="#333" strokeWidth={1.5} />
          <line x1={depthEnd[0] + 10} y1={depthEnd[1]} x2={depthEnd[0] + 20} y2={depthEnd[1]} stroke="#333" strokeWidth={1.5} />
          <g transform={`translate(${(depthStart[0] + depthEnd[0]) / 2 + 15}, ${(depthStart[1] + depthEnd[1]) / 2})`}>
            <rect x={-24} y={-9} width={48} height={18} rx={9} fill="#FAFAF1" stroke="none" />
            <text
              textAnchor="middle" dominantBaseline="central"
              fill="#1F1F1F" fontSize={11} fontWeight={600}
              transform={`rotate(${depthLabelAngle})`}
            >
              {totalD}
            </text>
          </g>
        </g>
      </g>
    </svg>
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
  isoModules: IsoModule[];
  minX: number; minZ: number;
  sofaW: number; sofaD: number;
  seatCount: number;
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
    const isoModules: IsoModule[] = [];

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

      if (catalog.type === 'seat') totalSeats++;

      const sizeLabel = SIZE_LABEL[catalog.size] ?? catalog.size.toUpperCase();
      rects.push({ cx, cz, halfW: halfX, halfD: halfZ, label: sizeLabel });

      // Build isometric module (position in cm, origin at top-left)
      isoModules.push({
        ox: cx - halfX,
        oz: cz - halfZ,
        w: halfX * 2,
        d: halfZ * 2,
        h: hCm,
        type: catalog.type as 'seat' | 'side',
        label: sizeLabel,
      });
    }

    // Normalize iso positions so minimum is at 0
    const isoMinX = Math.min(...isoModules.map(m => m.ox));
    const isoMinZ = Math.min(...isoModules.map(m => m.oz));
    for (const m of isoModules) {
      m.ox -= isoMinX;
      m.oz -= isoMinZ;
    }

    return {
      totalW: Math.round(maxX - minX),
      totalD: Math.round(maxZ - minZ),
      totalH: maxHeight,
      counts: Object.values(counts),
      rects,
      isoModules,
      minX, minZ,
      sofaW: maxX - minX,
      sofaD: maxZ - minZ,
      seatCount: totalSeats,
    };
  }, [modules]);

  if (!data) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton
        className="max-w-[430px] rounded-[16px] border-none p-0 max-h-[90vh] overflow-y-auto"
      >
        <div className="px-[24px] pt-[24px] pb-[32px]">
          <DialogTitle className="sr-only">Sofa Details</DialogTitle>

          {/* Isometric 3D illustration */}
          <div className="flex justify-center mb-[20px]">
            <div className="w-full max-w-[360px]">
              <IsometricSofa
                modules={data.isoModules}
                totalW={data.totalW}
                totalD={data.totalD}
              />
            </div>
          </div>

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
        </div>
      </DialogContent>
    </Dialog>
  );
}
