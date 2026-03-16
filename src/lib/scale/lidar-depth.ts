export interface LidarScaleResult {
  pixelsPerCm: number;
  floorDepthMeters: number;
}

export async function isLidarAvailable(): Promise<boolean> {
  if (typeof navigator === 'undefined' || !('xr' in navigator)) return false;
  try {
    return await navigator.xr!.isSessionSupported('immersive-ar');
  } catch {
    return false;
  }
}

export async function captureLidarScale(): Promise<LidarScaleResult | null> {
  if (!navigator.xr) return null;

  let session: XRSession | null = null;

  try {
    session = await navigator.xr.requestSession('immersive-ar', {
      requiredFeatures: ['depth-sensing'],
      depthSensing: {
        usagePreference: ['cpu-optimized'],
        dataFormatPreference: ['luminance-alpha'],
      },
    } as XRSessionInit);

    const result = await new Promise<LidarScaleResult | null>((resolve) => {
      const timeout = setTimeout(() => resolve(null), 10_000);

      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) {
        clearTimeout(timeout);
        resolve(null);
        return;
      }

      const baseLayer = new XRWebGLLayer(session!, gl);
      session!.updateRenderState({ baseLayer });

      const refSpacePromise = session!.requestReferenceSpace('local');

      session!.requestAnimationFrame(async (_, frame) => {
        clearTimeout(timeout);

        try {
          const refSpace = await refSpacePromise;
          const pose = frame.getViewerPose(refSpace);
          if (!pose || pose.views.length === 0) {
            resolve(null);
            return;
          }

          const view = pose.views[0];
          const depthInfo = frame.getDepthInformation?.(view) as {
            width: number;
            height: number;
            getDepthInMeters: (x: number, y: number) => number;
          } | undefined;

          if (!depthInfo) {
            resolve(null);
            return;
          }

          const sampleX = 0.5;
          const sampleY = 0.85;
          const floorDepthMeters = depthInfo.getDepthInMeters(sampleX, sampleY);

          if (floorDepthMeters <= 0 || floorDepthMeters > 20) {
            resolve(null);
            return;
          }

          const projMatrix = view.projectionMatrix;
          const tanHalfFovX = 1 / projMatrix[0];
          const viewportWidth = baseLayer.framebufferWidth;
          const realWorldWidthCm = 2 * floorDepthMeters * tanHalfFovX * 100;
          const pixelsPerCm = viewportWidth / realWorldWidthCm;

          resolve({ pixelsPerCm, floorDepthMeters });
        } catch {
          resolve(null);
        }
      });
    });

    return result;
  } catch {
    return null;
  } finally {
    if (session) {
      try { await session.end(); } catch { /* already ended */ }
    }
  }
}
