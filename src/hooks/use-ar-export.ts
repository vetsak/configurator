'use client';

import { useState, useMemo, useCallback } from 'react';
import { useStore } from '@/stores';

const CONFIG_WORKER_URL =
  'https://vetsak-config-share.vetsakconfi.workers.dev';

type Platform = 'ios' | 'android' | 'desktop';

function detectPlatform(): Platform {
  if (typeof window === 'undefined') return 'desktop';

  // iOS AR Quick Look support
  const a = document.createElement('a');
  if (a.relList?.supports?.('ar')) return 'ios';

  // Android
  if (/android/i.test(navigator.userAgent)) return 'android';

  return 'desktop';
}

export function useArExport() {
  const [isExporting, setIsExporting] = useState(false);
  const platform = useMemo(() => detectPlatform(), []);

  const buttonLabel = useMemo(() => {
    switch (platform) {
      case 'ios':
        return 'View in your room';
      case 'android':
        return 'Download 3D model';
      case 'desktop':
        return 'View in your room';
    }
  }, [platform]);

  const triggerAR = useCallback(async () => {
    if (isExporting) return;
    setIsExporting(true);

    try {
      const { modules, selectedMaterial } = useStore.getState();
      if (modules.length === 0) {
        setIsExporting(false);
        return;
      }

      if (platform === 'ios') {
        // iOS: USDZ → AR Quick Look
        const { exportToUSDZ } = await import('@/lib/three/usdz-exporter');
        const blobUrl = await exportToUSDZ(modules, selectedMaterial);

        const link = document.createElement('a');
        link.rel = 'ar';
        link.href = blobUrl;
        link.download = 'vetsak-sofa.usdz';

        const img = document.createElement('img');
        img.src = 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==';
        img.width = 1;
        img.height = 1;
        link.appendChild(img);

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
      } else if (platform === 'android') {
        // Android: GLB download
        const { exportToGLB } = await import('@/lib/three/glb-exporter');
        const blobUrl = await exportToGLB(modules, selectedMaterial);

        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = 'vetsak-sofa.glb';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        setTimeout(() => URL.revokeObjectURL(blobUrl), 5000);
      } else {
        // Desktop: share config → QR code modal
        const configPayload = {
          modules: modules.map((m) => ({
            moduleId: m.moduleId,
            instanceId: m.instanceId,
            type: m.type,
            position: m.position,
            rotation: m.rotation,
            anchors: m.anchors,
            connectedTo: m.connectedTo,
          })),
          material: selectedMaterial,
        };

        const res = await fetch(`${CONFIG_WORKER_URL}/config`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(configPayload),
        });

        if (!res.ok) throw new Error(`Config share failed: ${res.status}`);

        const { id } = await res.json();

        // Build the configurator URL with config param
        const configUrl = `${window.location.origin}${window.location.pathname}?config=${id}`;

        // Open QR modal via store
        const state = useStore.getState();
        state.setArQrUrl(configUrl);
        state.setArQrModalOpen(true);
      }
    } catch (err) {
      console.error('AR export failed:', err);
    } finally {
      setIsExporting(false);
    }
  }, [isExporting, platform]);

  return { triggerAR, isExporting, platform, buttonLabel };
}
