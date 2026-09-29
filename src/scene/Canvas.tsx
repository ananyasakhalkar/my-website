import { Canvas, useFrame } from '@react-three/fiber';
import { Bloom, EffectComposer, Noise, ToneMapping, Vignette } from '@react-three/postprocessing';
import { BlendFunction, ToneMappingMode } from 'postprocessing';
import { AgXToneMapping, PCFShadowMap } from 'three';
import { tierConfig } from '../app/quality';
import { useDesk } from '../app/store';
import { navigate, useRoute } from '../app/routes';
import { useRef } from 'react';
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
import { Lamp } from '../objects/Lamp';
import { DayNightDriver } from './dayNight';
import { CoffeeSpill } from '../objects/CoffeeSpill';

/** Signals the first rendered frame (the loader finishes on it). */
function FirstFrame() {
  const done = useRef(false);
  useFrame(() => {
    if (done.current) return;
    done.current = true;
    requestAnimationFrame(() => useDesk.getState().setReady());
  });
  return null;
}

/** Sustained < 20 fps for 4 s → offer (never force) the lightweight version. */
function FpsWatch() {
  const acc = useRef({ t: 0, frames: 0, slow: 0, grace: 3 });
  useFrame((_, dt) => {
    const a = acc.current;
    // Only judge steady-state frames: after the intro, plus a few seconds' grace.
    if (!useDesk.getState().introDone) return;
    if (a.grace > 0) {
      a.grace -= dt;
      return;
    }
    a.t += dt;
    a.frames++;
    if (a.t < 1) return;
    const fps = a.frames / a.t;
    a.slow = fps < 20 && document.visibilityState === 'visible' ? a.slow + a.t : 0;
    a.t = 0;
    a.frames = 0;
    if (a.slow >= 4) useDesk.getState().offerSlow();
  });
  return null;
}

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
  const plain = useRoute((s) => s.route.view === 'plain');
  return (
    <Canvas
      frameloop={plain ? 'never' : 'always'}
      shadows={{ type: PCFShadowMap }}
      dpr={[1, tierConfig.dpr]}
      gl={{ antialias: !tierConfig.post, powerPreference: 'high-performance' }}
      camera={{ fov: 42, near: 0.05, far: 90, position: [0, 1.45, 1.75] }}
      onCreated={({ gl }) => {
        gl.toneMapping = AgXToneMapping;
        gl.toneMappingExposure = 1;
        // A lost context that doesn't come back within 3 s falls back to the plain document.
        let timer = 0;
        gl.domElement.addEventListener('webglcontextlost', (e) => {
          e.preventDefault();
          timer = window.setTimeout(() => navigate({ view: 'plain' }), 3000);
        });
        gl.domElement.addEventListener('webglcontextrestored', () => window.clearTimeout(timer));
      }}
    >
      <WindDriver />
      <FirstFrame />
      <FpsWatch />
      <DayNightDriver />
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
      <Lamp />
      <CoffeeSpill />
      <TagProjector />
      {tierConfig.post && <Effects />}
    </Canvas>
  );
}
