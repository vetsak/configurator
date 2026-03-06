import { USDZExporter } from 'three/examples/jsm/exporters/USDZExporter.js';
import type { PlacedModule } from '@/types/configurator';
import type { MaterialSelection } from '@/types/materials';
import { buildExportScene, disposeExportScene } from './scene-builder';

/**
 * Export the current sofa configuration as a USDZ blob URL.
 * Used for iOS AR Quick Look.
 */
export async function exportToUSDZ(
  modules: PlacedModule[],
  material: MaterialSelection
): Promise<string> {
  const group = await buildExportScene(modules, material);

  const exporter = new USDZExporter();
  const buffer = await exporter.parseAsync(group);

  disposeExportScene(group);

  const blob = new Blob([buffer], { type: 'model/vnd.usdz+zip' });
  return URL.createObjectURL(blob);
}
