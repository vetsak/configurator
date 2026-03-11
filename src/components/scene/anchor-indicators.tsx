'use client';

import { useMemo } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useStore } from '@/stores';
import { MODULE_CATALOG } from '@/lib/config/modules';
import { buildFreeAnchors } from '@/lib/snapping/snap-detector-2d';
import type { ModuleType } from '@/types/configurator';

const INDICATOR_RADIUS = 0.03;
const INDICATOR_HEIGHT = 0.005;
const COLOR_COMPATIBLE = new THREE.Color('#3b82f6');   // blue
const COLOR_INCOMPATIBLE = new THREE.Color('#9ca3af');  // gray
const COLOR_ACTIVE = new THREE.Color('#22c55e');        // green

const indicatorGeo = new THREE.CylinderGeometry(INDICATOR_RADIUS, INDICATOR_RADIUS, INDICATOR_HEIGHT, 16);

/**
 * Renders small disc indicators at every free anchor when drag mode is active.
 * Blue = compatible with dragged module, gray = incompatible, green = active snap target.
 */
export function AnchorIndicators() {
  const dragModuleId = useStore((s) => s.dragModuleId);
  const dragInstanceId = useStore((s) => s.dragInstanceId);
  const modules = useStore((s) => s.modules);
  const snapTarget = useStore((s) => s.snapTarget);
  const invalidate = useThree((s) => s.invalidate);

  const indicators = useMemo(() => {
    if (!dragModuleId) return [];

    const dragCatalog = MODULE_CATALOG[dragModuleId];
    if (!dragCatalog) return [];

    const dragType: ModuleType = dragCatalog.type;
    const freeAnchors = buildFreeAnchors(modules, dragInstanceId ?? undefined);

    return freeAnchors.map((anchor) => {
      const isActive =
        snapTarget?.hostInstanceId === anchor.instanceId &&
        snapTarget?.hostAnchorId === anchor.anchorId;
      const isCompatible = anchor.compatible.includes(dragType);

      const color = isActive ? COLOR_ACTIVE : isCompatible ? COLOR_COMPATIBLE : COLOR_INCOMPATIBLE;
      const opacity = isActive ? 0.9 : isCompatible ? 0.6 : 0.25;

      return {
        key: `${anchor.instanceId}-${anchor.anchorId}`,
        position: anchor.worldPos as [number, number, number],
        color,
        opacity,
        scale: isActive ? 1.5 : 1,
      };
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dragModuleId, dragInstanceId, modules, snapTarget]);

  if (!dragModuleId || indicators.length === 0) return null;

  return (
    <>
      {indicators.map((ind) => (
        <mesh
          key={ind.key}
          geometry={indicatorGeo}
          position={[ind.position[0], 0.01, ind.position[2]]}
          scale={ind.scale}
          raycast={() => null}
        >
          <meshBasicMaterial
            color={ind.color}
            transparent
            opacity={ind.opacity}
            depthWrite={false}
          />
        </mesh>
      ))}
    </>
  );
}
