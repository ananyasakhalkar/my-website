import { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { CanvasTexture, CatmullRomCurve3, SRGBColorSpace, TubeGeometry, Vector3, type Group, type MeshStandardMaterial, type Texture } from 'three';
import { threads, type Thread } from '../content/research';
import { skills } from '../content/skills';
import { navigate, parseHash, useRoute } from '../app/routes';
import { useDesk } from '../app/store';
import { WALL_Z } from '../scene/constants';
import { cork, seeded } from '../scene/textures';
import { wind } from '../scene/wind';
import { HitProxy } from './HitProxy';
import { registerTag } from '../ui/ObjectTag';

/** Corkboard on the back wall, left of the window (DESK_SPEC §4.8; enlarged to fit the evidence board). */
export const BOARD = { x: -1.72, y: 1.64, z: WALL_Z + 0.014, w: 1.0, h: 0.62 };
const CARD = { w: 0.17, h: 0.11 };
const TOOL = { w: 0.125, h: 0.09 };
const PIN_COLORS = ['#c0392b', '#2e86c1', '#d4ac0d', '#239b56', '#8e44ad'];

/** Short label for an evidence tag: "[2]", "Project 1", "APMSIDC". */
export function tagLabel(route: string, fallback: string): string {
  const r = parseHash(route);
  if (r.view === 'publications') return '[' + r.page + ']';
  if (r.view === 'projects') return 'Project ' + r.page;
  if (r.view === 'experience' && r.id) return r.id.toUpperCase();
  return fallback;
}

export interface BoardTag {
  id: string;
  thread: Thread['id'];
  label: string;
  route: string;
  pos: Vector3; // board-local
}
export interface BoardCard {
  id: string;
  kind: 'thread' | 'tool' | 'photo';
  pos: Vector3;
  rot: number;
}

/** Board layout (board-local metres, origin at the board centre). */
export const layout = (() => {
  const cards: BoardCard[] = [];
  const tags: BoardTag[] = [];
  threads.forEach((t, i) => {
    const x = -0.36 + i * 0.24;
    cards.push({ id: 'thread-' + t.id, kind: 'thread', pos: new Vector3(x, 0.17, 0.009), rot: (i % 2 ? 1 : -1) * 0.035 });
    t.evidence.forEach((e, k) => {
      const n = t.evidence.length;
      tags.push({
        id: 'tag-' + t.id + '-' + k,
        thread: t.id,
        label: tagLabel(e.route, e.label),
        route: e.route,
        pos: new Vector3(x + (k - (n - 1) / 2) * 0.075, -0.015 - (k % 2) * 0.02, 0.009),
      });
    });
  });
  skills.forEach((_, i) => {
    cards.push({ id: 'tool-' + i, kind: 'tool', pos: new Vector3(-0.415 + i * 0.138, -0.2, 0.009), rot: ((i * 7) % 5 - 2) * 0.012 });
  });
  cards.push({ id: 'photo', kind: 'photo', pos: new Vector3(0.4, -0.17, 0.011), rot: 0.08 });
  return { cards, tags };
})();

async function fonts() {
  try {
    await Promise.all([document.fonts.load('500 44px Newsreader'), document.fonts.load('700 26px "Courier Prime"'), document.fonts.load('600 40px Caveat')]);
  } catch {
    // generic fallbacks
  }
}

function canvas(w: number, h: number, bg: string) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const x = c.getContext('2d')!;
  x.fillStyle = bg;
  x.fillRect(0, 0, w, h);
  return { c, x };
}
function wrap(x: CanvasRenderingContext2D, text: string, left: number, y: number, maxW: number, lh: number, maxLines = 99) {
  let line = '';
  let lines = 0;
  for (const w of text.split(' ')) {
    const test = line ? line + ' ' + w : w;
    if (x.measureText(test).width > maxW && line) {
      x.fillText(line, left, y);
      y += lh;
      line = w;
      if (++lines >= maxLines - 1) break;
    } else line = test;
  }
  x.fillText(line, left, y);
  return y + lh;
}
const tex = (c: HTMLCanvasElement) => {
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  t.anisotropy = 8;
  return t;
};

