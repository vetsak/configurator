'use client';

import { SCENE_DEFAULTS } from '@/lib/config/constants';

export function Lighting() {
  return (
    <>
      {/* Key light — main shadow caster */}
      <directionalLight
        position={[5, 8, 3]}
        intensity={1.0}
        castShadow
        shadow-mapSize-width={SCENE_DEFAULTS.shadowMapSize}
        shadow-mapSize-height={SCENE_DEFAULTS.shadowMapSize}
        shadow-camera-far={20}
        shadow-camera-left={-5}
        shadow-camera-right={5}
        shadow-camera-top={5}
        shadow-camera-bottom={-5}
        shadow-bias={-0.0005}
        shadow-normalBias={0.02}
      />
      {/* Fill light — softer, from the opposite side */}
      <directionalLight
        position={[-3, 5, -2]}
        intensity={0.4}
        color="#e8e4df"
      />
      {/* Rim light — subtle back light for edge definition */}
      <directionalLight
        position={[0, 3, -5]}
        intensity={0.3}
        color="#d4e0f0"
      />
      {/* Ambient fill */}
      <ambientLight intensity={0.35} />
      {/* Sky/ground color gradient */}
      <hemisphereLight
        args={['#c9dff0', '#d4c8a8', 0.4]}
      />
    </>
  );
}
