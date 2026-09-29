import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { MathUtils, Vector3, type PerspectiveCamera } from 'three';
import { useDesk } from '../app/store';
import { useRoute } from '../app/routes';
import { params } from '../app/params';
import { isTouch, prefersReducedMotion } from '../app/capabilities';
import { INTRO_POSE, POSES, poseForRoute, pose, resolvePose, type Pose, type PoseKey } from './poses';

const inOutQuart = (t: number) => (t < 0.5 ? 8 * t ** 4 : 1 - (-2 * t + 2) ** 4 / 2);
const inOutCubic = (t: number) => (t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2);

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

interface Move {
  from: Pose;
  to: PoseKey;
  start: number | null;
  duration: number;
  ease: (t: number) => number;
}

/** Camera: authored poses only (no free orbit). Intro pull-back, route-driven moves, hero parallax. */
export function CameraRig() {
  const camera = useThree((s) => s.camera) as PerspectiveCamera;
  const pointer = useThree((s) => s.pointer);
  const { skipRequested, introDone, setIntroDone } = useDesk();
  const route = useRoute((s) => s.route);
  const reduced = prefersReducedMotion();

  const move = useRef<Move | null>(null);
  const current = useRef<Pose>(pose([0, 0, 0], [0, 0, 0], 40));
  if (!move.current) {
    const again = returning();
    const skipIntro = params.noIntro || reduced || useRoute.getState().deepLinked;
    const hero = POSES.hero.wide;
    move.current = {
      from: again ? pose(hero.pos.clone().lerp(INTRO_POSE.pos, 0.3).toArray(), hero.look.clone().lerp(INTRO_POSE.look, 0.3).toArray(), 40) : INTRO_POSE,
      to: poseForRoute(route),
      start: skipIntro && params.introAt === null ? -Infinity : null,
      duration: again ? 1.0 : 3.2,
      ease: inOutQuart,
    };
  }

  // A route change starts a new move from wherever the camera is now.
  const key = poseForRoute(route);
  const lastKey = useRef(key);
  useEffect(() => {
    if (key === lastKey.current) return;
    lastKey.current = key;
    const c = current.current;
    move.current = {
      from: pose(c.pos.toArray(), c.look.toArray(), c.fov),
      to: key,
      start: null,
      duration: reduced ? 0.25 : key === 'hero' ? 0.9 : 0.8,
      ease: inOutCubic,
    };
  }, [key, reduced]);

  const parallax = useRef({ yaw: 0, pitch: 0 });
  const allowParallax = !isTouch() && !reduced;
  const target = useRef(pose([0, 0, 0], [0, 0, 0], 40));

  useFrame((state, dt) => {
    const m = move.current!;
    if (m.start === null) m.start = state.clock.elapsedTime;
    const isIntro = !introDone;
    const elapsed = isIntro && params.introAt !== null ? params.introAt : state.clock.elapsedTime - m.start;
    const p = isIntro && skipRequested ? 1 : MathUtils.clamp(elapsed / m.duration, 0, 1);
    const e = m.ease(p);

    const to = resolvePose(POSES[m.to], camera.aspect, target.current);
    const c = current.current;
    c.pos.lerpVectors(m.from.pos, to.pos, e);
    c.look.lerpVectors(m.from.look, to.look, e);
    c.fov = MathUtils.lerp(m.from.fov, to.fov, e);

    // Mouse parallax in the hero pose only: ±1.5° yaw, ±1° pitch, lerped.
    const px = parallax.current;
    const k = 1 - Math.exp(-dt * 3);
    const on = p >= 1 && m.to === 'hero' && allowParallax;
    px.yaw += ((on ? pointer.x * 1.5 : 0) - px.yaw) * k;
    px.pitch += ((on ? pointer.y * 1.0 : 0) - px.pitch) * k;
    const dist = c.pos.distanceTo(c.look);
    look.copy(c.look);
    look.x += Math.tan(MathUtils.degToRad(px.yaw)) * dist;
    look.y += Math.tan(MathUtils.degToRad(px.pitch)) * dist;

    camera.position.copy(c.pos);
    camera.lookAt(look);
    if (Math.abs(camera.fov - c.fov) > 1e-3) {
      camera.fov = c.fov;
      camera.updateProjectionMatrix();
    }
    if (isIntro && p >= 1) setIntroDone();
  });

  return null;
}

const look = new Vector3();
