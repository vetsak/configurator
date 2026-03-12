'use client';

import { useCallback, useMemo } from 'react';
import { useStore } from '@/stores';

/**
 * Floating action bar shown when a module is selected.
 * Provides "Remove" and deselect buttons.
 */
export function ModuleActions() {
  const modules = useStore((s) => s.modules);
  const selectedModuleId = useStore((s) => s.selectedModuleId);
  const removeModule = useStore((s) => s.removeModule);
  const setSelectedModuleId = useStore((s) => s.setSelectedModuleId);
  const isDragging = useStore((s) => s.dragModuleId !== null);

  const selectedModule = useMemo(
    () => modules.find((m) => m.instanceId === selectedModuleId) ?? null,
    [modules, selectedModuleId]
  );

  const isAccessory = selectedModule?.type === 'pillow' || selectedModule?.type === 'noodle';
  const seatSideCount = modules.filter((m) => m.type === 'seat' || m.type === 'side').length;
  const canRemove = selectedModule !== null && (isAccessory || seatSideCount > 1);

  const handleRemove = useCallback(() => {
    if (!selectedModule) return;
    if (isAccessory) {
      // Accessories don't use anchor connections — simple removal
      useStore.getState().removeAccessory(selectedModule.instanceId);
    } else {
      if (seatSideCount <= 1) return;
      removeModule(selectedModule.instanceId);
    }
    setSelectedModuleId(null);
  }, [selectedModule, isAccessory, seatSideCount, removeModule, setSelectedModuleId]);

  // Nothing selected or dragging — render nothing
  if (!selectedModuleId || !selectedModule || isDragging) return null;

  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
      {/* Module info badge */}
      <span className="rounded-full bg-white/90 px-3 py-1.5 text-xs font-medium text-gray-700 shadow backdrop-blur-sm select-none">
        {selectedModule.moduleId}
      </span>

      {/* Remove button */}
      {canRemove && (
        <button
          onClick={handleRemove}
          className="inline-flex items-center gap-1.5 rounded-full bg-red-500 px-3 py-1.5 text-xs font-medium text-white shadow transition-colors hover:bg-red-600 active:bg-red-700 min-h-[36px] min-w-[36px] touch-manipulation"
          aria-label="Remove selected module"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="h-3.5 w-3.5"
          >
            <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
          </svg>
          <span>Remove</span>
        </button>
      )}

      {/* Deselect button */}
      <button
        onClick={() => setSelectedModuleId(null)}
        className="inline-flex items-center rounded-full bg-white/90 px-3 py-1.5 text-xs font-medium text-gray-500 shadow backdrop-blur-sm transition-colors hover:bg-gray-100 active:bg-gray-200 min-h-[36px] min-w-[36px] touch-manipulation"
        aria-label="Deselect module"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className="h-3.5 w-3.5"
        >
          <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
        </svg>
      </button>
    </div>
  );
}
