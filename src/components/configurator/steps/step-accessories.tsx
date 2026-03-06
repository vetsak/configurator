'use client';

import { DUMMY_ACCESSORIES } from '@/lib/config/dummy-data';

export function StepAccessories() {
  return (
    <section className="px-4 pt-6 pb-4 md:px-6">
      <h2 className="mb-4 text-base font-semibold text-gray-900 md:text-lg">
        Accessories
      </h2>
      <div className="grid grid-cols-2 gap-3">
        {DUMMY_ACCESSORIES.map((item) => (
          <div key={item.id} className="rounded-xl border border-gray-200 p-3">
            <img src={item.image} alt={item.name} className="mb-2 h-20 w-full rounded-lg object-cover" />
            <span className="text-sm font-medium text-gray-900">{item.name}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
