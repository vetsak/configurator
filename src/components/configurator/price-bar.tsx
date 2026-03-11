'use client';

import { useCallback, useState } from 'react';
import { useStore } from '@/stores';
import { useSofaPrice } from '@/hooks/use-sofa-price';
import { addToCart, postCartMessage } from '@/lib/shopify/shopify-cart';
import { getAllFabrics } from '@/lib/config/materials';

export function PriceBar() {
  const { total } = useSofaPrice();
  const modules = useStore((s) => s.modules);
  const selectedMaterial = useStore((s) => s.selectedMaterial);
  const showNotification = useStore((s) => s.showNotification);
  const inlinePriceVisible = useStore((s) => s.inlinePriceVisible);
  const fabricCatalog = useStore((s) => s.fabricCatalog);
  const [adding, setAdding] = useState(false);

  const original = Math.round(total * 1.1);
  const savings = original - total;

  const fmt = (n: number) => n.toLocaleString('de-DE');

  const handleAddToCart = useCallback(async () => {
    if (adding) return;
    setAdding(true);

    try {
      // Resolve Shopify variant IDs for each module
      const allFabrics = getAllFabrics(fabricCatalog);
      const activeFabric = allFabrics.find((f) => f.id === selectedMaterial.fabricId);
      const activeColour = activeFabric?.colours.find((c) => c.id === selectedMaterial.colourId);
      const variantId = activeColour?.shopifyVariantId;

      if (variantId) {
        // Real Shopify cart flow
        const lines = modules.map(() => ({
          variantId,
          quantity: 1,
        }));

        const cart = await addToCart(lines);
        postCartMessage(cart.checkoutUrl, cart.id);
        showNotification('Added to cart!', 'success');
      } else {
        // Fallback: notify parent via postMessage with config data
        window.parent?.postMessage(
          {
            type: 'cart:add',
            modules: modules.map((m) => ({
              moduleId: m.moduleId,
              fabric: selectedMaterial.fabricId,
              colour: selectedMaterial.colourId,
            })),
            total,
          },
          '*'
        );
        showNotification('Configuration added to cart!', 'success');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to add to cart';
      showNotification(message, 'info');
    } finally {
      setAdding(false);
    }
  }, [adding, modules, selectedMaterial, fabricCatalog, total, showNotification]);

  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-20 lg:relative lg:inset-auto lg:z-auto grid transition-[grid-template-rows] duration-300 ${
        inlinePriceVisible ? 'grid-rows-[0fr]' : 'grid-rows-[1fr]'
      }`}
    >
      <div className="overflow-hidden">
        <div className="mx-auto w-full max-w-[430px] rounded-tl-[12px] rounded-tr-[12px] bg-white/90 shadow-[0px_0px_24px_0px_rgba(0,0,0,0.25)] backdrop-blur-[2px] lg:max-w-none lg:rounded-none lg:bg-white lg:shadow-[0px_-1px_12px_0px_rgba(0,0,0,0.08)]">
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
              disabled={adding}
              className="flex min-w-[186px] max-w-[186px] items-center justify-center rounded-[60px] bg-black px-[15px] py-[10px] disabled:opacity-60"
            >
              <span className="text-[15px] text-white tracking-[0.105px]">
                {adding ? 'Adding...' : 'Add to cart'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
