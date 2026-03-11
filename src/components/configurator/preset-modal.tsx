'use client';

import { useStore } from '@/stores';
import { applyPreset, autoPlaceSides } from '@/lib/snapping/layout-solver';
import { PRESETS } from '@/lib/config/presets';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';

interface PresetModalProps {
  open: boolean;
  onClose: () => void;
}

function ShapeIndicator({ shape, seatCount }: { shape?: string; seatCount: number }) {
  const block = "h-[20px] w-[16px] rounded-[2px] bg-black/20";

  if (shape === 'l-right') {
    return (
      <div className="shrink-0">
        <div className="flex gap-[2px]">
          {Array.from({ length: 3 }, (_, i) => <div key={i} className={block} />)}
        </div>
        <div className="flex gap-[2px] justify-end mt-[2px]">
          <div className={block} />
        </div>
      </div>
    );
  }

  if (shape === 'l-left') {
    return (
      <div className="shrink-0">
        <div className="flex gap-[2px]">
          {Array.from({ length: 3 }, (_, i) => <div key={i} className={block} />)}
        </div>
        <div className="flex gap-[2px] mt-[2px]">
          <div className={block} />
        </div>
      </div>
    );
  }

  if (shape === 'u-shape') {
    return (
      <div className="shrink-0">
        <div className="flex gap-[2px]">
          {Array.from({ length: 3 }, (_, i) => <div key={i} className={block} />)}
        </div>
        <div className="flex gap-[2px] justify-between mt-[2px]" style={{ width: `${3 * 16 + 2 * 2}px` }}>
          <div className={block} />
          <div className={block} />
        </div>
      </div>
    );
  }

  // Linear: simple row
  return (
    <div className="flex gap-[2px] shrink-0">
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

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        showCloseButton={false}
        className="max-w-[430px] rounded-[16px] p-0 border-none"
      >
        <div className="px-[18px] pb-[28px] pt-[21px]">
          <div className="flex items-center justify-between mb-[21px]">
            <DialogTitle className="text-[18px] font-medium text-black">
              Choose a layout
            </DialogTitle>
            <button
              onClick={onClose}
              className="text-[15px] text-black/50"
            >
              Close
            </button>
          </div>

          <div className="flex flex-col gap-[9px]">
            {PRESET_LIST.map((preset) => {
              const isActive = currentPresetId === preset.id;
              return (
                <button
                  key={preset.id}
                  onClick={() => handleSelect(preset.id)}
                  className={`flex items-center gap-[15px] rounded-[12px] border px-[15px] py-[12px] text-left transition-colors ${
                    isActive ? 'border-black bg-black/5' : 'border-black/20 bg-white'
                  }`}
                >
                  <ShapeIndicator shape={preset.shape} seatCount={
                    preset.modules
                      .filter((m) => m.moduleId.startsWith('seat-'))
                      .reduce((sum, m) => sum + m.count, 0)
                  } />
                  <div>
                    <p className="text-[15px] font-medium text-black">{preset.name}</p>
                    <p className="text-[12px] text-black/50">{preset.description}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
