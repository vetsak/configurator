'use client';

import { useStore } from '@/stores';
import { applyPreset, autoPlaceSides } from '@/lib/snapping/layout-solver';
import { PRESETS } from '@/lib/config/presets';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

interface PresetModalProps {
  open: boolean;
  onClose: () => void;
}

/** Preset display names for the redesigned card grid */
const PRESET_LABELS: Record<string, string> = {
  single: '1-Seat Sofa',
  double: '2-Seat Sofa',
  triple: '3-Seat Sofa',
  'l-right': 'L-Shape Right',
  'l-left': 'L-Shape Left',
  'u-shape': 'U-Shape',
};

function ShapeIndicator({ shape, seatCount }: { shape?: string; seatCount: number }) {
  const block = 'h-[28px] w-[22px] rounded-[3px] bg-black/15';

  if (shape === 'l-right') {
    return (
      <div className="shrink-0">
        <div className="flex gap-[3px]">
          {Array.from({ length: 3 }, (_, i) => <div key={i} className={block} />)}
        </div>
        <div className="flex gap-[3px] justify-end mt-[3px]">
          <div className={block} />
        </div>
      </div>
    );
  }

  if (shape === 'l-left') {
    return (
      <div className="shrink-0">
        <div className="flex gap-[3px]">
          {Array.from({ length: 3 }, (_, i) => <div key={i} className={block} />)}
        </div>
        <div className="flex gap-[3px] mt-[3px]">
          <div className={block} />
        </div>
      </div>
    );
  }

  if (shape === 'u-shape') {
    return (
      <div className="shrink-0">
        <div className="flex gap-[3px]">
          {Array.from({ length: 3 }, (_, i) => <div key={i} className={block} />)}
        </div>
        <div className="flex gap-[3px] justify-between mt-[3px]" style={{ width: `${3 * 22 + 2 * 3}px` }}>
          <div className={block} />
          <div className={block} />
        </div>
      </div>
    );
  }

  // Linear: simple row
  return (
    <div className="flex gap-[3px] shrink-0">
      {Array.from({ length: seatCount }, (_, i) => <div key={i} className={block} />)}
    </div>
  );
}

const PRESET_LIST = Object.values(PRESETS);

export function PresetModal({ open, onClose }: PresetModalProps) {
  const setModules = useStore((s) => s.setModules);
  const setPresetId = useStore((s) => s.setPresetId);
  const currentPresetId = useStore((s) => s.presetId);

  const handleSelect = (presetId: string) => {
    const placed = applyPreset(presetId);
    setModules(autoPlaceSides(placed));
    setPresetId(presetId);
    onClose();
  };

  const handleStartFromScratch = () => {
    setModules([]);
    setPresetId(null);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        showCloseButton={false}
        className="max-w-[min(460px,calc(100vw-2rem))] rounded-[20px] p-0 border-none"
      >
        <div className="px-[24px] pb-[28px] pt-[28px]">
          {/* Header */}
          <div className="flex items-start justify-between mb-[6px]">
            <DialogTitle className="text-[20px] font-semibold text-black leading-tight">
              Start a new sofa configuration
            </DialogTitle>
            <button
              onClick={onClose}
              className="ml-[12px] mt-[2px] flex h-[28px] w-[28px] shrink-0 items-center justify-center rounded-full text-black/40 transition-colors hover:bg-black/5 hover:text-black/60"
              aria-label="Close"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
          </div>
          <DialogDescription className="text-[13px] text-black/50 mb-[20px]">
            Choose a preset to get started quickly, or begin entirely from scratch.
          </DialogDescription>

          {/* Preset grid — 2 columns */}
          <div className="grid grid-cols-2 gap-[10px]">
            {PRESET_LIST.map((preset) => {
              const isActive = currentPresetId === preset.id;
              const seatCount = preset.modules
                .filter((m) => m.moduleId.startsWith('seat-'))
                .reduce((sum, m) => sum + m.count, 0);

              return (
                <button
                  key={preset.id}
                  onClick={() => handleSelect(preset.id)}
                  className={`group relative flex flex-col items-center rounded-[14px] border px-[12px] pb-[14px] pt-[20px] transition-colors ${
                    isActive
                      ? 'border-black bg-black/5'
                      : 'border-black/12 bg-white hover:border-black/30 hover:bg-black/[0.02]'
                  }`}
                >
                  {/* Plus icon top-right */}
                  <span className="absolute right-[10px] top-[10px] flex h-[22px] w-[22px] items-center justify-center rounded-full bg-black/8 text-black/40 text-[14px] leading-none transition-colors group-hover:bg-black/12 group-hover:text-black/60">
                    +
                  </span>

                  {/* Shape indicator — centered */}
                  <div className="mb-[14px] flex h-[60px] items-center justify-center">
                    <ShapeIndicator shape={preset.shape} seatCount={seatCount} />
                  </div>

                  {/* Label */}
                  <p className="text-[13px] font-medium text-black">
                    {PRESET_LABELS[preset.id] ?? preset.name}
                  </p>
                </button>
              );
            })}
          </div>

          {/* Start from scratch */}
          <button
            onClick={handleStartFromScratch}
            className="mt-[16px] w-full rounded-full bg-black py-[13px] text-[14px] font-medium text-white transition-colors hover:bg-black/85"
          >
            Start from scratch
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
