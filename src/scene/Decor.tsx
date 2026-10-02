/**
 * The lived-in room: posters, string lights, a bookshelf of textbooks, a sleeping cat and her things, a jar of
 * fairy lights and a pen cup on the desk, and a picture light over the corkboard. Decor only: nothing here
 * carries a fact or takes a click, and the warm lights double as the room's right-hand fill (they keep the
 * coffee-stain contact details readable at night).
 */
import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';
import {
  AdditiveBlending,
  CatmullRomCurve3,
  Color,
  InstancedMesh,
  Object3D,
  TubeGeometry,
  Vector3,
  type Group,
  type MeshBasicMaterial,
  type MeshStandardMaterial,
  type PointLight,
  type Texture,
} from 'three';
import { DESK_TOP, WALL_Z } from './constants';
import { nightMix } from './dayNight';
import { canvas, seeded, toTexture } from './textures';
import { catFur, posterShield, posterTeam } from './decorTextures';
import { BOARD } from '../objects/Corkboard';
import { useRoute } from '../app/routes';

const WARM = '#FFB866';
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Small emissive bulbs; their glow (and bloom) follows day/night. */
function Bulbs({ points, size, mat }: { points: Vector3[]; size: number; mat: (m: MeshStandardMaterial | null) => void }) {
  const ref = useRef<InstancedMesh>(null);
  useEffect(() => {
    const m = ref.current;
    if (!m) return;
    const o = new Object3D();
    points.forEach((p, i) => {
      o.position.copy(p);
      o.updateMatrix();
      m.setMatrixAt(i, o.matrix);
    });
    m.instanceMatrix.needsUpdate = true;
  }, [points]);
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, points.length]} frustumCulled={false}>
      <sphereGeometry args={[size, 8, 6]} />
      <meshStandardMaterial ref={mat} color="#fff1d6" emissive={WARM} emissiveIntensity={1} toneMapped />
    </instancedMesh>
  );
}

/** Soft radial falloff shared by the light pools. */
let glowTex: Texture | null = null;
function glowTexture(): Texture {
  if (glowTex) return glowTex;
  const { c, ctx } = canvas(128, 128);
  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, '#ffffff');
  g.addColorStop(0.35, '#9a9a9a');
  g.addColorStop(0.7, '#262626');
  g.addColorStop(1, '#000000');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);
  glowTex = toTexture(c, true, false);
  return glowTex;
}

/** A pool of warm light on a wall, added on top of what's there; stronger at night. */
function Glow({ position, size, day, night, gain }: { position: [number, number, number]; size: [number, number]; day: number; night: number; gain?: () => number }) {
  const mat = useRef<MeshBasicMaterial>(null);
  const g = useRef(1);
  useFrame((_, dt) => {
    g.current += ((gain ? gain() : 1) - g.current) * Math.min(1, dt * 3);
    if (mat.current) mat.current.opacity = lerp(day, night, nightMix()) * g.current;
  });
  return (
    <mesh position={position}>
      <planeGeometry args={size} />
      <meshBasicMaterial ref={mat} map={glowTexture()} color={WARM} transparent opacity={day} blending={AdditiveBlending} depthWrite={false} toneMapped={false} />
    </mesh>
  );
}

/** Two vintage posters taped to the back wall, right of the window (original artwork, no logos). */
function Posters() {
  const tex = useMemo(() => ({ a: posterShield(), b: posterTeam() }), []);
  useEffect(() => () => [tex.a, tex.b].forEach((t) => t.dispose()), [tex]);
  const items = [
    { t: tex.a, x: 1.6, y: 1.6, w: 0.4, rot: 0.012 },
    { t: tex.b, x: 2.03, y: 1.52, w: 0.33, rot: -0.03 },
  ];
  return (
    <>
      {items.map(({ t, x, y, w, rot }, i) => {
        const h = w * (720 / 512);
        return (
          <group key={i} position={[x, y, WALL_Z + 0.004]} rotation-z={rot}>
            <mesh receiveShadow>
              <planeGeometry args={[w, h]} />
              <meshStandardMaterial map={t} roughness={0.75} />
            </mesh>
            {/* Tape on the top corners */}
            {[-1, 1].map((s) => (
              <mesh key={s} position={[s * (w / 2 - 0.01), h / 2 - 0.008, 0.001]} rotation-z={s * 0.7}>
                <planeGeometry args={[0.055, 0.018]} />
                <meshStandardMaterial color="#f3ead2" transparent opacity={0.7} roughness={0.5} />
              </mesh>
            ))}
          </group>
        );
      })}
    </>
  );
}

