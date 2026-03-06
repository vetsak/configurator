'use client';

import { useRef, useMemo } from 'react';
import * as THREE from 'three';
import type { PlacedModule } from '@/types/configurator';
import type { MaterialSelection } from '@/types/materials';
import { getMaterialForSlot } from '@/lib/three/material-factory';
import { MODULE_MATERIAL_SLOTS } from '@/lib/config/constants';
import { MODULE_CATALOG } from '@/lib/config/modules';

interface PillowModuleProps {
  module: PlacedModule;
  material: MaterialSelection;
}

export function PillowModule({ module, material }: PillowModuleProps) {
  const groupRef = useRef<THREE.Group>(null);
  const catalog = MODULE_CATALOG[module.moduleId];
  const { width, depth, height } = catalog?.dimensions ?? { width: 0.6, depth: 0.2, height: 0.4 };

  const cordMaterial = useMemo(
    () => getMaterialForSlot(MODULE_MATERIAL_SLOTS.CORD, material),
    [material]
  );

  return (
    <group ref={groupRef} position={module.position} rotation={module.rotation}>
      <mesh position={[0, height / 2, 0]} castShadow material={cordMaterial}>
        <boxGeometry args={[width, height, depth]} />
      </mesh>
    </group>
  );
}
