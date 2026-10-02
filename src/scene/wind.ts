/**
 * The shared wind system (DESK_SPEC §3). One module drives curtains, trees, plant, dust and steam so the room
 * breathes coherently. Gust timing is seeded, so `?freeze=<t>` always renders the same frame.
 */
import { params } from '../app/params';
import { seeded } from './textures';

const BASE = 0.25;
const ATTACK = 1.2;
const HOLD = 0.8;
const RELEASE = 3.0;

interface Gust { start: number; peak: number }

// First gust peaks ~2 s into the intro; afterwards every 12–25 s.
const gusts: Gust[] = [];
{
  const r = seeded(20260929);
  let t = 0.2;
  gusts.push({ start: t, peak: 1 });
  while (t < 3600) {
    t += 12 + r() * 13;
    gusts.push({ start: t, peak: 0.65 + r() * 0.35 });
  }
}

const smooth = (x: number) => x * x * (3 - 2 * x);

function envelope(t: number): number {
  let e = 0;
  for (const g of gusts) {
    const l = t - g.start;
    if (l < 0) break;
    if (l > ATTACK + HOLD + RELEASE) continue;
    const v = l < ATTACK ? smooth(l / ATTACK) : l < ATTACK + HOLD ? 1 : 1 - smooth((l - ATTACK - HOLD) / RELEASE);
    e = Math.max(e, v * g.peak);
  }
  return e;
}

export const wind = {
  /** Accumulated seconds (frozen under ?freeze). */
  time: 0,
  base: BASE,
  /** Gust after the damped spring (overshoots slightly, then settles: the lazy fall-back of the curtains). */
  gust: 0,
  gustVel: 0,
  strength: BASE,
  /** Integrated push along +Z, used to carry dust with gusts. */
  push: 0,
  frozen: false,
  /** Motion scale: 1 normally, 0.25 under prefers-reduced-motion. */
  motion: 1,
};

/** Shared uniforms: every wind consumer references these same objects. */
export const windUniforms = {
  uTime: { value: 0 },
  uWind: { value: BASE },
  uGust: { value: 0 },
  uMotion: { value: 1 },
};

function integrate(dt: number) {
  wind.time += dt;
  const target = envelope(wind.time);
  const k = 16;
  const c = 4.2; // under-damped: a gentle overshoot as the gust releases
  wind.gustVel += (k * (target - wind.gust) - c * wind.gustVel) * dt;
  wind.gust += wind.gustVel * dt;
  wind.strength = Math.max(0, wind.base + wind.gust * 0.85);
  wind.push += wind.gust * dt * 0.02;
}

/** Advance the wind by `dt` seconds (sub-stepped for stability). */
export function stepWind(dt: number) {
  if (!wind.frozen) {
    let rest = Math.min(dt, 0.1);
    while (rest > 0) {
      const h = Math.min(rest, 1 / 120);
      integrate(h);
      rest -= h;
    }
  }
  windUniforms.uTime.value = wind.time;
  windUniforms.uWind.value = wind.strength;
  windUniforms.uGust.value = wind.gust;
  windUniforms.uMotion.value = wind.motion;
}

export function initWind(reducedMotion: boolean) {
  wind.motion = reducedMotion ? 0.25 : 1;
  if (params.freeze !== null) {
    while (wind.time < params.freeze) integrate(1 / 120);
    wind.frozen = true;
  }
  stepWind(0);
}