/** Warm string lights swagged across the wall above the posters, with a real light for the right side. */
function StringLights() {
  const mat = useRef<MeshStandardMaterial | null>(null);
  const { wire, bulbs } = useMemo(() => {
    const pts: Vector3[] = [];
    const spans: [number, number][] = [[1.36, 1.82], [1.82, 2.27]];
    for (const [a, b] of spans) {
      for (let i = 0; i <= 20; i++) {
        const t = i / 20;
        const x = lerp(a, b, t);
        pts.push(new Vector3(x, 2.06 - 0.1 * 4 * t * (1 - t), WALL_Z + 0.03));
      }
    }
    const curve = new CatmullRomCurve3(pts);
    return {
      wire: new TubeGeometry(curve, 120, 0.0025, 5, false),
      bulbs: Array.from({ length: 17 }, (_, i) => curve.getPointAt((i + 0.5) / 17).add(new Vector3(0, -0.018, 0.004))),
    };
  }, []);
  useEffect(() => () => wire.dispose(), [wire]);
  useFrame(() => {
    const n = nightMix();
    if (mat.current) mat.current.emissiveIntensity = lerp(1.2, 5, n);
  });
  return (
    <group>
      <mesh geometry={wire}>
        <meshStandardMaterial color="#2a241d" roughness={0.6} />
      </mesh>
      <Bulbs points={bulbs} size={0.011} mat={(m) => (mat.current = m)} />
      <Glow position={[1.82, 1.86, WALL_Z + 0.006]} size={[1.35, 0.8]} day={0.05} night={0.32} />
    </group>
  );
}

/** A curled-up ginger cat, asleep, breathing slowly. */
function Cat() {
  const fur = useMemo(() => catFur(), []);
  useEffect(() => () => fur.dispose(), [fur]);
  const body = useRef<Group>(null);
  const tail = useMemo(
    () =>
      new TubeGeometry(
        new CatmullRomCurve3([new Vector3(-0.12, 0.03, -0.02), new Vector3(-0.1, 0.02, 0.08), new Vector3(0.0, 0.018, 0.11), new Vector3(0.08, 0.02, 0.09)]),
        24,
        0.016,
        8,
        false,
      ),
    [],
  );
  useEffect(() => () => tail.dispose(), [tail]);
  useFrame(({ clock }) => {
    if (body.current) body.current.scale.y = 1 + Math.sin(clock.elapsedTime * 1.4) * 0.035;
  });
  const furMat = <meshStandardMaterial map={fur} roughness={0.95} />;
  return (
    <group>
      <group ref={body}>
        <mesh position={[0, 0.065, 0]} scale={[0.13, 0.072, 0.1]} castShadow receiveShadow>
          <sphereGeometry args={[1, 24, 16]} />
          {furMat}
        </mesh>
      </group>
      {/* Head resting low on its paws, facing the room */}
      <group position={[0.1, 0.07, 0.015]} rotation-z={-0.18}>
        <mesh scale={[0.95, 0.86, 1.05]} castShadow>
          <sphereGeometry args={[0.058, 24, 16]} />
          {furMat}
        </mesh>
        {[-1, 1].map((s) => (
          <group key={s} position={[-0.004, 0.047, s * 0.03]} rotation={[s * 0.32, 0, -0.08]}>
            <mesh>
              <coneGeometry args={[0.02, 0.042, 4]} />
              {furMat}
            </mesh>
            <mesh position={[0.006, -0.004, 0]} rotation-y={Math.PI / 4}>
              <coneGeometry args={[0.011, 0.028, 3]} />
              <meshStandardMaterial color="#e9a6a0" roughness={0.9} />
            </mesh>
          </group>
        ))}
        {/* Closed eyes, muzzle and a pink nose */}
        {[-1, 1].map((s) => (
          <mesh key={s} position={[0.052, 0.012, s * 0.021]} rotation={[0, Math.PI / 2, s * 0.25]}>
            <boxGeometry args={[0.016, 0.0028, 0.002]} />
            <meshStandardMaterial color="#3b2416" />
          </mesh>
        ))}
        <mesh position={[0.05, -0.016, 0]} scale={[0.7, 0.6, 1]}>
          <sphereGeometry args={[0.024, 14, 10]} />
          <meshStandardMaterial color="#f4e2c8" roughness={0.95} />
        </mesh>
        <mesh position={[0.066, -0.006, 0]}>
          <sphereGeometry args={[0.0055, 8, 6]} />
          <meshStandardMaterial color="#d97f86" />
        </mesh>
      </group>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[0.13, 0.016, 0.03 + s * 0.022]} scale={[1.6, 0.8, 1]}>
          <sphereGeometry args={[0.016, 12, 8]} />
          <meshStandardMaterial color="#f2dcc0" roughness={0.95} />
        </mesh>
      ))}
      <mesh geometry={tail} castShadow>
        {furMat}
      </mesh>
    </group>
  );
}

