import { useEffect, useMemo, useRef, useState, type MutableRefObject } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import {
  CanvasTexture,
  CubicBezierCurve3,
  LatheGeometry,
  MathUtils,
  PlaneGeometry,
  Quaternion,
  ShaderMaterial,
  SRGBColorSpace,
  TubeGeometry,
  Vector2,
  Vector3,
  type Group,
  type Texture,
} from 'three';
import noise from '../scene/shaders/noise.glsl?raw';
import steamVert from '../scene/shaders/steam.vert.glsl?raw';
import steamFrag from '../scene/shaders/steam.frag.glsl?raw';
import { DESK_TOP } from '../scene/constants';
import { seeded } from '../scene/textures';
import { wind, windUniforms } from '../scene/wind';
import { navigate, useRoute } from '../app/routes';
import { useDesk } from '../app/store';
import { HitProxy } from './HitProxy';
import { registerTag } from '../ui/ObjectTag';
import { S, refill, spillTime, useSpill } from './spillStore';

/** Mug placement (DESK_SPEC §4.0) and the direction it tips: toward the empty spill zone (front-left). */
export const MUG = { x: 0.6, z: 0.0, r: 0.041, h: 0.09 };
export const TIP_DIR = new Vector2(-1, 1).normalize();
const TIP_AXIS = new Vector3(TIP_DIR.y, 0, -TIP_DIR.x).normalize(); // cross(up, dir)
const PIVOT = new Vector3(TIP_DIR.x * MUG.r, 0, TIP_DIR.y * MUG.r);
const TIPPED = MathUtils.degToRad(96);

const easeIn = (t: number) => t ** 2.2;
const outBack = (t: number, s = 1.4) => 1 + (s + 1) * (t - 1) ** 3 + s * (t - 1) ** 2;

/** Tip angle (radians) along the spill / refill timelines. */
function tipAngle(): number {
  const s = useSpill.getState();
  if (s.phase === 'upright') return 0;
  if (s.phase === 'refilling') {
    const u = MathUtils.clamp((performance.now() - s.t0) / 600, 0, 1);
    return TIPPED * (1 - outBack(u));
  }
  const t = spillTime();
  if (t < S.tipStart) return MathUtils.degToRad(6) * Math.abs(Math.sin((t / S.anticipation) * Math.PI * 2)); // rocks twice
  if (t < S.tipEnd) return TIPPED * easeIn((t - S.tipStart) / (S.tipEnd - S.tipStart));
  const b = (t - S.tipEnd) / 180;
  return b < 1 ? TIPPED - MathUtils.degToRad(5) * Math.sin(Math.PI * b) : TIPPED; // clink + bounce
}

