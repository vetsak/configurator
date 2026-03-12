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

  const generate = useCallback(async (placement?: Placement, personOnSofa?: boolean) => {
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

      // Compute sofa dimensions from modules for accurate sizing
      const { MODULE_CATALOG } = await import('@/lib/config/modules');
      let minX = Infinity, maxX = -Infinity;
      let minZ = Infinity, maxZ = -Infinity;
      for (const mod of modules) {
        const catalog = MODULE_CATALOG[mod.moduleId];
        if (!catalog) continue;
        const ry = mod.rotation[1];
        const cosR = Math.abs(Math.cos(ry));
        const sinR = Math.abs(Math.sin(ry));
        const extX = (catalog.dimensions.width * cosR + catalog.dimensions.depth * sinR) / 2;
        const extZ = (catalog.dimensions.width * sinR + catalog.dimensions.depth * cosR) / 2;
        minX = Math.min(minX, mod.position[0] - extX);
        maxX = Math.max(maxX, mod.position[0] + extX);
        minZ = Math.min(minZ, mod.position[2] - extZ);
        maxZ = Math.max(maxZ, mod.position[2] + extZ);
      }
      const widthCm = Math.round((maxX - minX) * 100);
      const depthCm = Math.round((maxZ - minZ) * 100);

      // Dynamic import to avoid bundling Three.js renderer for all users
      const { renderSofaToPNG } = await import('@/lib/three/sofa-renderer');
      const sofaImage = await renderSofaToPNG(modules, selectedMaterial);

      setStatus('generating');

      const { requestAiRender } = await import('@/lib/api/ai-render-client');
      const result = await requestAiRender({
        roomImage,
        sofaImage,
        placement: placement ?? 'center',
        sofaDimensions: { widthCm, depthCm },
        personOnSofa: personOnSofa ?? false,
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
    (placement?: Placement, personOnSofa?: boolean) => generate(placement, personOnSofa),
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
