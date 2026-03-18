'use client';

import { useState, useEffect, useCallback } from 'react';
import QRCode from 'qrcode';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

interface ArQrModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  configUrl: string | null;
}

export function ArQrModal({ open, onOpenChange, configUrl }: ArQrModalProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!open || !configUrl) {
      setQrDataUrl(null);
      return;
    }

    let cancelled = false;
    QRCode.toDataURL(configUrl, { width: 256, margin: 2 }).then((url) => {
      if (!cancelled) setQrDataUrl(url);
    });

    return () => {
      cancelled = true;
    };
  }, [open, configUrl]);

  const handleCopyLink = useCallback(async () => {
    if (!configUrl) return;
    await navigator.clipboard.writeText(configUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [configUrl]);

  const handleClose = useCallback(() => {
    onOpenChange(false);
    setCopied(false);
  }, [onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent
        showCloseButton={false}
        className="max-w-[min(384px,calc(100vw-2rem))] rounded-[20px] p-0 border-none"
      >
        <div className="px-[24px] pb-[28px] pt-[28px]">
          {/* Header */}
          <div className="flex items-start justify-between mb-[6px]">
            <DialogTitle className="text-[20px] font-semibold text-black leading-tight">
              View in your room
            </DialogTitle>
            <button
              onClick={handleClose}
              className="ml-[12px] mt-[2px] flex h-[28px] w-[28px] shrink-0 items-center justify-center rounded-full text-black/40 transition-colors hover:bg-black/5 hover:text-black/60"
              aria-label="Close"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path
                  d="M1 1l12 12M13 1L1 13"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>
          <DialogDescription className="text-[13px] text-black/50 mb-[20px] leading-[1.45]">
            Scan this QR code with your phone to view your sofa in AR
          </DialogDescription>

          {/* QR Code */}
          <div className="flex justify-center mb-[20px]">
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt="AR QR Code"
                width={256}
                height={256}
                className="rounded-[12px]"
              />
            ) : (
              <div className="flex h-[256px] w-[256px] items-center justify-center rounded-[12px] bg-black/[0.04]">
                <span className="text-[13px] text-black/30">Generating...</span>
              </div>
            )}
          </div>

          {/* Copy link button */}
          <button
            onClick={handleCopyLink}
            disabled={!configUrl}
            className="w-full rounded-full bg-black py-[13px] text-[14px] font-medium text-white transition-colors hover:bg-black/85 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {copied ? 'Link copied!' : 'Copy link'}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
