'use client';

import { useMemo } from 'react';
import { useStore } from '@/stores';
import { selectModules } from '@/stores/selectors';
import { MODULE_CATALOG } from '@/lib/config/modules';

export function useSofaPrice() {
  const modules = useStore(selectModules);
  const selectedMaterial = useStore((s) => s.selectedMaterial);
  const priceLookup = useStore((s) => s.priceLookup);

  const total = useMemo(() => {
    const { fabricId, colourId } = selectedMaterial;

    return modules.reduce((sum, mod) => {
      const catalogEntry = MODULE_CATALOG[mod.moduleId];
      if (!catalogEntry) return sum;

      // Try specific price: fabric-color-moduleSize
      const specificKey = `${fabricId}-${colourId}-${mod.moduleId}`;
      const specificPrice = priceLookup.get(specificKey);
      if (specificPrice != null) return sum + specificPrice;

      // Try base price for fabric-color
      const baseKey = `${fabricId}-${colourId}`;
      const baseShopifyPrice = priceLookup.get(baseKey);
      if (baseShopifyPrice != null) return sum + baseShopifyPrice;

      // Fallback to hardcoded catalog price
      return sum + (catalogEntry.basePrice ?? 0);
    }, 0);
  }, [modules, selectedMaterial, priceLookup]);

  return { total, formatted: `€${total.toLocaleString('de-DE')}` };
}
