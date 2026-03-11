'use client';

import { useMemo } from 'react';
import { useStore } from '@/stores';
import { MODULE_CATALOG } from '@/lib/config/modules';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';

/** Exact module dimensions in cm (from vetsak spec sheet). */
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

interface SummaryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SummaryModal({ open, onOpenChange }: SummaryModalProps) {
  const modules = useStore((s) => s.modules);

  const data = useMemo(() => {
    if (modules.length === 0) return null;

    // Bounding box for overall dimensions
    let minX = Infinity, maxX = -Infinity;
    let minZ = Infinity, maxZ = -Infinity;
    let maxHeight = 0;

    // Count modules by type+size
    const counts: Record<string, { count: number; name: string; dimLabel: string }> = {};

    // Collect positioned rects for the schematic
    const rects: Array<{
      cx: number; cz: number;
      halfW: number; halfD: number;
      label: string;
    }> = [];

    for (const mod of modules) {
      const catalog = MODULE_CATALOG[mod.moduleId];
      if (!catalog) continue;
      // Skip accessories/pillows for schematic and dimensions
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

      // Module count
      const key = mod.moduleId;
      if (!counts[key]) {
        const sizeLabel = SIZE_LABEL[catalog.size] ?? catalog.size.toUpperCase();
        const typeName = catalog.type === 'seat' ? 'Seat' : 'Side';
        counts[key] = {
          count: 0,
          name: `${typeName} ${sizeLabel}`,
          dimLabel: `(${lenCm} x ${widCm})`,
        };
      }
      counts[key].count++;

      // Schematic rect
      const sizeLabel = SIZE_LABEL[catalog.size] ?? catalog.size.toUpperCase();
      rects.push({ cx, cz, halfW: halfX, halfD: halfZ, label: sizeLabel });
    }

    const totalW = Math.round(maxX - minX);
    const totalD = Math.round(maxZ - minZ);

    return {
      totalW,
      totalD,
      totalH: maxHeight,
      counts: Object.values(counts),
      rects,
      minX, minZ,
      sofaW: maxX - minX,
      sofaD: maxZ - minZ,
    };
  }, [modules]);

  if (!data) return null;

  // Scale schematic to fit ~280px wide
  const DRAW_W = 260;
  const padding = 40;
  const scale = Math.min(
    (DRAW_W - padding) / (data.sofaW || 1),
    (DRAW_W - padding) / (data.sofaD || 1),
  );
  const drawH = data.sofaD * scale + padding;

  // Dimension line offsets
  const dimLineOffset = 16;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton
        className="max-w-[430px] rounded-[16px] border-none p-0 max-h-[90vh] overflow-y-auto"
      >
        <div className="px-[24px] pt-[24px] pb-[32px]">
          <DialogTitle className="sr-only">Sofa Details</DialogTitle>

          {/* Schematic layout */}
          <div className="flex justify-center mb-[28px]">
            <svg
              width={DRAW_W}
              height={drawH + dimLineOffset * 2 + 20}
              viewBox={`0 0 ${DRAW_W} ${drawH + dimLineOffset * 2 + 20}`}
              className="text-[#333]"
            >
              {/* Width dimension line (top) */}
              <g transform={`translate(0, ${dimLineOffset})`}>
                {/* Line */}
                <line
                  x1={padding / 2 + (data.rects.length > 0 ? (Math.min(...data.rects.map(r => (r.cx - data.minX - r.halfW) * scale)) ) : 0)}
                  y1={0}
                  x2={padding / 2 + (data.rects.length > 0 ? (Math.max(...data.rects.map(r => (r.cx - data.minX + r.halfW) * scale)) ) : 0)}
                  y2={0}
                  stroke="#333"
                  strokeWidth={1}
                />
                {/* End ticks */}
                <line
                  x1={padding / 2 + (data.rects.length > 0 ? (Math.min(...data.rects.map(r => (r.cx - data.minX - r.halfW) * scale)) ) : 0)}
                  y1={-4}
                  x2={padding / 2 + (data.rects.length > 0 ? (Math.min(...data.rects.map(r => (r.cx - data.minX - r.halfW) * scale)) ) : 0)}
                  y2={4}
                  stroke="#333"
                  strokeWidth={1}
                />
                <line
                  x1={padding / 2 + (data.rects.length > 0 ? (Math.max(...data.rects.map(r => (r.cx - data.minX + r.halfW) * scale)) ) : 0)}
                  y1={-4}
                  x2={padding / 2 + (data.rects.length > 0 ? (Math.max(...data.rects.map(r => (r.cx - data.minX + r.halfW) * scale)) ) : 0)}
                  y2={4}
                  stroke="#333"
                  strokeWidth={1}
                />
                {/* Label */}
                <text
                  x={DRAW_W / 2}
                  y={-6}
                  textAnchor="middle"
                  fill="#333"
                  fontSize={12}
                  fontFamily="inherit"
                >
                  {data.totalW}
                </text>
              </g>

              {/* Module rects */}
              <g transform={`translate(${padding / 2}, ${dimLineOffset * 2 + 10})`}>
                {data.rects.map((r, i) => {
                  const x = (r.cx - data.minX - r.halfW) * scale;
                  const y = (r.cz - data.minZ - r.halfD) * scale;
                  const w = r.halfW * 2 * scale;
                  const h = r.halfD * 2 * scale;
                  return (
                    <g key={i}>
                      <rect
                        x={x}
                        y={y}
                        width={w}
                        height={h}
                        rx={4}
                        fill="#f5f5ef"
                        stroke="#ccc"
                        strokeWidth={1}
                      />
                      <text
                        x={x + w / 2}
                        y={y + h / 2}
                        textAnchor="middle"
                        dominantBaseline="central"
                        fill="#333"
                        fontSize={13}
                        fontWeight={600}
                        fontFamily="inherit"
                      >
                        {r.label}
                      </text>
                    </g>
                  );
                })}
              </g>

              {/* Depth dimension line (left) */}
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
                      <text
                        x={-2}
                        y={midY}
                        textAnchor="middle"
                        dominantBaseline="central"
                        fill="#333"
                        fontSize={12}
                        fontFamily="inherit"
                        transform={`rotate(-90, -2, ${midY})`}
                      >
                        {data.totalD}
                      </text>
                    </>
                  );
                })()}
              </g>
            </svg>
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

          {/* Possible product variations — content TBD */}
        </div>
      </DialogContent>
    </Dialog>
  );
}
