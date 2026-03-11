'use client';

import { useRef, useEffect } from 'react';
import { OrbitControls } from '@react-three/drei';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { CAMERA_DEFAULTS } from '@/lib/config/constants';
import { useStore } from '@/stores';

const BIRD_EYE_POS = new THREE.Vector3(0, 4, 0.01); // slight Z to avoid gimbal lock
const BIRD_EYE_TARGET = new THREE.Vector3(0, 0, 0);
const TRANSITION_SPEED = 0.08;
const ZOOM_LERP_SPEED = 0.1;
const DONE_THRESHOLD = 0.01;

const DEFAULT_POS = new THREE.Vector3(...CAMERA_DEFAULTS.position);
const DEFAULT_TARGET = new THREE.Vector3(...CAMERA_DEFAULTS.target);

export function CameraRig() {
  const isDragging = useStore((s) => s.dragModuleId !== null);
  const zoomTarget = useStore((s) => s.zoomTarget);
  const resetCameraFlag = useStore((s) => s.resetCameraFlag);
  const controlsRef = useRef<any>(null);
  const { camera, invalidate } = useThree();

  const savedCamera = useRef<{ position: THREE.Vector3; target: THREE.Vector3 } | null>(null);
  const isTransitioning = useRef(false);
  const transitionTarget = useRef<{ position: THREE.Vector3; target: THREE.Vector3 } | null>(null);

  // Zoom distance lerp target
  const zoomDistTarget = useRef<number | null>(null);

  // Start/end transition when drag state changes
  useEffect(() => {
    if (isDragging) {
      // Save current camera state before transitioning to bird's eye
      if (controlsRef.current) {
        savedCamera.current = {
          position: camera.position.clone(),
          target: controlsRef.current.target.clone(),
        };
      }
      transitionTarget.current = {
        position: BIRD_EYE_POS.clone(),
        target: BIRD_EYE_TARGET.clone(),
      };
      isTransitioning.current = true;
      invalidate();
    } else if (savedCamera.current) {
      // Transition back to saved camera position
      transitionTarget.current = {
        position: savedCamera.current.position.clone(),
        target: savedCamera.current.target.clone(),
      };
      isTransitioning.current = true;
      invalidate();
    }
  }, [isDragging, camera, invalidate]);

  // Handle zoom target changes from store
  useEffect(() => {
    if (zoomTarget === null || !controlsRef.current) return;

    const currentDist = camera.position.distanceTo(controlsRef.current.target);

    if (zoomTarget < 0) {
      // Signal values: -1 = zoom in, -2 = zoom out
      const step = zoomTarget === -1 ? 0.8 : 1.25;
      zoomDistTarget.current = Math.max(
        CAMERA_DEFAULTS.minDistance,
        Math.min(CAMERA_DEFAULTS.maxDistance, currentDist * step)
      );
    } else {
      zoomDistTarget.current = zoomTarget;
    }

    useStore.getState().clearZoomTarget();
    invalidate();
  }, [zoomTarget, camera, invalidate]);

  // Handle reset camera
  useEffect(() => {
    if (resetCameraFlag === 0) return;

    transitionTarget.current = {
      position: DEFAULT_POS.clone(),
      target: DEFAULT_TARGET.clone(),
    };
    isTransitioning.current = true;
    zoomDistTarget.current = null;
    invalidate();
  }, [resetCameraFlag, invalidate]);

  useFrame(() => {
    if (!controlsRef.current) return;

    let needsInvalidate = false;

    // Handle bird's eye / reset transitions
    if (isTransitioning.current && transitionTarget.current) {
      camera.position.lerp(transitionTarget.current.position, TRANSITION_SPEED);
      controlsRef.current.target.lerp(transitionTarget.current.target, TRANSITION_SPEED);
      controlsRef.current.update();

      const posDist = camera.position.distanceTo(transitionTarget.current.position);
      const targetDist = controlsRef.current.target.distanceTo(transitionTarget.current.target);

      if (posDist < DONE_THRESHOLD && targetDist < DONE_THRESHOLD) {
        camera.position.copy(transitionTarget.current.position);
        controlsRef.current.target.copy(transitionTarget.current.target);
        controlsRef.current.update();
        isTransitioning.current = false;
        transitionTarget.current = null;

        // Clear saved camera if we've returned from drag
        if (!isDragging) {
          savedCamera.current = null;
        }
      }

      needsInvalidate = true;
    }

    // Handle zoom distance lerp
    if (zoomDistTarget.current !== null) {
      const target = controlsRef.current.target as THREE.Vector3;
      const currentDist = camera.position.distanceTo(target);
      const newDist = THREE.MathUtils.lerp(currentDist, zoomDistTarget.current, ZOOM_LERP_SPEED);

      // Move camera along its current direction to/from target
      const direction = camera.position.clone().sub(target).normalize();
      camera.position.copy(target).addScaledVector(direction, newDist);
      controlsRef.current.update();

      if (Math.abs(currentDist - zoomDistTarget.current) < DONE_THRESHOLD) {
        zoomDistTarget.current = null;
      }

      needsInvalidate = true;
    }

    if (needsInvalidate) {
      invalidate();
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      enabled={!isDragging}
      target={CAMERA_DEFAULTS.target}
      minDistance={CAMERA_DEFAULTS.minDistance}
      maxDistance={CAMERA_DEFAULTS.maxDistance}
      minPolarAngle={CAMERA_DEFAULTS.minPolarAngle}
      maxPolarAngle={CAMERA_DEFAULTS.maxPolarAngle}
      enablePan={CAMERA_DEFAULTS.enablePan}
      dampingFactor={CAMERA_DEFAULTS.dampingFactor}
      enableDamping
    />
  );
}
