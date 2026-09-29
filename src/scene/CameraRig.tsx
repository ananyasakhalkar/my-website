import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { MathUtils, Vector3, type PerspectiveCamera } from 'three';
import { useDesk } from '../app/store';
import { params } from '../app/params';
import { isTouch, prefersReducedMotion } from '../app/capabilities';

interface Pose { pos: Vector3; look: Vector3; fov: number }
const pose = (pos: [number, number, number], look: [number, number, number], fov: number): Pose => ({
  pos: new Vector3(...pos),
  look: new Vector3(...look),
  fov,
});

/** Hero framing: whole desk, window and curtains behind it (tuned from DESK_SPEC §1 by eye; see changelog). */
const HERO_WIDE = pose([0.2, 1.62, 1.62], [0.02, 0.97, -0.55], 46);
const HERO_PORTRAIT = pose([0, 1.9, 2.2], [0, 1.2, -0.6], 64);
/** Intro starts close on the open window. */
const INTRO = pose([0, 1.5, -0.05], [0, 1.45, -1.2], 40);

const inOutQuart = (t: number) => (t < 0.5 ? 8 * t ** 4 : 1 - (-2 * t + 2) ** 4 / 2);

const VISITED = 'desk-visited';
function returning(): boolean {
  try {
    const seen = sessionStorage.getItem(VISITED) === '1';
    sessionStorage.setItem(VISITED, '1');
    return seen;
  } catch {
    return false;
  }
}

/** Camera: authored poses only (no free orbit). Intro pull-back, aspect-aware hero, gentle mouse parallax. */
export function CameraRig() {
  const camera = useThree((s) => s.camera) as PerspectiveCamera;
  const pointer = useThree((s) => s.pointer);
  const { skipRequested, introDone, setIntroDone } = useDesk();

  const cfg = useRef<{ start: number | null; duration: number; from: Pose } | null>(null);
  if (!cfg.current) {
    const again = returning();
    const skip = params.noIntro || prefersReducedMotion();
    cfg.current = {
      start: skip && params.introAt === null ? -Infinity : null,
      duration: again ? 1.0 : 3.2,
      from: again
        ? pose(
            HERO_WIDE.pos.clone().lerp(INTRO.pos, 0.3).toArray(),
            HERO_WIDE.look.clone().lerp(INTRO.look, 0.3).toArray(),
            40,
          )
        : INTRO,
    };
  }
  const parallax = useRef({ yaw: 0, pitch: 0 });
  const allowParallax = !isTouch() && !prefersReducedMotion();
  const tmp = useRef({ pos: new Vector3(), look: new Vector3(), hero: pose([0, 0, 0], [0, 0, 0], 40) });

  useFrame((state, dt) => {
    const c = cfg.current!;
    if (c.start === null) c.start = state.clock.elapsedTime;
    const elapsed = params.introAt ?? state.clock.elapsedTime - c.start;
    const p = skipRequested ? 1 : MathUtils.clamp(elapsed / c.duration, 0, 1);
    const e = inOutQuart(p);

    // Blend desktop and portrait hero poses by aspect so the key objects stay in frame.
    const w = MathUtils.smoothstep(camera.aspect, 0.8, 1.3);
    const { hero, pos, look } = tmp.current;
    hero.pos.lerpVectors(HERO_PORTRAIT.pos, HERO_WIDE.pos, w);
    hero.look.lerpVectors(HERO_PORTRAIT.look, HERO_WIDE.look, w);
    hero.fov = MathUtils.lerp(HERO_PORTRAIT.fov, HERO_WIDE.fov, w);

    pos.lerpVectors(c.from.pos, hero.pos, e);
    look.lerpVectors(c.from.look, hero.look, e);
    const fov = MathUtils.lerp(c.from.fov, hero.fov, e);

    // Mouse parallax (hero pose only): ±1.5° yaw, ±1° pitch, lerped.
    const px = parallax.current;
    const k = 1 - Math.exp(-dt * 3);
    px.yaw += ((p >= 1 && allowParallax ? pointer.x * 1.5 : 0) - px.yaw) * k;
    px.pitch += ((p >= 1 && allowParallax ? pointer.y * 1.0 : 0) - px.pitch) * k;
    const dist = pos.distanceTo(look);
    look.x += Math.tan(MathUtils.degToRad(px.yaw)) * dist;
    look.y += Math.tan(MathUtils.degToRad(px.pitch)) * dist;

    camera.position.copy(pos);
    camera.lookAt(look);
    if (Math.abs(camera.fov - fov) > 1e-3) {
      camera.fov = fov;
      camera.updateProjectionMatrix();
    }
    if (p >= 1 && !introDone) setIntroDone();
  });

  return null;
}
