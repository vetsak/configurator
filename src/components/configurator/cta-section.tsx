'use client';

import { useCallback } from 'react';
import { useStore } from '@/stores';
import { useSofaPrice } from '@/hooks/use-sofa-price';

export function CtaSection() {
  const modules = useStore((s) => s.modules);
  const selectedMaterial = useStore((s) => s.selectedMaterial);
  const addToCart = useStore((s) => s.addToCart);
  const showNotification = useStore((s) => s.showNotification);
  const setSaveModalOpen = useStore((s) => s.setSaveModalOpen);
  const { total } = useSofaPrice();

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

  const handleSaveConfig = useCallback(() => {
    setSaveModalOpen(true);
  }, [setSaveModalOpen]);

  return (
    <section className="bg-white px-[18px] py-[21px] flex flex-col gap-[9px] items-start">
      <div className="flex flex-col gap-[9px] w-full">
        <button
          onClick={handleAddToCart}
          className="w-full rounded-[60px] bg-black px-[15px] py-[10px] text-[15px] text-white text-center tracking-[0.105px]"
        >
          Add to cart
        </button>
        <button
          onClick={handleSaveConfig}
          className="w-full rounded-[60px] border border-black bg-white px-[15px] py-[10px] text-[15px] text-black text-center tracking-[0.105px]"
        >
          Save your configuration
        </button>
      </div>
      <p className="text-[11px] text-black text-center tracking-[0.077px] w-full">
        5 Year Guarantee &nbsp;&bull;&nbsp; Free Shipping &amp; Returns &nbsp;&bull;&nbsp; Made in Europe
      </p>
    </section>
  );
}
