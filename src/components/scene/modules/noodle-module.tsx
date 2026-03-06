'use client';

import { useRef, useMemo } from 'react';
import * as THREE from 'three';
import type { PlacedModule } from '@/types/configurator';
import type { MaterialSelection } from '@/types/materials';
import { getMaterialForSlot } from '@/lib/three/material-factory';
import { MODULE_MATERIAL_SLOTS } from '@/lib/config/constants';
import { MODULE_CATALOG } from '@/lib/config/modules';

interface NoodleModuleProps {
  module: PlacedModule;
  material: MaterialSelection;
}

export function NoodleModule({ module, material }: NoodleModuleProps) {
  const groupRef = useRef<THREE.Group>(null);
  const catalog = MODULE_CATALOG[module.moduleId];
  const { width, height } = catalog?.dimensions ?? { width: 0.8, height: 0.15 };

  const cordMaterial = useMemo(
    () => getMaterialForSlot(MODULE_MATERIAL_SLOTS.CORD, material),
    [material]
  );

  return (
    <group ref={groupRef} position={module.position} rotation={module.rotation}>
      <mesh position={[0, height / 2, 0]} castShadow rotation={[0, 0, Math.PI / 2]} material={cordMaterial}>
        <cylinderGeometry args={[height / 2, height / 2, width, 16]} />
      </mesh>
    </group>
  );
}
