'use client';

import { useRef } from 'react';
import { useAiRender, type AiRenderStatus } from '@/hooks/use-ai-render';
import type { Placement } from '@/lib/api/ai-render-client';

interface AiRenderModalProps {
  open: boolean;
  onClose: () => void;
}

const PLACEMENTS: { id: Placement; label: string }[] = [
  { id: 'center', label: 'Center' },
  { id: 'left', label: 'Left' },
  { id: 'right', label: 'Right' },
  { id: 'against-wall', label: 'Against wall' },
];

function UploadView({
  roomImage,
  onUpload,
  onGenerate,
  isGenerating,
}: {
  roomImage: string | null;
  onUpload: (file: File) => void;
  onGenerate: () => void;
  isGenerating: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex flex-col gap-[15px]">
      <div>
        <p className="text-[18px] font-medium text-black">AI Room Preview</p>
        <p className="text-[13px] text-black/50 mt-[3px]">
          Upload a photo of your room to see your sofa in it
        </p>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onUpload(file);
        }}
      />

      {roomImage ? (
        <button
          onClick={() => inputRef.current?.click()}
          className="relative w-full overflow-hidden rounded-[12px] border border-black/10"
        >
          <img
            src={roomImage}
            alt="Room preview"
            className="w-full h-[180px] object-cover"
          />
          <span className="absolute bottom-[8px] right-[8px] rounded-[8px] bg-black/60 px-[10px] py-[4px] text-[11px] text-white">
            Change photo
          </span>
        </button>
      ) : (
        <button
          onClick={() => inputRef.current?.click()}
          className="flex h-[180px] w-full items-center justify-center rounded-[12px] border-[2px] border-dashed border-black/20 bg-black/[0.03] text-[14px] text-black/40"
        >
          Tap to upload a room photo
        </button>
      )}

      <button
        onClick={onGenerate}
        disabled={!roomImage || isGenerating}
        className="w-full rounded-[50px] bg-black py-[12px] text-[14px] font-medium text-white disabled:opacity-40"
      >
        Generate
      </button>
    </div>
  );
}

function GeneratingView({ roomImage }: { roomImage: string | null }) {
  return (
    <div className="flex flex-col gap-[15px]">
      <p className="text-[18px] font-medium text-black">Rendering...</p>
      <div className="relative w-full overflow-hidden rounded-[12px]">
        {roomImage && (
          <img
            src={roomImage}
            alt="Room"
            className="w-full h-[220px] object-cover opacity-60"
          />
        )}
        {/* Shimmer overlay */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/40 to-transparent" />
        </div>
      </div>
      <p className="text-center text-[13px] text-black/50">
        Rendering your sofa into the room...
      </p>
    </div>
  );
}

function ResultView({
  resultImage,
  onRegenerate,
  onReposition,
  onNewPhoto,
  onDownload,
}: {
  resultImage: string;
  onRegenerate: () => void;
  onReposition: (p: Placement) => void;
  onNewPhoto: () => void;
  onDownload: () => void;
}) {
  return (
    <div className="flex flex-col gap-[12px]">
      <p className="text-[18px] font-medium text-black">Your sofa in the room</p>

      <img
        src={resultImage}
        alt="AI rendered sofa in room"
        className="w-full rounded-[12px] border border-black/10"
      />

      {/* Placement pills */}
      <div className="flex gap-[6px] overflow-x-auto">
        {PLACEMENTS.map((p) => (
          <button
            key={p.id}
            onClick={() => onReposition(p.id)}
            className="shrink-0 rounded-[50px] border border-black/20 px-[14px] py-[6px] text-[12px] text-black"
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Actions */}
      <div className="flex gap-[9px]">
        <button
          onClick={onRegenerate}
          className="flex-1 rounded-[50px] border border-black/20 py-[10px] text-[13px] text-black"
        >
          Regenerate
        </button>
        <button
          onClick={onNewPhoto}
          className="flex-1 rounded-[50px] border border-black/20 py-[10px] text-[13px] text-black"
        >
          New photo
        </button>
        <button
          onClick={onDownload}
          className="flex-1 rounded-[50px] bg-black py-[10px] text-[13px] text-white"
        >
          Download
        </button>
      </div>
    </div>
  );
}

function ErrorView({
  error,
  onRetry,
}: {
  error: string;
  onRetry: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-[15px] py-[20px]">
      <p className="text-[15px] text-red-600 text-center">{error}</p>
      <button
        onClick={onRetry}
        className="rounded-[50px] border border-black/20 px-[24px] py-[10px] text-[13px] text-black"
      >
        Try again
      </button>
    </div>
  );
}

function viewForStatus(status: AiRenderStatus): 'upload' | 'generating' | 'result' | 'error' {
  switch (status) {
    case 'idle':
    case 'preparing':
      return 'upload';
    case 'generating':
      return 'generating';
    case 'done':
      return 'result';
    case 'error':
      return 'error';
  }
}

export function AiRenderModal({ open, onClose }: AiRenderModalProps) {
  const {
    status,
    roomImage,
    resultImage,
    error,
    uploadRoom,
    generate,
    regenerate,
    reset,
  } = useAiRender();

  if (!open) return null;

  const view = viewForStatus(status);

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleDownload = () => {
    if (!resultImage) return;
    const link = document.createElement('a');
    link.href = resultImage;
    link.download = 'vetsak-room-preview.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleNewPhoto = () => {
    reset();
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40"
        onClick={status === 'generating' ? undefined : handleClose}
      />

      {/* Bottom sheet (mobile) / centered dialog (desktop) */}
      <div className="fixed inset-x-0 bottom-0 z-50 mx-auto max-w-[430px] lg:inset-auto lg:top-1/2 lg:left-1/2 lg:-translate-x-1/2 lg:-translate-y-1/2 lg:max-w-[520px] lg:w-full">
        <div className="rounded-t-[16px] bg-white px-[18px] pb-[36px] pt-[21px] shadow-[0px_-4px_24px_0px_rgba(0,0,0,0.15)] lg:rounded-[16px]">
          {/* Close button */}
          {status !== 'generating' && (
            <div className="flex justify-end mb-[6px]">
              <button
                onClick={handleClose}
                className="text-[15px] text-black/50"
              >
                Close
              </button>
            </div>
          )}

          {view === 'upload' && (
            <UploadView
              roomImage={roomImage}
              onUpload={uploadRoom}
              onGenerate={() => generate()}
              isGenerating={status === 'preparing'}
            />
          )}

          {view === 'generating' && (
            <GeneratingView roomImage={roomImage} />
          )}

          {view === 'result' && resultImage && (
            <ResultView
              resultImage={resultImage}
              onRegenerate={() => regenerate()}
              onReposition={(p) => regenerate(p)}
              onNewPhoto={handleNewPhoto}
              onDownload={handleDownload}
            />
          )}

          {view === 'error' && (
            <ErrorView
              error={error ?? 'Something went wrong.'}
              onRetry={() => generate()}
            />
          )}
        </div>
      </div>

    </>
  );
}
