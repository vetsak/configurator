#!/usr/bin/env tsx
/**
 * Optimize textures: convert to WebP, resize to standard sizes.
 *
 * Usage: pnpm tsx scripts/optimize-textures.ts
 *
 * Reads from: raw-assets/textures/
 * Outputs to: public/textures/
 */
import sharp from 'sharp';
import { join, basename, dirname, extname } from 'path';
import { readdirSync, mkdirSync, existsSync } from 'fs';

const RAW_DIR = join(process.cwd(), 'raw-assets', 'textures');
const OUT_DIR = join(process.cwd(), 'public', 'textures');

const SIZES = {
  diffuse: { width: 1024, height: 1024, quality: 80 },
  normal: { width: 1024, height: 1024, quality: 85 },
  swatch: { width: 64, height: 64, quality: 75 },
};

function walkDir(dir: string): string[] {
  const results: string[] = [];
  if (!existsSync(dir)) return results;

  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...walkDir(fullPath));
    } else if (/\.(jpg|jpeg|png|tiff|tga|bmp)$/i.test(entry.name)) {
      results.push(fullPath);
    }
  }
  return results;
}

function getSizeConfig(filename: string) {
  const lower = filename.toLowerCase();
  if (lower.includes('normal') || lower.includes('nrm')) return SIZES.normal;
  if (lower.includes('swatch') || lower.includes('thumb')) return SIZES.swatch;
  return SIZES.diffuse;
}

async function main() {
  if (!existsSync(RAW_DIR)) {
    console.log('No raw-assets/textures/ directory found. Creating placeholder...');
    mkdirSync(RAW_DIR, { recursive: true });
    console.log('Place your texture files in raw-assets/textures/ and re-run.');
    return;
  }

  const files = walkDir(RAW_DIR);
  if (files.length === 0) {
    console.log('No image files found in raw-assets/textures/');
    return;
  }

  for (const file of files) {
    const relativePath = file.replace(RAW_DIR, '');
    const outputDir = join(OUT_DIR, dirname(relativePath));
    const outputName = basename(file, extname(file)) + '.webp';
    const outputPath = join(outputDir, outputName);

    mkdirSync(outputDir, { recursive: true });

    const sizeConfig = getSizeConfig(basename(file));
    console.log(`Processing: ${relativePath} → ${sizeConfig.width}x${sizeConfig.height}`);

    await sharp(file)
      .resize(sizeConfig.width, sizeConfig.height, { fit: 'cover' })
      .webp({ quality: sizeConfig.quality })
      .toFile(outputPath);

    console.log(`  → ${outputPath}`);
  }

  console.log('\nDone! All textures optimized and saved to public/textures/');
}

main().catch(console.error);
