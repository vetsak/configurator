import type { ReferenceObject } from './reference-objects';

export interface DetectionResult {
  found: boolean;
  pixelsPerCm: number | null;
  confidence: number;
  bbox: [number, number, number, number] | null;
}

const MIN_CONFIDENCE = 0.5;
const MIN_IMAGE_DIMENSION = 800;

export async function detectReferenceObject(
  imageBase64: string,
  refObject: ReferenceObject,
  userInputCm?: number
): Promise<DetectionResult> {
  const NOT_FOUND: DetectionResult = {
    found: false,
    pixelsPerCm: null,
    confidence: 0,
    bbox: null,
  };

  const img = await loadImage(imageBase64);

  if (img.width < MIN_IMAGE_DIMENSION && img.height < MIN_IMAGE_DIMENSION) {
    console.warn('Image resolution may be too low for reliable detection');
  }

  const [tf, cocoSsd] = await Promise.all([
    import('@tensorflow/tfjs'),
    import('@tensorflow-models/coco-ssd'),
  ]);

  await tf.ready();

  const model = await cocoSsd.load({ base: 'lite_mobilenet_v2' });
  const predictions = await model.detect(img);

  const matches = predictions
    .filter(
      (p) =>
        p.class === refObject.cocoClass && p.score >= MIN_CONFIDENCE
    )
    .sort((a, b) => b.score - a.score);

  if (matches.length === 0) {
    return NOT_FOUND;
  }

  const best = matches[0];
  const [bx, by, bw, bh] = best.bbox;

  const EDGE_MARGIN = 5;
  if (
    bx < EDGE_MARGIN ||
    by < EDGE_MARGIN ||
    bx + bw > img.width - EDGE_MARGIN ||
    by + bh > img.height - EDGE_MARGIN
  ) {
    return NOT_FOUND;
  }

  const knownWidthCm = refObject.widthCm ?? userInputCm;
  const knownHeightCm = refObject.heightCm ?? userInputCm;

  if (!knownWidthCm && !knownHeightCm) {
    return NOT_FOUND;
  }

  let pixelsPerCm: number;
  if (knownWidthCm && knownHeightCm) {
    const pxPerCmW = bw / knownWidthCm;
    const pxPerCmH = bh / knownHeightCm;
    pixelsPerCm = (pxPerCmW + pxPerCmH) / 2;
  } else {
    const longerPx = Math.max(bw, bh);
    const dim = knownWidthCm ?? knownHeightCm!;
    pixelsPerCm = longerPx / dim;
  }

  return {
    found: true,
    pixelsPerCm,
    confidence: best.score,
    bbox: best.bbox as [number, number, number, number],
  };
}

export function validateScale(
  pixelsPerCm: number,
  sofaWidthCm: number,
  imageWidth: number
): boolean {
  const sofaPixelWidth = sofaWidthCm * pixelsPerCm;
  const ratio = sofaPixelWidth / imageWidth;
  return ratio >= 0.1 && ratio <= 0.95;
}

function loadImage(base64: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = base64;
  });
}
