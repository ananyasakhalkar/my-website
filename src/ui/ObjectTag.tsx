/**
 * Object tags and keyboard / screen-reader proxies live in the DOM (crisp, CSP-friendly) and are positioned
 * every frame by a projector inside the canvas (DESK_SPEC §4.0, §7).
 */
import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Vector3, type Object3D } from 'three';
import { create } from 'zustand';
import { isTouch } from '../app/capabilities';
import { useDesk } from '../app/store';
import { useRoute } from '../app/routes';
import { DESK_OBJECTS, ROUTE_OBJECT } from './deskObjects';

interface Anchor {
  id: string;
  text: string;
  object: Object3D;
  offset: Vector3;
}

const anchors = new Map<string, Anchor>();
const useTags = create<{ ids: { id: string; text: string }[] }>(() => ({ ids: [] }));
const publish = () => useTags.setState({ ids: [...anchors.values()].map((a) => ({ id: a.id, text: a.text })) });

/** Register an object's tag anchor (called from inside the canvas). Returns an unregister function. */
export function registerTag(id: string, text: string, object: Object3D, offset: [number, number, number]) {
  anchors.set(id, { id, text, object, offset: new Vector3(...offset) });
  publish();
  return () => {
    anchors.delete(id);
    publish();
  };
}

const v = new Vector3();
/** Projects every anchor to screen space and moves its DOM tag and proxy (CSSOM transforms). */
export function TagProjector() {
  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size);
  useFrame(() => {
    for (const a of anchors.values()) {
      v.copy(a.offset);
      a.object.localToWorld(v);
      v.project(camera);
      const x = ((v.x * 0.5 + 0.5) * size.width).toFixed(1);
      const y = ((-v.y * 0.5 + 0.5) * size.height).toFixed(1);
      const tag = document.getElementById('tag-' + a.id);
      if (tag) tag.style.transform = 'translate3d(' + x + 'px, ' + y + 'px, 0) translate(-50%, -100%)';
      const proxy = document.getElementById('proxy-' + a.id);
      if (proxy) proxy.style.transform = 'translate3d(' + x + 'px, ' + y + 'px, 0) translate(-50%, -8%)';
    }
  });
  return null;
}

/** Was the last input a keyboard? (Focus is only moved back to objects for keyboard users.) */
let keyboardUser = false;
window.addEventListener('keydown', (e) => {
  if (e.key === 'Tab' || e.key === 'Enter' || e.key === 'Escape') keyboardUser = true;
});
window.addEventListener('pointerdown', () => {
  keyboardUser = false;
});

/** DOM layer: handwritten tags (faintly always-on for touch) and focusable proxy buttons, in Tab order. */
export function ObjectTags({ enabled }: { enabled: boolean }) {
  const ids = useTags((s) => s.ids);
  const hovered = useDesk((s) => s.hovered);
  const setHovered = useDesk((s) => s.setHovered);
  const route = useRoute((s) => s.route);
  const previous = useRoute((s) => s.previous);
  const touch = isTouch();
  const has = (id: string) => ids.some((x) => x.id === id);
  const lastOpen = useRef<string | null>(null);

  // Remember which object opened a view, and return focus to it when the view closes.
  useEffect(() => {
    const obj = ROUTE_OBJECT[route.view];
    if (obj) lastOpen.current = obj;
    if (route.view === 'desk' && previous && previous.view !== 'desk' && lastOpen.current && keyboardUser) {
      const id = lastOpen.current;
      requestAnimationFrame(() => document.getElementById('proxy-' + id)?.focus({ preventScroll: true }));
    }
  }, [route, previous]);

  return (
    <div className="tags">
      {ids.map(({ id, text }) => (
        <span
          key={id}
          id={'tag-' + id}
          aria-hidden="true"
          className={'object-tag' + (enabled && hovered === id ? ' is-on' : enabled && touch ? ' is-faint' : '')}
        >
          {text}
        </span>
      ))}
      <nav className="desk-proxies" aria-label="Things on the desk">
        {DESK_OBJECTS.filter((o) => has(o.id)).map((o) => (
          <button
            key={o.id}
            id={'proxy-' + o.id}
            type="button"
            className="desk-proxy"
            tabIndex={enabled ? 0 : -1}
            aria-label={o.label()}
            onFocus={() => setHovered(o.id)}
            onBlur={() => setHovered(null)}
            onClick={() => {
              setHovered(null);
              o.activate();
            }}
          />
        ))}
      </nav>
    </div>
  );
}