async function cardTextures(): Promise<Map<string, Texture>> {
  await fonts();
  const out = new Map<string, Texture>();
  for (const t of threads) {
    const { c, x } = canvas(680, 440, '#FBF8EF');
    x.strokeStyle = 'rgba(192,57,43,0.55)';
    x.lineWidth = 3;
    x.beginPath();
    x.moveTo(0, 96);
    x.lineTo(680, 96);
    x.stroke();
    x.strokeStyle = 'rgba(46,134,193,0.25)';
    x.lineWidth = 2;
    for (let y = 150; y < 440; y += 50) {
      x.beginPath();
      x.moveTo(0, y);
      x.lineTo(680, y);
      x.stroke();
    }
    x.fillStyle = '#b3261e';
    x.font = '700 40px "Courier Prime", monospace';
    x.fillText(t.id, 34, 68);
    x.fillStyle = '#1b1b1d';
    x.font = '500 46px Newsreader, Georgia, serif';
    wrap(x, t.title, 34, 190, 612, 58, 3);
    out.set('thread-' + t.id, tex(c));
  }
  skills.forEach((g, i) => {
    const { c, x } = canvas(500, 360, '#F4F1E6');
    x.fillStyle = '#1b1b1d';
    x.font = '700 30px "Courier Prime", monospace';
    x.fillText(g.group.toUpperCase(), 28, 56);
    x.fillStyle = '#3b3b3f';
    x.font = '400 27px Newsreader, Georgia, serif';
    wrap(x, g.items.join(' · '), 28, 110, 444, 34, 7);
    out.set('tool-' + i, tex(c));
  });
  for (const t of layout.tags) {
    const { c, x } = canvas(300, 116, '#F7F2E4');
    x.fillStyle = '#1b1b1d';
    x.font = '700 50px "Courier Prime", monospace';
    x.textAlign = 'center';
    x.textBaseline = 'middle';
    x.fillText(t.label, 150, 64);
    out.set(t.id, tex(c));
  }
  // Polaroid: a procedurally generated, blurred patchwork of fields seen from above (no real imagery).
  {
    const { c, x } = canvas(400, 480, '#FBFBF7');
    const r = seeded(33);
    x.save();
    x.beginPath();
    x.rect(26, 26, 348, 348);
    x.clip();
    x.filter = 'blur(2px)';
    for (let i = 0; i < 70; i++) {
      const g = 90 + r() * 90;
      x.fillStyle = r() > 0.7 ? 'rgb(' + (g + 40) + ',' + (g + 20) + ',' + 70 + ')' : 'rgb(' + 60 + ',' + g + ',' + 50 + ')';
      x.save();
      x.translate(26 + r() * 348, 26 + r() * 348);
      x.rotate(0.35);
      x.fillRect(-60, -30, 60 + r() * 90, 30 + r() * 60);
      x.restore();
    }
    x.restore();
    x.fillStyle = '#23304f';
    x.font = '600 40px Caveat, cursive';
    x.fillText('sentinel-2 ✦', 120, 440);
    out.set('photo', tex(c));
  }
  return out;
}