/** Low painted bookshelf against the back wall: textbooks, the cat asleep on a folded blanket on top. */
function Bookshelf() {
  const W = 0.8;
  const H = 0.82;
  const D = 0.3;
  const x = 1.78;
  const z = WALL_Z + D / 2;
  const paint = <meshStandardMaterial color="#EEE6D8" roughness={0.7} />;
  const books = useMemo(() => {
    const r = seeded(77);
    const cols = ['#7a2e2e', '#2e4a7a', '#3f6b4a', '#c9a24a', '#5b3d6e', '#b8613a', '#2f5f6b', '#8a8a82', '#a33b4f'];
    const out: { p: Vector3; s: Vector3; ry: number; rz: number; c: Color }[] = [];
    for (const [y0, fill] of [[0.055, 0.92], [0.43, 0.7]] as const) {
      let bx = -W / 2 + 0.04;
      const end = -W / 2 + 0.04 + (W - 0.08) * fill;
      while (bx < end) {
        const t = 0.022 + r() * 0.03;
        const h = 0.2 + r() * 0.1;
        const d = 0.17 + r() * 0.06;
        out.push({ p: new Vector3(bx + t / 2, y0 + h / 2, 0.02 - (0.2 - d) / 2), s: new Vector3(t, h, d), ry: 0, rz: 0, c: new Color(cols[Math.floor(r() * cols.length)]) });
        bx += t + 0.002;
      }
      // One leaning book at the end of the row
      out.push({ p: new Vector3(end + 0.06, y0 + 0.12, 0.01), s: new Vector3(0.03, 0.26, 0.19), ry: 0, rz: -0.32, c: new Color(cols[Math.floor(r() * cols.length)]) });
    }
    // A short stack lying flat on the top-left
    for (let i = 0; i < 3; i++) out.push({ p: new Vector3(-0.22, H + 0.018 + i * 0.034, 0.0), s: new Vector3(0.24 - i * 0.02, 0.032, 0.18 - i * 0.01), ry: (r() - 0.5) * 0.25, rz: 0, c: new Color(cols[(i * 3 + 1) % cols.length]) });
    return out;
  }, []);
  const covers = useRef<InstancedMesh>(null);
  useEffect(() => {
    const m = covers.current;
    if (!m) return;
    const o = new Object3D();
    books.forEach((b, i) => {
      o.position.copy(b.p);
      o.scale.copy(b.s);
      o.rotation.set(0, b.ry, b.rz);
      o.updateMatrix();
      m.setMatrixAt(i, o.matrix);
      m.setColorAt(i, b.c);
    });
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
  }, [books]);

  return (
    <group position={[x, 0, z]}>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[(s * (W - 0.02)) / 2, H / 2, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.02, H, D]} />
          {paint}
        </mesh>
      ))}
      {[0.04, 0.42, H - 0.01].map((y) => (
        <mesh key={y} position={[0, y, 0]} castShadow receiveShadow>
          <boxGeometry args={[W, 0.02, D]} />
          {paint}
        </mesh>
      ))}
      <mesh position={[0, H / 2, -D / 2 + 0.005]} receiveShadow>
        <boxGeometry args={[W, H, 0.01]} />
        {paint}
      </mesh>
      <instancedMesh ref={covers} args={[undefined, undefined, books.length]} castShadow receiveShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial roughness={0.7} />
      </instancedMesh>
      {/* Folded blanket and the cat on top */}
      <mesh position={[0.17, H + 0.012, 0.01]} castShadow receiveShadow>
        <boxGeometry args={[0.34, 0.024, 0.24]} />
        <meshStandardMaterial color="#9fb3c8" roughness={1} />
      </mesh>
      <group position={[0.16, H + 0.024, 0.01]} rotation-y={-1.85}>
        <Cat />
      </group>
    </group>
  );
}

