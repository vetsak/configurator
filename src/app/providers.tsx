'use client';

import { useEffect, useRef } from 'react';
import { useStore } from '@/stores';
import { applyPreset, autoPlaceSides } from '@/lib/snapping/layout-solver';
import { preloadCordNormalMap } from '@/lib/three/material-factory';
import { useConfigRestore } from '@/hooks/use-config-restore';
import { useAutoSave } from '@/hooks/use-auto-save';
import { loadConfigFromLocal } from '@/lib/persistence';

export function Providers({ children }: { children: React.ReactNode }) {
  const setModules = useStore((s) => s.setModules);
  const setPresetId = useStore((s) => s.setPresetId);
  const setMaterial = useStore((s) => s.setMaterial);
  const setWelcomeBackOpen = useStore((s) => s.setWelcomeBackOpen);
  const modules = useStore((s) => s.modules);
  const { isRestoring, restoredFromShare } = useConfigRestore();
  const restoredFromLocal = useRef(false);

  // Auto-save on every change
  useAutoSave();

  // Preload cord normal map, then apply default preset or restore saved config
  // Skip if config was restored from a shared URL
  useEffect(() => {
    if (isRestoring || restoredFromShare) return;

    preloadCordNormalMap().then(() => {
      if (modules.length > 0) return;

      // Try to restore from localStorage
      const saved = loadConfigFromLocal();
      if (saved && saved.modules.length > 0) {
        setModules(saved.modules);
        if (saved.presetId) setPresetId(saved.presetId);
        if (saved.material) setMaterial(saved.material);
        restoredFromLocal.current = true;
        setWelcomeBackOpen(true);
        return;
      }

      // No saved config — apply default preset
      const placed = applyPreset('single');
      setModules(autoPlaceSides(placed));
      setPresetId('single');
    });
  }, [isRestoring, restoredFromShare]); // eslint-disable-line react-hooks/exhaustive-deps

  return <>{children}</>;
}
