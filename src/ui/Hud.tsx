import { useEffect } from 'react';
import { profile } from '../content/profile';
import { navigate, useRoute } from '../app/routes';
import { useDayNight } from '../scene/dayNight';
import { useSound } from '../audio/sound';

/**
 * Always-on HUD (DESK_SPEC §5): wordmark (back to desk), "Read as a document", CV, day/night, sound.
 * Real buttons and links, 44 px targets, visible focus.
 */
export function Hud() {
  const route = useRoute((s) => s.route);
  const night = useDayNight((s) => s.night);
  const toggleNight = useDayNight((s) => s.toggle);
  const sound = useSound((s) => s.on);
  const toggleSound = useSound((s) => s.toggle);
  const plain = route.view === 'plain';

  // Plain mode: show the prerendered document, pause the desk, restore page scrolling.
  useEffect(() => {
    document.documentElement.classList.toggle('plain-mode', plain);
    if (plain) {
      const id = window.location.hash.replace(/^#/, '');
      if (id && !id.startsWith('/')) document.getElementById(id)?.scrollIntoView();
    }
  }, [plain, route]);

  if (plain) {
    return (
      <button type="button" className="hud-btn open-desk" onClick={() => navigate({ view: 'desk' })}>
        ✦ open the 3D desk
      </button>
    );
  }

  return (
    <header className="hud">
      <a
        className="hud-mark"
        href="#/"
        aria-label={profile.wordmark.first + '.' + profile.wordmark.rest + ' — back to the desk'}
      >
        {profile.wordmark.first}
        <span>.</span>
        {profile.wordmark.rest}
      </a>
      <nav className="hud-right" aria-label="Site">
        <a className="hud-btn" href="#/plain">
          Read as a document
        </a>
        <a className="hud-btn" href="resume.pdf" target="_blank" rel="noopener noreferrer">
          CV ↓
        </a>
        <button type="button" className="hud-btn hud-icon" aria-pressed={night} aria-label={night ? 'Switch to daylight' : 'Switch to night'} onClick={toggleNight}>
          {night ? '☀' : '☾'}
        </button>
        <button
          type="button"
          className={'hud-btn hud-icon' + (sound ? '' : ' is-off')}
          aria-pressed={sound}
          aria-label="Sound"
          onClick={toggleSound}
        >
          ♪
        </button>
      </nav>
    </header>
  );
}