/** Her things on the floor: a ball of yarn that's been batted about, the cat's bowl, a school backpack. */
function FloorThings() {
  const thread = useMemo(
    () =>
      new TubeGeometry(
        new CatmullRomCurve3([new Vector3(1.0, 0.05, -0.32), new Vector3(0.95, 0.004, -0.2), new Vector3(1.08, 0.004, -0.08), new Vector3(0.96, 0.004, 0.06), new Vector3(1.04, 0.004, 0.2)]),
        60,
        0.0025,
        5,
        false,
      ),
    [],
  );
  useEffect(() => () => thread.dispose(), [thread]);
  const yarn = '#c8475a';
  return (
    <group>
      <group position={[1.02, 0.05, -0.34]}>
        <mesh>
          <sphereGeometry args={[0.05, 20, 14]} />
          <meshStandardMaterial color={yarn} roughness={1} />
        </mesh>
        {[0, 1, 2, 3].map((i) => (
          <mesh key={i} rotation={[i * 0.9, i * 1.3, i * 0.5]}>
            <torusGeometry args={[0.05, 0.004, 6, 32]} />
            <meshStandardMaterial color="#a83548" roughness={1} />
          </mesh>
        ))}
      </group>
      <mesh geometry={thread}>
        <meshStandardMaterial color={yarn} roughness={1} />
      </mesh>
      {/* Cat bowl */}
      <group position={[1.3, 0, -0.62]}>
        <mesh position-y={0.018} receiveShadow>
          <cylinderGeometry args={[0.065, 0.055, 0.036, 28]} />
          <meshStandardMaterial color="#e8eef2" roughness={0.3} />
        </mesh>
        <mesh position-y={0.033}>
          <cylinderGeometry args={[0.052, 0.052, 0.004, 24]} />
          <meshStandardMaterial color="#8a5a34" roughness={0.9} />
        </mesh>
      </group>
      {/* School backpack leaning against the bookshelf */}
      <group position={[1.16, 0, -0.76]} rotation={[0, -0.55, -0.1]}>
        <RoundedBox args={[0.28, 0.42, 0.14]} radius={0.05} smoothness={3} position-y={0.21} castShadow receiveShadow>
          <meshStandardMaterial color="#2f5d62" roughness={0.85} />
        </RoundedBox>
        <RoundedBox args={[0.2, 0.15, 0.05]} radius={0.02} smoothness={2} position={[0, 0.12, 0.08]} castShadow>
          <meshStandardMaterial color="#e0a93b" roughness={0.8} />
        </RoundedBox>
        <mesh position={[0, 0.43, 0]}>
          <torusGeometry args={[0.03, 0.006, 6, 16, Math.PI]} />
          <meshStandardMaterial color="#1f3d40" roughness={0.8} />
        </mesh>
      </group>
    </group>
  );
}