/** "collaborate" printed around the mug in a lowercase, slightly imperfect serif. */
async function mugLabel(word: string): Promise<Texture> {
  try {
    await document.fonts.load('italic 400 150px Newsreader');
  } catch {
    // generic serif fallback
  }
  const c = document.createElement('canvas');
  c.width = 2048;
  c.height = 256;
  const ctx = c.getContext('2d')!;
  const r = seeded(9);
  ctx.font = 'italic 400 150px Newsreader, Georgia, serif';
  ctx.fillStyle = '#3A2A20';
  ctx.textBaseline = 'alphabetic';
  const total = ctx.measureText(word).width;
  let x = 1024 - total / 2;
  for (const ch of word) {
    ctx.save();
    ctx.translate(x, 170 + (r() - 0.5) * 6);
    ctx.rotate((r() - 0.5) * 0.05);
    ctx.globalAlpha = 0.86 + r() * 0.14;
    ctx.fillText(ch, 0, 0);
    ctx.restore();
    x += ctx.measureText(ch).width;
  }
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

function Steam({ intensity }: { intensity: MutableRefObject<number> }) {
  const camera = useThree((s) => s.camera);
  const group = useRef<Group>(null);
  const res = useMemo(() => {
    const geo = new PlaneGeometry(0.028, 0.14, 1, 20).translate(0, 0.07, 0);
    const mats = [0, 1, 2].map(
      (i) =>
        new ShaderMaterial({
          vertexShader: steamVert,
          fragmentShader: `${noise}\n${steamFrag}`,
          uniforms: { ...windUniforms, uSeed: { value: i * 1.7 + 0.3 }, uIntensity: { value: 1 } },
          transparent: true,
          depthWrite: false,
        }),
    );
    return { geo, mats };
  }, []);
  useEffect(() => () => { res.geo.dispose(); res.mats.forEach((m) => m.dispose()); }, [res]);

  useFrame(() => {
    const g = group.current;
    if (!g) return;
    // Billboard around the vertical axis.
    g.rotation.y = Math.atan2(camera.position.x - MUG.x, camera.position.z - MUG.z);
    const visible = useSpill.getState().phase === 'upright';
    res.mats.forEach((m) => (m.uniforms.uIntensity!.value = visible ? intensity.current : 0));
  });

  return (
    <group ref={group} position={[0, MUG.h - 0.006, 0]}>
      {res.mats.map((m, i) => (
        <mesh key={i} geometry={res.geo} material={m} position={[(i - 1) * 0.012, 0, (i % 2) * 0.006]} renderOrder={12} />
      ))}
    </group>
  );
}

/** The "collaborate" mug: steam, hover wobble, and the tip that starts the spill (DESK_SPEC §4.3). */
export function Mug() {
  const route = useRoute((s) => s.route);
  const hovered = useDesk((s) => s.hovered === 'mug');
  const phase = useSpill((s) => s.phase);
  const onDesk = route.view === 'desk';

  const geo = useMemo(() => {
    const p = [
      [0.0, 0.008],
      [0.036, 0.008],
      [0.036, 0.086],
      [0.0368, 0.0893],
      [0.0386, 0.0904],
      [0.0404, 0.0897],
      [0.041, 0.088],
      [0.041, 0.012],
      [0.039, 0.004],
      [0.035, 0.0],
      [0.0, 0.0],
    ].map(([x, y]) => new Vector2(x, y));
    const body = new LatheGeometry(p, 64);
    const handle = new TubeGeometry(
      new CubicBezierCurve3(new Vector3(0.039, 0.07, 0), new Vector3(0.079, 0.074, 0), new Vector3(0.079, 0.02, 0), new Vector3(0.039, 0.024, 0)),
      32,
      0.0055,
      12,
      false,
    );
    return { body, handle };
  }, []);
  useEffect(() => () => { geo.body.dispose(); geo.handle.dispose(); }, [geo]);

  const [label, setLabel] = useState<Texture | null>(null);
  useEffect(() => {
    let tex: Texture | null = null;
    let live = true;
    void mugLabel('collaborate').then((t) => {
      if (!live) return t.dispose();
      tex = t;
      setLabel(t);
    });
    return () => {
      live = false;
      tex?.dispose();
    };
  }, []);

  const root = useRef<Group>(null);
  const pivot = useRef<Group>(null);
  const coffee = useRef<Group>(null);
  const steamIntensity = useRef(1);
  useEffect(() => (root.current ? registerTag('mug', "☕ let's talk?", root.current, [0, 0.16, 0]) : undefined), []);

  useFrame(() => {
    const p = pivot.current;
    if (!p) return;
    p.quaternion.setFromAxisAngle(TIP_AXIS, tipAngle());
    // Hover wobble (1.5°) and doubled steam.
    const hov = hovered && onDesk && phase === 'upright';
    if (hov) p.quaternion.multiply(tmpQ.setFromAxisAngle(TIP_AXIS, MathUtils.degToRad(1.5) * Math.sin(wind.time * 9)));
    steamIntensity.current += ((hov ? 2 : 1) - steamIntensity.current) * 0.1;
    // Coffee surface: empties as the mug tips, rises again on refill.
    const c = coffee.current;
    if (c) {
      const s = useSpill.getState();
      let level = 1;
      if (s.phase === 'spilling' || s.phase === 'spilled') level = 1 - MathUtils.clamp((spillTime() - S.tipStart) / 400, 0, 1);
      else if (s.phase === 'refilling') level = MathUtils.clamp((performance.now() - s.t0 - 350) / 600, 0, 1);
      c.visible = level > 0.02;
      c.position.y = MathUtils.lerp(0.02, 0.078, level);
    }
  });

  const activate = () => {
    if (useSpill.getState().phase === 'upright') navigate({ view: 'contact' });
    else refill();
  };

  return (
    <group ref={root} position={[MUG.x, DESK_TOP, MUG.z]}>
      {/* Tip about the base edge nearest the spill zone. */}
      <group position={PIVOT.toArray()}>
        <group ref={pivot}>
          <group position={PIVOT.clone().negate().toArray()}>
            <mesh geometry={geo.body} castShadow receiveShadow>
              <meshPhysicalMaterial color="#EFE6D6" roughness={0.28} clearcoat={0.6} clearcoatRoughness={0.2} side={2} />
            </mesh>
            <mesh geometry={geo.handle} rotation-y={Math.PI / 4} castShadow>
              <meshPhysicalMaterial color="#EFE6D6" roughness={0.28} clearcoat={0.6} clearcoatRoughness={0.2} />
            </mesh>
            {/* Printed word, facing the camera (+Z) */}
            <mesh position-y={0.052} rotation-y={Math.PI} visible={!!label}>
              <cylinderGeometry args={[MUG.r + 0.0004, MUG.r + 0.0004, 0.034, 96, 1, true]} />
              <meshStandardMaterial key={label ? 'tex' : 'none'} map={label} transparent roughness={0.3} depthWrite={false} polygonOffset polygonOffsetFactor={-2} />
            </mesh>
            {/* Coffee with a faint crema ring */}
            <group ref={coffee} position-y={0.078}>
              <mesh rotation-x={-Math.PI / 2}>
                <circleGeometry args={[0.0357, 48]} />
                <meshStandardMaterial color="#2A170C" roughness={0.05} envMapIntensity={1.6} />
              </mesh>
              <mesh rotation-x={-Math.PI / 2} position-y={0.0003}>
                <ringGeometry args={[0.03, 0.0357, 48]} />
                <meshStandardMaterial color="#8A5A32" roughness={0.3} transparent opacity={0.55} depthWrite={false} />
              </mesh>
            </group>
          </group>
        </group>
      </group>
      <Steam intensity={steamIntensity} />
      <HitProxy id="mug" size={[0.1, 0.1, 0.1]} position={[0, 0.05, 0]} enabled={onDesk || route.view === 'contact'} onActivate={activate} />
    </group>
  );
}

const tmpQ = new Quaternion();
