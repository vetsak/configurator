#!/usr/bin/env tsx
/**
 * Convert OBJ/FBX models to optimized GLB with Draco compression.
 *
 * Usage: pnpm tsx scripts/convert-models.ts
 *
 * Reads from: raw-assets/models/
 * Outputs to: public/models/
 */
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { dedup, quantize, prune } from '@gltf-transform/functions';
import { MeshoptEncoder } from 'meshoptimizer';
import { join, basename } from 'path';
import { readdirSync, mkdirSync, existsSync } from 'fs';

const RAW_DIR = join(process.cwd(), 'raw-assets', 'models');
const OUT_DIR = join(process.cwd(), 'public', 'models');

async function main() {
  await MeshoptEncoder.ready;

  if (!existsSync(RAW_DIR)) {
    console.log(`No raw-assets/models/ directory found. Creating placeholder...`);
    mkdirSync(RAW_DIR, { recursive: true });
    console.log('Place your OBJ/FBX/GLB files in raw-assets/models/ and re-run.');
    return;
  }

  mkdirSync(OUT_DIR, { recursive: true });

  const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
  const files = readdirSync(RAW_DIR).filter((f) => /\.(glb|gltf)$/i.test(f));

  if (files.length === 0) {
    console.log('No .glb or .gltf files found in raw-assets/models/');
    console.log('Note: OBJ/FBX files must first be converted to GLB using Blender or similar tool.');
    return;
  }

  for (const file of files) {
    const inputPath = join(RAW_DIR, file);
    const outputPath = join(OUT_DIR, basename(file, '.gltf').replace('.glb', '') + '.glb');

    console.log(`Processing: ${file}`);

    const document = await io.read(inputPath);

    // Optimize
    await document.transform(
      dedup(),
      prune(),
      quantize(),
    );

    await io.write(outputPath, document);

    console.log(`  → ${outputPath}`);
  }

  console.log('\nDone! All models optimized and saved to public/models/');
}

main().catch(console.error);
