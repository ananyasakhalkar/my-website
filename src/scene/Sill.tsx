/**
 * Window-sill detail: a shaped sill (rounded nose, bead, apron), a turned terracotta pot for the pothos, and a few
 * small things in the gaps the open sashes leave: a glazed teacup on its saucer, a candle in a glass and a succulent.
 * Turned pieces are lathed at high resolution so their rims and glaze highlights stay smooth up close.
 */
import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';
import { InstancedMesh, LatheGeometry, Object3D, Vector2, type Mesh, type MeshStandardMaterial } from 'three';
import { WALL_DEPTH, WALL_Z, WIN, WIN_Y0 } from './constants';
import { nightMix } from './dayNight';

const FRAME = '#F2EEE6';
const SEG = 72;
const lathe = (pts: [number, number][]) => new LatheGeometry(pts.map(([x, y]) => new Vector2(x, y)), SEG);

/** Geometries made once and disposed with the component. */
function useLathes<T extends Record<string, LatheGeometry>>(make: () => T): T {
  const g = useMemo(make, []); // made once: `make` is an inline literal
  useEffect(() => () => Object.values(g).forEach((x) => x.dispose()), [g]);
  return g;
}

/** The sill board with a softened nose, a bead moulding under it and an apron against the wall. */
export function SillBoard() {
  const z = (WALL_Z - WALL_DEPTH + WALL_Z + 0.12) / 2;
  const front = WALL_Z + 0.12;
  const mat = <meshStandardMaterial color={FRAME} roughness={0.38} />;
  return (
    <group>
      <RoundedBox args={[WIN.width + 0.16, 0.04, WALL_DEPTH + 0.12]} radius={0.012} smoothness={4} position={[0, WIN_Y0 - 0.02, z]} castShadow receiveShadow>
        {mat}
      </RoundedBox>
      <mesh position={[0, WIN_Y0 - 0.044, front - 0.012]} rotation-z={Math.PI / 2}>
        <cylinderGeometry args={[0.006, 0.006, WIN.width + 0.1, 16]} />
        {mat}
      </mesh>
      <RoundedBox args={[WIN.width + 0.08, 0.075, 0.02]} radius={0.006} smoothness={3} position={[0, WIN_Y0 - 0.085, WALL_Z + 0.01]} castShadow receiveShadow>
        {mat}
      </RoundedBox>
    </group>
  );
}

/** Terracotta pot on a saucer, same footprint as before (top of the soil at y ≈ 0.107). */
export function PlantPot() {
  const g = useLathes(() => ({
    pot: lathe([
      [0, 0.004], [0.05, 0.004], [0.053, 0.008], [0.062, 0.078], [0.063, 0.084], [0.07, 0.086], [0.072, 0.09],
      [0.072, 0.108], [0.07, 0.112], [0.066, 0.112], [0.064, 0.108], [0.062, 0.104], [0.06, 0.1],
    ]),
    saucer: lathe([[0, 0], [0.07, 0], [0.078, 0.004], [0.081, 0.012], [0.078, 0.013], [0.074, 0.006], [0.066, 0.004], [0, 0.004]]),
  }));
  return (
    <group>
      <mesh geometry={g.saucer} castShadow receiveShadow>
        <meshStandardMaterial color="#A85E40" roughness={0.8} />
      </mesh>
      <mesh geometry={g.pot} castShadow receiveShadow>
        <meshStandardMaterial color="#B5694A" roughness={0.82} side={2} />
      </mesh>
      <mesh position={[0, 0.103, 0]}>
        <cylinderGeometry args={[0.06, 0.06, 0.006, SEG]} />
        <meshStandardMaterial color="#3B2A1E" roughness={1} />
      </mesh>
    </group>
  );
}

/** A glazed teacup on a matching saucer, half full. */
function Teacup() {
  const g = useLathes(() => ({
    cup: lathe([
      [0, 0.006], [0.02, 0.006], [0.022, 0.009], [0.028, 0.022], [0.033, 0.04], [0.035, 0.049], [0.0335, 0.0505],
      [0.032, 0.049], [0.0305, 0.04], [0.026, 0.024], [0.02, 0.012], [0, 0.011],
    ]),
    saucer: lathe([[0, 0], [0.03, 0], [0.042, 0.004], [0.05, 0.009], [0.0505, 0.011], [0.049, 0.0115], [0.04, 0.0065], [0.028, 0.005], [0, 0.005]]),
  }));
  const glaze = <meshPhysicalMaterial color="#F3EEE4" roughness={0.3} clearcoat={1} clearcoatRoughness={0.08} side={2} />;
  return (
    <group>
      <mesh geometry={g.saucer} castShadow receiveShadow>
        {glaze}
      </mesh>
      <group>
        <mesh geometry={g.cup} castShadow receiveShadow>
          {glaze}
        </mesh>
        {/* Painted band under the rim, the tea, and the handle */}
        <mesh position-y={0.044} rotation-x={Math.PI / 2}>
          <torusGeometry args={[0.0343, 0.0011, 8, SEG]} />
          <meshStandardMaterial color="#2F4F8A" roughness={0.35} />
        </mesh>
        <mesh position-y={0.036}>
          <cylinderGeometry args={[0.0296, 0.0296, 0.001, SEG]} />
          <meshPhysicalMaterial color="#6B3D1C" roughness={0.08} clearcoat={1} />
        </mesh>
        <mesh position={[0.037, 0.03, 0]} rotation-z={-0.15}>
          <torusGeometry args={[0.012, 0.0032, 12, 40, Math.PI * 1.25]} />
          {glaze}
        </mesh>
      </group>
    </group>
  );
}

