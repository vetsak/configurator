'use client';

import { useRef, useState, useEffect } from 'react';
import { CreditCard, FileText, BookOpen, Footprints, type LucideProps } from 'lucide-react';
import { useAiRender, type AiRenderStatus } from '@/hooks/use-ai-render';
import type { Placement } from '@/lib/api/ai-render-client';
import type { ScaleResult } from '@/lib/scale/scale-resolver';
import { REFERENCE_OBJECTS, type ReferenceObject } from '@/lib/scale/reference-objects';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';

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

const ICONS: Record<string, React.FC<LucideProps>> = {
  CreditCard,
  FileText,
  BookOpen,
  Footprints,
};

type Phase = 'upload' | 'generating' | 'result' | 'error';

function UploadView({
  onUpload,
  selectedRef,
  onSelectRef,
  userInput,
  onUserInputChange,
}: {
  onUpload: (file: File) => void;
  selectedRef: ReferenceObject | null;
  onSelectRef: (obj: ReferenceObject | null) => void;
  userInput: string;
  onUserInputChange: (val: string) => void;
}) {
  const galleryRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onUpload(file);
  };

  return (
    <div className="flex flex-col gap-[15px]">
      <div>
        <p className="text-[18px] font-medium text-black">AI Room Preview</p>
        <p className="text-[13px] text-black/50 mt-[3px]">
          For better size accuracy, place one of these on the floor, then take a photo of your room
        </p>
      </div>

      {/* Reference object grid */}
      <div className="grid grid-cols-2 gap-[8px]">
        {REFERENCE_OBJECTS.map((obj) => {
          const Icon = ICONS[obj.icon] ?? CreditCard;
          const isSelected = selectedRef?.id === obj.id;
          return (
            <button
              key={obj.id}
              onClick={() => onSelectRef(isSelected ? null : obj)}
              className={`flex flex-col items-center gap-[6px] rounded-[12px] border-[2px] p-[12px] transition-colors ${
                isSelected
                  ? 'border-black bg-black/[0.04]'
                  : 'border-black/10 hover:border-black/30'
              }`}
            >
              <Icon size={22} className={isSelected ? 'text-black' : 'text-black/40'} />
              <span className={`text-[12px] ${isSelected ? 'text-black font-medium' : 'text-black/60'}`}>
                {obj.label}
              </span>
              {obj.widthCm && obj.heightCm && (
                <span className="text-[10px] text-black/30">
                  {obj.widthCm} x {obj.heightCm} cm
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Shoe length input */}
      {selectedRef?.requiresInput && (
        <div className="flex items-center gap-[8px]">
          <label className="text-[13px] text-black/60">{selectedRef.inputLabel}</label>
          <input
            type="number"
            value={userInput}
            onChange={(e) => onUserInputChange(e.target.value)}
            placeholder="e.g. 27"
            className="w-[80px] rounded-[8px] border border-black/20 px-[10px] py-[6px] text-[13px] text-black"
          />
        </div>
      )}

      <input
        ref={galleryRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileChange}
      />

      <div className="flex gap-[10px]">
        <button
          onClick={() => galleryRef.current?.click()}
          className="flex flex-1 flex-col items-center justify-center gap-[8px] h-[100px] rounded-[12px] border-[2px] border-dashed border-black/20 bg-black/[0.03] text-black/40 hover:border-black/30 hover:bg-black/[0.05] transition-colors"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <path d="M21 15l-5-5L5 21" />
          </svg>
          <span className="text-[13px]">Upload photo</span>
        </button>
        <button
          onClick={() => cameraRef.current?.click()}
          className="flex flex-1 flex-col items-center justify-center gap-[8px] h-[100px] rounded-[12px] border-[2px] border-dashed border-black/20 bg-black/[0.03] text-black/40 hover:border-black/30 hover:bg-black/[0.05] transition-colors"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
            <circle cx="12" cy="13" r="4" />
          </svg>
          <span className="text-[13px]">Take photo</span>
        </button>
      </div>
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
  showDisclaimer,
  onRegenerate,
  onReposition,
  onPersonOnSofa,
  onNewPhoto,
  onDownload,
}: {
  resultImage: string;
  showDisclaimer: boolean;
  onRegenerate: () => void;
  onReposition: (p: Placement) => void;
  onPersonOnSofa: () => void;
  onNewPhoto: () => void;
  onDownload: () => void;
}) {
  return (
    <div className="flex flex-col gap-[12px]">
      <p className="text-[18px] font-medium text-black">Your sofa in the room</p>

      {showDisclaimer && (
        <div className="flex items-center justify-between rounded-[8px] bg-amber-50 border border-amber-200 px-[12px] py-[8px]">
          <p className="text-[12px] text-amber-700">
            Sofa size is approximate.
          </p>
          <button
            onClick={onNewPhoto}
            className="text-[12px] text-amber-700 underline underline-offset-2 font-medium shrink-0 ml-[8px]"
          >
            Retake photo
          </button>
        </div>
      )}

      <img
        src={resultImage}
        alt="AI rendered sofa in room"
        className="w-full rounded-[12px] border border-black/10"
      />

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
        <button
          onClick={onPersonOnSofa}
          className="shrink-0 rounded-[50px] border border-black/20 px-[14px] py-[6px] text-[12px] text-black"
        >
          Person on sofa
        </button>
      </div>

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

export function AiRenderModal({ open, onClose }: AiRenderModalProps) {
  const {
    status,
    roomImage,
    resultImage,
    error,
    scaleResult,
    setScaleResult,
    uploadRoom,
    generate,
    regenerate,
    reset,
  } = useAiRender();

  const [phase, setPhase] = useState<Phase>('upload');
  const [selectedRef, setSelectedRef] = useState<ReferenceObject | null>(null);
  const [userInput, setUserInput] = useState('');

  // Sync phase with hook status changes
  useEffect(() => {
    if (status === 'generating') setPhase('generating');
    else if (status === 'done') setPhase('result');
    else if (status === 'error') setPhase('error');
  }, [status]);

  const handleUpload = (file: File) => {
    uploadRoom(file);
  };

  // Once room image is ready, run scale detection on it and generate
  useEffect(() => {
    if (roomImage && phase === 'upload') {
      // Check for LiDAR — if available, skip reference detection
      import('@/lib/scale/scale-resolver').then(async ({ hasLiDAR, resolveLidarScale, resolveScale }) => {
        if (await hasLiDAR()) {
          const result = await resolveLidarScale();
          if (result.pixelsPerCm !== null) {
            setScaleResult(result);
            generate();
            return;
          }
        }

        // Try reference object detection on the room image
        if (selectedRef) {
          const userCm = selectedRef.requiresInput ? parseFloat(userInput) : undefined;
          const result = await resolveScale(roomImage, selectedRef, userCm);
          setScaleResult(result);
        } else {
          // No reference object selected — approximate sizing
          setScaleResult({ method: 'none', pixelsPerCm: null, confidence: 0, disclaimer: true });
        }

        generate();
      });
    }
  }, [roomImage, phase]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleClose = () => {
    reset();
    setPhase('upload');
    setSelectedRef(null);
    setUserInput('');
    onClose();
  };

  const handleNewPhoto = () => {
    reset();
    setPhase('upload');
  };

  const handleDownload = () => {
    if (!resultImage) return;
    const byteString = atob(resultImage.split(',')[1]);
    const mimeType = resultImage.split(',')[0].match(/:(.*?);/)?.[1] ?? 'image/png';
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    const blob = new Blob([ab], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'vetsak-room-preview.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const showDisclaimer = scaleResult?.disclaimer ?? true;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent showCloseButton={false} className="max-w-[430px] rounded-[20px] p-0 border-none">
        <DialogTitle className="sr-only">AI Room Preview</DialogTitle>
        <div className="px-[18px] pb-[36px] pt-[21px]">
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

          {phase === 'upload' && (
            <UploadView
              onUpload={handleUpload}
              selectedRef={selectedRef}
              onSelectRef={setSelectedRef}
              userInput={userInput}
              onUserInputChange={setUserInput}
            />
          )}

          {phase === 'generating' && (
            <GeneratingView roomImage={roomImage} />
          )}

          {phase === 'result' && resultImage && (
            <ResultView
              resultImage={resultImage}
              showDisclaimer={showDisclaimer}
              onRegenerate={() => regenerate()}
              onReposition={(p) => regenerate(p)}
              onPersonOnSofa={() => regenerate(undefined, true)}
              onNewPhoto={handleNewPhoto}
              onDownload={handleDownload}
            />
          )}

          {phase === 'error' && (
            <ErrorView
              error={error ?? 'Something went wrong.'}
              onRetry={() => generate()}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
