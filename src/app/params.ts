/** Deterministic-state URL params used by screenshots and QA (DESK_SPEC §12). */
const q = new URLSearchParams(window.location.search);

function num(name: string): number | null {
  const v = q.get(name);
  if (v === null || v.trim() === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export const params = {
  /** Skip the intro camera move and start in the hero pose. */
  noIntro: q.has('nointro'),
  /** Render the intro camera at this many seconds into the move (deterministic intro frames). */
  introAt: num('introAt'),
  /** Freeze wind/animation time at this many seconds (deterministic frames). */
  freeze: num('freeze'),
  /** Force a quality tier. */
  quality: (['low', 'medium', 'high'] as const).find((t) => t === q.get('quality')) ?? null,
  /** Start at a time of day. */
  time: q.get('time') === 'night' ? ('night' as const) : null,
  debug: q.has('debug'),
};
