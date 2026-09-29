import { useEffect, useRef } from 'react';
import { Environment, Lightformer } from '@react-three/drei';
import type { DirectionalLight } from 'three';
import { SUN_COLOR, SUN_DIR } from './constants';
import { tierConfig } from '../app/quality';

const TARGET: [number, number, number] = [0.05, 0.76, -0.25];

/** Golden-hour key light through the window, cool sky fill, and a procedural (network-free) environment. */
export function Lighting() {
  const sun = useRef<DirectionalLight>(null);

  useEffect(() => {
    const l = sun.current;
    if (!l) return;
    l.target.position.set(...TARGET);
    l.target.updateMatrixWorld();
    const cam = l.shadow.camera;
    cam.left = -1.9;
    cam.right = 1.9;
    cam.top = 1.9;
    cam.bottom = -1.9;
    cam.near = 0.5;
    cam.far = 12;
    cam.updateProjectionMatrix();
  }, []);

  const pos: [number, number, number] = [
    TARGET[0] - SUN_DIR.x * 6,
    TARGET[1] - SUN_DIR.y * 6,
    TARGET[2] - SUN_DIR.z * 6,
  ];

  return (
    <>
      <directionalLight
        ref={sun}
        position={pos}
        color={SUN_COLOR}
        intensity={6.2}
        castShadow
        shadow-mapSize={[tierConfig.shadowMap, tierConfig.shadowMap]}
        shadow-bias={-0.0003}
        shadow-normalBias={0.015}
      />
      <hemisphereLight args={['#C9DDF5', '#8A6448', 1.0]} />
      {/* Warm bounce from the sunlit desk and floor, aimed upward so it lifts the walls but not the desk top */}
      <directionalLight position={[0.4, -1.5, 2.5]} color="#FFC08A" intensity={1.1} />
      <Environment resolution={64} environmentIntensity={0.85}>
        {/* The window: bright sky, warm toward the sun side */}
        <Lightformer form="rect" intensity={2.2} color="#DCE8F6" position={[0, 1.7, -3]} scale={[3, 2, 1]} />
        <Lightformer form="rect" intensity={2.5} color="#FFD6A0" position={[-2.5, 1.2, -2.5]} scale={[2, 1.5, 1]} target={[0, 1, 0]} />
        {/* Warm bounce from the sunlit desk and floor */}
        <Lightformer form="rect" intensity={0.7} color="#E8B98A" position={[0, -1.5, 0]} rotation-x={Math.PI / 2} scale={[6, 6, 1]} />
        {/* Dim room behind the viewer */}
        <Lightformer form="rect" intensity={0.25} color="#EADFCF" position={[0, 1.5, 4]} rotation-y={Math.PI} scale={[6, 3, 1]} />
      </Environment>
    </>
  );
}
