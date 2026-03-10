'use client';

import { useMemo, useCallback, useRef, useState } from 'react';
import { useStore } from '@/stores';
import { MODULE_CATALOG } from '@/lib/config/modules';
import { buildLinear, buildShape } from '@/lib/snapping/layout-solver';
import { DEPTH_OPTIONS } from '@/lib/config/dummy-data';
import { InfoIcon } from '@/components/icons';
import { analyzeShape, getShapeParts } from '@/lib/snapping/shape-detector';

// Map depth (cm) to seat module IDs by width
const DEPTH_MODULE_MAP: Record<number, Record<number, string>> = {
  63: { 84: 'seat-xs', 105: 'seat-s' },
  84: { 84: 'seat-m', 105: 'seat-l' },
  105: { 84: 'seat-xl', 105: 'seat-xl' },
};

// Available seat widths per depth (in cm)
const SEAT_WIDTHS_BY_DEPTH: Record<number, number[]> = {
  63: [84, 105],
  84: [84, 105],
  105: [105],
};

function getDepthFromModules(modules: { moduleId: string }[]): number {
  for (const mod of modules) {
    const catalog = MODULE_CATALOG[mod.moduleId];
    if (catalog?.type === 'seat') {
      return Math.round(catalog.dimensions.depth * 100);
    }
  }
  return 84;
}

function getSeatModules(modules: { moduleId: string }[]) {
  return modules.filter((m) => MODULE_CATALOG[m.moduleId]?.type === 'seat');
}

function getSideModuleIds(modules: { moduleId: string }[]) {
  return modules
    .filter((m) => MODULE_CATALOG[m.moduleId]?.type === 'side')
    .map((m) => m.moduleId);
}

// Build seat module IDs to achieve target width at given depth
function buildSeatsForWidth(targetWidth: number, depthCm: number): string[] {
  const availableWidths = SEAT_WIDTHS_BY_DEPTH[depthCm] ?? [105];
  const depthMap = DEPTH_MODULE_MAP[depthCm] ?? {};
  const seats: string[] = [];
  let remaining = targetWidth;

  // Sort widths descending for greedy fill
  const sorted = [...availableWidths].sort((a, b) => b - a);

  for (const w of sorted) {
    while (remaining >= w) {
      const seatId = depthMap[w];
      if (seatId) {
        seats.push(seatId);
        remaining -= w;
      } else {
        break;
      }
    }
  }

  // Ensure at least one seat
  if (seats.length === 0) {
    const fallbackWidth = sorted[sorted.length - 1];
    const fallbackId = depthMap[fallbackWidth];
    if (fallbackId) seats.push(fallbackId);
  }

  return seats;
}

// Discrete width steps based on depth
function getWidthSteps(depthCm: number): number[] {
  const widths = SEAT_WIDTHS_BY_DEPTH[depthCm] ?? [105];
  const minW = Math.min(...widths);
  const steps: number[] = [];
  const maxSeats = 6;

  for (let n = 1; n <= maxSeats; n++) {
    // All combinations of n seats
    if (widths.length === 1) {
      steps.push(widths[0] * n);
    } else {
      // Generate all unique widths for n seats using the two available widths
      for (let i = 0; i <= n; i++) {
        const w = widths[0] * i + widths[1] * (n - i);
        if (!steps.includes(w)) steps.push(w);
      }
    }
  }

  return [...new Set(steps)].sort((a, b) => a - b);
}

function snapToNearestStep(value: number, steps: number[]): number {
  let closest = steps[0];
  let minDist = Math.abs(value - closest);
  for (const s of steps) {
    const dist = Math.abs(value - s);
    if (dist < minDist) {
      minDist = dist;
      closest = s;
    }
  }
  return closest;
}

