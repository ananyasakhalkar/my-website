import { useEffect } from 'react';
import { threads } from '../content/research';
import { skills } from '../content/skills';
import { closeView, useRoute } from '../app/routes';
import { useDesk } from '../app/store';
import { useView } from '../app/viewStore';
import { layout } from '../objects/Corkboard';

/** Caption for whatever the pointer is over on the board. */
function caption(hovered: string | null): { title: string; body: string } | null {
  if (!hovered) return null;
  if (hovered.startsWith('thread-')) {
    const t = threads.find((x) => 'thread-' + x.id === hovered);
    return t ? { title: t.id + ' · ' + t.title, body: t.body } : null;
  }
  if (hovered.startsWith('tool-')) {
    const g = skills[Number(hovered.slice(5))];
    return g ? { title: g.group, body: g.items.join(' · ') } : null;
  }
  if (hovered.startsWith('tag-')) {
    const t = layout.tags.find((x) => x.id === hovered);
    const th = t && threads.find((x) => x.id === t.thread);
    const ev = th?.evidence.find((e) => e.route === t?.route);
    return t && ev ? { title: t.label, body: 'Evidence for ' + th!.id + ' · ' + th!.title + ' → ' + ev.label } : null;
  }
  return null;
}

/**
 * The corkboard view (DESK_SPEC §4.8): focusable buttons over each evidence tag, a caption bar for the
 * hovered card, and the whole board as a list for screen readers.
 */
export function BoardView() {
  const open = useRoute((s) => s.route.view === 'board');
  const phase = useView((s) => (s.key === 'board' ? s.phase : 'closed'));
  const hovered = useDesk((s) => s.hovered);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        closeView();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  if (!open || phase !== 'rest') return null;
  const cap = caption(hovered);

  return (
    <div className="board-layer" role="dialog" aria-modal="true" aria-label="Research board">
      {layout.tags.map((t) => (
        <a key={t.id} id={'board-' + t.id} className="board-tag" href={t.route} aria-label={'Open ' + t.label}>
          {t.label}
        </a>
      ))}
      <div className="reader__hud">
        <button type="button" className="hud-btn" onClick={closeView}>
          ← back to desk
        </button>
      </div>
      <div className="board-caption" aria-hidden="true">
        {cap ? (
          <>
            <b>{cap.title}</b>
            <span>{cap.body}</span>
          </>
        ) : (
          <span className="board-caption__hint">hover a card · click a tag to open its evidence</span>
        )}
      </div>
      <ul className="sr-only">
        {threads.map((t) => (
          <li key={t.id}>
            {t.id}: {t.title}. {t.body}{' '}
            {t.evidence.map((e) => (
              <a key={e.route} href={e.route}>
                {e.label}
              </a>
            ))}
          </li>
        ))}
        {skills.map((g) => (
          <li key={g.group}>
            {g.group}: {g.items.join(', ')}
          </li>
        ))}
      </ul>
    </div>
  );
}
