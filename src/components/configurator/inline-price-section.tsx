'use client';

import { useRef, useEffect } from 'react';
import { useSofaPrice } from '@/hooks/use-sofa-price';
import { useStore } from '@/stores';

export function InlinePriceSection() {
  const { total } = useSofaPrice();
  const setInlinePriceVisible = useStore((s) => s.setInlinePriceVisible);
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setInlinePriceVisible(entry.isIntersecting),
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [setInlinePriceVisible]);
  const original = Math.round(total * 1.1);
  const savings = original - total;

  const fmt = (n: number) => n.toLocaleString('de-DE');

  return (
    <section ref={ref} className="bg-white py-[15px] flex flex-col gap-[3px] items-center text-center">
      <p className="text-[12px] text-black max-w-[384px]">
        <span className="font-bold line-through">{fmt(original)}&euro;</span>
        <span> | you save </span>
        <span className="font-bold text-[#ce0000]">{fmt(savings)}&euro; </span>
        <span>till the 03.03.2026</span>
      </p>
      <p className="text-[27px] font-bold text-[#ce0000] max-w-[384px]">
        {fmt(total)}&euro;
      </p>
      <p className="text-[12px] text-black max-w-[384px]">
        Lowest price in the last 30 days
      </p>
    </section>
  );
}
