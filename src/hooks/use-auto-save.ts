'use client';

import { useEffect, useRef } from 'react';
import { useStore } from '@/stores';
import { saveConfigToLocal } from '@/lib/persistence';

/**
 * Auto-saves the current configuration to localStorage on every change,
 * debounced by 500ms. Skips saving when no modules are placed.
 */
export function useAutoSave() {
  const modules = useStore((s) => s.modules);
  const presetId = useStore((s) => s.presetId);
  const selectedMaterial = useStore((s) => s.selectedMaterial);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFirstRender = useRef(true);

  useEffect(() => {
    // Skip the initial render — don't save the default/restored config immediately
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    // Don't save empty configurations
    if (modules.length === 0) return;

    // Debounce 500ms
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      saveConfigToLocal(modules, presetId, selectedMaterial);
    }, 500);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [modules, presetId, selectedMaterial]);
}
