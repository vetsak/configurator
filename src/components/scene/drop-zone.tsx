'use client';

import { useEffect, useRef } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useStore } from '@/stores';
import { findBestSnap } from '@/lib/snapping/snap-detector-2d';
import { createPlacedModule } from '@/lib/snapping/engine';

const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
const intersectPoint = new THREE.Vector3();
const pointer = new THREE.Vector2();

/**
 * Handles pointer events for module placement using DOM events + manual
 * raycasting to a virtual ground plane. Supports both catalog placement
 * and module repositioning via 2D anchor-based snapping.
 */
export function DropZone() {
  const { camera, gl, invalidate } = useThree();
  const raycasterRef = useRef(new THREE.Raycaster());

  useEffect(() => {
    const canvas = gl.domElement;

    const getGroundPoint = (e: PointerEvent | MouseEvent): [number, number, number] | null => {
      const rect = canvas.getBoundingClientRect();
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycasterRef.current.setFromCamera(pointer, camera);
      const hit = raycasterRef.current.ray.intersectPlane(groundPlane, intersectPoint);
      if (!hit) return null;
      return [intersectPoint.x, 0, intersectPoint.z];
    };

    const handlePointerMove = (e: PointerEvent) => {
      const { dragModuleId, dragInstanceId, modules, setSnapTarget, updateGhost } = useStore.getState();
      if (!dragModuleId) return;

      const worldPos = getGroundPoint(e);
      if (!worldPos) return;

      // If there are no modules yet, just update ghost position (no snap targets)
      if (modules.length === 0 || (modules.length === 1 && dragInstanceId && modules[0].instanceId === dragInstanceId)) {
        setSnapTarget(null);
        updateGhost(worldPos);
        invalidate();
        return;
      }

      const snap = findBestSnap(worldPos, dragModuleId, modules, dragInstanceId ?? undefined);

      if (snap) {
        setSnapTarget(snap);
      } else {
        setSnapTarget(null);
        updateGhost(worldPos);
      }

      invalidate();
    };

    const handleClick = (e: MouseEvent) => {
      const { dragModuleId, dragInstanceId, dragSource, snapTarget, modules, confirmDrop, placeSnappedModule, repositionModule, addModule } = useStore.getState();
      if (!dragModuleId) return;

      const worldPos = getGroundPoint(e as unknown as PointerEvent);

      // Special case: first module placement (no existing modules to snap to)
      if (modules.length === 0 || (modules.length === 1 && dragInstanceId && modules[0].instanceId === dragInstanceId)) {
        if (worldPos) {
          if (dragSource === 'catalog') {
            const newModule = createPlacedModule(dragModuleId, worldPos);
            addModule(newModule);
          } else if (dragSource === 'reposition' && dragInstanceId) {
            // For reposition with no other modules, just update position
            const { updateModule } = useStore.getState();
            updateModule(dragInstanceId, { position: worldPos, rotation: [0, 0, 0] });
          }
          confirmDrop();
          invalidate();
        }
        return;
      }

      // Normal snap placement
      if (!snapTarget) return;

      if (dragSource === 'catalog') {
        placeSnappedModule(dragModuleId, snapTarget);
        // Find the just-placed module for animation
        const latestModules = useStore.getState().modules;
        const newest = latestModules[latestModules.length - 1];
        if (newest) useStore.setState({ justPlacedId: newest.instanceId });
      } else if (dragSource === 'reposition' && dragInstanceId) {
        repositionModule(dragInstanceId, snapTarget);
        useStore.setState({ justPlacedId: dragInstanceId });
      }

      confirmDrop();
      invalidate();
    };

    canvas.addEventListener('pointermove', handlePointerMove);
    canvas.addEventListener('click', handleClick);

    return () => {
      canvas.removeEventListener('pointermove', handlePointerMove);
      canvas.removeEventListener('click', handleClick);
    };
  }, [camera, gl, invalidate]);

  // No mesh needed — uses DOM events + virtual ground plane
  return null;
}
