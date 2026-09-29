import { useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { AdditiveBlending, BufferAttribute, BufferGeometry, Color, ShaderMaterial, Vector3 } from 'three';
import dustVert from './shaders/dust.vert.glsl?raw';
import dustFrag from './shaders/dust.frag.glsl?raw';
import { SUN_DIR, WALL_Z, WIN_X0, WIN_X1, WIN_Y0, WIN_Y1 } from './constants';
import { seeded } from './textures';
import { dayNightUniforms } from './dayNight';
import { LAMP } from '../objects/Lamp';
import { wind, windUniforms } from './wind';
import { tierConfig } from '../app/quality';

const BOX_MIN = new Vector3(-0.7, 0.8, WALL_Z + 0.05);
const BOX_SIZE = new Vector3(1.9, 1.3, 1.45);

/** Dust motes drifting through the room, visible only where the sun reaches them. */
export function Dust() {
  const count = tierConfig.dust;
  const res = useMemo(() => {
    const r = seeded(99);
    const pos = new Float32Array(count * 3);
    const seed = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = BOX_MIN.x + r() * BOX_SIZE.x;
      pos[i * 3 + 1] = BOX_MIN.y + r() * BOX_SIZE.y;
      pos[i * 3 + 2] = BOX_MIN.z + r() * BOX_SIZE.z;
      seed[i * 3] = r();
      seed[i * 3 + 1] = r();
      seed[i * 3 + 2] = r();
    }
    const geo = new BufferGeometry();
    geo.setAttribute('position', new BufferAttribute(pos, 3));
    geo.setAttribute('aSeed', new BufferAttribute(seed, 3));
    const mat = new ShaderMaterial({
      vertexShader: dustVert,
      fragmentShader: dustFrag,
      uniforms: {
        uTime: windUniforms.uTime,
        uMotion: { value: wind.motion < 1 ? 0 : 1 }, // reduced motion: no dust drift
        uPush: { value: 0 },
        uPx: { value: 6 * Math.min(window.devicePixelRatio, tierConfig.dpr) },
        uBoxMin: { value: BOX_MIN },
        uBoxSize: { value: BOX_SIZE },
        uSunDir: { value: SUN_DIR },
        uWin: { value: [WIN_X0, WIN_X1, WIN_Y0, WIN_Y1] },
        uWallZ: { value: WALL_Z },
        uNight: dayNightUniforms.uNight,
        uLampPos: { value: LAMP.head },
        uLampDir: { value: LAMP.target.clone().sub(LAMP.head).normalize() },
        uColor: { value: new Color('#FFE2B8') },
      },
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
    });
    return { geo, mat };
  }, [count]);

  useFrame(() => {
    res.mat.uniforms.uPush!.value = wind.push;
  });

  useEffect(
    () => () => {
      res.geo.dispose();
      res.mat.dispose();
    },
    [res],
  );

  return <points geometry={res.geo} material={res.mat} frustumCulled={false} renderOrder={11} />;
}
