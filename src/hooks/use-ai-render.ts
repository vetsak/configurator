'use client';

import { useState, useCallback } from 'react';
import { useStore } from '@/stores';
import type { Placement } from '@/lib/api/ai-render-client';

export type AiRenderStatus = 'idle' | 'preparing' | 'generating' | 'done' | 'error';

export function useAiRender() {
  const [status, setStatus] = useState<AiRenderStatus>('idle');
  const [roomImage, setRoomImage] = useState<string | null>(null);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  /** Resize an image file to max 2048px on longest side, return base64 */
  const uploadRoom = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const MAX = 2048;
        let { width, height } = img;
        if (width > MAX || height > MAX) {
          const scale = MAX / Math.max(width, height);
          width = Math.round(width * scale);
          height = Math.round(height * scale);
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0, width, height);
        const base64 = canvas.toDataURL('image/jpeg', 0.9);
        setRoomImage(base64);
        setResultImage(null);
        setError(null);
        setStatus('idle');
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  }, []);

  const generate = useCallback(async (placement?: Placement) => {
    if (!roomImage) return;

    try {
      setStatus('preparing');
      setError(null);
      setResultImage(null);

      const { modules, selectedMaterial } = useStore.getState();
      if (modules.length === 0) {
        setError('No sofa modules configured.');
        setStatus('error');
        return;
      }

      // Dynamic import to avoid bundling Three.js renderer for all users
      const { renderSofaToPNG } = await import('@/lib/three/sofa-renderer');
      const sofaImage = await renderSofaToPNG(modules, selectedMaterial);

      setStatus('generating');

      const { requestAiRender } = await import('@/lib/api/ai-render-client');
      const result = await requestAiRender({
        roomImage,
        sofaImage,
        placement: placement ?? 'center',
      });

      // If result is a base64 string without prefix, add it
      const image = result.image.startsWith('data:')
        ? result.image
        : `data:image/png;base64,${result.image}`;

      setResultImage(image);
      setStatus('done');
    } catch (err) {
      console.error('AI render failed:', err);
      setError(err instanceof Error ? err.message : 'Something went wrong.');
      setStatus('error');
    }
  }, [roomImage]);

  const regenerate = useCallback(
    (placement?: Placement) => generate(placement),
    [generate]
  );

  const reset = useCallback(() => {
    setStatus('idle');
    setRoomImage(null);
    setResultImage(null);
    setError(null);
  }, []);

  return {
    status,
    roomImage,
    resultImage,
    error,
    uploadRoom,
    generate,
    regenerate,
    reset,
  };
}
