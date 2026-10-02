/** Decide whether the 3D desk can run; otherwise the prerendered plain document stays (DESK_SPEC §7). */
interface NavigatorExtras {
  connection?: { saveData?: boolean };
  deviceMemory?: number;
}

export function hasWebGL2(): boolean {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2');
    const ok = !!gl;
    gl?.getExtension('WEBGL_lose_context')?.loseContext();
    return ok;
  } catch {
    return false;
  }
}

export function canRun3D(): boolean {
  const nav = navigator as Navigator & NavigatorExtras;
  if (nav.connection?.saveData) return false;
  if (typeof nav.deviceMemory === 'number' && nav.deviceMemory <= 2) return false;
  return hasWebGL2();
}

export const prefersReducedMotion = (): boolean =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export const isTouch = (): boolean => window.matchMedia('(hover: none), (pointer: coarse)').matches;
