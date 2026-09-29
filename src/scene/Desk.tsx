import { useEffect, useMemo } from 'react';
import { ContactShadows, RoundedBox } from '@react-three/drei';
import { DESK_TOP } from './constants';
import { felt, oak } from './textures';

const W = 1.6;
const D = 0.8;
const TOP_T = 0.03;
const LEG_H = DESK_TOP - TOP_T;

/** Warm oak writing desk with a softly bevelled top, tapered legs, one shallow drawer and a felt mat. */
export function Desk() {
  const tex = useMemo(() => ({ oak: oak(), felt: felt() }), []);
  useEffect(() => {
    tex.felt.repeat.set(3, 1.7);
    return () => {
      tex.oak.map.dispose();
      tex.oak.rough.dispose();
      tex.felt.dispose();
    };
  }, [tex]);

  const wood = <meshStandardMaterial map={tex.oak.map} roughnessMap={tex.oak.rough} roughness={0.55} color="#E9D5C2" />;
  const legs: [number, number][] = [
    [-W / 2 + 0.05, -D / 2 + 0.05],
    [W / 2 - 0.05, -D / 2 + 0.05],
    [-W / 2 + 0.05, D / 2 - 0.05],
    [W / 2 - 0.05, D / 2 - 0.05],
  ];

  return (
    <group>
      <RoundedBox args={[W, TOP_T, D]} radius={0.004} smoothness={3} position={[0, DESK_TOP - TOP_T / 2, 0]} castShadow receiveShadow>
        {wood}
      </RoundedBox>
      {/* Apron and drawer front */}
      <mesh position={[0, DESK_TOP - TOP_T - 0.055, D / 2 - 0.035]} castShadow receiveShadow>
        <boxGeometry args={[W - 0.12, 0.11, 0.02]} />
        {wood}
      </mesh>
      <mesh position={[0.18, DESK_TOP - TOP_T - 0.055, D / 2 - 0.022]} castShadow>
        <boxGeometry args={[0.5, 0.075, 0.006]} />
        {wood}
      </mesh>
      <mesh position={[0.18, DESK_TOP - TOP_T - 0.055, D / 2 - 0.012]} castShadow>
        <sphereGeometry args={[0.009, 12, 8]} />
        <meshStandardMaterial color="#B08A4A" metalness={0.85} roughness={0.3} />
      </mesh>
      {legs.map(([x, z], i) => (
        <mesh key={i} position={[x, LEG_H / 2, z]} rotation={[0, Math.PI / 4, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.032, 0.02, LEG_H, 4]} />
          {wood}
        </mesh>
      ))}
      {/* Soft contact shadow grounding the desk on the floor (baked once) */}
      <ContactShadows position={[0, 0.002, 0]} scale={[2.4, 1.6]} far={0.8} blur={2.5} opacity={0.55} frames={1} resolution={256} color="#2a1a10" />
      {/* Felt mat: left of centre, clear of the spill zone (x ≥ 0.05) */}
      <mesh position={[-0.37, DESK_TOP + 0.0015, 0]} receiveShadow>
        <boxGeometry args={[0.8, 0.003, 0.45]} />
        <meshStandardMaterial map={tex.felt} roughness={1} />
      </mesh>
    </group>
  );
}
