'use client';

import { SCENE_DEFAULTS } from '@/lib/config/constants';

export function Ground() {
  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, -0.001, 0]}
      receiveShadow
    >
      <planeGeometry args={[SCENE_DEFAULTS.groundSize, SCENE_DEFAULTS.groundSize]} />
      <shadowMaterial transparent opacity={0.15} />
    </mesh>
  );
}
