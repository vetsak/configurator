'use client';

import { useState, useEffect } from 'react';
import { useStore } from '@/stores';
import { loadConfigFromLocal, clearSavedConfig } from '@/lib/persistence';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

export function RestoreConfigPrompt() {
  const [open, setOpen] = useState(false);
  const [savedDate, setSavedDate] = useState('');
  const setModules = useStore((s) => s.setModules);
  const setPresetId = useStore((s) => s.setPresetId);
  const setMaterial = useStore((s) => s.setMaterial);

  useEffect(() => {
    const config = loadConfigFromLocal();
    if (config && config.modules.length > 0) {
      const date = new Date(config.savedAt);
      setSavedDate(
        date.toLocaleDateString('en-GB', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        })
      );
      setOpen(true);
    }
  }, []);

  const handleContinue = () => {
    const config = loadConfigFromLocal();
    if (config) {
      setModules(config.modules);
      setPresetId(config.presetId);
      if (config.material) {
        setMaterial(config.material);
      }
    }
    setOpen(false);
  };

  const handleStartNew = () => {
    clearSavedConfig();
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleStartNew()}>
      <DialogContent
        showCloseButton={false}
        className="max-w-[400px] rounded-[20px] p-0 border-none"
      >
        <div className="px-[24px] pb-[24px] pt-[28px]">
          <DialogTitle className="text-[20px] font-semibold text-black leading-tight mb-[6px]">
            Welcome back
          </DialogTitle>
          <DialogDescription className="text-[13px] text-black/50 mb-[20px] leading-[1.45]">
            You have a saved configuration from {savedDate}. Would you like to continue where you left off?
          </DialogDescription>

          <div className="flex flex-col gap-[10px]">
            <button
              onClick={handleContinue}
              className="w-full rounded-full bg-black py-[13px] text-[14px] font-medium text-white transition-colors hover:bg-black/85"
            >
              Continue previous
            </button>
            <button
              onClick={handleStartNew}
              className="w-full rounded-full border border-black/20 bg-white py-[13px] text-[14px] font-medium text-black transition-colors hover:bg-black/5"
            >
              Start new
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
