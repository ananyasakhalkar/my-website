import { useEffect, useRef, useState } from 'react';
import { useProgress } from '@react-three/drei';
import { profile } from '../content/profile';
import { useDesk } from '../app/store';
import { navigate, useRoute } from '../app/routes';
import { prefersReducedMotion } from '../app/capabilities';

/**
 * Loader (DESK_SPEC §1): a blank sheet of warm paper; a fountain-pen stroke writes her name as the scene
 * loads. Progress is real: textures in flight, then the first rendered frame. The sheet then slides away.
 */
export function Loader() {
  const ready = useDesk((s) => s.ready);
  const loaderDone = useDesk((s) => s.loaderDone);
  const setLoaderDone = useDesk((s) => s.setLoaderDone);
  const { progress, active } = useProgress();
  const plain = useRoute((s) => s.route.view === 'plain');
  const [slow, setSlow] = useState(false);
  const [leaving, setLeaving] = useState(false);

  // Canvas + shaders ≈ first 60 %, texture loads the next 35 %, the first frame the last 5 %.
  const p = Math.min(1, 0.6 * (ready ? 1 : 0.4) + 0.35 * (active ? progress / 100 : 1) + (ready && !active ? 0.05 : 0));

  useEffect(() => {
    const t = setTimeout(() => setSlow(true), 6000);
    return () => clearTimeout(t);
  }, []);
  // Leave once the first frame is up and loads have settled (or 2.5 s after the first frame at most:
  // lazily loaded page textures must not hold the room hostage). The exit runs exactly once.
  const exiting = useRef(false);
  const exit = useRef<() => void>(() => undefined);
  exit.current = () => {
    if (exiting.current) return;
    exiting.current = true;
    const reduced = prefersReducedMotion();
    window.setTimeout(() => setLeaving(true), reduced ? 0 : 350);
    window.setTimeout(() => setLoaderDone(), reduced ? 150 : 900);
  };
  useEffect(() => {
    if (ready && !active) exit.current();
  }, [ready, active]);
  useEffect(() => {
    if (!ready) return;
    const t = window.setTimeout(() => exit.current(), 2500);
    return () => window.clearTimeout(t);
  }, [ready]);

  // The plain document needs no loader (and the paused desk renders no first frame).
  if (loaderDone || plain) return null;
  return (
    <div className={'loader' + (leaving ? ' is-leaving' : '')} role="status" aria-live="polite">
      <svg className="loader__sig" viewBox="0 0 900 200" aria-hidden="true">
        <defs>
          <clipPath id="loader-ink">
            <rect x="0" y="0" height="200" width={(60 + p * 790).toFixed(1)} />
          </clipPath>
        </defs>
        {/* The ink is revealed left to right as loading progresses; a nib rides the writing edge. */}
        <text x="450" y="130" textAnchor="middle" clipPath="url(#loader-ink)">
          {profile.name}
        </text>
        {!leaving && <circle className="loader__nib" cx={(60 + p * 790).toFixed(1)} cy="118" r="5" />}
      </svg>
      <p className="sr-only">Loading the desk…</p>
      {slow && !leaving && (
        <p className="loader__slow">
          Taking a while…{' '}
          <button type="button" className="hud-btn" onClick={() => navigate({ view: 'plain' })}>
            Read as a document
          </button>
        </p>
      )}
    </div>
  );
}

const HINT_KEY = 'desk-hint-seen';

/** "go on — pick something up": after the intro, until the first interaction (once per session). */
export function Hint() {
  const introDone = useDesk((s) => s.introDone);
  const hovered = useDesk((s) => s.hovered);
  const onDesk = useRoute((s) => s.route.view === 'desk');
  const [seen, setSeen] = useState(() => {
    try {
      return sessionStorage.getItem(HINT_KEY) === '1';
    } catch {
      return false;
    }
  });
  useEffect(() => {
    if (seen || !hovered) return;
    setSeen(true);
    try {
      sessionStorage.setItem(HINT_KEY, '1');
    } catch {
      // fine: the hint just shows again next visit
    }
  }, [hovered, seen]);
  useEffect(() => {
    const onHash = () => setSeen(true);
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);
  if (seen || !introDone || !onDesk) return null;
  return (
    <p className="hint" aria-hidden="true">
      <span className="hint__arrow">↙</span> go on — pick something up
    </p>
  );
}

/** Offer (never force) the lightweight version when the desk struggles (DESK_SPEC §7). */
export function SlowToast() {
  const slow = useDesk((s) => s.slowOffer);
  const dismiss = useDesk((s) => s.dismissSlow);
  if (!slow) return null;
  return (
    <div className="toast-offer" role="alert">
      <span>This device seems to be struggling. Switch to the lightweight version?</span>
      <button type="button" className="hud-btn" onClick={() => navigate({ view: 'plain' })}>
        Switch
      </button>
      <button type="button" className="hud-btn" onClick={dismiss}>
        Keep the desk
      </button>
    </div>
  );
}
