'use client';

import { useRef, useMemo, useEffect } from 'react';
import { useGLTF } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import type { PlacedModule } from '@/types/configurator';
import type { MaterialSelection } from '@/types/materials';
import { getMaterialForSlot } from '@/lib/three/material-factory';
import { MODULE_MATERIAL_SLOTS, UNIT_SCALE } from '@/lib/config/constants';

/** Selection highlight color and intensity */
const SELECTION_EMISSIVE = new THREE.Color('#3b82f6');
const SELECTION_EMISSIVE_INTENSITY = 0.15;

interface GlbModuleProps {
  module: PlacedModule;
  material: MaterialSelection;
  modelPath: string;
  isSelected?: boolean;
  onSelect?: (instanceId: string) => void;
}

/**
 * Generic GLB module renderer. Loads a GLB, clones it, and applies
 * material overrides by matching material names: "Cord", "legs", "etikett".
 *
 * When selected, applies a subtle emissive glow to all meshes so the
 * entire module is highlighted without an obtrusive wireframe overlay.
 */
export function GlbModule({ module, material, modelPath, isSelected, onSelect }: GlbModuleProps) {
  const groupRef = useRef<THREE.Group>(null);
  const { scene } = useGLTF(modelPath);
  const invalidate = useThree((s) => s.invalidate);

  // Module's Y rotation — used to counter-rotate normal/diffuse maps on Cord
  const moduleRotY = module.rotation[1];

  const clonedScene = useMemo(() => {
    const clone = scene.clone(true);

    clone.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const matName = (child.material as THREE.Material)?.name ?? '';

        // Clone the shared material so emissive changes stay local to this instance.
        if (matName === 'Cord') {
          const clonedMat = getMaterialForSlot(MODULE_MATERIAL_SLOTS.CORD, material).clone() as THREE.MeshStandardMaterial;

          // Counter-rotate texture UVs so cord pattern stays consistent
          // regardless of module Y rotation (sides rotated ±90°)
          if (Math.abs(moduleRotY) > 0.01) {
            const rotateTexture = (tex: THREE.Texture): THREE.Texture => {
              const rotated = tex.clone();
              rotated.center.set(0.5, 0.5);
              rotated.rotation = -moduleRotY;
              rotated.needsUpdate = true;
              return rotated;
            };

            if (clonedMat.normalMap) {
              clonedMat.normalMap = rotateTexture(clonedMat.normalMap);
            }
            if (clonedMat.map) {
              clonedMat.map = rotateTexture(clonedMat.map);
            }
          }

          child.material = clonedMat;
        } else if (matName === 'legs') {
          child.material = getMaterialForSlot(MODULE_MATERIAL_SLOTS.LEGS, material).clone();
        } else if (matName === 'etikett') {
          child.material = getMaterialForSlot(MODULE_MATERIAL_SLOTS.ETIKETT, material).clone();
        } else {
          // Clone any other material so it is unique to this module instance.
          child.material = (child.material as THREE.Material).clone();
        }

        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    return clone;
  }, [scene, material, moduleRotY]);

  // Apply / remove emissive highlight when selection state changes.
  // Because each mesh now owns a cloned material, mutations are safe.
  useEffect(() => {
    if (!clonedScene) return;

    clonedScene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const mat = child.material;
        if (mat instanceof THREE.MeshStandardMaterial || mat instanceof THREE.MeshPhysicalMaterial) {
          if (isSelected) {
            mat.emissive = SELECTION_EMISSIVE;
            mat.emissiveIntensity = SELECTION_EMISSIVE_INTENSITY;
          } else {
            mat.emissive = new THREE.Color('#000000');
            mat.emissiveIntensity = 0;
          }
          mat.needsUpdate = true;
        }
      }
    });

    invalidate();
  }, [clonedScene, isSelected, invalidate]);

  // Request a re-render when the cloned scene changes
  useEffect(() => {
    invalidate();
  }, [clonedScene, invalidate]);

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
      <primitive object={clonedScene} scale={[UNIT_SCALE, UNIT_SCALE, UNIT_SCALE]} />
    </group>
  );
}
