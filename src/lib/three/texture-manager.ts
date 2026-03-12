import * as THREE from 'three';
import { TEXTURE_CACHE_SIZE } from '@/lib/config/constants';

/**
 * Singleton texture loader with LRU eviction.
 * All 16 modules share the same fabric texture — changing colour swaps 2 files (~400KB)
 * instead of reloading 16 GLBs.
 */
class TextureManager {
  private loader = new THREE.TextureLoader();
  private cache = new Map<string, THREE.Texture>();
  private accessOrder: string[] = [];

  load(path: string): Promise<THREE.Texture> {
    const cached = this.cache.get(path);
    if (cached) {
      this.touch(path);
      return Promise.resolve(cached);
    }

    return new Promise((resolve, reject) => {
      this.loader.load(
        path,
        (texture) => {
          texture.colorSpace = THREE.SRGBColorSpace;
          // GLB-embedded UVs expect flipY=false; standalone images (JPG/PNG) need flipY=true
          // Textures from /textures/shopify/ or /textures/cord/ are standalone files
          const isStandalone = path.includes('/textures/');
          texture.flipY = isStandalone;
          texture.wrapS = THREE.RepeatWrapping;
          texture.wrapT = THREE.RepeatWrapping;
          this.put(path, texture);
          resolve(texture);
        },
        undefined,
        reject
      );
    });
  }

  getSync(path: string): THREE.Texture | undefined {
    const cached = this.cache.get(path);
    if (cached) this.touch(path);
    return cached;
  }

  private put(key: string, texture: THREE.Texture): void {
    if (this.cache.size >= TEXTURE_CACHE_SIZE) {
      this.evict();
    }
    this.cache.set(key, texture);
    this.accessOrder.push(key);
  }

  private touch(key: string): void {
    this.accessOrder = this.accessOrder.filter((k) => k !== key);
    this.accessOrder.push(key);
  }

  private evict(): void {
    const oldest = this.accessOrder.shift();
    if (oldest) {
      const texture = this.cache.get(oldest);
      texture?.dispose();
      this.cache.delete(oldest);
    }
  }

  dispose(): void {
    for (const texture of this.cache.values()) {
      texture.dispose();
    }
    this.cache.clear();
    this.accessOrder = [];
  }
}

export const textureManager = new TextureManager();
