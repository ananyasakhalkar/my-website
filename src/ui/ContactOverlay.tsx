import { useEffect, useState } from 'react';
import { contact } from '../content/contact';
import { closeView, useRoute } from '../app/routes';
import { S, finishSpill, refill, spillTime, startSpill, useSpill } from '../objects/spillStore';
import { params } from '../app/params';

/** Keeps the spill in step with the #/contact route. */
export function SpillSync() {
  const route = useRoute((s) => s.route);
  const previous = useRoute((s) => s.previous);
  useEffect(() => {
    if (route.view !== 'contact') return;
    const { phase } = useSpill.getState();
    // Deep links land on the dried end state; from the desk, the full sequence plays.
    if (phase === 'upright') (previous === null && params.spillAt === null ? finishSpill : startSpill)();
  }, [route, previous]);

  // Advance the spill timeline's phases.
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const s = useSpill.getState();
      const t = performance.now() - s.t0;
      if (s.phase === 'spilling' && t >= S.total && params.spillAt === null) useSpill.setState({ phase: 'spilled' });
      else if (s.phase === 'refilling' && t >= S.refill) useSpill.setState({ phase: 'upright' });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);
  return null;
}

/** Clock that re-renders the overlay while the sequence develops. */
function useSpillClock() {
  const phase = useSpill((s) => s.phase);
  const [t, setT] = useState(spillTime());
  useEffect(() => {
    if (phase !== 'spilling') {
      setT(spillTime());
      return;
    }
    let raf = 0;
    const tick = () => {
      setT(spillTime());
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [phase]);
  return { phase, t };
}

/**
 * The contact details in the stain as real DOM: invisible, focusable, selectable links aligned over each
 * developed line (positioned by the projector in the canvas), plus the controls under the stain.
 */
export function ContactOverlay() {
  const onContact = useRoute((s) => s.route.view === 'contact');
  const { phase, t } = useSpillClock();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!onContact) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      e.preventDefault();
      if (useSpill.getState().phase === 'spilling') finishSpill();
      else closeView();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onContact]);

  const developed = phase === 'spilled' || phase === 'spilling';
  const controls = onContact && developed && t >= S.controls;
  const email = contact.find((c) => c.key === 'email');

  const copy = async () => {
    if (!email) return;
    try {
      await navigator.clipboard.writeText(email.value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className={`contact-layer${onContact ? ' is-on' : ''}`} aria-hidden={!onContact}>
      <ul className="stain-links" aria-label="Contact details">
        {contact.map((c, i) => {
          const shown = developed && t >= S.developStart + 250 + i * 200;
          return (
            <li key={c.key}>
              <a
                id={`contact-line-${c.key}`}
                className={`stain-link${shown ? ' is-on' : ''}`}
                href={c.href}
                tabIndex={onContact && shown ? 0 : -1}
                {...(c.newTab ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
              >
                {c.label}: {c.value}
              </a>
            </li>
          );
        })}
      </ul>
      {onContact && (
        <div className="reader__hud">
          <button type="button" className="hud-btn" onClick={closeView}>
            ← back to desk
          </button>
        </div>
      )}
      {controls && (
        <div className="stain-controls">
          <button type="button" className="hud-btn" onClick={() => void copy()}>
            {copied ? 'copied ✓' : 'copy email'}
          </button>
          <button
            type="button"
            className="hud-btn"
            onClick={() => {
              refill();
              closeView();
            }}
          >
            ↺ refill
          </button>
        </div>
      )}
      <p className="sr-only" aria-live="polite">
        {onContact && phase === 'spilled' ? 'Contact details' : ''}
        {copied ? ' Email address copied.' : ''}
      </p>
    </div>
  );
}
