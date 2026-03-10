'use client';

import { useCallback } from 'react';
import { useStore } from '@/stores';
import { useSofaPrice } from '@/hooks/use-sofa-price';

export function PriceBar() {
  const { total } = useSofaPrice();
  const modules = useStore((s) => s.modules);
  const selectedMaterial = useStore((s) => s.selectedMaterial);
  const addToCart = useStore((s) => s.addToCart);
  const showNotification = useStore((s) => s.showNotification);
  const original = Math.round(total * 1.1);
  const savings = original - total;

  const fmt = (n: number) => n.toLocaleString('de-DE');

  const handleAddToCart = useCallback(() => {
    addToCart({
      moduleId: `config-${Date.now()}`,
      variantId: `${selectedMaterial.fabricId}-${selectedMaterial.colourId}`,
      quantity: 1,
      price: total,
      name: `vetsak Sofa (${modules.length} modules)`,
    });
    showNotification('Configuration added to cart!', 'success');
  }, [addToCart, total, modules.length, selectedMaterial, showNotification]);

  return (
    <div className="fixed inset-x-0 bottom-0 z-20 lg:hidden">
      <div className="mx-auto w-full max-w-[430px] rounded-tl-[12px] rounded-tr-[12px] bg-white/90 shadow-[0px_0px_24px_0px_rgba(0,0,0,0.25)] backdrop-blur-[2px]">
        <div className="flex items-center justify-between px-[18px] py-[9px]">
          <div className="flex w-[160px] flex-col items-start pb-[3px]">
            <p className="text-[10px] text-black">
              <span className="font-bold line-through">{fmt(original)}&euro;</span>
              <span> | you save </span>
              <span className="font-bold text-[#ce0000]">{fmt(savings)}&euro;</span>
            </p>
            <p className="text-[21px] font-bold text-[#ce0000]">
              {fmt(total)}&euro;
            </p>
            <p className="text-[10px] text-black">
              Lowest price in the last 30 days
            </p>
          </div>

          <button
            onClick={handleAddToCart}
            className="flex min-w-[186px] max-w-[186px] items-center justify-center rounded-[60px] bg-black px-[15px] py-[10px]"
          >
            <span className="text-[15px] text-white tracking-[0.105px]">
              Add to cart
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
