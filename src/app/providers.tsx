'use client';

import { useEffect } from 'react';
import { useStore } from '@/stores';
import { applyPreset, autoPlaceSides } from '@/lib/snapping/layout-solver';
import { preloadCordNormalMap } from '@/lib/three/material-factory';
import { useConfigRestore } from '@/hooks/use-config-restore';

export function Providers({ children }: { children: React.ReactNode }) {
  const setModules = useStore((s) => s.setModules);
  const setPresetId = useStore((s) => s.setPresetId);
  const modules = useStore((s) => s.modules);
  const { isRestoring, restoredFromShare } = useConfigRestore();

  // Preload cord normal map, then apply default preset
  // Skip if config was restored from a shared URL
  useEffect(() => {
    if (isRestoring || restoredFromShare) return;

    preloadCordNormalMap().then(() => {
      if (modules.length === 0) {
        const placed = applyPreset('single');
        setModules(autoPlaceSides(placed));
        setPresetId('single');
      }
    });
  }, [isRestoring, restoredFromShare]); // eslint-disable-line react-hooks/exhaustive-deps

  return <>{children}</>;
}
