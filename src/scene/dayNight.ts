/**
 * Day ↔ night (DESK_SPEC §2 night mode, §4.9 lamp). One shared value, eased over 1.6 s (inOutSine), that
 * lights, sky, shafts, dust and curtains all read. The choice persists (storage wrapped in try/catch).
 */
import { useFrame } from '@react-three/fiber';
import { create } from 'zustand';
import { params } from '../app/params';
import { prefersReducedMotion } from '../app/capabilities';
import { sfx } from '../audio/sound';

const KEY = 'desk-time';

function initialNight(): boolean {
  if (params.time === 'night') return true;
  try {
    const v = localStorage.getItem(KEY);
    if (v === 'night' || v === 'day') return v === 'night';
  } catch {
    // storage unavailable: fall through to the system preference
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

export const useDayNight = create<{ night: boolean; toggle: () => void }>((set, get) => ({
  night: initialNight(),
  toggle: () => {
    const night = !get().night;
    try {
      localStorage.setItem(KEY, night ? 'night' : 'day');
    } catch {
      // session-only choice
    }
    set({ night });
    sfx('click');
    transition.from = dayNightUniforms.uNight.value;
    transition.t0 = performance.now();
  },
}));

/** Shared uniform: 0 = golden hour, 1 = night. */
export const dayNightUniforms = { uNight: { value: useDayNight.getState().night ? 1 : 0 } };
const transition = { from: dayNightUniforms.uNight.value, t0: -Infinity };
const DURATION = prefersReducedMotion() ? 250 : 1600;
const inOutSine = (t: number) => -(Math.cos(Math.PI * t) - 1) / 2;

/** Advances the day/night mix once per frame (before its consumers). */
export function DayNightDriver() {
  useFrame(() => {
    const target = useDayNight.getState().night ? 1 : 0;
    const u = Math.min(1, (performance.now() - transition.t0) / DURATION);
    dayNightUniforms.uNight.value = transition.from + (target - transition.from) * inOutSine(u);
  }, -1);
  return null;
}

/** Current night mix (0..1). */
export const nightMix = () => dayNightUniforms.uNight.value;
