'use client';

import { useState, useCallback } from 'react';
import { useStore } from '@/stores';
import { saveConfigToLocal } from '@/lib/persistence';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

interface SaveConfigModalProps {
  open: boolean;
  onClose: () => void;
}

export function SaveConfigModal({ open, onClose }: SaveConfigModalProps) {
  const modules = useStore((s) => s.modules);
  const presetId = useStore((s) => s.presetId);
  const selectedMaterial = useStore((s) => s.selectedMaterial);
  const showNotification = useStore((s) => s.showNotification);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [friendEmails, setFriendEmails] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = useCallback(async () => {
    if (!email.trim()) return;

    setIsSaving(true);

    // Save to localStorage
    const config = saveConfigToLocal(
      modules,
      presetId,
      selectedMaterial,
      name.trim() || undefined,
      email.trim()
    );

    // TODO: POST to serverless function for email delivery
    // const res = await fetch('/api/save-config', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({
    //     config,
    //     friendEmails: friendEmails.split(',').map(e => e.trim()).filter(Boolean),
    //   }),
    // });

    setIsSaving(false);
    showNotification('Configuration saved!', 'success');
    onClose();

    // Reset form
    setName('');
    setEmail('');
    setFriendEmails('');
  }, [modules, presetId, selectedMaterial, name, email, friendEmails, showNotification, onClose]);

  const inputClass =
    'w-full rounded-[12px] border border-black/15 bg-white px-[14px] py-[12px] text-[14px] text-black placeholder:text-black/35 outline-none transition-colors focus:border-black/40';

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        showCloseButton={false}
        className="max-w-[min(430px,calc(100vw-2rem))] rounded-[20px] p-0 border-none"
      >
        <div className="px-[24px] pb-[28px] pt-[28px]">
          {/* Header */}
          <div className="flex items-start justify-between mb-[6px]">
            <DialogTitle className="text-[20px] font-semibold text-black leading-tight">
              a little closer to comfort...
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
          <DialogDescription className="text-[13px] text-black/50 mb-[20px] leading-[1.45]">
            We&apos;ll save your configuration until you return to reconfigure and customize your vetsak sofa.
          </DialogDescription>

          {/* Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSave();
            }}
            className="flex flex-col gap-[12px]"
          >
            <input
              type="text"
              placeholder="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputClass}
            />
            <input
              type="email"
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className={inputClass}
            />
            <input
              type="text"
              placeholder="Friends & Family Email Addresses (comma-separated)"
              value={friendEmails}
              onChange={(e) => setFriendEmails(e.target.value)}
              className={inputClass}
            />

            <button
              type="submit"
              disabled={isSaving || !email.trim()}
              className="mt-[4px] w-full rounded-full bg-black py-[13px] text-[14px] font-medium text-white transition-colors hover:bg-black/85 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? 'Saving...' : 'Save configuration'}
            </button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
