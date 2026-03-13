'use client';

import { useState, useMemo } from 'react';
import { useStore } from '@/stores';
import { MODULE_CATALOG } from '@/lib/config/modules';
import { PRESETS } from '@/lib/config/presets';
import { applyPreset, autoPlaceSides } from '@/lib/snapping/layout-solver';
import { clearSavedConfig, loadConfigFromLocal } from '@/lib/persistence';
import { ConfigSchematic } from './config-schematic';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

const PRESET_IDS = ['single', 'double', 'triple', 'l-right', 'l-left', 'u-shape'] as const;

function formatTimeAgo(isoDate: string): string {
  const diff = Date.now() - new Date(isoDate).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Yesterday';
  return `${days} days ago`;
}

function formatFabricName(fabricId: string): string {
  return fabricId
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function formatColourName(colourId: string): string {
  return colourId.charAt(0).toUpperCase() + colourId.slice(1);
}

export function WelcomeBackModal() {
  const welcomeBackOpen = useStore((s) => s.welcomeBackOpen);
  const setWelcomeBackOpen = useStore((s) => s.setWelcomeBackOpen);
  const setModules = useStore((s) => s.setModules);
  const setPresetId = useStore((s) => s.setPresetId);

  const [step, setStep] = useState<1 | 2>(1);

  const savedConfig = useMemo(() => {
    if (typeof window === 'undefined') return null;
    return loadConfigFromLocal();
  }, []);

  // Generate preset preview modules (seats only, no sides for cleaner schematic)
  const presetPreviews = useMemo(() => {
    const previews: Record<string, ReturnType<typeof applyPreset>> = {};
    for (const id of PRESET_IDS) {
      try {
        previews[id] = applyPreset(id);
      } catch {
        previews[id] = [];
      }
    }
    return previews;
  }, []);

  // Build saved config summary
  const summary = useMemo(() => {
    if (!savedConfig) return null;
    const { modules, material, savedAt } = savedConfig;

    const counts: Record<string, number> = {};
    for (const mod of modules) {
      const catalog = MODULE_CATALOG[mod.moduleId];
      if (!catalog) continue;
      const type = catalog.type;
      counts[type] = (counts[type] || 0) + 1;
    }

    const parts: string[] = [];
    if (counts.seat) parts.push(`${counts.seat} seat${counts.seat > 1 ? 's' : ''}`);
    if (counts.side) parts.push(`${counts.side} side${counts.side > 1 ? 's' : ''}`);
    if (counts.pillow) parts.push(`${counts.pillow} pillow${counts.pillow > 1 ? 's' : ''}`);

    return {
      moduleSummary: parts.join(', ') || 'Empty configuration',
      fabric: `${formatFabricName(material.fabricId)} · ${formatColourName(material.colourId)}`,
      timeAgo: formatTimeAgo(savedAt),
    };
  }, [savedConfig]);

  const handleContinue = () => {
    setWelcomeBackOpen(false);
    setStep(1);
  };

  const handleStartFresh = () => {
    setStep(2);
  };

  const handleSelectPreset = (presetId: string) => {
    clearSavedConfig();
    const placed = applyPreset(presetId);
    setModules(autoPlaceSides(placed));
    setPresetId(presetId);
    setWelcomeBackOpen(false);
    setStep(1);
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      if (step === 2) {
        // On step 2, close goes back to step 1
        setStep(1);
      } else {
        // On step 1, close = continue
        handleContinue();
      }
    }
  };

  if (!savedConfig || !summary) return null;

  return (
    <Dialog open={welcomeBackOpen} onOpenChange={handleOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="max-w-[430px] rounded-[20px] p-0 border-none"
      >
        <div className="px-[24px] pb-[28px] pt-[28px]">
          {/* Close button */}
          <div className="flex items-start justify-between mb-[6px]">
            <DialogTitle className="text-[20px] font-semibold text-black leading-tight">
              {step === 1 ? 'Welcome back' : 'Choose a starting layout'}
            </DialogTitle>
            <button
              onClick={() => handleOpenChange(false)}
              className="ml-[12px] mt-[2px] flex h-[28px] w-[28px] shrink-0 items-center justify-center rounded-full text-black/40 transition-colors hover:bg-black/5 hover:text-black/60"
              aria-label={step === 2 ? 'Back' : 'Close'}
            >
              {step === 2 ? (
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M9 1L3 7l6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              )}
            </button>
          </div>

          {step === 1 ? (
            <>
              <DialogDescription className="text-[13px] text-black/50 mb-[20px] leading-[1.45]">
                You have a saved configuration. Continue where you left off or start fresh.
              </DialogDescription>

              {/* Saved config preview */}
              <div className="mb-[20px] rounded-[12px] border border-black/10 bg-[#faf9f7] p-[16px]">
                <div className="flex justify-center mb-[12px]">
                  <ConfigSchematic
                    modules={savedConfig.modules}
                    width={200}
                    height={120}
                  />
                </div>
                <div className="text-center">
                  <p className="text-[14px] font-medium text-black">{summary.moduleSummary}</p>
                  <p className="text-[12px] text-black/50 mt-[2px]">{summary.fabric}</p>
                  <p className="text-[11px] text-black/35 mt-[2px]">Saved {summary.timeAgo}</p>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex flex-col gap-[10px]">
                <button
                  onClick={handleContinue}
                  className="w-full rounded-full bg-black py-[13px] text-[14px] font-medium text-white transition-colors hover:bg-black/85"
                >
                  Continue configuration
                </button>
                <button
                  onClick={handleStartFresh}
                  className="w-full rounded-full border border-black/15 bg-white py-[13px] text-[14px] font-medium text-black transition-colors hover:bg-black/5"
                >
                  Start fresh
                </button>
              </div>
            </>
          ) : (
            <>
              <DialogDescription className="text-[13px] text-black/50 mb-[20px] leading-[1.45]">
                Pick a layout to start with. You can always add or remove modules later.
              </DialogDescription>

              {/* Preset grid */}
              <div className="grid grid-cols-3 gap-[10px]">
                {PRESET_IDS.map((id) => {
                  const preset = PRESETS[id];
                  if (!preset) return null;
                  return (
                    <button
                      key={id}
                      onClick={() => handleSelectPreset(id)}
                      className="flex flex-col items-center rounded-[12px] border border-black/10 bg-[#faf9f7] p-[10px] transition-colors hover:border-black/30 hover:bg-[#f5f3ef]"
                    >
                      <ConfigSchematic
                        modules={presetPreviews[id] || []}
                        width={100}
                        height={70}
                      />
                      <span className="mt-[6px] text-[11px] font-medium text-black leading-tight text-center">
                        {preset.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
