'use client';

import { useState } from 'react';
import { PILLOW_SETS, DUMMY_ACCESSORIES } from '@/lib/config/dummy-data';
import { CheckmarkIcon, PlusIcon } from '@/components/icons';

export function StepFinish() {
  const [selectedSet, setSelectedSet] = useState('pillow-set-1');

  return (
    <section className="bg-white px-[18px] py-[21px]">
      <p className="text-[18px] text-black mb-[21px]">
        Finish your sofa look
      </p>

      {/* Pillow sets — visual selector list */}
      <div className="flex flex-col gap-[21px] mb-[21px]">
        {PILLOW_SETS.map((set) => {
          const isSelected = selectedSet === set.id;
          return (
            <button
              key={set.id}
              onClick={() => setSelectedSet(set.id)}
              className={`relative h-[96px] w-full rounded-[12px] border ${
                isSelected ? 'border-black' : 'border-black/20'
              } bg-white text-left`}
            >
              <div className="absolute left-[18px] top-[18px] flex items-center gap-[12px]">
                {/* Product image */}
                <div className="h-[60px] w-[84px] shrink-0 overflow-hidden rounded-[3px] border border-black/10">
                  <img
                    src={set.image}
                    alt={set.name}
                    className="h-full w-full object-cover"
                  />
                </div>
                {/* Name + description */}
                <div className="flex flex-col items-start w-[217px]">
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
      <p className="text-[18px] text-black mb-[21px]">
        I want to choose my own Accessories
      </p>

      {/* Accessories grid — same 89x114 module card pattern */}
      <div className="flex flex-wrap content-center gap-[9px]">
        {DUMMY_ACCESSORIES.map((item) => (
          <div
            key={item.id}
            className="relative h-[114px] w-[89px] shrink-0 overflow-hidden rounded-[6px] border border-black/20 bg-white"
          >
            {/* Product photo top half */}
            <div className="absolute left-[-1px] top-[-1px] h-[63px] w-[89px]">
              <img
                src={item.image}
                alt={item.name}
                className="absolute inset-0 h-full w-full object-cover"
              />
            </div>
            {/* Plus icon */}
            <div className="absolute right-[-1px] top-[-1px]">
              <PlusIcon className="h-[24px] w-[26px]" />
            </div>
            {/* Name */}
            <div className="absolute left-1/2 top-[84px] -translate-x-1/2 -translate-y-1/2 flex h-[26px] w-[78px] flex-col items-center justify-center text-center text-[9px] font-medium text-black leading-tight">
              <span>{item.name}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
