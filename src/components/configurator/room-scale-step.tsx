'use client';

import { useState, useRef } from 'react';
import { CreditCard, FileText, BookOpen, Footprints, Check, Loader2, type LucideProps } from 'lucide-react';
import { REFERENCE_OBJECTS, type ReferenceObject } from '@/lib/scale/reference-objects';
import type { ScaleResult } from '@/lib/scale/scale-resolver';

const ICONS: Record<string, React.FC<LucideProps>> = {
  CreditCard,
  FileText,
  BookOpen,
  Footprints,
};

type DetectStatus = 'idle' | 'detecting' | 'found' | 'not-found';

interface RoomScaleStepProps {
  roomImage: string;
  onScaleResolved: (result: ScaleResult) => void;
  onSkip: () => void;
}

export function RoomScaleStep({ roomImage, onScaleResolved, onSkip }: RoomScaleStepProps) {
  const [selected, setSelected] = useState<ReferenceObject | null>(null);
  const [userInput, setUserInput] = useState<string>('');
  const [detectStatus, setDetectStatus] = useState<DetectStatus>('idle');
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  const handleSelect = (obj: ReferenceObject) => {
    setSelected(obj);
    setDetectStatus('idle');
  };

  const handleCapture = async (file: File) => {
    if (!selected) return;

    const base64 = await fileToBase64(file);

    setDetectStatus('detecting');

    try {
      const { resolveScale } = await import('@/lib/scale/scale-resolver');
      const userCm = selected.requiresInput ? parseFloat(userInput) : undefined;
      const result = await resolveScale(base64, selected, userCm);

      if (result.pixelsPerCm !== null) {
        setDetectStatus('found');
        onScaleResolved(result);
      } else {
        setDetectStatus('not-found');
        setTimeout(() => {
          onScaleResolved({ method: 'none', pixelsPerCm: null, confidence: 0, disclaimer: true });
        }, 2000);
      }
    } catch {
      setDetectStatus('not-found');
      setTimeout(() => {
        onScaleResolved({ method: 'none', pixelsPerCm: null, confidence: 0, disclaimer: true });
      }, 2000);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleCapture(file);
  };

  const canProceed =
    selected && (!selected.requiresInput || (userInput && parseFloat(userInput) > 0));

  return (
    <div className="flex flex-col gap-[15px]">
      <div>
        <p className="text-[18px] font-medium text-black">Improve size accuracy</p>
        <p className="text-[13px] text-black/50 mt-[3px]">
          Place one of these on the floor where your sofa would go, then take a photo
        </p>
      </div>

      {/* Reference object grid */}
      <div className="grid grid-cols-2 gap-[8px]">
        {REFERENCE_OBJECTS.map((obj) => {
          const Icon = ICONS[obj.icon] ?? CreditCard;
          const isSelected = selected?.id === obj.id;
          return (
            <button
              key={obj.id}
              onClick={() => handleSelect(obj)}
              className={`flex flex-col items-center gap-[6px] rounded-[12px] border-[2px] p-[14px] transition-colors ${
                isSelected
                  ? 'border-black bg-black/[0.04]'
                  : 'border-black/10 hover:border-black/30'
              }`}
            >
              <Icon size={24} className={isSelected ? 'text-black' : 'text-black/40'} />
              <span className={`text-[13px] ${isSelected ? 'text-black font-medium' : 'text-black/60'}`}>
                {obj.label}
              </span>
              {obj.widthCm && obj.heightCm && (
                <span className="text-[11px] text-black/30">
                  {obj.widthCm} x {obj.heightCm} cm
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Shoe length input */}
      {selected?.requiresInput && (
        <div className="flex items-center gap-[8px]">
          <label className="text-[13px] text-black/60">{selected.inputLabel}</label>
          <input
            type="number"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            placeholder="e.g. 27"
            className="w-[80px] rounded-[8px] border border-black/20 px-[10px] py-[6px] text-[13px] text-black"
          />
        </div>
      )}

      {/* Hidden file inputs */}
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
      <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileChange} />

      {/* Detection status */}
      {detectStatus === 'detecting' && (
        <div className="flex items-center justify-center gap-[8px] py-[10px]">
          <Loader2 size={18} className="animate-spin text-black/50" />
          <span className="text-[13px] text-black/50">Detecting {selected?.label}...</span>
        </div>
      )}
      {detectStatus === 'found' && (
        <div className="flex items-center justify-center gap-[8px] py-[10px]">
          <Check size={18} className="text-green-600" />
          <span className="text-[13px] text-green-600">Reference detected! Generating...</span>
        </div>
      )}
      {detectStatus === 'not-found' && (
        <div className="py-[10px]">
          <p className="text-[13px] text-amber-600 text-center">
            Couldn&apos;t spot the {selected?.label}. Proceeding with approximate sizing.
          </p>
        </div>
      )}

      {/* Action buttons */}
      {detectStatus === 'idle' && (
        <>
          <div className="flex gap-[10px]">
            <button
              onClick={() => fileRef.current?.click()}
              disabled={!canProceed}
              className="flex-1 rounded-[50px] border border-black/20 py-[10px] text-[13px] text-black disabled:opacity-40"
            >
              Upload photo
            </button>
            <button
              onClick={() => cameraRef.current?.click()}
              disabled={!canProceed}
              className="flex-1 rounded-[50px] bg-black py-[10px] text-[13px] text-white disabled:opacity-40"
            >
              Take photo
            </button>
          </div>
          <button
            onClick={onSkip}
            className="text-[12px] text-black/40 underline underline-offset-2 hover:text-black/60"
          >
            Skip — use approximate sizing
          </button>
        </>
      )}
    </div>
  );
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