/** A tea light in a glass: a small flame by day, a warm flicker at night (bloom does the glow). */
function Candle() {
  const g = useLathes(() => ({
    glass: lathe([[0.024, 0], [0.026, 0.002], [0.027, 0.055], [0.025, 0.056], [0.0245, 0.003], [0, 0.003]]),
  }));
  const flame = useRef<Mesh>(null);
  const mat = useRef<MeshStandardMaterial>(null);
  useFrame(({ clock }) => {
    const n = nightMix();
    const t = clock.elapsedTime;
    const f = 1 + Math.sin(t * 13) * 0.06 + Math.sin(t * 7.3) * 0.05;
    if (flame.current) flame.current.scale.set(0.004, 0.011 * f, 0.004);
    if (mat.current) mat.current.emissiveIntensity = (1.5 + n * 5) * f;
  });
  return (
    <group>
      <mesh geometry={g.glass}>
        <meshPhysicalMaterial color="#E9F1EE" transparent opacity={0.28} roughness={0.04} clearcoat={1} depthWrite={false} side={2} />
      </mesh>
      <mesh position-y={0.012} castShadow>
        <cylinderGeometry args={[0.021, 0.021, 0.018, SEG]} />
        <meshStandardMaterial color="#F4EAD6" roughness={0.6} />
      </mesh>
      <mesh position-y={0.024}>
        <cylinderGeometry args={[0.0008, 0.0008, 0.007, 6]} />
        <meshStandardMaterial color="#2a2018" />
      </mesh>
      <mesh ref={flame} position-y={0.034} scale={[0.004, 0.011, 0.004]}>
        <sphereGeometry args={[1, 16, 12]} />
        <meshStandardMaterial ref={mat} color="#FFE2A8" emissive="#FF9A3C" emissiveIntensity={1.5} />
      </mesh>
    </group>
  );
}

const RINGS = {
  outer: { r: 0.016, y: 0, tilt: 0.55, len: 0.014, w: 0.007 },
  middle: { r: 0.01, y: 0.004, tilt: 0.85, len: 0.011, w: 0.006 },
  inner: { r: 0.004, y: 0.008, tilt: 1.2, len: 0.007, w: 0.004 },
};

/** An echeveria rosette in a small white pot. */
function Succulent() {
  const g = useLathes(() => ({
    pot: lathe([[0, 0], [0.022, 0], [0.024, 0.003], [0.028, 0.045], [0.026, 0.047], [0.024, 0.042], [0, 0.04]]),
  }));
  const leaves = useRef<InstancedMesh>(null);
  const COUNT = 22;
  useEffect(() => {
    const m = leaves.current;
    if (!m) return;
    const o = new Object3D();
    for (let i = 0; i < COUNT; i++) {
      // Outer, middle and inner rings: radius, lift, tilt, length, width.
      const ring = i < 8 ? RINGS.outer : i < 15 ? RINGS.middle : RINGS.inner;
      const a = i * 2.39996;
      o.position.set(Math.cos(a) * ring.r, 0.046 + ring.y, Math.sin(a) * ring.r);
      o.rotation.set(0, -a, ring.tilt);
      o.scale.set(ring.len, 0.004, ring.w);
      o.updateMatrix();
      m.setMatrixAt(i, o.matrix);
    }
    m.instanceMatrix.needsUpdate = true;
  }, []);
  return (
    <group>
      <mesh geometry={g.pot} castShadow receiveShadow>
        <meshPhysicalMaterial color="#EFEDE8" roughness={0.4} clearcoat={0.6} />
      </mesh>
      <instancedMesh ref={leaves} args={[undefined, undefined, COUNT]} castShadow>
        <sphereGeometry args={[1, 16, 10]} />
        <meshStandardMaterial color="#8DB3A0" roughness={0.55} />
      </instancedMesh>
    </group>
  );
}

/** Small things on the sill, placed in front of the open sashes' sweep (a touch larger than life to read from the room). */
export function SillThings() {
  return (
    <group>
      <group position={[-0.53, WIN_Y0, -1.13]} scale={1.3}>
        <Candle />
      </group>
      <group position={[-0.4, WIN_Y0, -1.135]} rotation-y={0.5} scale={1.2}>
        <Teacup />
      </group>
      <group position={[0.48, WIN_Y0, -1.14]} scale={1.3}>
        <Succulent />
      </group>
    </group>
  );
}
