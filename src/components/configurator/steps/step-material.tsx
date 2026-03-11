'use client';

import { useState, useMemo } from 'react';
import { useStore } from '@/stores';
import { getAllFabrics } from '@/lib/config/materials';
import { CheckmarkIcon, ColorSwatchIcon } from '@/components/icons';
import { MaterialModal } from '@/components/configurator/material-modal';
import type { FabricDefinition, ColourVariant } from '@/types/materials';

export function StepMaterial() {
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [modalFabricId, setModalFabricId] = useState<string | undefined>();

  const selectedMaterial = useStore((s) => s.selectedMaterial);
  const setMaterial = useStore((s) => s.setMaterial);
  const fabricCatalog = useStore((s) => s.fabricCatalog);

  const allFabrics = useMemo(() => getAllFabrics(fabricCatalog), [fabricCatalog]);

  // Build filter pills from fabric names
  const filterPills = useMemo(() => {
    const pills: Array<{ id: string; label: string }> = [
      { id: 'all', label: 'All materials' },
    ];
    for (const fabric of allFabrics) {
      pills.push({ id: fabric.id, label: fabric.name });
    }
    return pills;
  }, [allFabrics]);

  // Flat list of all swatches, filtered by selected fabric type
  const swatches = useMemo(() => {
    const items: Array<{ fabric: FabricDefinition; colour: ColourVariant }> = [];
    const fabrics = selectedFilter === 'all'
      ? allFabrics
      : allFabrics.filter((f) => f.id === selectedFilter);

    for (const fabric of fabrics) {
      for (const colour of fabric.colours) {
        items.push({ fabric, colour });
      }
    }
    return items;
  }, [allFabrics, selectedFilter]);

  const handleSwatchClick = (fabric: FabricDefinition, colour: ColourVariant) => {
    setMaterial({ fabricId: fabric.id, colourId: colour.id });
  };

  return (
    <section className="bg-white px-[18px] py-[21px] lg:px-[28px] lg:py-[28px]">
      <div className="mb-[21px]">
        <p className="text-[18px] lg:text-[20px] text-black w-[384px] lg:w-auto">
          Choose your Material and Colour:
        </p>
      </div>

      {/* Fabric type filter pills */}
      <div className="flex flex-wrap content-center gap-[9px_7px] mb-[21px] w-[360px] lg:w-auto">
        {filterPills.map((pill) => (
          <button
            key={pill.id}
            onClick={() => setSelectedFilter(pill.id)}
            className={`rounded-[50px] border-[0.7px] px-[12px] py-[7px] text-[10px] text-center whitespace-nowrap ${
              selectedFilter === pill.id
                ? 'border-[#111] bg-[#111] text-white'
                : 'border-black bg-white text-black'
            }`}
          >
            {pill.label}
          </button>
        ))}
      </div>

      {/* Flat color swatches grid */}
      <div className="flex flex-wrap content-center gap-[6px] mb-[21px]">
        {swatches.map(({ fabric, colour }) => {
          const isSelected =
            selectedMaterial.fabricId === fabric.id &&
            selectedMaterial.colourId === colour.id;
          const swatchSrc = colour.swatchPath || colour.swatchUrl;

          return (
            <button
              key={`${fabric.id}-${colour.id}`}
              onClick={() => handleSwatchClick(fabric, colour)}
              className="relative"
            >
              <div
                className={`h-[52px] w-[42px] overflow-hidden rounded-[6px] ${
                  isSelected ? 'border border-black' : ''
                }`}
              >
                {swatchSrc ? (
                  <img
                    src={swatchSrc}
                    alt={`${fabric.name} – ${colour.name}`}
                    className="h-full w-full object-cover rounded-[6px]"
                  />
                ) : (
                  <div
                    className="h-full w-full rounded-[6px]"
                    style={{ backgroundColor: colour.hex }}
                  />
                )}
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
      <button
        onClick={() => {
          setModalFabricId(selectedMaterial.fabricId);
          setModalOpen(true);
        }}
        className="rounded-[50px] border-[0.7px] border-black px-[12px] py-[7px] text-[12px] text-black mb-[21px] block"
      >
        More information about our Materials
      </button>

      {/* Get samples link */}
      <div className="flex items-center gap-[3px]">
        <ColorSwatchIcon className="h-[18px] w-[18px]" />
        <span className="text-[12px] text-black underline">
          Get your samples here
        </span>
      </div>

      {/* Material detail modal */}
      <MaterialModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        initialFabricId={modalFabricId}
      />
    </section>
  );
}
