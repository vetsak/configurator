'use client';

import { useMemo } from 'react';
import { useStore } from '@/stores';
import { MODULE_CATALOG } from '@/lib/config/modules';
import { TruckIcon } from '@/components/icons';

export function SummarySection() {
  const modules = useStore((s) => s.modules);

  const { widthCm, depthCm, seatCount, sideCount } = useMemo(() => {
    if (modules.length === 0) return { widthCm: 0, depthCm: 0, seatCount: 0, sideCount: 0 };

    let minX = Infinity, maxX = -Infinity;
    let minZ = Infinity, maxZ = -Infinity;
    let seats = 0, sides = 0;

    for (const mod of modules) {
      const catalog = MODULE_CATALOG[mod.moduleId];
      if (!catalog) continue;

      const ry = mod.rotation[1];
      const cosR = Math.abs(Math.cos(ry));
      const sinR = Math.abs(Math.sin(ry));
      const halfW = (catalog.dimensions.width * cosR + catalog.dimensions.depth * sinR) / 2;
      const halfD = (catalog.dimensions.width * sinR + catalog.dimensions.depth * cosR) / 2;

      minX = Math.min(minX, mod.position[0] - halfW);
      maxX = Math.max(maxX, mod.position[0] + halfW);
      minZ = Math.min(minZ, mod.position[2] - halfD);
      maxZ = Math.max(maxZ, mod.position[2] + halfD);

      if (catalog.type === 'seat') seats++;
      else if (catalog.type === 'side') sides++;
    }

    return {
      widthCm: Math.round((maxX - minX) * 100),
      depthCm: Math.round((maxZ - minZ) * 100),
      seatCount: seats,
      sideCount: sides,
    };
  }, [modules]);

  return (
    <section className="bg-white px-[18px] py-[21px]">
      <div className="flex flex-col gap-[21px]">
        {/* Heading */}
        <p className="text-[18px] text-black">
          Ready? Your <span className="font-bold">vetsak</span> sofa looks amazing!
        </p>

        {/* Sofa dimensions */}
        <div className="text-[15px] text-black leading-normal">
          <p>Sofa size: {widthCm}cm x {depthCm}cm</p>
          <p className="text-[12px] text-black/50">
            {seatCount} seat{seatCount !== 1 ? 's' : ''}, {sideCount} side{sideCount !== 1 ? 's' : ''}
          </p>
          <p className="font-bold underline">more details</p>
        </div>

        {/* Shipping info bar */}
        <div className="flex items-center justify-center gap-[10px] rounded-[6px] bg-[#eee] py-[9px] w-full">
          <TruckIcon className="h-[18px] w-[36px]" />
          <p className="text-[15px] text-black text-center">
            shipping within <span className="font-bold">10 weeks</span>
          </p>
        </div>
      </div>
    </section>
  );
}
