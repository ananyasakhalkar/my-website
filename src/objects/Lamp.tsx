import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Object3D, Quaternion, Vector3, type Group, type MeshStandardMaterial, type SpotLight } from 'three';
import { useRoute } from '../app/routes';
import { DESK_TOP } from '../scene/constants';
import { nightMix, useDayNight } from '../scene/dayNight';
import { tierConfig } from '../app/quality';
import { HitProxy } from './HitProxy';
import { registerTag } from '../ui/ObjectTag';

/** Desk lamp placement (DESK_SPEC §4.0) and where its shade points. */
export const LAMP = {
  base: new Vector3(-0.66, DESK_TOP, -0.28),
  elbow: new Vector3(-0.63, DESK_TOP + 0.34, -0.31),
  head: new Vector3(-0.5, DESK_TOP + 0.4, -0.17),
  target: new Vector3(-0.3, DESK_TOP, 0.02),
};
const BRASS = '#B08A4A';
const UP = new Vector3(0, 1, 0);

/** A cylinder spanning two points. */
function Segment({ a, b, r, color }: { a: Vector3; b: Vector3; r: number; color: string }) {
  const { pos, quat, len } = useMemo(() => {
    const d = b.clone().sub(a);
    return { pos: a.clone().add(b).multiplyScalar(0.5), quat: new Quaternion().setFromUnitVectors(UP, d.clone().normalize()), len: d.length() };
  }, [a, b]);
  return (
    <mesh position={pos} quaternion={quat} castShadow>
      <cylinderGeometry args={[r, r, len, 12]} />
      <meshStandardMaterial color={color} metalness={0.85} roughness={0.3} />
    </mesh>
  );
}

/** The desk lamp: switches the room between golden hour and night (DESK_SPEC §4.9). */
export function Lamp() {
  const route = useRoute((s) => s.route);
  const onDesk = route.view === 'desk';
  const toggle = useDayNight((s) => s.toggle);
  const spot = useRef<SpotLight>(null);
  const bulb = useRef<MeshStandardMaterial>(null);
  const root = useRef<Group>(null);
  const target = useMemo(() => {
    const o = new Object3D();
    o.position.copy(LAMP.target);
    return o;
  }, []);
  const shadeQ = useMemo(() => new Quaternion().setFromUnitVectors(new Vector3(0, -1, 0), LAMP.target.clone().sub(LAMP.head).normalize()), []);
  useEffect(() => (root.current ? registerTag('lamp', 'desk lamp ✦', root.current, [0, 0.5, 0]) : undefined), []);

  useFrame(() => {
    const n = nightMix();
    if (spot.current) spot.current.intensity = n * 9;
    if (bulb.current) bulb.current.emissiveIntensity = 0.15 + n * 7;
  });

  return (
    <group>
      <group ref={root} position={LAMP.base}>
        <mesh position-y={0.01} castShadow receiveShadow>
          <cylinderGeometry args={[0.065, 0.072, 0.02, 32]} />
          <meshStandardMaterial color="#17171a" roughness={0.35} metalness={0.3} />
        </mesh>
        <HitProxy id="lamp" size={[0.16, 0.46, 0.16]} position={[0.06, 0.23, 0.05]} enabled={onDesk} onActivate={toggle} />
      </group>
      <Segment a={LAMP.base.clone().setY(DESK_TOP + 0.02)} b={LAMP.elbow} r={0.0065} color={BRASS} />
      <Segment a={LAMP.elbow} b={LAMP.head} r={0.0055} color={BRASS} />
      {/* Spring hint along the lower arm */}
      <Segment a={LAMP.base.clone().setY(DESK_TOP + 0.08).add(new Vector3(0.012, 0, 0))} b={LAMP.elbow.clone().add(new Vector3(0.012, -0.06, 0))} r={0.0022} color="#8f8f94" />
      <mesh position={LAMP.elbow} castShadow>
        <sphereGeometry args={[0.012, 16, 12]} />
        <meshStandardMaterial color="#17171a" roughness={0.35} />
      </mesh>
      <group position={LAMP.head} quaternion={shadeQ}>
        <mesh position-y={-0.035} castShadow>
          <cylinderGeometry args={[0.018, 0.06, 0.08, 32, 1, true]} />
          <meshStandardMaterial color="#17171a" roughness={0.4} metalness={0.3} side={2} />
        </mesh>
        <mesh position-y={-0.045}>
          <sphereGeometry args={[0.018, 16, 12]} />
          <meshStandardMaterial ref={bulb} color="#fff4e0" emissive="#FFB870" emissiveIntensity={0.15} />
        </mesh>
      </group>
      <primitive object={target} />
      <spotLight
        ref={spot}
        position={LAMP.head}
        target={target}
        color="#FFB870"
        intensity={0}
        angle={0.62}
        penumbra={0.75}
        decay={1.6}
        castShadow={tierConfig.shadowMap >= 2048}
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0004}
      />
    </group>
  );
}
