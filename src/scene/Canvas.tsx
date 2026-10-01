import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { PerformanceMonitor } from '@react-three/drei';
import { Bloom, EffectComposer, Noise, ToneMapping, Vignette } from '@react-three/postprocessing';
import { BlendFunction, ToneMappingMode } from 'postprocessing';
import { AgXToneMapping, PCFShadowMap, WebGLRenderTarget } from 'three';
import { tierConfig } from '../app/quality';
import { useDesk } from '../app/store';
import { navigate, useRoute } from '../app/routes';
import { useEffect, useRef, useState } from 'react';
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
import { Decor } from './Decor';

/** Signals the first rendered frame (the loader finishes on it). */
function FirstFrame({ post }: { post: boolean }) {
  const done = useRef(false);
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const camera = useThree((s) => s.camera);
  useFrame(() => {
    if (done.current) return;
    done.current = true;
    requestAnimationFrame(() => useDesk.getState().setReady());
    // Start compiling every material now (in parallel where the driver supports it) so the first spill,
    // page flight or night switch doesn't stall on it. With post-processing the scene renders into a render
    // target (linear output, no renderer tone mapping), so compile with one bound or the variants differ.
    // (Not compileAsync: its readiness poll throws if a material is disposed meanwhile.)
    const compile = () => {
      const prev = gl.getRenderTarget();
      const rt = post ? new WebGLRenderTarget(1, 1) : null;
      gl.setRenderTarget(rt);
      gl.compile(scene, camera);
      gl.setRenderTarget(prev);
      rt?.dispose();
    };
    compile();
    // Again once late materials exist (the spill waits for its text texture, the mug for its label).
    setTimeout(compile, 2500);
  });
  return null;
}

/**
 * Sustained < 20 fps for 4 s → offer (never force) the lightweight version, but only once the automatic
 * steps (pixel ratio, then bloom and MSAA) have been taken and it is still slow.
 */
function FpsWatch({ exhausted }: { exhausted: boolean }) {
  const acc = useRef({ t: 0, frames: 0, slow: 0, grace: 3 });
  useFrame((_, dt) => {
    const a = acc.current;
    // Only judge steady-state frames: after the intro, plus a few seconds' grace.
    if (!useDesk.getState().introDone || !exhausted) return;
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

/** Throttle to ~30 fps while the window isn't focused (hidden tabs pause on their own). */
function BlurThrottle() {
  const setFrameloop = useThree((s) => s.setFrameloop);
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => {
    let timer = 0;
    const blur = () => {
      setFrameloop('demand');
      timer = window.setInterval(() => invalidate(), 33);
    };
    const focus = () => {
      window.clearInterval(timer);
      setFrameloop('always');
    };
    window.addEventListener('blur', blur);
    window.addEventListener('focus', focus);
    return () => {
      window.removeEventListener('blur', blur);
      window.removeEventListener('focus', focus);
      window.clearInterval(timer);
    };
  }, [setFrameloop, invalidate]);
  return null;
}

/** Advances the shared wind once per frame, before anything that consumes it. */
function WindDriver() {
  useFrame((_, dt) => stepWind(dt), -1);
  return null;
}

function Effects({ lite }: { lite: boolean }) {
  const bloom = tierConfig.bloom && !lite;
  return (
    <EffectComposer multisampling={lite ? 0 : 4}>
      {bloom ? <Bloom mipmapBlur luminanceThreshold={0.9} intensity={0.35} /> : <></>}
      <ToneMapping mode={ToneMappingMode.AGX} />
      <Vignette offset={0.3} darkness={0.5} />
      {bloom ? <Noise premultiply blendFunction={BlendFunction.SOFT_LIGHT} opacity={0.08} /> : <></>}
    </EffectComposer>
  );
}

export function DeskCanvas() {
  const plain = useRoute((s) => s.route.view === 'plain');
  // Auto-degrade (DESK_SPEC §10): lower the pixel ratio first, then the costly effects. The composer itself
  // stays: removing it re-targets every material, and recompiling them all freezes D3D for seconds.
  const [dpr, setDpr] = useState(tierConfig.dpr);
  const [lite, setLite] = useState(false);
  const post = tierConfig.post;
  const decline = () => {
    if (dpr > 1) setDpr((d) => Math.max(1, d - 0.5));
    else setLite(true);
  };
  return (
    <Canvas
      frameloop={plain ? 'never' : 'always'}
      shadows={{ type: PCFShadowMap }}
      dpr={[1, dpr]}
      gl={{ antialias: !tierConfig.post, powerPreference: 'high-performance' }}
      camera={{ fov: 42, near: 0.05, far: 90, position: [0, 1.45, 1.75] }}
      onCreated={({ gl, scene }) => {
        gl.toneMapping = AgXToneMapping;
        gl.toneMappingExposure = 1;
        // Production: skip per-program shader diagnostics (driver notes are not errors; also faster).
        gl.debug.checkShaderErrors = import.meta.env.DEV;
        if (import.meta.env.DEV) Object.assign(window, { __gl: gl, __scene: scene });
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
      <FirstFrame post={post} />
      <FpsWatch exhausted={lite} />
      <BlurThrottle />
      <PerformanceMonitor onDecline={decline} flipflops={3} />
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
      <Decor />
      <CoffeeSpill />
      <TagProjector />
      {post && <Effects lite={lite} />}
    </Canvas>
  );
}
