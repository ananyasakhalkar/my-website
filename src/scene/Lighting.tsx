import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Color, type HemisphereLight } from 'three';
import { Environment, Lightformer } from '@react-three/drei';
import type { DirectionalLight } from 'three';
import { SUN_COLOR, SUN_DIR } from './constants';
import { tierConfig } from '../app/quality';
import { nightMix } from './dayNight';

const SKY_DAY = new Color('#C9DDF5');
const SKY_NIGHT = new Color('#2A3658');
const GROUND_DAY = new Color('#8A6448');
const GROUND_NIGHT = new Color('#2B2320');

const TARGET: [number, number, number] = [0.05, 0.76, -0.25];

/** Golden-hour key light through the window, cool sky fill, and a procedural (network-free) environment. */
export function Lighting() {
  const sun = useRef<DirectionalLight>(null);
  const bounce = useRef<DirectionalLight>(null);
  const hemi = useRef<HemisphereLight>(null);
  const scene = useThree((s) => s.scene);

  // Night: the sun sets to nothing, the sky fill turns cool and dim, the room's bounce fades.
  useFrame(() => {
    const n = nightMix();
    if (sun.current) sun.current.intensity = 6.2 * (1 - n);
    if (bounce.current) bounce.current.intensity = 1.1 * (1 - n);
    if (hemi.current) {
      hemi.current.intensity = 1.12 - n * 0.8;
      hemi.current.color.lerpColors(SKY_DAY, SKY_NIGHT, n);
      hemi.current.groundColor.lerpColors(GROUND_DAY, GROUND_NIGHT, n);
    }
    scene.environmentIntensity = 0.92 - n * 0.64;
  });

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
      <hemisphereLight ref={hemi} args={['#C9DDF5', '#8A6448', 1.0]} />
      {/* Warm bounce from the sunlit desk and floor, aimed upward so it lifts the walls but not the desk top */}
      <directionalLight ref={bounce} position={[0.4, -1.5, 2.5]} color="#FFC08A" intensity={1.1} />
      <Environment resolution={256} environmentIntensity={0.85}>
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
