'use client';

import { useEffect } from 'react';
import { useStore } from '@/stores';
import { applyPreset } from '@/lib/snapping/layout-solver';
import { preloadCordNormalMap } from '@/lib/three/material-factory';

export function Providers({ children }: { children: React.ReactNode }) {
  const setModules = useStore((s) => s.setModules);
  const setPresetId = useStore((s) => s.setPresetId);
  const modules = useStore((s) => s.modules);

  // Preload cord normal map, then apply default preset
  useEffect(() => {
    preloadCordNormalMap().then(() => {
      if (modules.length === 0) {
        const placed = applyPreset('single');
        setModules(placed);
        setPresetId('single');
      }
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return <>{children}</>;
}
