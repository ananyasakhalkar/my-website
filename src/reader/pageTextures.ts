import { SRGBColorSpace, TextureLoader, type Texture } from 'three';

/** Page textures baked at build time from the same React page components (scripts/bake-page-textures.mjs). */
const loader = new TextureLoader();
const cache = new Map<string, Texture>();

export function pageTexture(kind: string, n: number): Texture {
  const key = `${kind}-${String(n).padStart(2, '0')}`;
  let t = cache.get(key);
  if (!t) {
    t = loader.load(`${import.meta.env.BASE_URL}assets/pages/${key}.webp`);
    t.colorSpace = SRGBColorSpace;
    t.anisotropy = 8;
    cache.set(key, t);
  }
  return t;
}
