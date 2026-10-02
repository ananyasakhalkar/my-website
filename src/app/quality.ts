import { params } from './params';
import { isTouch } from './capabilities';

export type Tier = 'low' | 'medium' | 'high';

/** Quick capability probe; PerformanceMonitor auto-degrades from here in M7. */
function probe(): Tier {
  const nav = navigator as Navigator & { deviceMemory?: number };
  const cores = navigator.hardwareConcurrency || 4;
  if (isTouch()) return cores >= 8 && (nav.deviceMemory ?? 4) >= 6 ? 'medium' : 'low';
  return cores >= 4 ? 'high' : 'medium';
}

export const tier: Tier = params.quality ?? probe();

export const tierConfig = {
  low: { dpr: 1, shadowMap: 1024, dust: 100, curtainSeg: [24, 48] as const, post: false, bloom: false },
  medium: { dpr: 1.5, shadowMap: 1024, dust: 220, curtainSeg: [36, 72] as const, post: true, bloom: false },
  high: { dpr: 2, shadowMap: 2048, dust: 340, curtainSeg: [48, 96] as const, post: true, bloom: true },
}[tier];
