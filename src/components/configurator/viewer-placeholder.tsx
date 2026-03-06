'use client';

import { ChatbotIcon, MenuDotsIcon } from '@/components/icons';

export function ViewerPlaceholder() {
  return (
    <div className="sticky top-0 z-10 h-[307px] w-full">
      <div className="relative h-full w-full rounded-[12px] bg-[#fcfcf7]">
        {/* Sofa preview image with gradient fade */}
        <div className="absolute inset-0 overflow-hidden rounded-[12px]">
          <img
            src="/images/sofa-preview.jpg"
            alt="Sofa preview"
            className="absolute left-[-4.5%] top-0 h-[87.5%] w-[109%] max-w-none object-cover"
          />
          <div className="absolute inset-0 rounded-[12px] bg-gradient-to-b from-transparent from-[73%] to-[#f1f1ec] to-[85%]" />
        </div>

        {/* Save configuration pill button */}
        <div className="absolute bottom-[7%] left-1/2 -translate-x-1/2">
          <button className="rounded-[50px] border-[3px] border-black/10 bg-white px-6 py-2 text-[12px] font-medium text-black shadow-[0px_0px_24px_0px_rgba(0,0,0,0.05)]">
            Save configuration
          </button>
        </div>

        {/* Chatbot button */}
        <button className="absolute bottom-[7%] left-[4.2%] flex h-[36px] w-[36px] items-center justify-center rounded-[50px] border-[3px] border-black/10 bg-white shadow-[0px_0px_24px_0px_rgba(0,0,0,0.05)]">
          <ChatbotIcon className="h-[16px] w-[16px]" />
        </button>

        {/* Menu dots button */}
        <button className="absolute right-[4.2%] top-[3.6%] flex h-[36px] w-[36px] items-center justify-center rounded-[50px] border-[3px] border-black/10 bg-white shadow-[0px_0px_24px_0px_rgba(0,0,0,0.05)]">
          <MenuDotsIcon className="h-[21px] w-[21px]" />
        </button>
      </div>
    </div>
  );
}