export function StepSize() {
  const modules = useStore((s) => s.modules);
  const setModules = useStore((s) => s.setModules);
  const showNotification = useStore((s) => s.showNotification);
  const trackRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragWidth, setDragWidth] = useState<number | null>(null);

  const { totalWidthCm, currentDepth } = useMemo(() => {
    let width = 0;
    for (const mod of modules) {
      const catalog = MODULE_CATALOG[mod.moduleId];
      if (!catalog) continue;
      const ry = mod.rotation[1];
      const cosR = Math.abs(Math.cos(ry));
      const sinR = Math.abs(Math.sin(ry));
      width += catalog.dimensions.width * cosR + catalog.dimensions.depth * sinR;
    }
    return {
      totalWidthCm: Math.round(width * 100),
      currentDepth: getDepthFromModules(modules),
    };
  }, [modules]);

  const widthSteps = useMemo(() => getWidthSteps(currentDepth), [currentDepth]);
  const minWidth = widthSteps[0];
  const maxWidth = widthSteps[widthSteps.length - 1];

  const displayWidth = dragWidth ?? totalWidthCm;
  const pct = Math.max(0, Math.min(100, ((displayWidth - minWidth) / (maxWidth - minWidth)) * 100));

  // Clamp pill so it doesn't overflow container edges
  const pillHalfW = 46;
  const containerW = trackRef.current?.getBoundingClientRect().width ?? 384;
  const rawLeft = (pct / 100) * containerW;
  const clampedLeft = Math.max(pillHalfW, Math.min(rawLeft, containerW - pillHalfW));
  const clampedPct = (clampedLeft / containerW) * 100;

  const selectedDepthId = `depth-${currentDepth}`;

  const applyWidth = useCallback((targetWidth: number) => {
    const snapped = snapToNearestStep(targetWidth, widthSteps);
    const sideIds = getSideModuleIds(modules);
    const shape = analyzeShape(modules);

    if (shape === 'linear') {
      const seatIds = buildSeatsForWidth(snapped, currentDepth);
      const allIds = sideIds.length > 0
        ? [sideIds[0], ...seatIds, ...(sideIds.length > 1 ? [sideIds[1]] : [])]
        : seatIds;
      const placed = buildLinear(allIds);
      setModules(placed);
    } else {
      // Shape-preserving resize: only change main row, keep wings
      const parts = getShapeParts(modules);
      const mainRowSeatIds = buildSeatsForWidth(snapped, currentDepth);
      const leftWingIds = parts.leftWing.map((m) => m.moduleId);
      const rightWingIds = parts.rightWing.map((m) => m.moduleId);
      const placed = buildShape(shape, mainRowSeatIds, leftWingIds, rightWingIds, sideIds);
      setModules(placed);
    }
  }, [modules, currentDepth, widthSteps, setModules]);

  const getWidthFromPointer = useCallback((clientX: number) => {
    if (!trackRef.current) return totalWidthCm;
    const rect = trackRef.current.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    return minWidth + ratio * (maxWidth - minWidth);
  }, [totalWidthCm, minWidth, maxWidth]);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    setIsDragging(true);
    const w = getWidthFromPointer(e.clientX);
    setDragWidth(snapToNearestStep(w, widthSteps));
  }, [getWidthFromPointer, widthSteps]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging) return;
    const w = getWidthFromPointer(e.clientX);
    setDragWidth(snapToNearestStep(w, widthSteps));
  }, [isDragging, getWidthFromPointer, widthSteps]);

  const handlePointerUp = useCallback(() => {
    if (!isDragging) return;
    setIsDragging(false);
    if (dragWidth !== null) {
      applyWidth(dragWidth);
    }
    setDragWidth(null);
  }, [isDragging, dragWidth, applyWidth]);

  const handleDepthChange = useCallback((depthCm: number) => {
    const depthMap = DEPTH_MODULE_MAP[depthCm];
    if (!depthMap) return;

    const shape = analyzeShape(modules);
    let substituted = false;

    const mapSeatId = (moduleId: string): string => {
      const catalog = MODULE_CATALOG[moduleId];
      if (!catalog || catalog.type !== 'seat') return moduleId;
      const seatWidthCm = Math.round(catalog.dimensions.width * 100);
      const newSeatId = depthMap[seatWidthCm];
      if (newSeatId) {
        if (newSeatId !== moduleId && seatWidthCm !== Math.round(MODULE_CATALOG[newSeatId].dimensions.width * 100)) {
          substituted = true;
        }
        return newSeatId;
      }
      substituted = true;
      return Object.values(depthMap)[0];
    };

    if (shape === 'linear') {
      const newModuleIds: string[] = [];
      for (const mod of modules) {
        const catalog = MODULE_CATALOG[mod.moduleId];
        if (!catalog) continue;
        if (catalog.type === 'side') {
          newModuleIds.push(mod.moduleId);
        } else if (catalog.type === 'seat') {
          newModuleIds.push(mapSeatId(mod.moduleId));
        }
      }
      const placed = buildLinear(newModuleIds);
      setModules(placed);
    } else {
      const parts = getShapeParts(modules);
      const mainRowIds = parts.mainRow.map((m) => mapSeatId(m.moduleId));
      const leftWingIds = parts.leftWing.map((m) => mapSeatId(m.moduleId));
      const rightWingIds = parts.rightWing.map((m) => mapSeatId(m.moduleId));
      const sideIds = parts.sides.map((m) => m.moduleId);
      const placed = buildShape(shape, mainRowIds, leftWingIds, rightWingIds, sideIds);
      setModules(placed);
    }

    if (substituted) {
      showNotification('Seat size adjusted to fit selected depth', 'info');
    }
  }, [modules, setModules, showNotification]);

  return (
    <section className="bg-white px-[18px] py-[21px] lg:px-[28px] lg:py-[28px]">
      <div className="flex items-center gap-[6px] mb-[21px]">
        <p className="text-[18px] lg:text-[20px] text-black whitespace-nowrap">Adapt your Sofa size</p>
        <InfoIcon className="h-[20px] w-[20px] shrink-0" />
      </div>

      {/* Width slider (interactive) */}
      <div className="mb-[21px]">
        <p className="text-[12px] text-black mb-[8px]">width</p>

        <div className="relative h-[55px] select-none touch-none">
          {/* Floating pill showing value */}
          <div
            className="absolute top-0 -translate-x-1/2 pointer-events-none"
            style={{ left: `${clampedPct}%` }}
          >
            <div className={`rounded-[56px] border-[3px] bg-white px-[23px] py-[5px] shadow-sm ${isDragging ? 'border-black' : 'border-[#ccc]'}`}>
              <span className="text-[15px] font-medium text-black whitespace-nowrap">{displayWidth}cm</span>
            </div>
          </div>

          {/* Track — interactive area */}
          <div
            ref={trackRef}
            className="absolute bottom-0 left-0 right-0 h-[18px] cursor-pointer"
            style={{ paddingTop: '5px', paddingBottom: '5px' }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
          >
            <div className="h-[8px] rounded-[6px] bg-[#ddd]">
              <div
                className="absolute left-0 top-[5px] h-[8px] rounded-[6px] bg-black pointer-events-none"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>

          {/* Thumb circle on the track */}
          <div
            className={`absolute bottom-[-5px] h-[18px] w-[18px] -translate-x-1/2 rounded-full bg-black border-[3px] border-white shadow-md pointer-events-none ${isDragging ? 'scale-125' : ''}`}
            style={{ left: `${pct}%`, transition: isDragging ? 'none' : 'left 0.2s ease' }}
          />
        </div>
      </div>

      {/* Depth segmented control */}
      <div>
        <p className="text-[12px] text-black mb-[4px]">depth</p>
        <div className="relative flex h-[44px] w-full rounded-[86px] bg-[#ddd]">
          {DEPTH_OPTIONS.map((opt) => {
            const isActive = selectedDepthId === opt.id;
            return (
              <button
                key={opt.id}
                onClick={() => handleDepthChange(opt.widthCm)}
                className="relative flex-1 h-full text-[15px] font-medium text-black text-center"
              >
                {isActive && (
                  <div className="absolute inset-[4px] rounded-[56px] border-[4px] border-black/15 bg-white" />
                )}
                <span className="relative z-[1]">{opt.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