/** The corkboard evidence board: thread cards, tools cards, a polaroid, red strings to evidence tags. */
export function Corkboard() {
  const route = useRoute((s) => s.route);
  const hovered = useDesk((s) => s.hovered);
  const onDesk = route.view === 'desk';
  const onBoard = route.view === 'board';
  const [textures, setTextures] = useState<Map<string, Texture> | null>(null);
  const corkTex = useMemo(() => cork(), []);

  useEffect(() => {
    corkTex.map.repeat.set(3.4, 2.1);
    corkTex.bump.repeat.set(3.4, 2.1);
    return () => {
      corkTex.map.dispose();
      corkTex.bump.dispose();
    };
  }, [corkTex]);
  useEffect(() => {
    let made: Texture[] = [];
    let live = true;
    void cardTextures().then((m) => {
      made = [...m.values()];
      if (live) setTextures(m);
      else made.forEach((t) => t.dispose());
    });
    return () => {
      live = false;
      made.forEach((t) => t.dispose());
    };
  }, []);

  // Red strings: from the thread card's bottom pin to each of its evidence tags, with a little sag.
  const strings = useMemo(
    () =>
      layout.tags.map((t) => {
        const card = layout.cards.find((c) => c.id === 'thread-' + t.thread)!;
        const a = new Vector3(card.pos.x, card.pos.y - CARD.h / 2 + 0.012, 0.016);
        const b = new Vector3(t.pos.x, t.pos.y + 0.012, 0.016);
        const mid = a.clone().lerp(b, 0.5);
        mid.y -= 0.012;
        mid.z += 0.004;
        return { id: t.id, thread: t.thread, geo: new TubeGeometry(new CatmullRomCurve3([a, mid, b]), 16, 0.0012, 5, false) };
      }),
    [],
  );
  useEffect(() => () => strings.forEach((s) => s.geo.dispose()), [strings]);

  const root = useRef<Group>(null);
  const cardRefs = useRef<Map<string, Group>>(new Map());
  const stringMats = useRef<Map<string, MeshStandardMaterial>>(new Map());
  useEffect(() => (root.current ? registerTag('board', 'research board →', root.current, [0.2, -0.36, 0.05]) : undefined), []);

  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size);
  const v = useMemo(() => new Vector3(), []);

  useFrame(() => {
    // Keep the focusable DOM buttons aligned over each evidence tag (CSSOM styles).
    const g = root.current;
    if (g && onBoard) {
      for (const t of layout.tags) {
        const el = document.getElementById('board-' + t.id);
        if (!el) continue;
        v.copy(t.pos);
        g.localToWorld(v);
        v.project(camera);
        el.style.left = ((v.x * 0.5 + 0.5) * size.width).toFixed(1) + 'px';
        el.style.top = ((-v.y * 0.5 + 0.5) * size.height).toFixed(1) + 'px';
      }
    }
    // Cards lift slightly on gusts.
    let i = 0;
    for (const [id, g] of cardRefs.current) {
      const c = layout.cards.find((x) => x.id === id)!;
      g.rotation.set(-Math.max(0, wind.gust) * 0.05 * wind.motion * (0.6 + (i++ % 3) * 0.3), 0, c.rot);
    }
    const hot = hovered && hovered.startsWith('thread-') ? hovered.slice(7) : null;
    for (const s of strings) {
      const m = stringMats.current.get(s.id);
      if (m) m.emissiveIntensity = hot === s.thread ? 1.4 : 0.15;
    }
  });

  return (
    <group ref={root} position={[BOARD.x, BOARD.y, BOARD.z]}>
      <mesh receiveShadow>
        <boxGeometry args={[BOARD.w, BOARD.h, 0.012]} />
        <meshStandardMaterial map={corkTex.map} bumpMap={corkTex.bump} bumpScale={1.2} roughness={0.95} />
      </mesh>
      {[
        [0, BOARD.h / 2 + 0.012, BOARD.w + 0.05, 0.025],
        [0, -BOARD.h / 2 - 0.012, BOARD.w + 0.05, 0.025],
        [-BOARD.w / 2 - 0.012, 0, 0.025, BOARD.h],
        [BOARD.w / 2 + 0.012, 0, 0.025, BOARD.h],
      ].map(([x, y, w, h], i) => (
        <mesh key={i} position={[x!, y!, 0.006]} castShadow receiveShadow>
          <boxGeometry args={[w!, h!, 0.025]} />
          <meshStandardMaterial color="#9C6B45" roughness={0.55} />
        </mesh>
      ))}

      {layout.cards.map((c, i) => {
        const size = c.kind === 'thread' ? CARD : c.kind === 'tool' ? TOOL : { w: 0.1, h: 0.12 };
        const t = textures?.get(c.id);
        return (
          <group key={c.id} position={c.pos} ref={(g) => { if (g) cardRefs.current.set(c.id, g); }}>
            <mesh castShadow>
              <planeGeometry args={[size.w, size.h]} />
              <meshStandardMaterial key={t ? 'tex' : 'none'} map={t ?? null} color={t ? '#ffffff' : '#FBF8EF'} roughness={0.9} />
            </mesh>
            <mesh position={[c.kind === 'tool' ? size.w / 2 - 0.016 : 0, size.h / 2 - 0.012, 0.008]} castShadow>
              <sphereGeometry args={[0.0075, 12, 10]} />
              <meshStandardMaterial color={PIN_COLORS[i % PIN_COLORS.length]} roughness={0.3} />
            </mesh>
            {c.kind === 'thread' && (
              <mesh position={[0, -size.h / 2 + 0.012, 0.008]}>
                <sphereGeometry args={[0.005, 10, 8]} />
                <meshStandardMaterial color="#c0392b" roughness={0.3} />
              </mesh>
            )}
            {c.kind !== 'photo' && (
              <HitProxy id={c.id} size={[size.w, size.h, 0.01]} enabled={onBoard} onActivate={() => undefined} />
            )}
          </group>
        );
      })}

      {layout.tags.map((t) => (
        <group key={t.id} position={t.pos}>
          <mesh castShadow>
            <planeGeometry args={[0.062, 0.024]} />
            <meshStandardMaterial key={textures ? 'tex' : 'none'} map={textures?.get(t.id) ?? null} color={textures ? '#ffffff' : '#F7F2E4'} roughness={0.9} />
          </mesh>
          <mesh position={[0, 0.012, 0.006]}>
            <sphereGeometry args={[0.0045, 10, 8]} />
            <meshStandardMaterial color="#c0392b" roughness={0.3} />
          </mesh>
          <HitProxy id={t.id} size={[0.062, 0.024, 0.01]} enabled={onBoard} onActivate={() => { window.location.hash = t.route; }} />
        </group>
      ))}

      {strings.map((s) => (
        <mesh key={s.id} geometry={s.geo}>
          <meshStandardMaterial
            ref={(m) => { if (m) stringMats.current.set(s.id, m); }}
            color="#b3261e"
            emissive="#ff3b2f"
            emissiveIntensity={0.15}
            roughness={0.6}
          />
        </mesh>
      ))}

      <HitProxy id="board" size={[BOARD.w, BOARD.h, 0.03]} enabled={onDesk} onActivate={() => navigate({ view: 'board' })} />
    </group>
  );
}
