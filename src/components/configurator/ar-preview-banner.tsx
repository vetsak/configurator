'use client';

import { useState } from 'react';
import { useArExport } from '@/hooks/use-ar-export';
import { AiRenderModal } from './ai-render-modal';

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
  const { triggerAR, isExporting, isSupported } = useArExport();
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);

  return (
    <>
      {/* AR Mode CTA */}
      <section className="bg-white px-[18px] py-[10px] lg:px-[28px]">
        <div className="flex items-center gap-[16px] rounded-[16px] bg-[#f5f4ef] p-[20px]">
          <div className="shrink-0 flex h-[56px] w-[56px] items-center justify-center rounded-[14px] bg-white shadow-[0px_1px_4px_rgba(0,0,0,0.06)]">
            <ArIcon className="h-[32px] w-[32px] text-[#3d3d3d]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[15px] font-semibold text-black leading-tight">
              Place your sofa at home
            </p>
            <p className="text-[12px] text-black/45 mt-[4px] leading-[1.4]">
              Use your phone&apos;s camera to see how your vetsak sofa fits in your space.
            </p>
          </div>
          <button
            onClick={triggerAR}
            disabled={isExporting}
            className="shrink-0 rounded-full bg-black px-[16px] py-[8px] text-[12px] font-medium text-white transition-colors hover:bg-black/85 disabled:opacity-50"
          >
            {isExporting ? 'Preparing...' : isSupported ? 'Try AR' : 'Download 3D'}
          </button>
        </div>
      </section>

      {/* AI Rendering CTA */}
      <section className="bg-white px-[18px] py-[10px] lg:px-[28px]">
        <div className="flex items-center gap-[16px] rounded-[16px] bg-[#f5f4ef] p-[20px]">
          <div className="shrink-0 flex h-[56px] w-[56px] items-center justify-center rounded-[14px] bg-white shadow-[0px_1px_4px_rgba(0,0,0,0.06)]">
            <AiRenderIcon className="h-[32px] w-[32px] text-[#3d3d3d]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[15px] font-semibold text-black leading-tight">
              Picture it in your room
            </p>
            <p className="text-[12px] text-black/45 mt-[4px] leading-[1.4]">
              Snap a photo of your living room and we&apos;ll place your sofa right into the scene.
            </p>
          </div>
          <button
            onClick={() => setIsAiModalOpen(true)}
            className="shrink-0 rounded-full bg-black px-[16px] py-[8px] text-[12px] font-medium text-white transition-colors hover:bg-black/85"
          >
            Try AI
          </button>
        </div>
      </section>

      <AiRenderModal open={isAiModalOpen} onClose={() => setIsAiModalOpen(false)} />
    </>
  );
}
