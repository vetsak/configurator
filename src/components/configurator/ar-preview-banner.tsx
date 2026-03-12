'use client';

import { useState } from 'react';
import { useArExport } from '@/hooks/use-ar-export';
import { useStore } from '@/stores';
import { AiRenderModal } from './ai-render-modal';
import { ArQrModal } from './ar-qr-modal';

function ArIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Phone outline */}
      <rect x="12" y="4" width="24" height="40" rx="3" stroke="currentColor" strokeWidth="1.5" fill="none" />
      <rect x="14" y="8" width="20" height="28" rx="1" stroke="currentColor" strokeWidth="0.75" fill="none" strokeDasharray="2 2" />
      {/* Sofa silhouette inside phone */}
      <rect x="18" y="22" width="12" height="6" rx="1.5" fill="currentColor" opacity="0.3" />
      <rect x="17" y="24" width="3" height="5" rx="1" fill="currentColor" opacity="0.25" />
      <rect x="28" y="24" width="3" height="5" rx="1" fill="currentColor" opacity="0.25" />
      {/* AR corner brackets */}
      <path d="M16 12h-2v2M32 12h2v2M16 32h-2v-2M32 32h2v-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      {/* Home indicator */}
      <rect x="20" y="40" width="8" height="1.5" rx="0.75" fill="currentColor" opacity="0.3" />
    </svg>
  );
}

function AiRenderIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Camera lens */}
      <circle cx="24" cy="24" r="14" stroke="currentColor" strokeWidth="1.5" fill="none" />
      <circle cx="24" cy="24" r="9" stroke="currentColor" strokeWidth="1" fill="none" opacity="0.4" />
      <circle cx="24" cy="24" r="4" fill="currentColor" opacity="0.2" />
      {/* Sparkle / AI stars */}
      <path d="M38 8l1 3 3 1-3 1-1 3-1-3-3-1 3-1 1-3z" fill="currentColor" opacity="0.5" />
      <path d="M10 34l0.7 2 2 0.7-2 0.7-0.7 2-0.7-2-2-0.7 2-0.7 0.7-2z" fill="currentColor" opacity="0.4" />
      <path d="M40 30l0.5 1.5 1.5 0.5-1.5 0.5-0.5 1.5-0.5-1.5-1.5-0.5 1.5-0.5 0.5-1.5z" fill="currentColor" opacity="0.35" />
      {/* Sofa silhouette inside lens */}
      <rect x="18" y="23" width="12" height="5" rx="1.5" fill="currentColor" opacity="0.15" />
      <rect x="17" y="25" width="2.5" height="4" rx="0.8" fill="currentColor" opacity="0.12" />
      <rect x="28.5" y="25" width="2.5" height="4" rx="0.8" fill="currentColor" opacity="0.12" />
    </svg>
  );
}

export function ArPreviewBanner() {
  const { triggerAR, isExporting, buttonLabel } = useArExport();
  const arQrModalOpen = useStore((s) => s.arQrModalOpen);
  const arQrUrl = useStore((s) => s.arQrUrl);
  const setArQrModalOpen = useStore((s) => s.setArQrModalOpen);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);

  return (
    <>
      {/* AR Mode CTA */}
      <section className="bg-white px-[18px] py-[10px] lg:px-[28px]">
        <div className="rounded-[12px] bg-[#f5f4ef] px-[15px] py-[21px]">
          <div className="mb-[11px]">
            <ArIcon className="h-[40px] w-[40px] text-[#3d3d3d]" />
          </div>

          <h3 className="mb-[11px] text-[21px] font-medium text-black">
            Place your sofa at home
          </h3>

          <p className="mb-[11px] text-[13px] text-black/60 leading-normal">
            Use your phone&apos;s camera to see how your vetsak sofa fits in your space.
          </p>

          <button
            onClick={triggerAR}
            disabled={isExporting}
            className="rounded-[50px] border-[0.7px] border-black bg-black px-[12px] py-[7px] text-[12px] text-white transition-colors hover:bg-black/85 disabled:opacity-50"
          >
            {isExporting ? 'Preparing...' : buttonLabel}
          </button>
        </div>
      </section>

      {/* AI Rendering CTA */}
      <section className="bg-white px-[18px] py-[10px] lg:px-[28px]">
        <div className="rounded-[12px] bg-[#f5f4ef] px-[15px] py-[21px]">
          <div className="mb-[11px]">
            <AiRenderIcon className="h-[40px] w-[40px] text-[#3d3d3d]" />
          </div>

          <h3 className="mb-[11px] text-[21px] font-medium text-black">
            Picture it in your room
          </h3>

          <p className="mb-[11px] text-[13px] text-black/60 leading-normal">
            Snap a photo of your living room and we&apos;ll place your sofa right into the scene.
          </p>

          <button
            onClick={() => setIsAiModalOpen(true)}
            className="rounded-[50px] border-[0.7px] border-black bg-black px-[12px] py-[7px] text-[12px] text-white transition-colors hover:bg-black/85"
          >
            Generate photo
          </button>
        </div>
      </section>

      <AiRenderModal open={isAiModalOpen} onClose={() => setIsAiModalOpen(false)} />
      <ArQrModal open={arQrModalOpen} onOpenChange={setArQrModalOpen} configUrl={arQrUrl} />
    </>
  );
}
