'use client';

import { useStore } from '@/stores';

export function ViewerToolbar() {
  const showDimensions = useStore((s) => s.showDimensions);
  const toggleDimensions = useStore((s) => s.toggleDimensions);

  return (
    <div className="absolute left-[4.2%] top-[3.6%] z-20 flex gap-[6px]">
      {/* Show dimensions toggle */}
      <button
        onClick={toggleDimensions}
        className={`flex h-[32px] items-center gap-[4px] rounded-[50px] border-[2px] px-[10px] text-[10px] font-medium shadow-[0px_0px_12px_0px_rgba(0,0,0,0.05)] ${
          showDimensions
            ? 'border-black bg-black text-white'
            : 'border-black/10 bg-white text-black'
        }`}
        title="Toggle dimensions"
      >
        {/* Ruler icon */}
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M1 5h14v6H1V5zm2 0v3m2-3v2m2-2v3m2-3v2m2-2v3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
        </svg>
        <span>{showDimensions ? 'Hide' : 'Size'}</span>
      </button>
    </div>
  );
}
