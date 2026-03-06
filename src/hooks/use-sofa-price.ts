'use client';

import { useMemo } from 'react';
import { useStore } from '@/stores';
import { selectModules } from '@/stores/selectors';
import { MODULE_CATALOG } from '@/lib/config/modules';

export function useSofaPrice() {
  const modules = useStore(selectModules);

  const total = useMemo(() => {
    return modules.reduce((sum, mod) => {
      const catalogEntry = MODULE_CATALOG[mod.moduleId];
      return sum + (catalogEntry?.basePrice ?? 0);
    }, 0);
  }, [modules]);

  return { total, formatted: `€${total.toLocaleString('de-DE')}` };
}
