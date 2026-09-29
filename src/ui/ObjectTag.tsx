/**
 * Object tags live in the DOM (crisp, CSP-friendly) and are positioned every frame by a projector inside
 * the canvas. The same anchors will carry the keyboard / screen-reader proxy buttons (M6).
 */
import { useFrame, useThree } from '@react-three/fiber';
import { Vector3, type Object3D } from 'three';
import { create } from 'zustand';
import { isTouch } from '../app/capabilities';
import { useDesk } from '../app/store';

interface Anchor {
  id: string;
  text: string;
  object: Object3D;
  offset: Vector3;
}

const anchors = new Map<string, Anchor>();
const useTags = create<{ ids: { id: string; text: string }[] }>(() => ({ ids: [] }));

/** Register an object's tag (called from inside the canvas). Returns an unregister function. */
export function registerTag(id: string, text: string, object: Object3D, offset: [number, number, number]) {
  anchors.set(id, { id, text, object, offset: new Vector3(...offset) });
  useTags.setState({ ids: [...anchors.values()].map((a) => ({ id: a.id, text: a.text })) });
  return () => {
    anchors.delete(id);
    useTags.setState({ ids: [...anchors.values()].map((a) => ({ id: a.id, text: a.text })) });
  };
}

const v = new Vector3();
/** Projects every registered anchor to screen space and moves its DOM tag (CSSOM transform). */
export function TagProjector() {
  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size);
  useFrame(() => {
    for (const a of anchors.values()) {
      const el = document.getElementById(`tag-${a.id}`);
      if (!el) continue;
      v.copy(a.offset);
      a.object.localToWorld(v);
      v.project(camera);
      const x = (v.x * 0.5 + 0.5) * size.width;
      const y = (-v.y * 0.5 + 0.5) * size.height;
      el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) translate(-50%, -100%)`;
    }
  });
  return null;
}

/** The DOM layer of handwritten tags (faintly always-on for touch). */
export function ObjectTags({ enabled }: { enabled: boolean }) {
  const ids = useTags((s) => s.ids);
  const hovered = useDesk((s) => s.hovered);
  const touch = isTouch();
  return (
    <div className="tags" aria-hidden="true">
      {ids.map(({ id, text }) => (
        <span
          key={id}
          id={`tag-${id}`}
          className={`object-tag${enabled && hovered === id ? ' is-on' : enabled && touch ? ' is-faint' : ''}`}
        >
          {text}
        </span>
      ))}
    </div>
  );
}
