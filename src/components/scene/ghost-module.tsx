'use client';

import { useMemo, useEffect, useRef } from 'react';
import { useGLTF } from '@react-three/drei';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useStore } from '@/stores';
import { MODULE_CATALOG } from '@/lib/config/modules';
import { UNIT_SCALE } from '@/lib/config/constants';

const LERP_FACTOR = 0.15;
const LERP_THRESHOLD = 0.001;
const SCALE_BOUNCE = 1.04;
const SCALE_SETTLE_SPEED = 0.08;

/**
 * Semi-transparent preview of the module being placed.
 * Green when snapped to a valid anchor, blue when floating.
 * Smoothly lerps to target position and bounces on snap.
 */
export function GhostModule() {
  const dragModuleId = useStore((s) => s.dragModuleId);
  const ghostPosition = useStore((s) => s.ghostPosition);
  const ghostRotation = useStore((s) => s.ghostRotation);
  const isSnapped = useStore((s) => s.isSnapped);
  const invalidate = useThree((s) => s.invalidate);

  const groupRef = useRef<THREE.Group>(null);
  const currentPos = useRef(new THREE.Vector3());
  const currentRotY = useRef(0);
  const currentScale = useRef(1);
  const prevSnapped = useRef(false);
  const isAnimating = useRef(false);

  const catalog = dragModuleId ? MODULE_CATALOG[dragModuleId] : null;

  const modelPath = catalog?.modelPath ?? '/models/seat-m.glb';
  const { scene } = useGLTF(modelPath);

  const ghostScene = useMemo(() => {
    if (!catalog) return null;

    const clone = scene.clone(true);
    const color = isSnapped ? 0x22c55e : 0x3b82f6;

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

  // Haptic feedback when snap state changes
  useEffect(() => {
    if (isSnapped && !prevSnapped.current) {
      navigator.vibrate?.(10);
      currentScale.current = SCALE_BOUNCE;
    }
    prevSnapped.current = isSnapped;
  }, [isSnapped]);

  // Reset lerp position when drag starts
  useEffect(() => {
    if (ghostPosition) {
      currentPos.current.set(...ghostPosition);
      currentRotY.current = ghostRotation[1];
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dragModuleId]);

  // Smooth lerp animation
  useFrame(() => {
    if (!groupRef.current || !ghostPosition) return;

    const targetPos = new THREE.Vector3(...ghostPosition);
    const targetRotY = ghostRotation[1];

    // Lerp position
    currentPos.current.lerp(targetPos, LERP_FACTOR);
    // Lerp rotation
    currentRotY.current += (targetRotY - currentRotY.current) * LERP_FACTOR;
    // Settle scale bounce
    currentScale.current += (1 - currentScale.current) * SCALE_SETTLE_SPEED;

    // Apply
    groupRef.current.position.copy(currentPos.current);
    groupRef.current.rotation.set(ghostRotation[0], currentRotY.current, ghostRotation[2]);
    const s = currentScale.current;
    groupRef.current.scale.set(s, s, s);

    // Keep invalidating while animating
    const posDelta = currentPos.current.distanceTo(targetPos);
    const rotDelta = Math.abs(targetRotY - currentRotY.current);
    const scaleDelta = Math.abs(1 - currentScale.current);
    const stillAnimating = posDelta > LERP_THRESHOLD || rotDelta > LERP_THRESHOLD || scaleDelta > 0.001;

    if (stillAnimating) {
      isAnimating.current = true;
      invalidate();
    } else {
      isAnimating.current = false;
    }
  });

  // Trigger initial invalidate on state changes
  useEffect(() => {
    invalidate();
  }, [ghostPosition, ghostRotation, isSnapped, invalidate]);

  const noRaycast = useMemo(() => () => null, []);

  if (!dragModuleId || !ghostPosition || !ghostScene) return null;

  return (
    <group ref={groupRef} raycast={noRaycast}>
      <primitive object={ghostScene} scale={[UNIT_SCALE, UNIT_SCALE, UNIT_SCALE]} />
    </group>
  );
}
