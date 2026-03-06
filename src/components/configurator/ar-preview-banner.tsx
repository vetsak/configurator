'use client';

import { useArExport } from '@/hooks/use-ar-export';

export function ArPreviewBanner() {
  const { triggerAR, isExporting, isSupported } = useArExport();

  return (
    <>
      {/* AR Mode CTA */}
      <section className="bg-white px-[18px] py-[20px]">
        <div className="flex items-center justify-between rounded-[12px] bg-[#eee] p-[15px]">
          <div className="flex flex-col gap-[3px]">
            <p className="text-[18px] font-medium text-black w-[188px]">
              See your sofa in your living room
            </p>
          </div>
          <button
            onClick={triggerAR}
            disabled={isExporting}
            className="shrink-0 rounded-[50px] border-[0.7px] border-[#111] px-[21px] py-[7px] text-[12px] text-[#111] disabled:opacity-50"
          >
            {isExporting ? 'Preparing...' : isSupported ? 'Open AR mode' : 'Download 3D'}
          </button>
        </div>
      </section>

      {/* AI Rendering CTA */}
      <section className="bg-white px-[18px] py-[20px]">
        <div className="flex items-center justify-between rounded-[12px] bg-[#eee] p-[15px]">
          <div className="flex flex-col gap-[3px]">
            <p className="text-[18px] font-medium text-black w-[188px]">
              See your sofa in your living room
            </p>
          </div>
          <button className="shrink-0 rounded-[50px] border-[0.7px] border-[#111] px-[21px] py-[7px] text-[12px] text-[#111]">
            AI Rendering
          </button>
        </div>
      </section>
    </>
  );
}
