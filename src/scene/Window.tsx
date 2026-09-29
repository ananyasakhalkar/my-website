import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { CatmullRomCurve3, DoubleSide, Shape, TubeGeometry, Vector3, type Group } from 'three';
import { FRAME_Z, SASH_OPEN, WALL_DEPTH, WALL_Z, WIN, WIN_X0, WIN_X1, WIN_Y0, WIN_Y1 } from './constants';
import { wind } from './wind';
import { seeded } from './textures';
import { useRoute } from '../app/routes';
import { HitProxy } from '../objects/HitProxy';

const FRAME = '#F2EEE6';
const BAR = 0.022; // glazing bar width
const RAIL = 0.05; // sash stile/rail width
const DEPTH = 0.045;

function Bar({ x, y, w, h, d = DEPTH }: { x: number; y: number; w: number; h: number; d?: number }) {
  return (
    <mesh position={[x, y, 0]} castShadow receiveShadow>
      <boxGeometry args={[w, h, d]} />
      <meshStandardMaterial color={FRAME} roughness={0.45} />
    </mesh>
  );
}

/** One casement sash (2 × 3 panes), built from its hinge edge along +X. */
function Sash({ width, height }: { width: number; height: number }) {
  const inner = width - RAIL * 2;
  const innerH = height - RAIL * 2;
  return (
    <group>
      <Bar x={width / 2} y={RAIL / 2} w={width} h={RAIL} />
      <Bar x={width / 2} y={height - RAIL / 2} w={width} h={RAIL} />
      <Bar x={RAIL / 2} y={height / 2} w={RAIL} h={height} />
      <Bar x={width - RAIL / 2} y={height / 2} w={RAIL} h={height} />
      <Bar x={width / 2} y={height / 2} w={BAR} h={innerH} d={0.03} />
      {[1, 2].map((i) => (
        <Bar key={i} x={width / 2} y={RAIL + (innerH * i) / 3} w={inner} h={BAR} d={0.03} />
      ))}
      <mesh position={[width / 2, height / 2, 0]}>
        <planeGeometry args={[inner, innerH]} />
        <meshPhysicalMaterial
          color="#dfe8ee"
          transparent
          opacity={0.1}
          roughness={0.04}
          metalness={0}
          envMapIntensity={1.4}
          depthWrite={false}
          side={2}
        />
      </mesh>
    </group>
  );
}

