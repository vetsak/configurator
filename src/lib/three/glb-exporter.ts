import * as THREE from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import type { PlacedModule } from '@/types/configurator';
import type { MaterialSelection } from '@/types/materials';
import { buildExportScene, disposeExportScene } from './scene-builder';
import { ensureTexturesLoaded } from './material-factory';

/**
 * Wait until every MeshStandardMaterial in the group has its .map and
 * .normalMap textures fully uploaded (image !== undefined).
 * Resolves immediately if no pending textures are found.
 */
function waitForMaterialTextures(group: THREE.Group): Promise<void> {
  const pending: Promise<void>[] = [];

  group.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return;

    const mat = child.material;
    if (!(mat instanceof THREE.MeshStandardMaterial)) return;

    for (const tex of [mat.map, mat.normalMap]) {
      if (!tex) continue;
      // Texture exists but image may still be loading
      if (tex.image) continue;
      // Wait for the texture source to be set
      pending.push(
        new Promise<void>((resolve) => {
          const check = () => {
            if (tex.image) {
              resolve();
            } else {
              setTimeout(check, 50);
            }
          };
          check();
        })
      );
    }
  });

  if (pending.length === 0) return Promise.resolve();

  // Cap maximum wait at 10 seconds to avoid hanging
  return Promise.race([
    Promise.all(pending).then(() => {}),
    new Promise<void>((resolve) => setTimeout(resolve, 10_000)),
  ]);
}

/**
 * Export the current sofa configuration as a GLB blob URL.
 * Embeds textures (diffuse + normal) for the active material selection.
 */
export async function exportToGLB(
  modules: PlacedModule[],
  material: MaterialSelection
): Promise<string> {
  // Pre-load textures into the cache so buildExportScene picks them up
  // synchronously when creating cord materials.
  await ensureTexturesLoaded(material);

  const group = await buildExportScene(modules, material);

  // Belt-and-suspenders: ensure every texture image is actually available
  await waitForMaterialTextures(group);

  const exporter = new GLTFExporter();
  const buffer = await exporter.parseAsync(group, { binary: true });

  disposeExportScene(group);

  const blob = new Blob([buffer as ArrayBuffer], { type: 'model/gltf-binary' });
  return URL.createObjectURL(blob);
}
