import { MODULE_CATALOG } from '@/lib/config/modules';
import type { PlacedModule } from '@/types/configurator';

/* ── Spec dimensions ─────────────────────────────────────── */

const MODULE_SPECS: Record<string, { height: number; length: number; width: number }> = {
  'seat-xs': { height: 38, length: 84, width: 63 },
  'seat-s':  { height: 38, length: 105, width: 63 },
  'seat-m':  { height: 38, length: 84, width: 84 },
  'seat-l':  { height: 38, length: 105, width: 84 },
  'seat-xl': { height: 38, length: 105, width: 105 },
  'side-s':  { height: 60, length: 63, width: 31 },
  'side-m':  { height: 60, length: 84, width: 31 },
  'side-l':  { height: 60, length: 105, width: 31 },
};

const SIZE_LABEL: Record<string, string> = {
  xs: 'XS', s: 'S', m: 'M', l: 'L', xl: 'XL',
};

/* ── Types ────────────────────────────────────────────────── */

export interface SchematicData {
  totalW: number;
  totalD: number;
  totalH: number;
  counts: Array<{ count: number; name: string; dimLabel: string }>;
  rects: Array<{ cx: number; cz: number; halfW: number; halfD: number; label: string }>;
  minX: number; minZ: number;
  sofaW: number; sofaD: number;
  seatCount: number;
}

/* ── Data computation ─────────────────────────────────────── */

export function computeSchematicData(modules: PlacedModule[]): SchematicData | null {
  if (modules.length === 0) return null;

  let minX = Infinity, maxX = -Infinity;
  let minZ = Infinity, maxZ = -Infinity;
  let maxHeight = 0;

  const counts: Record<string, { count: number; name: string; dimLabel: string }> = {};
  const rects: SchematicData['rects'] = [];

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
  }

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
  };
}

/* ── Top-down schematic component ─────────────────────────── */

export function TopDownSchematic({ data }: { data: SchematicData }) {
  const DRAW_W = 260;
  const padding = 40;
  const scale = Math.min(
    (DRAW_W - padding) / (data.sofaW || 1),
    (DRAW_W - padding) / (data.sofaD || 1),
  );
  const drawH = data.sofaD * scale + padding;
  const dimLineOffset = 20;

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
        <rect x={(leftEdge + rightEdge) / 2 - 20} y={-18} width={40} height={16} rx={8} fill="#FAFAF1" />
        <text x={(leftEdge + rightEdge) / 2} y={-10} textAnchor="middle" dominantBaseline="central" fill="#333" fontSize={12} fontWeight={600}>{data.totalW}</text>
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
              <rect x={-8 - 20} y={midY - 8} width={40} height={16} rx={8} fill="#FAFAF1" transform={`rotate(-90, -8, ${midY})`} />
              <text x={-8} y={midY} textAnchor="middle" dominantBaseline="central" fill="#333" fontSize={12} fontWeight={600} transform={`rotate(-90, -8, ${midY})`}>{data.totalD}</text>
            </>
          );
        })()}
      </g>
    </svg>
  );
}
