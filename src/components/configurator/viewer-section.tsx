'use client';

import dynamic from 'next/dynamic';
import { ChatbotIcon, MenuDotsIcon } from '@/components/icons';
import { ModuleActions } from './module-actions';
import { ViewerToolbar } from './viewer-toolbar';

const CanvasWrapper = dynamic(
  () => import('@/components/scene/canvas-wrapper').then((m) => m.CanvasWrapper),
  { ssr: false }
);

export function ViewerSection() {
  return (
    <div className="h-[307px] w-full lg:h-full">
      <div className="relative h-full w-full rounded-[12px] bg-[#fcfcf7] overflow-hidden lg:rounded-none">
        {/* Live 3D Canvas */}
        <CanvasWrapper />

        {/* Module selection actions overlay */}
        <ModuleActions />

        {/* Toolbar */}
        <ViewerToolbar />

        {/* Save configuration pill button */}
        <div className="absolute bottom-[7%] left-1/2 -translate-x-1/2 z-20">
          <button className="rounded-[50px] border-[3px] border-black/10 bg-white px-6 py-2 text-[12px] font-medium text-black shadow-[0px_0px_24px_0px_rgba(0,0,0,0.05)]">
            Save configuration
          </button>
        </div>

        {/* Chatbot button */}
        <button className="absolute bottom-[7%] left-[4.2%] z-20 flex h-[36px] w-[36px] items-center justify-center rounded-[50px] border-[3px] border-black/10 bg-white shadow-[0px_0px_24px_0px_rgba(0,0,0,0.05)]">
          <ChatbotIcon className="h-[16px] w-[16px]" />
        </button>

        {/* Menu dots button */}
        <button className="absolute right-[4.2%] top-[3.6%] z-20 flex h-[36px] w-[36px] items-center justify-center rounded-[50px] border-[3px] border-black/10 bg-white shadow-[0px_0px_24px_0px_rgba(0,0,0,0.05)]">
          <MenuDotsIcon className="h-[21px] w-[21px]" />
        </button>
      </div>
    </div>
  );
}
