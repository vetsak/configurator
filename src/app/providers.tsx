'use client';

import { useEffect } from 'react';
import { useStore } from '@/stores';
import { applyPreset, autoPlaceSides } from '@/lib/snapping/layout-solver';
import { preloadCordNormalMap } from '@/lib/three/material-factory';

export function Providers({ children }: { children: React.ReactNode }) {
  const setModules = useStore((s) => s.setModules);
  const setPresetId = useStore((s) => s.setPresetId);
  const modules = useStore((s) => s.modules);

  // Preload cord normal map, then apply default preset
  // Shopify catalog is baked in at build time — no fetch needed
  useEffect(() => {
    preloadCordNormalMap().then(() => {
      if (modules.length === 0) {
        const placed = applyPreset('single');
        setModules(autoPlaceSides(placed));
        setPresetId('single');
      }
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return <>{children}</>;
}
