import { MathUtils, Vector3 } from 'three';
import type { Route } from '../app/routes';

export interface Pose {
  pos: Vector3;
  look: Vector3;
  fov: number;
}

export const pose = (pos: [number, number, number], look: [number, number, number], fov: number): Pose => ({
  pos: new Vector3(...pos),
  look: new Vector3(...look),
  fov,
});

/** Each authored pose has a wide (≥ 1.3 aspect) and a portrait (< 0.8) variant, blended in between. */
export interface PosePair {
  wide: Pose;
  portrait: Pose;
}

export const POSES = {
  hero: {
    wide: pose([0.2, 1.62, 1.62], [0.02, 0.97, -0.55], 46),
    portrait: pose([0, 1.9, 2.2], [0, 1.2, -0.6], 64),
  },
  spill: {
    // High and forward: the sun's mirror glare on the desk falls outside the text block.
    wide: pose([0.34, 1.25, 0.86], [0.34, 0.76, 0.225], 34),
    portrait: pose([0.34, 1.5, 0.78], [0.34, 0.76, 0.23], 60),
  },
  folder: {
    wide: pose([-0.3, 1.18, 0.62], [-0.36, 0.78, 0.05], 46),
    portrait: pose([-0.36, 1.3, 0.72], [-0.4, 0.76, 0.08], 60),
  },
} satisfies Record<string, PosePair>;

export type PoseKey = keyof typeof POSES;

/** Which authored pose a route uses (objects added in M4–M5 extend this). */
export function poseForRoute(r: Route): PoseKey {
  switch (r.view) {
    case 'projects':
      return 'folder';
    case 'contact':
      return 'spill';
    default:
      return 'hero';
  }
}

/** Resolve a pose for the current aspect into `out`. */
export function resolvePose(pair: PosePair, aspect: number, out: Pose): Pose {
  const w = MathUtils.smoothstep(aspect, 0.8, 1.3);
  out.pos.lerpVectors(pair.portrait.pos, pair.wide.pos, w);
  out.look.lerpVectors(pair.portrait.look, pair.wide.look, w);
  out.fov = MathUtils.lerp(pair.portrait.fov, pair.wide.fov, w);
  return out;
}

export const INTRO_POSE = pose([0, 1.5, -0.05], [0, 1.45, -1.2], 40);
