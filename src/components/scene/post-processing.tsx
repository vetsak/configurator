'use client';

import { EffectComposer, SSAO, Bloom } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';

export function PostProcessing() {
  return (
    <EffectComposer enableNormalPass>
      <SSAO
        blendFunction={BlendFunction.MULTIPLY}
        radius={0.05}
        intensity={15}
        luminanceInfluence={0.5}
      />
      <Bloom luminanceThreshold={0.9} intensity={0.1} />
    </EffectComposer>
  );
}
