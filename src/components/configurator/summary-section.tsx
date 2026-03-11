'use client';

import { useState, useMemo } from 'react';
import { useStore } from '@/stores';
import { MODULE_CATALOG } from '@/lib/config/modules';
import { TruckIcon } from '@/components/icons';
import { SummaryModal } from './summary-modal';

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

export function SummarySection() {
  const [modalOpen, setModalOpen] = useState(false);
  const modules = useStore((s) => s.modules);

  const SIZE_LABEL: Record<string, string> = {
    xs: 'XS', s: 'S', m: 'M', l: 'L', xl: 'XL',
  };

  const { lengthCm, widthCm, heightCm, moduleSummary, accessoryCount } = useMemo(() => {
    if (modules.length === 0)
      return { lengthCm: 0, widthCm: 0, heightCm: 0, moduleSummary: '', accessoryCount: 0 };

    let minX = Infinity, maxX = -Infinity;
    let minZ = Infinity, maxZ = -Infinity;
    let maxHeight = 0;
    let accessories = 0;

    // Count by moduleId
    const counts: Record<string, number> = {};

    for (const mod of modules) {
      const catalog = MODULE_CATALOG[mod.moduleId];
      if (!catalog) continue;

      if (catalog.type !== 'seat' && catalog.type !== 'side') {
        accessories++;
        continue;
      }

      counts[mod.moduleId] = (counts[mod.moduleId] || 0) + 1;

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
    }

    // Build summary string like "1 x Seat M, 3 x Side L"
    const parts: string[] = [];
    for (const [id, count] of Object.entries(counts)) {
      const catalog = MODULE_CATALOG[id];
      if (!catalog) continue;
      const typeName = catalog.type === 'seat' ? 'Seat' : 'Side';
      const sizeLabel = SIZE_LABEL[catalog.size] ?? catalog.size.toUpperCase();
      parts.push(`${count} x ${typeName} ${sizeLabel}`);
    }

    return {
      lengthCm: Math.round(maxX - minX),
      widthCm: Math.round(maxZ - minZ),
      heightCm: maxHeight,
      moduleSummary: parts.join(', '),
      accessoryCount: accessories,
    };
  }, [modules]);

  return (
    <section className="bg-white px-[18px] py-[21px] lg:px-[28px] lg:py-[28px]">
      <div className="flex flex-col gap-[21px]">
        {/* Heading */}
        <p className="text-[18px] text-black">
          Ready? Your <span className="font-bold">vetsak</span> sofa looks amazing!
        </p>

        {/* Sofa dimensions */}
        <div className="text-[15px] text-black leading-normal">
          <p>{lengthCm}cm x {widthCm}cm x {heightCm}cm</p>
          <p className="text-[12px] text-black/50">
            {moduleSummary}
            {accessoryCount > 0 && `, ${accessoryCount} accessor${accessoryCount !== 1 ? 'ies' : 'y'}`}
          </p>
          <button onClick={() => setModalOpen(true)} className="font-bold underline">
            more details
          </button>
        </div>

        {/* Shipping info bar */}
        <div className="flex items-center justify-center gap-[10px] rounded-[6px] bg-[#eee] py-[9px] w-full">
          <TruckIcon className="h-[18px] w-[36px]" />
          <p className="text-[15px] text-black text-center">
            shipping within <span className="font-bold">10 weeks</span>
          </p>
        </div>
      </div>

      <SummaryModal open={modalOpen} onOpenChange={setModalOpen} />
    </section>
  );
}