/** A pothos: a leafy dome plus two vines draping over the front edge of the sill; sways with the shared wind. */
function Plant() {
  const leafShape = useMemo(() => {
    const s = new Shape();
    s.moveTo(0, 0);
    s.bezierCurveTo(0.034, 0.012, 0.04, 0.05, 0, 0.072);
    s.bezierCurveTo(-0.04, 0.05, -0.034, 0.012, 0, 0);
    return s;
  }, []);
  const vineRefs = useRef<(Group | null)[]>([]);
  const crown = useMemo(() => {
    const r = seeded(314);
    return Array.from({ length: 26 }, (_, i) => {
      const a = i * 2.39996 + r() * 0.4; // golden-angle spread
      const ring = Math.sqrt((i + 0.5) / 26);
      return { a, lift: 0.11 + (1 - ring) * 0.08 + r() * 0.02, r: 0.01 + ring * 0.045, tilt: 0.25 + ring * 0.75, s: 0.85 + r() * 0.4 };
    });
  }, []);
  // Vines: from the rim, over the sill's front edge (+Z), then hanging down in front of it.
  const vines = useMemo(
    () =>
      [-1, 1].map((side) => {
        const curve = new CatmullRomCurve3([
          new Vector3(side * 0.03, 0.1, 0.02),
          new Vector3(side * 0.05, 0.075, 0.1),
          new Vector3(side * 0.065, 0.02, 0.16),
          new Vector3(side * 0.07, -0.12, 0.175),
          new Vector3(side * 0.075, -0.3 + side * 0.04, 0.18),
        ]);
        const stem = new TubeGeometry(curve, 40, 0.0025, 5, false);
        const leaves = Array.from({ length: 8 }, (_, i) => {
          const t = 0.08 + (i / 7) * 0.9;
          return { pos: curve.getPoint(t).toArray(), a: side * 0.6 + (i % 2 ? 1.2 : -1.2), s: 0.95 - t * 0.35 };
        });
        return { stem, leaves };
      }),
    [],
  );
  useEffect(() => () => vines.forEach((v) => v.stem.dispose()), [vines]);

  // Easter egg (DESK_SPEC §4.10): a click makes the leaves shiver, and once per visit a leaf drifts down.
  const poke = useRef({ t0: -Infinity, dropped: false, dropT0: -Infinity });
  const falling = useRef<Group>(null);
  const onDesk = useRoute((s) => s.route.view === 'desk');
  const shake = () => {
    const now = performance.now();
    poke.current.t0 = now;
    if (!poke.current.dropped) {
      poke.current.dropped = true;
      poke.current.dropT0 = now;
    }
  };

  useFrame(() => {
    const sway = (0.05 + wind.gust * 0.12) * wind.motion;
    const since = (performance.now() - poke.current.t0) / 1000;
    const shiver = since < 1.2 ? Math.sin(since * 38) * 0.09 * (1 - since / 1.2) * wind.motion : 0;
    vineRefs.current.forEach((g, i) => {
      if (!g) return;
      g.rotation.x = -Math.sin(wind.time * 1.1 + i * 1.7) * sway * 0.5 - wind.gust * 0.12 * wind.motion + shiver;
      g.rotation.z = Math.sin(wind.time * 0.8 + i) * sway * 0.35 - shiver * 0.6;
    });
    // The falling leaf: flutters down from the crown onto the sill in front of the pot, then stays.
    const f = falling.current;
    if (f) {
      const u = Math.min(1, (performance.now() - poke.current.dropT0) / 2600);
      f.visible = poke.current.dropped;
      const e = 1 - (1 - u) ** 2;
      f.position.set(0.05 + Math.sin(u * 9) * 0.02 * (1 - u), 0.17 - e * 0.165, 0.03 + e * 0.07);
      f.rotation.set(-Math.PI / 2 + (1 - u) * Math.sin(u * 14) * 0.9, u * 2.2, (1 - u) * Math.cos(u * 11) * 0.7);
    }
  });

  const leafMat = (i: number) => (
    <meshStandardMaterial color={i % 3 === 0 ? '#6B9A45' : i % 3 === 1 ? '#5A8A3C' : '#4C7A34'} roughness={0.5} side={DoubleSide} />
  );

  return (
    <group>
      <mesh position={[0, 0.055, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.068, 0.052, 0.11, 28]} />
        <meshStandardMaterial color="#B5694A" roughness={0.85} />
      </mesh>
      <mesh position={[0, 0.107, 0]}>
        <cylinderGeometry args={[0.061, 0.061, 0.006, 28]} />
        <meshStandardMaterial color="#3B2A1E" roughness={1} />
      </mesh>
      <group ref={falling} visible={false}>
        <mesh scale={0.9} castShadow>
          <shapeGeometry args={[leafShape]} />
          {leafMat(1)}
        </mesh>
      </group>
      <HitProxy id="plant" size={[0.16, 0.24, 0.16]} position={[0, 0.1, 0.02]} enabled={onDesk} onActivate={shake} />
      <group ref={(g) => { vineRefs.current[0] = g; }}>
        {crown.map((l, i) => (
          <group key={i} rotation-y={l.a} position-y={l.lift}>
            <mesh position-z={l.r} rotation-x={l.tilt} scale={l.s} castShadow>
              <shapeGeometry args={[leafShape]} />
              {leafMat(i)}
            </mesh>
          </group>
        ))}
      </group>
      {vines.map((vine, v) => (
        <group key={v} ref={(g) => { vineRefs.current[v + 1] = g; }}>
          <mesh geometry={vine.stem} castShadow>
            <meshStandardMaterial color="#5B7A36" roughness={0.6} />
          </mesh>
          {vine.leaves.map((l, i) => (
            <group key={i} position={l.pos as [number, number, number]} rotation-y={l.a}>
              <mesh rotation-x={Math.PI * 0.82} scale={l.s} castShadow>
                <shapeGeometry args={[leafShape]} />
                {leafMat(i + v)}
              </mesh>
            </group>
          ))}
        </group>
      ))}
    </group>
  );
}

/** Window: frame in the reveal, two casement sashes open inward, deep sill, pothos. */
export function Window() {
  const sashW = WIN.width / 2;
  const sashH = WIN.height;
  return (
    <group>
      {/* Frame (casing) at the outer face of the reveal */}
      <group position={[0, 0, FRAME_Z]}>
        <Bar x={0} y={WIN_Y1 - 0.02} w={WIN.width} h={0.04} d={0.07} />
        <Bar x={WIN_X0 + 0.02} y={(WIN_Y0 + WIN_Y1) / 2} w={0.04} h={WIN.height} d={0.07} />
        <Bar x={WIN_X1 - 0.02} y={(WIN_Y0 + WIN_Y1) / 2} w={0.04} h={WIN.height} d={0.07} />
      </group>

      {/* Sashes hinged at the frame's sides, open inward */}
      <group position={[WIN_X0 + 0.04, WIN_Y0 + 0.01, FRAME_Z + 0.03]} rotation={[0, -SASH_OPEN, 0]}>
        <Sash width={sashW - 0.04} height={sashH - 0.05} />
      </group>
      <group position={[WIN_X1 - 0.04, WIN_Y0 + 0.01, FRAME_Z + 0.03]} rotation={[0, Math.PI + SASH_OPEN, 0]}>
        <Sash width={sashW - 0.04} height={sashH - 0.05} />
      </group>

      {/* Deep sill: runs through the reveal and protrudes into the room */}
      <mesh position={[0, WIN_Y0 - 0.02, (WALL_Z - WALL_DEPTH + WALL_Z + 0.12) / 2]} castShadow receiveShadow>
        <boxGeometry args={[WIN.width + 0.16, 0.04, WALL_DEPTH + 0.12]} />
        <meshStandardMaterial color={FRAME} roughness={0.4} />
      </mesh>

      <group position={[0.36, WIN_Y0, -1.2]}>
        <Plant />
      </group>
    </group>
  );
}
