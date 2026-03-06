'use client';

import { useState } from 'react';
import { useStore } from '@/stores';
import { FABRIC_TAGS, COLOR_SWATCHES } from '@/lib/config/dummy-data';
import { FABRICS } from '@/lib/config/materials';
import { CheckmarkIcon, ColorSwatchIcon } from '@/components/icons';

// Map first 4 swatch IDs to real fabric color IDs
const SWATCH_TO_COLOR: Record<string, string> = {
  'swatch-01': 'platinum',
  'swatch-02': 'sand',
  'swatch-03': 'forest',
  'swatch-04': 'navy',
};

export function StepMaterial() {
  const [selectedTag, setSelectedTag] = useState('all');
  const selectedMaterial = useStore((s) => s.selectedMaterial);
  const setMaterial = useStore((s) => s.setMaterial);

  // Find which swatch corresponds to the current material color
  const activeSwatchId = Object.entries(SWATCH_TO_COLOR).find(
    ([, colorId]) => colorId === selectedMaterial.colourId
  )?.[0] ?? 'swatch-01';

  const handleSwatchClick = (swatchId: string) => {
    const colourId = SWATCH_TO_COLOR[swatchId];
    if (colourId) {
      setMaterial({ fabricId: 'cord', colourId });
    }
  };

  return (
    <section className="bg-white px-[18px] py-[21px]">
      <div className="mb-[21px]">
        <p className="text-[18px] text-black w-[384px]">
          Choose your Material and Colour:
        </p>
      </div>

      {/* Tag pills */}
      <div className="flex flex-wrap content-center gap-[9px_7px] mb-[21px] w-[360px]">
        {FABRIC_TAGS.map((tag) => (
          <button
            key={tag.id}
            onClick={() => setSelectedTag(tag.id)}
            className={`rounded-[50px] border-[0.7px] px-[12px] py-[7px] text-[10px] text-center whitespace-nowrap ${
              selectedTag === tag.id
                ? 'border-[#111] bg-[#111] text-white'
                : 'border-black bg-white text-black'
            }`}
          >
            {tag.label}
          </button>
        ))}
      </div>

      {/* Color swatches */}
      <div className="flex flex-wrap content-center gap-[6px] mb-[21px]">
        {COLOR_SWATCHES.map((swatch) => {
          const isSelected = activeSwatchId === swatch.id;
          const hasMapping = swatch.id in SWATCH_TO_COLOR;
          return (
            <button
              key={swatch.id}
              onClick={() => handleSwatchClick(swatch.id)}
              className={`relative ${!hasMapping ? 'opacity-40' : ''}`}
              disabled={!hasMapping}
            >
              <div
                className={`h-[52px] w-[42px] overflow-hidden rounded-[6px] ${
                  isSelected ? 'border border-black' : ''
                }`}
              >
                <img
                  src={swatch.image}
                  alt={swatch.name}
                  className="h-full w-full object-cover rounded-[6px]"
                />
              </div>
              {/* Checkmark badge */}
              {isSelected && (
                <div className="absolute bottom-0 right-0 flex h-[15px] w-[15px] items-center justify-center rounded-br-[6px] bg-black">
                  <CheckmarkIcon className="h-[9px] w-[9px]" />
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* More info pill */}
      <button className="rounded-[50px] border-[0.7px] border-black px-[12px] py-[7px] text-[12px] text-black mb-[21px] block">
        More information about our Materials
      </button>

      {/* Get samples link */}
      <div className="flex items-center gap-[3px]">
        <ColorSwatchIcon className="h-[18px] w-[18px]" />
        <span className="text-[12px] text-black underline">
          Get your samples here
        </span>
      </div>
    </section>
  );
}
