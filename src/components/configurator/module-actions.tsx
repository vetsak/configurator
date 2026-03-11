'use client';

import { useCallback, useMemo } from 'react';
import { useStore } from '@/stores';

/**
 * Floating action bar shown when a module is selected.
 * Provides "Move" and "Remove" buttons, plus deselect.
 */
export function ModuleActions() {
  const modules = useStore((s) => s.modules);
  const selectedModuleId = useStore((s) => s.selectedModuleId);
  const removeModule = useStore((s) => s.removeModule);
  const setSelectedModuleId = useStore((s) => s.setSelectedModuleId);
  const startRepositionDrag = useStore((s) => s.startRepositionDrag);
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

  const handleMove = useCallback(() => {
    if (!selectedModule) return;
    startRepositionDrag(selectedModule.instanceId);
    setSelectedModuleId(null);
  }, [selectedModule, startRepositionDrag, setSelectedModuleId]);

  // Nothing selected or dragging — render nothing
  if (!selectedModuleId || !selectedModule || isDragging) return null;

  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
      {/* Module info badge */}
      <span className="rounded-full bg-white/90 px-3 py-1.5 text-xs font-medium text-gray-700 shadow backdrop-blur-sm select-none">
        {selectedModule.moduleId}
      </span>

      {/* Move button — not available for accessories */}
      {!isAccessory && <button
        onClick={handleMove}
        className="inline-flex items-center gap-1.5 rounded-full bg-blue-500 px-3 py-1.5 text-xs font-medium text-white shadow transition-colors hover:bg-blue-600 active:bg-blue-700 min-h-[36px] min-w-[36px] touch-manipulation"
        aria-label="Move selected module"
      >
        {/* Move icon (arrows-pointing-out) */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className="h-3.5 w-3.5"
        >
          <path d="M3.28 2.22a.75.75 0 00-1.06 1.06L5.44 6.5H2.75a.75.75 0 000 1.5h4.5A.75.75 0 008 7.25v-4.5a.75.75 0 00-1.5 0v2.69L3.28 2.22zM13.5 2.75a.75.75 0 00-1.5 0v4.5c0 .414.336.75.75.75h4.5a.75.75 0 000-1.5h-2.69l3.22-3.22a.75.75 0 00-1.06-1.06L13.5 5.44V2.75zM2.75 12a.75.75 0 000 1.5h2.69l-3.22 3.22a.75.75 0 101.06 1.06L6.5 14.56v2.69a.75.75 0 001.5 0v-4.5A.75.75 0 007.25 12h-4.5zM12.75 12a.75.75 0 00-.75.75v4.5a.75.75 0 001.5 0v-2.69l3.22 3.22a.75.75 0 101.06-1.06L14.56 13.5h2.69a.75.75 0 000-1.5h-4.5z" />
        </svg>
        <span>Move</span>
      </button>}

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