/** A jar of fairy lights and a pen cup at the back-right of the desk (clear of the spill zone). */
function DeskThings() {
  const light = useRef<PointLight>(null);
  const mat = useRef<MeshStandardMaterial | null>(null);
  const JAR = { x: 0.725, z: 0.14, r: 0.042, h: 0.12 };
  const inside = useMemo(() => {
    const r = seeded(41);
    return Array.from({ length: 14 }, (_, i) => {
      const a = i * 2.4;
      const rad = JAR.r * (0.35 + r() * 0.5);
      return new Vector3(Math.cos(a) * rad, 0.012 + (i / 14) * (JAR.h - 0.03), Math.sin(a) * rad);
    });
  }, [JAR.r, JAR.h]);
  useFrame(() => {
    const n = nightMix();
    if (light.current) light.current.intensity = lerp(0.15, 2.4, n);
    if (mat.current) mat.current.emissiveIntensity = lerp(1.5, 6, n);
  });
  const pencils = ['#e7b62f', '#e7b62f', '#2c6fb0', '#c0392b'];
  return (
    <group>
      <group position={[JAR.x, DESK_TOP, JAR.z]}>
        <mesh position-y={JAR.h / 2}>
          <cylinderGeometry args={[JAR.r, JAR.r, JAR.h, 28, 1, true]} />
          <meshStandardMaterial color="#dfeee8" transparent opacity={0.22} roughness={0.05} depthWrite={false} side={2} />
        </mesh>
        <mesh position-y={JAR.h + 0.006}>
          <cylinderGeometry args={[JAR.r * 0.92, JAR.r * 0.92, 0.014, 24]} />
          <meshStandardMaterial color="#b58a5a" roughness={0.9} />
        </mesh>
        <Bulbs points={inside} size={0.0045} mat={(m) => (mat.current = m)} />
        <pointLight ref={light} position={[0, JAR.h * 0.6, 0.02]} color={WARM} intensity={0.15} decay={1.6} />
      </group>
      <group position={[0.72, DESK_TOP, -0.3]}>
        <mesh position-y={0.045} castShadow receiveShadow>
          <cylinderGeometry args={[0.028, 0.026, 0.09, 20]} />
          <meshStandardMaterial color="#2e2a26" roughness={0.5} />
        </mesh>
        {pencils.map((c, i) => (
          <mesh key={i} position={[Math.cos(i * 1.7) * 0.01, 0.1, Math.sin(i * 1.7) * 0.01]} rotation={[Math.sin(i * 1.7) * 0.18, 0, -Math.cos(i * 1.7) * 0.18]}>
            <cylinderGeometry args={[0.0035, 0.0035, 0.15, 6]} />
            <meshStandardMaterial color={c} roughness={0.6} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

/** Brass picture light over the corkboard: a soft wash in daylight, a pool of warm light at night. */
const boardGain = () => (useRoute.getState().route.view === 'board' ? 0.15 : 1);

function PictureLight() {
  const mat = useRef<MeshStandardMaterial>(null);
  useFrame(() => {
    if (mat.current) mat.current.emissiveIntensity = lerp(0.6, 4, nightMix());
  });
  const y = BOARD.y + BOARD.h / 2 + 0.07;
  return (
    <group>
      <mesh position={[BOARD.x, y + 0.01, WALL_Z + 0.03]} rotation-x={Math.PI / 2}>
        <cylinderGeometry args={[0.008, 0.008, 0.06, 8]} />
        <meshStandardMaterial color="#B08A4A" metalness={0.85} roughness={0.3} />
      </mesh>
      <mesh position={[BOARD.x, y, WALL_Z + 0.07]} rotation-z={Math.PI / 2}>
        <cylinderGeometry args={[0.02, 0.02, 0.4, 16, 1, false, 0, Math.PI]} />
        <meshStandardMaterial color="#B08A4A" metalness={0.85} roughness={0.3} side={2} />
      </mesh>
      <mesh position={[BOARD.x, y - 0.008, WALL_Z + 0.07]}>
        <boxGeometry args={[0.36, 0.004, 0.012]} />
        <meshStandardMaterial ref={mat} color="#fff3dd" emissive={WARM} emissiveIntensity={0.6} />
      </mesh>
      {/* The pool of light it throws over the board (an additive wash: no extra light for every surface to shade) */}
      {/* Up close it would wash out the ink, so it fades while the board is open. */}
      <Glow position={[BOARD.x, BOARD.y + 0.16, BOARD.z + 0.03]} size={[1.3, 1.0]} day={0.1} night={0.42} gain={boardGain} />
    </group>
  );
}

export function Decor() {
  return (
    <>
      <Posters />
      <StringLights />
      <Bookshelf />
      <FloorThings />
      <DeskThings />
      <PictureLight />
    </>
  );
}
