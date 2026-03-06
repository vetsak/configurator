'use client';

import { useMemo, useEffect } from 'react';
import { useGLTF } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useStore } from '@/stores';
import { MODULE_CATALOG } from '@/lib/config/modules';
import { UNIT_SCALE } from '@/lib/config/constants';

/**
 * Semi-transparent preview of the module being placed.
 * Green when snapped to a valid anchor, blue when floating.
 */
export function GhostModule() {
  const dragModuleId = useStore((s) => s.dragModuleId);
  const ghostPosition = useStore((s) => s.ghostPosition);
  const ghostRotation = useStore((s) => s.ghostRotation);
  const isSnapped = useStore((s) => s.isSnapped);
  const invalidate = useThree((s) => s.invalidate);

  const catalog = dragModuleId ? MODULE_CATALOG[dragModuleId] : null;

  // Load the GLB for the dragged module (if any)
  // useGLTF must be called unconditionally, so we default to a seat-m path
  const modelPath = catalog?.modelPath ?? '/models/seat-m.glb';
  const { scene } = useGLTF(modelPath);

  const ghostScene = useMemo(() => {
    if (!catalog) return null;

    const clone = scene.clone(true);
    const color = isSnapped ? 0x22c55e : 0x3b82f6; // green or blue

    clone.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.material = new THREE.MeshStandardMaterial({
          color,
          transparent: true,
          opacity: 0.5,
          depthWrite: false,
        });
        child.castShadow = false;
        child.receiveShadow = false;
      }
    });

    return clone;
  }, [scene, catalog, isSnapped]);

  useEffect(() => {
    invalidate();
  }, [ghostPosition, ghostRotation, isSnapped, invalidate]);

  // Disable raycasting so the ghost doesn't intercept clicks meant for the DropZone
  const noRaycast = useMemo(() => () => null, []);

  if (!dragModuleId || !ghostPosition || !ghostScene) return null;

  return (
    <group position={ghostPosition} rotation={ghostRotation} raycast={noRaycast}>
      <primitive object={ghostScene} scale={[UNIT_SCALE, UNIT_SCALE, UNIT_SCALE]} />
    </group>
  );
}
