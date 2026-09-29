import { useEffect, useMemo } from 'react';
import { AdditiveBlending, Color, PlaneGeometry, ShaderMaterial, Vector3 } from 'three';
import noise from './shaders/noise.glsl?raw';
import shaftVert from './shaders/shaft.vert.glsl?raw';
import shaftFrag from './shaders/shaft.frag.glsl?raw';
import { DESK_TOP, SUN_DIR, WALL_Z } from './constants';
import { windUniforms } from './wind';

/** Where each shaft enters (on the window plane) and how wide it is. */
const SHAFTS: { x: number; y: number; width: number; opacity: number }[] = [
  { x: -0.42, y: 1.62, width: 0.5, opacity: 0.6 },
  { x: 0.02, y: 1.38, width: 0.4, opacity: 0.5 },
  { x: 0.4, y: 1.86, width: 0.55, opacity: 0.42 },
];

/** Fake volumetric sun shafts: axis-billboarded quads with scrolling noise, brightest at the window. */
export function Shafts() {
  const res = useMemo(() => {
    const geo = new PlaneGeometry(1, 1);
    const mats = SHAFTS.map((s) => {
      const start = new Vector3(s.x, s.y, WALL_Z - 0.05);
      // Run until the shaft meets the desk top (or the floor beyond it), then fade.
      const length = Math.min((start.y - DESK_TOP) / -SUN_DIR.y, 3.2);
      return new ShaderMaterial({
        vertexShader: shaftVert,
        fragmentShader: `${noise}\n${shaftFrag}`,
        uniforms: {
          uTime: windUniforms.uTime,
          uStart: { value: start },
          uDir: { value: SUN_DIR.clone() },
          uLength: { value: length },
          uWidth: { value: s.width },
          uOpacity: { value: s.opacity },
          uColor: { value: new Color('#FFD9A8') },
        },
        transparent: true,
        depthWrite: false,
        blending: AdditiveBlending,
      });
    });
    return { geo, mats };
  }, []);

  useEffect(
    () => () => {
      res.geo.dispose();
      res.mats.forEach((m) => m.dispose());
    },
    [res],
  );

  return (
    <group>
      {res.mats.map((m, i) => (
        <mesh key={i} geometry={res.geo} material={m} frustumCulled={false} renderOrder={10} />
      ))}
    </group>
  );
}
