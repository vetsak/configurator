'use client';

import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

interface ConsultationModalProps {
  open: boolean;
  onClose: () => void;
}

const SHOWROOM_URL =
  'https://calendly.com/popup-duesseldorf/vetsak-shopping-session';
const VIDEO_URL =
  'https://calendly.com/popup-duesseldorf/vetsak-shopping-session';

export function ConsultationModal({ open, onClose }: ConsultationModalProps) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        showCloseButton={false}
        className="max-w-[430px] rounded-[20px] p-0 border-none"
      >
        <div className="px-[24px] pb-[28px] pt-[28px]">
          {/* Header */}
          <div className="flex items-start justify-between mb-[6px]">
            <DialogTitle className="text-[20px] font-semibold text-black leading-tight">
              Book your consultation
            </DialogTitle>
            <button
              onClick={onClose}
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
            Choose how you&apos;d like to connect with our team
          </DialogDescription>

          {/* Option Cards */}
          <div className="flex flex-col gap-[12px]">
            {/* Card 1 — Visit a showroom */}
            <a
              href={SHOWROOM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-[14px] rounded-[12px] border border-black/10 p-[16px] transition-colors hover:bg-black/[0.02] cursor-pointer"
            >
              {/* Store icon */}
              <div className="flex h-[40px] w-[40px] shrink-0 items-center justify-center rounded-[10px] bg-black/[0.04]">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-black/70"
                >
                  <path d="M3 21h18" />
                  <path d="M5 21V7l8-4v18" />
                  <path d="M19 21V11l-6-4" />
                  <path d="M9 9v.01" />
                  <path d="M9 12v.01" />
                  <path d="M9 15v.01" />
                  <path d="M9 18v.01" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[15px] font-medium text-black">
                  Visit a showroom
                </p>
                <p className="text-[13px] text-black/50">
                  See and feel your sofa in person
                </p>
              </div>
              {/* Chevron right */}
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                className="shrink-0 text-black/25"
              >
                <path
                  d="M6 3l5 5-5 5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </a>

            {/* Card 2 — Video consultation */}
            <a
              href={VIDEO_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-[14px] rounded-[12px] border border-black/10 p-[16px] transition-colors hover:bg-black/[0.02] cursor-pointer"
            >
              {/* Video camera icon */}
              <div className="flex h-[40px] w-[40px] shrink-0 items-center justify-center rounded-[10px] bg-black/[0.04]">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-black/70"
                >
                  <path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14" />
                  <rect x="3" y="6" width="12" height="12" rx="2" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[15px] font-medium text-black">
                  Video consultation
                </p>
                <p className="text-[13px] text-black/50">
                  Get expert advice from home
                </p>
              </div>
              {/* Chevron right */}
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                className="shrink-0 text-black/25"
              >
                <path
                  d="M6 3l5 5-5 5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </a>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
