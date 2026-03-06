'use client';

import { Suspense } from 'react';
import { Lighting } from './lighting';
import { Ground } from './ground';
import { CameraRig } from './camera-rig';
import { SofaAssembly } from './sofa-assembly';
import { GhostModule } from './ghost-module';
import { DropZone } from './drop-zone';

function LoadingFallback() {
  return (
    <mesh position={[0, 0.3, 0]}>
      <boxGeometry args={[1.2, 0.6, 0.8]} />
      <meshStandardMaterial color="#d4d0cc" wireframe />
    </mesh>
  );
}

export function SofaScene() {
  return (
    <>
      <Lighting />
      <Ground />
      <CameraRig />
      <Suspense fallback={<LoadingFallback />}>
        <SofaAssembly />
        <GhostModule />
      </Suspense>
      <DropZone />
    </>
  );
}
