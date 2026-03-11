'use client';

import { useStore } from '@/stores';
import { MODULE_DISPLAY_NAMES } from '@/lib/config/dummy-data';
import { MODULE_CATALOG } from '@/lib/config/modules';
import { PlusIcon } from '@/components/icons';
import { predictBestPlacement } from '@/lib/snapping/seat-predictor';
import { useSelectedColour } from '@/hooks/use-selected-colour';

const MODULES = [
  'seat-xl', 'seat-l', 'seat-m', 'seat-s', 'seat-xs',
  'side-l', 'side-m', 'side-s',
];


export function StepModules() {
  const dragModuleId = useStore((s) => s.dragModuleId);
  const startCatalogDrag = useStore((s) => s.startCatalogDrag);
  const cancelDrag = useStore((s) => s.cancelDrag);
  const showNotification = useStore((s) => s.showNotification);
  const { fabricId, colourId } = useSelectedColour();

  const handleClick = (moduleId: string) => {
    if (dragModuleId === moduleId) {
      cancelDrag();
      return;
    }

    const catalog = MODULE_CATALOG[moduleId];
    if (!catalog) return;

    // For seat modules, try smart prediction first
    if (catalog.type === 'seat') {
      const { modules, placeSnappedModule } = useStore.getState();
      if (modules.length > 0) {
        const prediction = predictBestPlacement(moduleId, modules);
        if (prediction) {
          placeSnappedModule(moduleId, prediction);
          showNotification('Seat placed automatically', 'info');
          return;
        }
      }
    }

    // Fallback: enter drag/click-to-place mode
    startCatalogDrag(moduleId);
    showNotification('Click on the sofa to place the module', 'info');
  };

  return (
    <section className="bg-white px-[18px] py-[21px] lg:px-[28px] lg:py-[28px]">
      <div className="mb-[21px]">
        <p className="text-[18px] lg:text-[20px] text-black w-[384px] lg:w-auto">
          Add seats and sites to your configuration
        </p>
      </div>

      {dragModuleId && (
        <p className="text-[12px] text-black/50 mb-[12px]">
          Click on the sofa in the viewer above to place the module
        </p>
      )}

      <div className="flex flex-wrap content-center gap-[9px]">
        {MODULES.map((id) => {
          const isActive = dragModuleId === id;
          return (
            <button
              key={id}
              onClick={() => handleClick(id)}
              className={`relative h-[114px] w-[89px] shrink-0 overflow-hidden rounded-[6px] border bg-white transition-colors ${
                isActive ? 'border-black border-2' : 'border-black/20'
              }`}
            >
              {/* Product photo top half — real Shopify image per colour */}
              <div className="absolute left-[-1px] top-[-1px] h-[63px] w-[89px]">
                <img
                  src={`/images/modules/${id}-${fabricId}-${colourId}.jpg`}
                  alt={id}
                  className="absolute inset-0 h-full w-full object-cover"
                  onError={(e) => {
                    // Fallback to generic module image
                    (e.target as HTMLImageElement).src = `/images/modules/${id}.jpg`;
                  }}
                />
              </div>

              {/* Plus icon top-right */}
              <div className="absolute right-[-1px] top-[-1px]">
                <PlusIcon className="h-[24px] w-[26px]" />
              </div>

              {/* Module name bottom centered */}
              <div className="absolute left-1/2 top-[84px] -translate-x-1/2 -translate-y-1/2 flex h-[26px] w-[78px] flex-col items-center justify-center text-center text-[11px] font-medium text-black leading-tight">
                {(MODULE_DISPLAY_NAMES[id] || id).split('\n').map((line, i) => (
                  <span key={i}>{line}</span>
                ))}
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
