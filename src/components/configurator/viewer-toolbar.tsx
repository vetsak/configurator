'use client';

import { useCallback } from 'react';
import { ZoomIn, ZoomOut, RotateCcw, FlipHorizontal2, Camera } from 'lucide-react';
import { useStore } from '@/stores';
import { renderSofaHQ } from '@/lib/three/sofa-renderer';

function ToolbarButton({
  onClick,
  title,
  active,
  children,
}: {
  onClick: () => void;
  title: string;
  active?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex h-[32px] w-[32px] items-center justify-center rounded-full border-[2px] shadow-[0px_0px_12px_0px_rgba(0,0,0,0.05)] transition-colors ${
        active
          ? 'border-black bg-black text-white'
          : 'border-black/10 bg-white text-black hover:border-black/20'
      }`}
      title={title}
    >
      {children}
    </button>
  );
}

export function ViewerToolbar() {
  const showDimensions = useStore((s) => s.showDimensions);
  const toggleDimensions = useStore((s) => s.toggleDimensions);
  const zoomIn = useStore((s) => s.zoomIn);
  const zoomOut = useStore((s) => s.zoomOut);
  const resetCamera = useStore((s) => s.resetCamera);
  const rotateSofa = useStore((s) => s.rotateSofa);
  const isRendering = useStore((s) => s.isRenderingHQ);

  const handleRenderHQ = useCallback(async () => {
    const state = useStore.getState();
    if (state.isRenderingHQ) return;

    const modules = state.modules;
    if (!modules || modules.length === 0) return;

    const material = state.selectedMaterial;

    // Open modal and show loading state
    state.setHqRenderModalOpen(true);
    state.setRenderingHQ(true);
    state.setHqRenderResult(null);

    try {
      const dataUrl = await renderSofaHQ(modules, material);
      useStore.getState().setHqRenderResult(dataUrl);
    } catch (err) {
      console.error('[HQ Render] Failed:', err);
      useStore.getState().setHqRenderResult(null);
    } finally {
      useStore.getState().setRenderingHQ(false);
    }
  }, []);

  return (
    <div className="absolute left-[4.2%] top-[3.6%] z-20 flex gap-[6px] lg:flex-col lg:top-1/2 lg:-translate-y-1/2 lg:left-[16px]">
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

      {/* Zoom in */}
      <ToolbarButton onClick={zoomIn} title="Zoom in">
        <ZoomIn size={16} strokeWidth={2} />
      </ToolbarButton>

      {/* Zoom out */}
      <ToolbarButton onClick={zoomOut} title="Zoom out">
        <ZoomOut size={16} strokeWidth={2} />
      </ToolbarButton>

      {/* Reset camera */}
      <ToolbarButton onClick={resetCamera} title="Reset camera">
        <RotateCcw size={14} strokeWidth={2} />
      </ToolbarButton>

      {/* Rotate sofa 180 degrees */}
      <ToolbarButton onClick={rotateSofa} title="Rotate sofa 180°">
        <FlipHorizontal2 size={16} strokeWidth={2} />
      </ToolbarButton>

      {/* HQ Render */}
      <button
        onClick={handleRenderHQ}
        disabled={isRendering}
        className={`flex h-[32px] items-center gap-[4px] rounded-[50px] border-[2px] px-[10px] text-[10px] font-medium shadow-[0px_0px_12px_0px_rgba(0,0,0,0.05)] transition-colors ${
          isRendering
            ? 'border-black/10 bg-neutral-100 text-neutral-400 cursor-wait'
            : 'border-black/10 bg-white text-black hover:border-black/30'
        }`}
        title="Render HQ product image"
      >
        <Camera className="h-[14px] w-[14px]" />
        <span>{isRendering ? '...' : 'HQ'}</span>
      </button>
    </div>
  );
}
