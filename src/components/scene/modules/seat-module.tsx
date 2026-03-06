'use client';

import { useRef, useMemo } from 'react';
import * as THREE from 'three';
import type { PlacedModule } from '@/types/configurator';
import type { MaterialSelection } from '@/types/materials';
import { getMaterialForSlot } from '@/lib/three/material-factory';
import { MODULE_MATERIAL_SLOTS } from '@/lib/config/constants';
import { MODULE_CATALOG } from '@/lib/config/modules';

interface SeatModuleProps {
  module: PlacedModule;
  material: MaterialSelection;
  isSelected?: boolean;
  onSelect?: (instanceId: string) => void;
}

/**
 * Renders a seat module. Uses placeholder box geometry until real GLBs are provided.
 * Once you have GLBs, replace the box with useGLTF + material slot traversal.
 */
export function SeatModule({ module, material, isSelected, onSelect }: SeatModuleProps) {
  const groupRef = useRef<THREE.Group>(null);
  const catalog = MODULE_CATALOG[module.moduleId];
  const { width, depth, height } = catalog?.dimensions ?? { width: 0.8, depth: 0.95, height: 0.68 };

  const cordMaterial = useMemo(
    () => getMaterialForSlot(MODULE_MATERIAL_SLOTS.CORD, material),
    [material]
  );
  const legsMaterial = useMemo(
    () => getMaterialForSlot(MODULE_MATERIAL_SLOTS.LEGS, material),
    [material]
  );

  const seatHeight = height * 0.45;
  const backHeight = height * 0.55;
  const legHeight = 0.08;

  return (
    <group
      ref={groupRef}
      position={module.position}
      rotation={module.rotation}
      onClick={(e) => {
        e.stopPropagation();
        onSelect?.(module.instanceId);
      }}
    >
      {/* Seat cushion */}
      <mesh
        position={[0, legHeight + seatHeight / 2, 0]}
        castShadow
        receiveShadow
        material={cordMaterial}
      >
        <boxGeometry args={[width, seatHeight, depth]} />
      </mesh>

      {/* Back rest */}
      <mesh
        position={[0, legHeight + seatHeight + backHeight / 2, -depth / 2 + 0.08]}
        castShadow
        receiveShadow
        material={cordMaterial}
      >
        <boxGeometry args={[width, backHeight, 0.16]} />
      </mesh>

      {/* Legs */}
      {[
        [-width / 2 + 0.04, legHeight / 2, -depth / 2 + 0.04],
        [width / 2 - 0.04, legHeight / 2, -depth / 2 + 0.04],
        [-width / 2 + 0.04, legHeight / 2, depth / 2 - 0.04],
        [width / 2 - 0.04, legHeight / 2, depth / 2 - 0.04],
      ].map((pos, i) => (
        <mesh
          key={i}
          position={pos as [number, number, number]}
          castShadow
          material={legsMaterial}
        >
          <cylinderGeometry args={[0.015, 0.015, legHeight, 8]} />
        </mesh>
      ))}

      {/* Selection highlight */}
      {isSelected && (
        <mesh position={[0, legHeight + seatHeight / 2, 0]}>
          <boxGeometry args={[width + 0.02, seatHeight + 0.02, depth + 0.02]} />
          <meshBasicMaterial color="#3b82f6" transparent opacity={0.15} wireframe />
        </mesh>
      )}
    </group>
  );
}
