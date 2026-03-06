#!/usr/bin/env tsx
/**
 * Convert OBJ files to optimized GLB using obj2gltf + gltf-transform.
 *
 * Usage: pnpm tsx scripts/fbx-to-glb.ts
 *
 * Reads OBJ from: Desktop/3d_files
 * Outputs to: public/models/
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, copyFileSync } from 'fs';
import { join } from 'path';
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { dedup, quantize, prune, weld } from '@gltf-transform/functions';
import { MeshoptEncoder } from 'meshoptimizer';
import { execFileSync, execSync } from 'child_process';

const SOURCE_DIR = '/Users/marcoschache/Desktop/3d_files';
const OUT_DIR = join(process.cwd(), 'public', 'models');
const TEX_OUT_DIR = join(process.cwd(), 'public', 'textures');

// Mapping from source folder names to our module IDs
const FOLDER_TO_MODULE: Record<string, string> = {
  'vetsak_seat_xs': 'seat-xs',
  'vetsak_seat-s': 'seat-s',
  'vetsak_seat-m': 'seat-m',
  'vetsak_seat-l': 'seat-l',
  'vetsak_seat_xl': 'seat-xl',
  'vetsak_side_s': 'side-s',
  'vetsak_side_m': 'side-m',
  'vetsak_side_l': 'side-l',
  'vetsak_pillow': 'pillow-back',
  'vetsak_big_pillow': 'pillow-deco-l',
  'vetsak_lounge_pillow': 'pillow-deco-s',
  'vetsak_noodle': 'noodle',
  'vetsak_jumbo_pillow_gefaltet': 'jumbo-pillow-folded',
  'vetsak_jumbo_pillow_liegend_links': 'jumbo-pillow-left',
  'vetsak_jumbo_pillow_liegend_rechts': 'jumbo-pillow-right',
};

function unlinkSafe(path: string) {
  try { require('fs').unlinkSync(path); } catch {}
}

async function main() {
  await MeshoptEncoder.ready;

  mkdirSync(OUT_DIR, { recursive: true });
  mkdirSync(TEX_OUT_DIR, { recursive: true });

  const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);

  console.log('Converting OBJ files to optimized GLB...\n');

  const folders = readdirSync(SOURCE_DIR).filter(
    (f) => f.startsWith('vetsak_') && existsSync(join(SOURCE_DIR, f))
  );

  // Copy shared textures (same across all modules)
  const sampleTexDir = join(SOURCE_DIR, 'vetsak_seat-m', 'tex');
  if (existsSync(sampleTexDir)) {
    const platDir = join(TEX_OUT_DIR, 'cord', 'platinum');
    mkdirSync(platDir, { recursive: true });
    const texFiles = readdirSync(sampleTexDir);
    for (const tf of texFiles) {
      const src = join(sampleTexDir, tf);
      if (tf.toLowerCase().includes('cord_platinum')) {
        copyFileSync(src, join(platDir, 'diffuse.jpg'));
        console.log(`  Copied diffuse texture: ${tf}`);
      } else if (tf.toLowerCase().includes('cord_normal')) {
        copyFileSync(src, join(platDir, 'normal.jpg'));
        console.log(`  Copied normal map: ${tf}`);
      } else if (tf.toLowerCase().includes('vetsak') || tf.toLowerCase().includes('cape town')) {
        copyFileSync(src, join(TEX_OUT_DIR, 'etikett.jpg'));
        console.log(`  Copied etikett texture: ${tf}`);
      }
    }
    console.log('');
  }

  for (const folder of folders) {
    const moduleId = FOLDER_TO_MODULE[folder];
    if (!moduleId) {
      console.log(`Skipping unknown folder: ${folder}`);
      continue;
    }

    const folderPath = join(SOURCE_DIR, folder);
    const files = readdirSync(folderPath);
    const objFile = files.find((f) => f.endsWith('.obj'));

    if (!objFile) {
      console.log(`No OBJ found in ${folder}, skipping`);
      continue;
    }

    const objPath = join(folderPath, objFile);
    const tmpGlb = join(OUT_DIR, `${moduleId}_tmp.glb`);
    const finalGlb = join(OUT_DIR, `${moduleId}.glb`);

    console.log(`Processing: ${folder} → ${moduleId}.glb`);

    try {
      // Convert OBJ → GLB using obj2gltf
      execFileSync('npx', ['--yes', 'obj2gltf', '-i', objPath, '-o', tmpGlb], {
        stdio: 'pipe',
        timeout: 120000,
      });

      // Optimize with gltf-transform
      const document = await io.read(tmpGlb);

      await document.transform(
        weld(),
        dedup(),
        prune(),
        quantize(),
      );

      await io.write(finalGlb, document);

      // Remove temp file
      unlinkSafe(tmpGlb);

      // Report size
      const stats = readFileSync(finalGlb);
      const sizeMB = (stats.length / 1024 / 1024).toFixed(2);
      console.log(`  → ${moduleId}.glb (${sizeMB} MB)`);
    } catch (err) {
      console.error(`  ERROR converting ${folder}:`, (err as Error).message?.slice(0, 200));
      unlinkSafe(tmpGlb);
    }
  }

  console.log('\nDone! Check public/models/ for GLB files.');

  // Summary
  const glbFiles = readdirSync(OUT_DIR).filter((f) => f.endsWith('.glb'));
  const totalSize = glbFiles.reduce((sum, f) => {
    return sum + readFileSync(join(OUT_DIR, f)).length;
  }, 0);
  console.log(`Total: ${glbFiles.length} GLB files, ${(totalSize / 1024 / 1024).toFixed(2)} MB`);
}

main().catch(console.error);
