import { Canvas, useFrame } from '@react-three/fiber';
import { Bloom, EffectComposer, Noise, ToneMapping, Vignette } from '@react-three/postprocessing';
import { BlendFunction, ToneMappingMode } from 'postprocessing';
import { AgXToneMapping, PCFShadowMap } from 'three';
import { tierConfig } from '../app/quality';
import { stepWind } from './wind';
import { CameraRig } from './CameraRig';
import { Lighting } from './Lighting';
import { Room } from './Room';
import { Window } from './Window';
import { Curtains } from './Curtains';
import { Outside } from './Outside';
import { Desk } from './Desk';
import { Shafts } from './Shafts';
import { Dust } from './Dust';
import { ProjectsFolder } from '../objects/ProjectsFolder';
import { ReaderPapers } from '../reader/ReaderPapers';
import { TagProjector } from '../ui/ObjectTag';
import { Mug } from '../objects/Mug';
import { JournalStack } from '../objects/JournalStack';
import { ReportCard } from '../objects/ReportCard';
import { Badges } from '../objects/Badges';
import { Notebook } from '../objects/Notebook';
import { Corkboard } from '../objects/Corkboard';
import { CoffeeSpill } from '../objects/CoffeeSpill';

/** Advances the shared wind once per frame, before anything that consumes it. */
function WindDriver() {
  useFrame((_, dt) => stepWind(dt), -1);
  return null;
}

function Effects() {
  return (
    <EffectComposer multisampling={4}>
      {tierConfig.bloom ? <Bloom mipmapBlur luminanceThreshold={0.9} intensity={0.35} /> : <></>}
      <ToneMapping mode={ToneMappingMode.AGX} />
      <Vignette offset={0.3} darkness={0.5} />
      {tierConfig.bloom ? <Noise premultiply blendFunction={BlendFunction.SOFT_LIGHT} opacity={0.08} /> : <></>}
    </EffectComposer>
  );
}

export function DeskCanvas() {
  return (
    <Canvas
      shadows={{ type: PCFShadowMap }}
      dpr={[1, tierConfig.dpr]}
      gl={{ antialias: !tierConfig.post, powerPreference: 'high-performance' }}
      camera={{ fov: 42, near: 0.05, far: 90, position: [0, 1.45, 1.75] }}
      onCreated={({ gl }) => {
        gl.toneMapping = AgXToneMapping;
        gl.toneMappingExposure = 1;
      }}
    >
      <WindDriver />
      <CameraRig />
      <Lighting />
      <Room />
      <Window />
      <Curtains />
      <Outside />
      <Desk />
      <Shafts />
      <Dust />
      <ProjectsFolder />
      <ReaderPapers />
      <Mug />
      <JournalStack />
      <ReportCard />
      <Badges />
      <Notebook />
      <Corkboard />
      <CoffeeSpill />
      <TagProjector />
      {tierConfig.post && <Effects />}
    </Canvas>
  );
}
