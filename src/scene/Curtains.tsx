import { useEffect, useMemo } from 'react';
import { Color, DoubleSide, MeshStandardMaterial, PlaneGeometry } from 'three';
import noise from './shaders/noise.glsl?raw';
import curtainVert from './shaders/curtain.vert.glsl?raw';
import { CURTAIN, SUN_COLOR, SUN_DIR, WIN_X0, WIN_X1, WIN_Y0, WIN_Y1 } from './constants';
import { linen } from './textures';
import { windUniforms } from './wind';
import { tierConfig } from '../app/quality';

/**
 * Sheer linen panel. Displacement, normals and back-lit translucency are injected into MeshStandardMaterial,
 * so the fabric is lit by the same sun, sky and environment as the rest of the room.
 */
function makeCurtainMaterial(innerEdge: 0 | 1, phase: number, map: ReturnType<typeof linen>) {
  const m = new MeshStandardMaterial({
    color: '#F4EEE2',
    map,
    roughness: 0.92,
    side: DoubleSide,
    transparent: true,
    opacity: 0.72,
  });
  const uniforms = {
    ...windUniforms,
    uSize: { value: [CURTAIN.width, CURTAIN.height] },
    uInnerEdge: { value: innerEdge },
    uInnerEdgeSide: { value: innerEdge === 1 ? 0 : 1 },
    uPhase: { value: phase },
    uSunDir: { value: SUN_DIR.clone() },
    uSunColor: { value: new Color(SUN_COLOR) },
    uSunAmount: { value: 1 },
    uWin: { value: [WIN_X0, WIN_X1, WIN_Y0, WIN_Y1] },
  };
  m.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', `#include <common>\n${noise}\n${curtainVert}`)
      .replace(
        '#include <beginnormal_vertex>',
        `vec2 cUv = position.xy / uSize + 0.5;
        vec3 cPos = curtainPos(cUv);
        vec3 cPx = curtainPos(cUv + vec2(0.004, 0.0));
        vec3 cPy = curtainPos(cUv + vec2(0.0, 0.004));
        vec3 objectNormal = normalize(cross(cPx - cPos, cPy - cPos));
        #ifdef USE_TANGENT
          vec3 objectTangent = vec3(tangent.xyz);
        #endif`,
      )
      .replace(
        '#include <begin_vertex>',
        `vec3 transformed = cPos;
        vCWorld = (modelMatrix * vec4(cPos, 1.0)).xyz;`,
      );
    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>
        uniform vec3 uSunDir;
        uniform vec3 uSunColor;
        uniform float uSunAmount;
        uniform vec4 uWin;
        varying vec3 vCWorld;`,
      )
      .replace(
        '#include <emissivemap_fragment>',
        `#include <emissivemap_fragment>
        {
          // Back-lit translucency: the sun behind the fabric makes it glow.
          vec3 toSun = normalize((viewMatrix * vec4(-uSunDir, 0.0)).xyz);
          float back = max(0.0, -dot(normal, toSun));
          // Skylight through the fabric where it hangs in front of the window opening.
          float e = 0.12;
          float overWin = smoothstep(uWin.x - e, uWin.x + e, vCWorld.x) * (1.0 - smoothstep(uWin.y - e, uWin.y + e, vCWorld.x))
                        * smoothstep(uWin.z - e, uWin.z + e, vCWorld.y) * (1.0 - smoothstep(uWin.w - e, uWin.w + e, vCWorld.y));
          totalEmissiveRadiance += diffuseColor.rgb * uSunColor * uSunAmount * (back * 0.9 + overWin * 0.85);
        }`,
      );
  };
  return m;
}

export function Curtains() {
  const [sx, sy] = tierConfig.curtainSeg;
  const res = useMemo(() => {
    const map = linen();
    map.repeat.set(CURTAIN.width * 22, CURTAIN.height * 22);
    const geo = new PlaneGeometry(CURTAIN.width, CURTAIN.height, sx, sy);
    return {
      map,
      geo,
      left: makeCurtainMaterial(1, 0.0, map),
      right: makeCurtainMaterial(0, 2.1, map),
    };
  }, [sx, sy]);

  useEffect(
    () => () => {
      res.geo.dispose();
      res.map.dispose();
      res.left.dispose();
      res.right.dispose();
    },
    [res],
  );

  const y = CURTAIN.rodY - CURTAIN.height / 2 - 0.03;
  const x = CURTAIN.gapX + CURTAIN.width / 2;
  const rodLen = (CURTAIN.gapX + CURTAIN.width) * 2 + 0.2;
  return (
    <group>
      {/* Thin brass rod with finials */}
      <mesh position={[0, CURTAIN.rodY, CURTAIN.z]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.009, 0.009, rodLen, 12]} />
        <meshStandardMaterial color="#B08A4A" metalness={0.9} roughness={0.3} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[(s * rodLen) / 2, CURTAIN.rodY, CURTAIN.z]}>
          <sphereGeometry args={[0.018, 16, 12]} />
          <meshStandardMaterial color="#B08A4A" metalness={0.9} roughness={0.3} />
        </mesh>
      ))}
      <mesh geometry={res.geo} material={res.left} position={[-x, y, CURTAIN.z]} frustumCulled={false} />
      <mesh geometry={res.geo} material={res.right} position={[x, y, CURTAIN.z]} frustumCulled={false} />
    </group>
  );
}
