import { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import {
  CanvasTexture,
  CatmullRomCurve3,
  InstancedMesh,
  MathUtils,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  Object3D,
  PlaneGeometry,
  TubeGeometry,
  Vector2,
  Vector3,
  type Mesh,
  type Texture,
} from 'three';
import noise from '../scene/shaders/noise.glsl?raw';
import spillFrag from '../scene/shaders/spill.frag.glsl?raw';
import { DESK_TOP, SPILL_ZONE } from '../scene/constants';
import { seeded } from '../scene/textures';
import { MUG, TIP_DIR } from './Mug';
import { S, spillTime, useSpill } from './spillStore';
import { drawContactText, lines, TEXT_RECT, toWorld, LABEL_X, RIGHT_X } from './contactLayout';

/** Where the rim lands after the tip; the puddle spreads from here. */
export const LAND = new Vector2(MUG.x + TIP_DIR.x * 0.09, MUG.z + TIP_DIR.y * 0.09);
/** The plane the spill is drawn on (covers the zone and the mug ring). */
const PLANE = { x0: 0.0, z0: -0.08, x1: 0.68, z1: 0.4 };
const Y = DESK_TOP + 0.0005;

const smooth = (a: number, b: number, t: number) => MathUtils.smoothstep(t, a, b);

function makeSpillMaterial(text: Texture) {
  // Backlit by the window, a fully glossy puddle glares milky from the viewer's side; a lower specular
  // strength keeps a warm wet sheen while the coffee's colour reads.
  const m = new MeshPhysicalMaterial({
    transparent: true,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    envMapIntensity: 0.5,
    metalness: 0,
    specularIntensity: 0.28,
  });
  const uniforms = {
    uSpread: { value: 0 },
    uDry: { value: 0 },
    uFade: { value: 1 },
    uDevelop: { value: 0 },
    uMugRing: { value: 0 },
    uGhost: { value: 0 },
    uLand: { value: LAND },
    uCentre: { value: new Vector2((TEXT_RECT.x0 + TEXT_RECT.x1) / 2, (TEXT_RECT.z0 + TEXT_RECT.z1) / 2 + 0.005) },
    uRadii: { value: new Vector2(0.305, 0.2) },
    uMug: { value: new Vector2(MUG.x, MUG.z) },
    // Clip only where something else is: the felt mat (x < 0.04) and the desk's front edge (z = 0.40).
    uZone: { value: [SPILL_ZONE.x0 - 0.01, -0.1, 0.8, 0.398] },
    uTextRect: { value: [TEXT_RECT.x0, TEXT_RECT.z0, TEXT_RECT.x1, TEXT_RECT.z1] },
    uText: { value: text },
  };
  m.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec2 vSpill;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvSpill = (modelMatrix * vec4(transformed, 1.0)).xz;');
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>\n${noise}\n${spillFrag}`)
      .replace(
        '#include <map_fragment>',
        `float glint;
        vec4 sp = spill(vSpill, glint);
        vec4 st = stains(vSpill);
        float outA = sp.a + st.a * (1.0 - sp.a);
        if (outA < 0.003) discard;
        diffuseColor = vec4((sp.rgb * sp.a + st.rgb * st.a * (1.0 - sp.a)) / outA, outA);`,
      )
      .replace('#include <roughnessmap_fragment>', 'float roughnessFactor = mix(0.16, 0.5, uDry);')
      .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\ntotalEmissiveRadiance += vec3(1.0, 0.85, 0.65) * glint * 0.12;')
      // Keep the sun's glint crisp: an unclamped HDR highlight blooms into a haze over the close-up.
      .replace('#include <opaque_fragment>', 'outgoingLight = min(outgoingLight, vec3(2.2));\n#include <opaque_fragment>');
  };
  return { material: m, uniforms };
}

/** Pour stream: a short liquid tongue from the rim to the landing point, plus droplets. */
function Pour() {
  const res = useMemo(() => {
    const start = new Vector3(MUG.x + TIP_DIR.x * 0.06, Y + 0.035, MUG.z + TIP_DIR.y * 0.06);
    const curve = new CatmullRomCurve3([
      start,
      new Vector3(LAND.x + 0.012, Y + 0.02, LAND.y - 0.012),
      new Vector3(LAND.x, Y + 0.002, LAND.y),
    ]);
    const tube = new TubeGeometry(curve, 24, 0.006, 8, false);
    const mat = new MeshStandardMaterial({ color: '#2B170B', roughness: 0.05, envMapIntensity: 2, transparent: true });
    const r = seeded(31);
    const drops = Array.from({ length: 28 }, () => ({
      v: new Vector3(TIP_DIR.x * (0.25 + r() * 0.35) + (r() - 0.5) * 0.25, 0.25 + r() * 0.35, TIP_DIR.y * (0.25 + r() * 0.35) + (r() - 0.5) * 0.25),
      t0: S.pourStart + r() * 700,
      s: 0.0012 + r() * 0.0022,
    }));
    const dropGeo = new PlaneGeometry(1, 1);
    return { start, tube, mat, drops, dropGeo };
  }, []);
  useEffect(() => () => { res.tube.dispose(); res.mat.dispose(); res.dropGeo.dispose(); }, [res]);

  const tube = useRef<Mesh>(null);
  const inst = useRef<InstancedMesh>(null);
  const dummy = useMemo(() => new Object3D(), []);
  const camera = useThree((s) => s.camera);

  useFrame(() => {
    const t = spillTime();
    const phase = useSpill.getState().phase;
    const on = phase === 'spilling' && t > S.pourStart && t < S.pourEnd + 200;
    const idx = res.tube.index!.count;
    if (tube.current) {
      // Kept in the scene (drawing nothing when off) so its shader compiles at load, not mid-spill.
      if (!on) res.tube.setDrawRange(0, 0);
      const grow = smooth(S.pourStart, S.pourStart + 260, t);
      const drain = smooth(S.pourEnd - 350, S.pourEnd, t);
      const a = Math.floor(drain * idx / 6) * 6;
      const b = Math.floor(grow * idx / 6) * 6;
      if (on) res.tube.setDrawRange(a, Math.max(0, b - a));
      res.mat.opacity = 1 - smooth(S.pourEnd - 100, S.pourEnd + 200, t);
    }
    const m = inst.current;
    if (!m) return;
    res.drops.forEach((d, i) => {
      const u = (t - d.t0) / 1000;
      if (u < 0 || u > 0.6) {
        dummy.scale.setScalar(0);
      } else {
        const p = res.start.clone().addScaledVector(d.v, u);
        p.y -= 4.9 * u * u;
        if (p.y < Y + 0.001) {
          p.y = Y + 0.001;
          dummy.scale.setScalar(d.s * (1 - (u - 0.3) * 2));
        } else dummy.scale.setScalar(d.s * 2);
        dummy.position.copy(p);
      }
      dummy.quaternion.copy(camera.quaternion);
      dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);
    });
    m.instanceMatrix.needsUpdate = true;
  });

  return (
    <>
      <mesh ref={tube} geometry={res.tube} material={res.mat} renderOrder={13} frustumCulled={false} />
      <instancedMesh ref={inst} args={[res.dropGeo, undefined, res.drops.length]} renderOrder={13} frustumCulled={false}>
        <meshStandardMaterial color="#2B170B" roughness={0.1} envMapIntensity={2} />
      </instancedMesh>
    </>
  );
}

const corners = [new Vector3(), new Vector3(), new Vector3(), new Vector3()];
const lineRects = lines.flatMap((l) =>
  l.kind === 'item' ? [{ key: l.item.key, rect: toWorld(LABEL_X - 30, l.y + 6, RIGHT_X - LABEL_X + 60, l.h - 12) }] : [],
);

/** Positions each invisible DOM contact link exactly over its developed line (CSSOM styles only). */
function LinkProjector() {
  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size);
  useFrame(() => {
    for (const { key, rect } of lineRects) {
      const el = document.getElementById(`contact-line-${key}`);
      if (!el) continue;
      const [x0, z0, x1, z1] = rect;
      corners[0]!.set(x0, Y, z0);
      corners[1]!.set(x1, Y, z0);
      corners[2]!.set(x0, Y, z1);
      corners[3]!.set(x1, Y, z1);
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      for (const c of corners) {
        const v = c.clone().project(camera);
        const sx = (v.x * 0.5 + 0.5) * size.width;
        const sy = (-v.y * 0.5 + 0.5) * size.height;
        minX = Math.min(minX, sx);
        maxX = Math.max(maxX, sx);
        minY = Math.min(minY, sy);
        maxY = Math.max(maxY, sy);
      }
      el.style.left = `${minX.toFixed(1)}px`;
      el.style.top = `${minY.toFixed(1)}px`;
      el.style.width = `${(maxX - minX).toFixed(1)}px`;
      el.style.height = `${(maxY - minY).toFixed(1)}px`;
      el.style.fontSize = `${((maxY - minY) * 0.55).toFixed(1)}px`;
    }
  });
  return null;
}

/** The coffee puddle: spreads, develops the contact details, dries into a stain (DESK_SPEC §4.3). */
export function CoffeeSpill() {
  const [text, setText] = useState<Texture | null>(null);
  useEffect(() => {
    let tex: Texture | null = null;
    let live = true;
    void drawContactText().then((c) => {
      if (!live) return;
      tex = new CanvasTexture(c);
      tex.anisotropy = 8;
      setText(tex);
    });
    return () => {
      live = false;
      tex?.dispose();
    };
  }, []);

  const mat = useMemo(() => (text ? makeSpillMaterial(text) : null), [text]);
  useEffect(() => () => mat?.material.dispose(), [mat]);
  const geo = useMemo(() => new PlaneGeometry(PLANE.x1 - PLANE.x0, PLANE.z1 - PLANE.z0), []);
  useEffect(() => () => geo.dispose(), [geo]);

  useFrame(() => {
    if (!mat) return;
    const s = useSpill.getState();
    const t = spillTime();
    const u = mat.uniforms;
    const active = s.phase !== 'upright';
    u.uSpread.value = active ? smooth(S.spreadStart, S.spreadEnd, t) : 0;
    u.uDry.value = active ? smooth(S.dryStart, S.dryEnd, t) : 0;
    u.uDevelop.value = active ? smooth(S.developStart, S.developEnd, t) : 0;
    u.uMugRing.value = active ? smooth(S.ring, S.ring + 500, t) : 0;
    u.uFade.value = s.phase === 'refilling' ? 1 - MathUtils.clamp((performance.now() - s.t0) / S.refill, 0, 1) : 1;
    u.uGhost.value = s.stained ? 1 : 0;
  });

  return (
    <>
      {mat && (
        <mesh
          geometry={geo}
          material={mat.material}
          rotation-x={-Math.PI / 2}
          position={[(PLANE.x0 + PLANE.x1) / 2, Y, (PLANE.z0 + PLANE.z1) / 2]}
          renderOrder={3}
          receiveShadow
        />
      )}
      <Pour />
      <LinkProjector />
    </>
  );
}

