#!/usr/bin/env node
/**
 * GLB Optimization Pipeline
 *
 * 1. Strip embedded textures from materials (keep material names for runtime)
 * 2. Preserve TEXCOORD_0 on fabric meshes (needed for runtime normal/diffuse maps)
 * 3. Simplify over-tessellated legs meshes (41K → ~4K triangles)
 * 4. Weld, dedup, and prune unused data (but keep UVs)
 * 5. Reorder + quantize for GPU efficiency
 *
 * Preserves material NAMES (Cord, legs, etikett) for runtime matching.
 */

import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import {
  dedup,
  prune,
  weld,
  simplify,
  quantize,
  reorder,
} from '@gltf-transform/functions';
import { MeshoptSimplifier, MeshoptEncoder } from 'meshoptimizer';
import { readdir, stat, mkdir, copyFile } from 'node:fs/promises';
import { join } from 'node:path';

const MODELS_DIR = join(import.meta.dirname, '..', 'public', 'models');
const BACKUP_DIR = join(MODELS_DIR, 'backup-originals');
const LEGS_TARGET_RATIO = 0.10; // reduce legs to ~10% of original (41K → ~4K)

async function main() {
  await MeshoptSimplifier.ready;
  await MeshoptEncoder.ready;

  // Restore from backup first (re-runnable)
  const backupExists = await stat(BACKUP_DIR).catch(() => null);
  if (backupExists) {
    console.log('Restoring from backup before re-processing...');
    const backups = (await readdir(BACKUP_DIR)).filter((f) => f.endsWith('.glb'));
    for (const f of backups) {
      await copyFile(join(BACKUP_DIR, f), join(MODELS_DIR, f));
    }
  } else {
    await mkdir(BACKUP_DIR, { recursive: true });
  }

  const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);

  const files = (await readdir(MODELS_DIR))
    .filter((f) => f.endsWith('.glb'))
    .sort();

  // Backup originals if first run
  if (!backupExists) {
    for (const file of files) {
      await copyFile(join(MODELS_DIR, file), join(BACKUP_DIR, file));
    }
  }

  console.log(`\nProcessing ${files.length} GLB files...\n`);

  const results = [];

  for (const file of files) {
    const filePath = join(MODELS_DIR, file);
    const originalSize = (await stat(filePath)).size;

    const document = await io.read(filePath);
    const root = document.getRoot();

    // --- Step 1: Strip texture IMAGE DATA but keep material names ---
    // Remove texture references from materials
    for (const material of root.listMaterials()) {
      material.setBaseColorTexture(null);
      material.setNormalTexture(null);
      material.setOcclusionTexture(null);
      material.setEmissiveTexture(null);
      material.setMetallicRoughnessTexture(null);
    }
    // Remove texture and image resources
    for (const texture of root.listTextures()) {
      texture.dispose();
    }

    // --- Step 2: Simplify ONLY legs meshes ---
    // Check if this model has over-tessellated legs
    const hasHeavyLegs = root.listMeshes().some((mesh) => {
      const name = mesh.getName().toLowerCase();
      if (!name.includes('leg')) return false;
      return mesh.listPrimitives().some((prim) => {
        const idx = prim.getIndices();
        return idx && idx.getCount() > 5000;
      });
    });

    if (hasHeavyLegs) {
      await document.transform(
        simplify({
          simplifier: MeshoptSimplifier,
          ratio: LEGS_TARGET_RATIO,
          error: 0.01,
        })
      );
    }

    // --- Step 3: Weld + dedup ---
    await document.transform(
      weld({ tolerance: 0.0001 }),
      dedup(),
    );

    // --- Step 4: Prune unused resources but KEEP vertex attributes ---
    // prune() would strip TEXCOORD_0 since no textures reference it,
    // so we only prune non-attribute resources
    await document.transform(
      prune({ keepAttributes: true }),
    );

    // --- Step 5: Reorder for GPU cache + quantize ---
    await document.transform(
      reorder({ encoder: MeshoptEncoder }),
      quantize(),
    );

    // --- Step 6: Write optimized GLB ---
    await io.write(filePath, document);

    const newSize = (await stat(filePath)).size;
    const savings = ((1 - newSize / originalSize) * 100).toFixed(1);

    results.push({
      file,
      originalBytes: originalSize,
      newBytes: newSize,
    });

    console.log(
      `  ${file.padEnd(28)} ${fmt(originalSize).padStart(8)} → ${fmt(newSize).padStart(8)}  (${savings}% smaller)`
    );
  }

  // Summary
  const totalOrig = results.reduce((s, r) => s + r.originalBytes, 0);
  const totalNew = results.reduce((s, r) => s + r.newBytes, 0);
  const totalSavings = ((1 - totalNew / totalOrig) * 100).toFixed(1);

  console.log(`\n${'─'.repeat(70)}`);
  console.log(
    `  TOTAL:${' '.repeat(20)} ${fmt(totalOrig).padStart(8)} → ${fmt(totalNew).padStart(8)}  (${totalSavings}% smaller)`
  );
  console.log(`\nOriginals backed up to: ${BACKUP_DIR}`);
}

function fmt(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

main().catch((err) => {
  console.error('Optimization failed:', err);
  process.exit(1);
});
