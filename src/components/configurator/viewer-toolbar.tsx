'use client';

import { useCallback, useState } from 'react';
import { ZoomIn, ZoomOut, RotateCcw, FlipHorizontal2, Camera, Menu, X } from 'lucide-react';
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
  const snapEnabled = useStore((s) => s.snapEnabled);
  const toggleSnap = useStore((s) => s.toggleSnap);
  const showDimensions = useStore((s) => s.showDimensions);
  const toggleDimensions = useStore((s) => s.toggleDimensions);
  const zoomIn = useStore((s) => s.zoomIn);
  const zoomOut = useStore((s) => s.zoomOut);
  const resetCamera = useStore((s) => s.resetCamera);
  const rotateSofa = useStore((s) => s.rotateSofa);
  const isRendering = useStore((s) => s.isRenderingHQ);
  const [mobileOpen, setMobileOpen] = useState(false);

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

  const toolbarItems = (
    <>
      {/* Snap toggle */}
      <ToolbarButton
        onClick={() => { toggleSnap(); setMobileOpen(false); }}
        title="Toggle snap"
        active={snapEnabled}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M6 1h4v2h1a2 2 0 0 1 2 2v3a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V5a2 2 0 0 1 2-2h1V1z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
          <path d="M8 12v3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
        </svg>
      </ToolbarButton>

      {/* Show dimensions toggle */}
      <ToolbarButton
        onClick={() => { toggleDimensions(); setMobileOpen(false); }}
        title="Toggle dimensions"
        active={showDimensions}
      >
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M1 5h14v6H1V5zm2 0v3m2-3v2m2-2v3m2-3v2m2-2v3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
        </svg>
      </ToolbarButton>

      {/* Zoom in */}
      <ToolbarButton onClick={() => { zoomIn(); setMobileOpen(false); }} title="Zoom in">
        <ZoomIn size={16} strokeWidth={2} />
      </ToolbarButton>

      {/* Zoom out */}
      <ToolbarButton onClick={() => { zoomOut(); setMobileOpen(false); }} title="Zoom out">
        <ZoomOut size={16} strokeWidth={2} />
      </ToolbarButton>

      {/* Reset camera */}
      <ToolbarButton onClick={() => { resetCamera(); setMobileOpen(false); }} title="Reset camera">
        <RotateCcw size={14} strokeWidth={2} />
      </ToolbarButton>

      {/* Rotate sofa 180 degrees */}
      <ToolbarButton onClick={() => { rotateSofa(); setMobileOpen(false); }} title="Rotate sofa 180°">
        <FlipHorizontal2 size={16} strokeWidth={2} />
      </ToolbarButton>

      {/* HQ Render */}
      <ToolbarButton
        onClick={() => { handleRenderHQ(); setMobileOpen(false); }}
        title="Render HQ product image"
      >
        <Camera size={14} strokeWidth={2} />
      </ToolbarButton>
    </>
  );

  return (
    <>
      {/* Desktop: always visible vertical column */}
      <div className="absolute left-[16px] top-1/2 -translate-y-1/2 z-20 hidden lg:flex lg:flex-col gap-[6px]">
        {toolbarItems}
      </div>

      {/* Mobile: toggle button + expandable menu */}
      <div className="absolute left-[4.2%] top-[3.6%] z-20 lg:hidden">
        <button
          onClick={() => setMobileOpen((v) => !v)}
          className="flex h-[32px] w-[32px] items-center justify-center rounded-full border-[2px] border-black/10 bg-white text-black shadow-[0px_0px_12px_0px_rgba(0,0,0,0.05)]"
          title="Tools"
        >
          {mobileOpen ? <X size={16} strokeWidth={2} /> : <Menu size={16} strokeWidth={2} />}
        </button>

        {mobileOpen && (
          <div className="absolute left-0 top-[38px] flex flex-col gap-[6px] animate-in fade-in slide-in-from-top-1 duration-150">
            {toolbarItems}
          </div>
        )}
      </div>
    </>
  );
}
