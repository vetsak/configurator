'use client';

import { Canvas } from '@react-three/fiber';
import { CAMERA_DEFAULTS, SCENE_DEFAULTS } from '@/lib/config/constants';
import { SofaScene } from './sofa-scene';
import { useStore } from '@/stores';

export function CanvasWrapper() {
  const isDragging = useStore((s) => s.dragModuleId !== null);

  return (
    <Canvas
      frameloop="demand"
      dpr={[1, 2]}
      shadows
      camera={{
        position: CAMERA_DEFAULTS.position,
        fov: CAMERA_DEFAULTS.fov,
        near: CAMERA_DEFAULTS.near,
        far: CAMERA_DEFAULTS.far,
      }}
      style={{
        background: SCENE_DEFAULTS.backgroundColor,
        cursor: isDragging ? 'crosshair' : 'auto',
      }}
      gl={{
        antialias: true,
        toneMapping: 3, // ACESFilmicToneMapping
        toneMappingExposure: 1.1,
      }}
    >
      <SofaScene />
    </Canvas>
  );
}
