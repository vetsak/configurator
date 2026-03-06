'use client';

import { MODULE_CATALOG } from '@/lib/config/modules';
import type { ModuleCatalogEntry } from '@/types/modules';

const PILLOW_MODULES: ModuleCatalogEntry[] = Object.values(
  MODULE_CATALOG
).filter((m) => m.type === 'pillow' || m.type === 'noodle');

function formatPrice(price: number): string {
  return `${price.toLocaleString('de-DE')}\u00A0\u20AC`;
}

export function StepPillows() {
  return (
    <section className="px-4 pt-6 pb-2 md:px-6">
      <div className="mb-1 text-xs font-medium uppercase tracking-wider text-gray-400">
        Step 5
      </div>
      <h2 className="mb-4 text-base font-semibold text-gray-900 md:text-lg">
        Finish your sofa look
      </h2>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
        {PILLOW_MODULES.map((mod) => (
          <div
            key={mod.id}
            className="flex flex-col items-start rounded-xl border border-gray-200 bg-white p-3 shadow-sm transition-all hover:border-gray-300 hover:shadow-md"
          >
            {/* Placeholder image area */}
            <div className="mb-3 flex h-20 w-full items-center justify-center rounded-lg bg-gray-50">
              <svg
                className="h-8 w-8 text-gray-300"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>

            {/* Pillow name */}
            <span className="text-sm font-medium text-gray-900">
              {mod.name}
            </span>

            {/* Price */}
            <span className="mt-1 text-sm font-semibold text-gray-900">
              {formatPrice(mod.basePrice)}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
