import type { ReferenceObject } from './reference-objects';
import type { DetectionResult } from './reference-detector';

export type ScaleMethod = 'lidar' | 'reference' | 'none';

export interface ScaleResult {
  method: ScaleMethod;
  pixelsPerCm: number | null;
  confidence: number;
  disclaimer: boolean;
}

export async function hasLiDAR(): Promise<boolean> {
  if (typeof navigator === 'undefined') return false;
  if (!('xr' in navigator)) return false;
  try {
    return await navigator.xr!.isSessionSupported('immersive-ar');
  } catch {
    return false;
  }
}

export async function resolveScale(
  imageBase64: string,
  refObject: ReferenceObject | null,
  userInputCm?: number
): Promise<ScaleResult> {
  if (!refObject) {
    return { method: 'none', pixelsPerCm: null, confidence: 0, disclaimer: true };
  }

  const { detectReferenceObject } = await import('./reference-detector');
  const result: DetectionResult = await detectReferenceObject(
    imageBase64,
    refObject,
    userInputCm
  );

  if (result.found && result.pixelsPerCm !== null) {
    return {
      method: 'reference',
      pixelsPerCm: result.pixelsPerCm,
      confidence: result.confidence,
      disclaimer: false,
    };
  }

  return { method: 'none', pixelsPerCm: null, confidence: 0, disclaimer: true };
}
