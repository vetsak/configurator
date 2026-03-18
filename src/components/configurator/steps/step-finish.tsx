'use client';

import { useState, useCallback } from 'react';
import { PILLOW_SETS, DUMMY_ACCESSORIES } from '@/lib/config/dummy-data';
import { CheckmarkIcon, PlusIcon } from '@/components/icons';
import { useStore } from '@/stores';
import { useSelectedColour } from '@/hooks/use-selected-colour';

// Map accessory dummy-data IDs → Shopify image slug
const ACC_SLUG_MAP: Record<string, string> = {
  'lounge-pillow-acc': 'lounge-pillow',
};

// Pillow set → representative accessory slug for colour-specific image
const PILLOW_SET_SLUG: Record<string, string> = {
  'pillow-set-1': 'jumbo-pillow',
  'lounge-pillow': 'lounge-pillow',
  'blanket-ted': 'blanket',
};

export function StepFinish() {
  const [selectedSet, setSelectedSet] = useState('pillow-set-1');
  const placeAccessory = useStore((s) => s.placeAccessory);
  const modules = useStore((s) => s.modules);
  const { fabricId, colourId } = useSelectedColour();

  const hasSeats = modules.some((m) => m.type === 'seat');

  const handleAccessoryClick = useCallback(
    (catalogId: string | undefined) => {
      if (!catalogId || !hasSeats) return;
      placeAccessory(catalogId);
    },
    [placeAccessory, hasSeats],
  );

  return (
    <section className="bg-white px-[18px] py-[21px] lg:px-[28px] lg:py-[28px]">
      <p className="text-[18px] lg:text-[20px] text-black mb-[21px]">
        Finish your sofa look
      </p>

      {/* Pillow sets — visual selector list */}
      <div className="flex flex-col gap-[21px] mb-[21px]">
        {PILLOW_SETS.map((set) => {
          const isSelected = selectedSet === set.id;
          const slug = PILLOW_SET_SLUG[set.id] ?? set.id;
          const colourSrc = `/images/accessories/${slug}-${fabricId}-${colourId}.jpg`;

          return (
            <button
              key={set.id}
              onClick={() => setSelectedSet(set.id)}
              className={`relative h-[96px] w-full rounded-[12px] border ${
                isSelected ? 'border-black' : 'border-black/20'
              } bg-white text-left`}
            >
              <div className="absolute left-[18px] top-[18px] flex items-center gap-[12px]">
                {/* Product image — colour-specific with fallback */}
                <div className="h-[60px] w-[84px] shrink-0 overflow-hidden rounded-[3px] border border-black/10">
                  <img
                    src={colourSrc}
                    alt={set.name}
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = set.image;
                    }}
                  />
                </div>
                {/* Name + description */}
                <div className="flex flex-col items-start w-[217px] lg:flex-1">
                  <span className="text-[15px] text-black">{set.name}</span>
                  {set.description && (
                    <span className="text-[11px] text-black/50">{set.description}</span>
                  )}
                </div>
              </div>
              {/* Price */}
              <p className="absolute right-[18px] top-1/2 -translate-y-1/2 text-[18px] text-black text-right w-[60px]">
                {set.price}&thinsp;&euro;
              </p>
              {/* Checkmark badge when selected */}
              {isSelected && (
                <div className="absolute bottom-0 right-0 flex h-[25px] w-[25px] items-center justify-center rounded-br-[11px] bg-black">
                  <CheckmarkIcon className="h-[15px] w-[15px]" />
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Accessories heading */}
      <p className="text-[18px] lg:text-[20px] text-black mb-[21px]">
        I want to choose my own Accessories
      </p>

      {/* Accessories grid — click to place on sofa */}
      <div className="flex flex-wrap content-center gap-[9px]">
        {DUMMY_ACCESSORIES.map((item) => {
          const has3D = !!item.catalogId;
          const slug = ACC_SLUG_MAP[item.id] ?? item.id;
          const colourSrc = `/images/accessories/${slug}-${fabricId}-${colourId}.jpg`;

          return (
            <button
              key={item.id}
              onClick={() => handleAccessoryClick(item.catalogId)}
              disabled={!has3D || !hasSeats}
              className={`relative h-[114px] w-[89px] shrink-0 overflow-hidden rounded-[6px] border bg-white transition-colors ${
                has3D && hasSeats
                  ? 'border-black/20 hover:border-black/50 cursor-pointer'
                  : 'border-black/10 opacity-50 cursor-not-allowed'
              }`}
            >
              {/* Product photo top half — colour-specific */}
              <div className="absolute left-[-1px] top-[-1px] h-[63px] w-[89px]">
                <img
                  src={colourSrc}
                  alt={item.name}
                  className="absolute inset-0 h-full w-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = item.image;
                  }}
                />
              </div>
              {/* Plus icon */}
              {has3D && (
                <div className="absolute right-[-1px] top-[-1px]">
                  <PlusIcon className="h-[24px] w-[26px]" />
                </div>
              )}
              {/* Name */}
              <div className="absolute left-1/2 top-[84px] -translate-x-1/2 -translate-y-1/2 flex h-[26px] w-[78px] flex-col items-center justify-center text-center text-[11px] font-medium text-black leading-tight">
                <span>{item.name}</span>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
