'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { useStore } from '@/stores';
import { getAllFabrics } from '@/lib/config/materials';
import { CheckmarkIcon } from '@/components/icons';
import type { FabricDefinition, ColourVariant } from '@/types/materials';

interface MaterialModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Pre-select a fabric tab when opening */
  initialFabricId?: string;
}

export function MaterialModal({ open, onOpenChange, initialFabricId }: MaterialModalProps) {
  const fabricCatalog = useStore((s) => s.fabricCatalog);
  const selectedMaterial = useStore((s) => s.selectedMaterial);
  const setMaterial = useStore((s) => s.setMaterial);

  const allFabrics = getAllFabrics(fabricCatalog);
  const activeFabric =
    allFabrics.find((f) => f.id === (initialFabricId ?? selectedMaterial.fabricId)) ??
    allFabrics[0];

  const [previewColour, setPreviewColour] = useState<ColourVariant | null>(null);

  if (!activeFabric) return null;

  const handleSelectColor = (fabric: FabricDefinition, colour: ColourVariant) => {
    setMaterial({ fabricId: fabric.id, colourId: colour.id });
  };

  // Find the HQ texture for the currently selected or previewed colour
  const displayColour =
    previewColour ??
    activeFabric.colours.find((c) => c.id === selectedMaterial.colourId) ??
    activeFabric.colours[0];
  const texturePreviewSrc = displayColour?.textureLocal || displayColour?.textureUrl;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[min(560px,calc(100vw-2rem))] max-h-[85vh] overflow-y-auto p-0">
        <DialogHeader className="px-6 pt-6 pb-0">
          <DialogTitle className="text-[20px] font-bold text-black flex items-center gap-2">
            {activeFabric.name}
            {activeFabric.badge && (
              <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-medium text-emerald-700">
                {activeFabric.badge}
              </span>
            )}
          </DialogTitle>
          {activeFabric.description && (
            <DialogDescription className="text-[13px] text-gray-600 mt-1">
              {activeFabric.description}
            </DialogDescription>
          )}
        </DialogHeader>

        {/* HQ Texture Preview */}
        {texturePreviewSrc && (
          <div className="px-6 pt-4">
            <div className="overflow-hidden rounded-lg border border-gray-100">
              <img
                src={texturePreviewSrc}
                alt={`${activeFabric.name} – ${displayColour?.name ?? ''} texture`}
                className="w-full h-auto max-h-[280px] object-cover"
              />
            </div>
            {displayColour && (
              <p className="text-[11px] text-gray-500 mt-1.5 text-center">
                {activeFabric.name} – {displayColour.name}
              </p>
            )}
          </div>
        )}

        {/* Specifications table */}
        {activeFabric.specs && activeFabric.specs.length > 0 && (
          <div className="border-t px-6 py-4">
            <p className="text-[13px] font-medium text-black mb-2">Specifications</p>
            <table className="w-full text-[12px]">
              <tbody>
                {activeFabric.specs.map((spec, i) => (
                  <tr key={i} className={i % 2 === 0 ? 'bg-gray-50' : ''}>
                    <td className="py-1.5 px-2 text-gray-500 font-medium w-[45%]">{spec.label}</td>
                    <td className="py-1.5 px-2 text-gray-800">{spec.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Color grid */}
        <div className="border-t px-6 pb-6 pt-4">
          <p className="text-[13px] text-black mb-3 font-medium">
            {activeFabric.colours.length} colours available
          </p>
          <div className="grid grid-cols-5 gap-3 sm:grid-cols-7">
            {activeFabric.colours.map((colour) => {
              const isSelected =
                selectedMaterial.fabricId === activeFabric.id &&
                selectedMaterial.colourId === colour.id;
              const swatchSrc = colour.swatchPath || colour.swatchUrl;

              return (
                <button
                  key={colour.id}
                  onClick={() => handleSelectColor(activeFabric, colour)}
                  onMouseEnter={() => setPreviewColour(colour)}
                  onMouseLeave={() => setPreviewColour(null)}
                  className="relative flex flex-col items-center gap-1"
                >
                  <div
                    className={`h-[52px] w-[42px] overflow-hidden rounded-[6px] ${
                      isSelected ? 'ring-2 ring-black ring-offset-1' : 'border border-gray-200'
                    }`}
                  >
                    {swatchSrc ? (
                      <img
                        src={swatchSrc}
                        alt={colour.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div
                        className="h-full w-full"
                        style={{ backgroundColor: colour.hex }}
                      />
                    )}
                  </div>
                  {isSelected && (
                    <div className="absolute bottom-4 right-0 flex h-[15px] w-[15px] items-center justify-center rounded-br-[6px] bg-black">
                      <CheckmarkIcon className="h-[9px] w-[9px]" />
                    </div>
                  )}
                  <span className="text-[9px] text-gray-600 leading-tight text-center truncate w-[42px]">
                    {colour.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
