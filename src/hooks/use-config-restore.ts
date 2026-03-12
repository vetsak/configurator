import { useEffect, useState } from 'react';
import { useStore } from '@/stores';

const WORKER_BASE_URL =
  'https://vetsak-config-share.vetsakconfi.workers.dev/config';

interface ConfigRestoreResult {
  isRestoring: boolean;
  restoredFromShare: boolean;
}

/**
 * On mount, checks for a `?config=<id>` URL parameter.
 * If found, fetches the shared configuration from the Cloudflare Worker
 * and restores modules + material into the store.
 */
export function useConfigRestore(): ConfigRestoreResult {
  const [isRestoring, setIsRestoring] = useState(false);
  const [restoredFromShare, setRestoredFromShare] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const params = new URLSearchParams(window.location.search);
    const configId = params.get('config');
    if (!configId) return;

    let cancelled = false;

    const restore = async () => {
      setIsRestoring(true);
      try {
        const res = await fetch(`${WORKER_BASE_URL}/${configId}`);
        if (!res.ok) {
          console.error(
            `[useConfigRestore] Failed to fetch config ${configId}: ${res.status}`
          );
          return;
        }

        const data = await res.json();
        if (cancelled) return;

        const { setModules, setMaterial } = useStore.getState();

        if (data.modules) {
          setModules(data.modules);
        }
        if (data.material) {
          setMaterial(data.material);
        }

        setRestoredFromShare(true);
      } catch (err) {
        console.error('[useConfigRestore] Error restoring config:', err);
      } finally {
        if (!cancelled) setIsRestoring(false);
      }

      // Clean up the URL parameter without triggering a page reload
      params.delete('config');
      const cleanUrl =
        params.toString().length > 0
          ? `${window.location.pathname}?${params.toString()}`
          : window.location.pathname;
      window.history.replaceState({}, '', cleanUrl);
    };

    restore();

    return () => {
      cancelled = true;
    };
  }, []);

  return { isRestoring, restoredFromShare };
}
