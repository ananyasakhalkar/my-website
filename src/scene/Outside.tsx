import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Color, ShaderMaterial, Vector3, type Mesh } from 'three';
import skyVert from './shaders/sky.vert.glsl?raw';
import skyFrag from './shaders/sky.frag.glsl?raw';
import { foliage, rooftops } from './textures';
import { wind } from './wind';

/** A hazy tree line along the horizon plus one nearer canopy overhanging from the left. */
const TREES: { x: number; y: number; z: number; h: number; seed: number; warm: boolean; haze: number }[] = [
  ...Array.from({ length: 9 }, (_, i) => ({
    x: -16 + i * 4 + (i % 2) * 1.3,
    y: 0.2 + (i % 3) * 0.5,
    z: -24 - (i % 2) * 2,
    h: 5.5 + (i % 3) * 1.2,
    seed: 3 + i * 7,
    warm: false,
    haze: 0.62,
  })),
  { x: -4.6, y: 5.2, z: -7, h: 7, seed: 5, warm: true, haze: 0.18 },
];
const HAZE = new Color('#F2DCC2');

/** Soft, out-of-focus late-afternoon world beyond the window (not a set piece). */
export function Outside() {
  const res = useMemo(() => {
    const sky = new ShaderMaterial({
      vertexShader: skyVert,
      fragmentShader: skyFrag,
      uniforms: {
        uTop: { value: new Color('#8FBDEB').multiplyScalar(1.15) },
        uHorizon: { value: new Color('#FFB27A').multiplyScalar(1.25) },
        uGlow: { value: new Color('#FFB066') },
        uSunPos: { value: new Vector3(-14, 7, -30) },
      },
      depthWrite: false,
    });
    const trees = TREES.map((t) => foliage(t.seed, t.warm));
    const roofs = rooftops();
    return { sky, trees, roofs };
  }, []);
  const treeRefs = useRef<(Mesh | null)[]>([]);

  useFrame(() => {
    const t = wind.time;
    treeRefs.current.forEach((m, i) => {
      if (m) m.rotation.z = (Math.sin(t * 0.55 + i * 1.3) * 0.012 + wind.gust * 0.02) * wind.motion;
    });
  });

  useEffect(
    () => () => {
      res.sky.dispose();
      res.trees.forEach((t) => t.dispose());
      res.roofs.dispose();
    },
    [res],
  );

  return (
    <group>
      <mesh position={[0, 6, -32]} material={res.sky} renderOrder={-10}>
        <planeGeometry args={[120, 60]} />
      </mesh>
      <mesh position={[0, 0.3, -21]} renderOrder={-9}>
        <planeGeometry args={[60, 15]} />
        <meshBasicMaterial map={res.roofs} transparent depthWrite={false} color="#F4C9A8" />
      </mesh>
      {TREES.map((t, i) => (
        <group key={i} position={[t.x, t.y, t.z]}>
          <mesh ref={(m) => { treeRefs.current[i] = m; }} renderOrder={-8 + i}>
            <planeGeometry args={[t.h * 0.95, t.h]} />
            <meshBasicMaterial
              map={res.trees[i]}
              transparent
              depthWrite={false}
              color={new Color('#ffffff').lerp(HAZE, t.haze)}
            />
          </mesh>
        </group>
      ))}
      {/* Hedge line below the sill, catching the low sun */}
      <mesh position={[0, -1.6, -6]} renderOrder={-7}>
        <planeGeometry args={[30, 4]} />
        <meshBasicMaterial color="#A7A565" />
      </mesh>
    </group>
  );
}
