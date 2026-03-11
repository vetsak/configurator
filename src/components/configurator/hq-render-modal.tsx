'use client';

import { useCallback } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { useStore } from '@/stores';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

function downloadDataUrl(dataUrl: string, filename: string) {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function HqRenderModal() {
  const open = useStore((s) => s.hqRenderModalOpen);
  const isRendering = useStore((s) => s.isRenderingHQ);
  const result = useStore((s) => s.hqRenderResult);
  const setOpen = useStore((s) => s.setHqRenderModalOpen);

  const handleDownload = useCallback(() => {
    if (!result) return;
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '');
    downloadDataUrl(result, `vetsak-sofa-hq-${timestamp}.png`);
  }, [result]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-2xl lg:max-w-4xl">
        <DialogHeader>
          <DialogTitle>
            {isRendering ? 'Rendering...' : 'HQ Render'}
          </DialogTitle>
          <DialogDescription>
            {isRendering
              ? 'Generating a high-quality product image. This may take a few seconds.'
              : 'Your photorealistic sofa render is ready.'}
          </DialogDescription>
        </DialogHeader>

        <div className="relative flex min-h-[200px] items-center justify-center overflow-hidden rounded-md bg-neutral-100">
          {isRendering && (
            <div className="flex flex-col items-center gap-3 text-neutral-500">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="text-sm font-medium">Rendering HQ image...</span>
            </div>
          )}

          {!isRendering && result && (
            <img
              src={result}
              alt="HQ sofa render"
              className="w-full rounded-md"
              draggable={false}
            />
          )}

          {!isRendering && !result && (
            <p className="text-sm text-neutral-400">
              No render available. Try again.
            </p>
          )}
        </div>

        {!isRendering && result && (
          <div className="flex justify-end gap-2">
            <button
              onClick={handleDownload}
              className="inline-flex items-center gap-2 rounded-full border-2 border-black bg-black px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-neutral-800"
            >
              <Download className="h-4 w-4" />
              Download PNG
            </button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
