'use client';

import { useStore } from '@/stores';
import { MODULE_CATALOG } from '@/lib/config/modules';

const DRAGGABLE_MODULES = Object.values(MODULE_CATALOG).filter(
  (m) => m.type === 'seat' || m.type === 'side'
);

export function ModulePalette() {
  const dragModuleId = useStore((s) => s.dragModuleId);
  const startDrag = useStore((s) => s.startCatalogDrag);
  const cancelDrag = useStore((s) => s.cancelDrag);

  const handleSelect = (moduleId: string) => {
    if (dragModuleId === moduleId) {
      cancelDrag();
    } else {
      startDrag(moduleId);
    }
  };

  return (
    <div className="absolute top-4 right-4 z-10 rounded-lg bg-white/90 p-3 shadow-lg backdrop-blur-sm w-48">
      <h3 className="text-xs font-semibold text-gray-900 mb-2 uppercase tracking-wide">
        Add Module
      </h3>

      {dragModuleId && (
        <div className="mb-2 px-2 py-1 bg-blue-50 rounded text-[10px] text-blue-700">
          Click on the sofa to place. Press Esc to cancel.
        </div>
      )}

      <div className="space-y-1">
        {DRAGGABLE_MODULES.map((mod) => (
          <button
            key={mod.id}
            onClick={() => handleSelect(mod.id)}
            className={`w-full flex items-center justify-between px-2 py-1.5 rounded text-xs transition-colors ${
              dragModuleId === mod.id
                ? 'bg-blue-600 text-white'
                : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
            }`}
          >
            <span className="font-medium">{mod.name}</span>
            <span className={`text-[10px] ${
              dragModuleId === mod.id ? 'text-blue-200' : 'text-gray-400'
            }`}>
              {mod.dimensions.width.toFixed(0) === '0'
                ? `${(mod.dimensions.width * 100).toFixed(0)}cm`
                : `${(mod.dimensions.width * 100).toFixed(0)}cm`}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
