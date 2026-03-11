import { useMemo } from 'react';
import { useStore } from '@/stores';

/**
 * Returns the hex colour and swatch image for the currently selected material.
 */
export function useSelectedColour() {
  const selectedMaterial = useStore((s) => s.selectedMaterial);
  const fabricCatalog = useStore((s) => s.fabricCatalog);

  return useMemo(() => {
    const fabric = fabricCatalog.find((f) => f.id === selectedMaterial.fabricId);
    const colour = fabric?.colours.find((c) => c.id === selectedMaterial.colourId);
    return {
      fabricId: selectedMaterial.fabricId,
      colourId: selectedMaterial.colourId,
      hex: colour?.hex ?? '#b8b0a8',
      name: colour?.name ?? 'Platinum',
      fabricName: fabric?.name ?? 'Cord Velour',
      swatchSrc: colour?.swatchPath || colour?.swatchUrl || null,
      textureLocal: colour?.textureLocal || colour?.textureUrl || null,
    };
  }, [selectedMaterial, fabricCatalog]);
}
