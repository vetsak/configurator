'use client';

import { useState, useMemo, useCallback } from 'react';
import { useStore } from '@/stores';

function checkARSupport(): boolean {
  if (typeof document === 'undefined') return false;
  const a = document.createElement('a');
  return a.relList?.supports?.('ar') ?? false;
}

export function useArExport() {
  const [isExporting, setIsExporting] = useState(false);
  const isSupported = useMemo(() => checkARSupport(), []);

  const triggerAR = useCallback(async () => {
    if (isExporting) return;
    setIsExporting(true);

    try {
      const { modules, selectedMaterial } = useStore.getState();
      if (modules.length === 0) {
        setIsExporting(false);
        return;
      }

      // Dynamic import to avoid bundling USDZ exporter for all users
      const { exportToUSDZ } = await import('@/lib/three/usdz-exporter');
      const blobUrl = await exportToUSDZ(modules, selectedMaterial);

      // Create <a rel="ar"> with child <img> (required by Safari for AR Quick Look)
      const link = document.createElement('a');
      link.rel = 'ar';
      link.href = blobUrl;
      link.download = 'vetsak-sofa.usdz';

      // Safari requires a child <img> element for AR Quick Look activation
      const img = document.createElement('img');
      img.src = 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==';
      img.width = 1;
      img.height = 1;
      link.appendChild(img);

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Revoke after delay — Safari needs time to read the blob for AR session
      setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
    } catch (err) {
      console.error('AR export failed:', err);
    } finally {
      setIsExporting(false);
    }
  }, [isExporting]);

  return { triggerAR, isExporting, isSupported };
}
