import { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { CanvasTexture, SRGBColorSpace, type Group, type Texture } from 'three';
import { publications } from '../content/publications';
import { navigate, useRoute } from '../app/routes';
import { useDesk } from '../app/store';
import { DESK_TOP } from '../scene/constants';
import { seeded } from '../scene/textures';
import { HitProxy } from './HitProxy';
import { registerTag } from '../ui/ObjectTag';
import { pageTexture } from '../reader/pageTextures';

/** Journal stack placement (DESK_SPEC §4.0): partly on the felt mat, top toward the window. */
export const JOURNALS = { x: -0.46, z: -0.2, y: DESK_TOP + 0.003, rotY: -0.06 };
const SHEET = 0.0006;
export const JOURNAL_TOP = JOURNALS.y + SHEET * publications.length;

async function stickyNote(text: string): Promise<Texture> {
  try {
    await document.fonts.load('600 110px Caveat');
  } catch {
    // generic cursive fallback
  }
  const c = document.createElement('canvas');
  c.width = 384;
  c.height = 384;
  const ctx = c.getContext('2d')!;
  const g = ctx.createLinearGradient(0, 0, 0, 384);
  g.addColorStop(0, '#f7df7a');
  g.addColorStop(1, '#efd063');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 384, 384);
  ctx.fillStyle = 'rgba(0,0,0,0.06)';
  ctx.fillRect(0, 0, 384, 44); // adhesive strip
  ctx.fillStyle = '#2b2a6a';
  ctx.font = '600 92px Caveat, "Segoe Print", cursive';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.save();
  ctx.translate(192, 205);
  ctx.rotate(-0.06);
  ctx.fillText(text, 0, 0);
  ctx.restore();
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

/** Four stapled papers, a black binder clip and a sticky note: opens the publications reader. */
export function JournalStack() {
  const route = useRoute((s) => s.route);
  const hovered = useDesk((s) => s.hovered === 'journals');
  const onDesk = route.view === 'desk';
  const [note, setNote] = useState<Texture | null>(null);
  const top = useMemo(() => pageTexture('publications', 1), []);

  useEffect(() => {
    let tex: Texture | null = null;
    let live = true;
    void stickyNote('publications').then((t) => {
      if (!live) return t.dispose();
      tex = t;
      setNote(t);
    });
    return () => {
      live = false;
      tex?.dispose();
    };
  }, []);

  const sheets = useMemo(() => {
    const r = seeded(512);
    return publications.map((_, i) => ({ dx: (r() - 0.5) * 0.008, dz: (r() - 0.5) * 0.008, rot: (r() - 0.5) * 0.05, y: SHEET * (i + 0.5) }));
  }, []);

  const root = useRef<Group>(null);
  const lift = useRef({ y: 0, v: 0 });
  useEffect(() => (root.current ? registerTag('journals', 'publications →', root.current, [0.02, 0.05, -0.05]) : undefined), []);

  useFrame((_, dt) => {
    const l = lift.current;
    const h = Math.min(dt, 0.05);
    l.v += (300 * ((hovered && onDesk ? 0.01 : 0) - l.y) - 22 * l.v) * h;
    l.y += l.v * h;
    if (root.current) root.current.position.y = JOURNALS.y + l.y;
  });

  return (
    <group ref={root} position={[JOURNALS.x, JOURNALS.y, JOURNALS.z]} rotation-y={JOURNALS.rotY}>
      {sheets.map((s, i) => (
        <mesh key={i} position={[s.dx, s.y, s.dz]} rotation-y={s.rot} castShadow receiveShadow>
          <boxGeometry args={[0.21, SHEET * 0.8, 0.297]} />
          <meshStandardMaterial color={i % 2 ? '#f6f2e8' : '#fbf8f1'} roughness={0.9} />
        </mesh>
      ))}
      {/* Title page of the top paper (the same baked page the reader flies) */}
      <mesh position={[0, SHEET * publications.length + 0.0002, 0]} rotation-x={-Math.PI / 2} receiveShadow>
        <planeGeometry args={[0.21, 0.297]} />
        <meshStandardMaterial map={top} roughness={0.9} />
      </mesh>
      {/* Staple and black binder clip on the top edge */}
      <mesh position={[-0.085, SHEET * publications.length + 0.0006, -0.135]} rotation-y={0.7}>
        <boxGeometry args={[0.014, 0.0008, 0.0016]} />
        <meshStandardMaterial color="#9aa0a6" metalness={0.9} roughness={0.3} />
      </mesh>
      <group position={[0.02, SHEET * publications.length, -0.145]}>
        <mesh position={[0, 0.004, 0.006]} castShadow>
          <boxGeometry args={[0.05, 0.008, 0.02]} />
          <meshStandardMaterial color="#141414" roughness={0.35} metalness={0.2} />
        </mesh>
        {[-0.016, 0.016].map((x) => (
          <mesh key={x} position={[x, 0.014, -0.004]} rotation-x={-0.9} castShadow>
            <torusGeometry args={[0.008, 0.0011, 6, 16, Math.PI]} />
            <meshStandardMaterial color="#b9bec4" metalness={0.95} roughness={0.25} />
          </mesh>
        ))}
      </group>
      {/* Sticky note */}
      {note && (
        <mesh position={[0.05, SHEET * publications.length + 0.0006, 0.07]} rotation={[-Math.PI / 2, 0, 0.12]} castShadow>
          <planeGeometry args={[0.076, 0.076]} />
          <meshStandardMaterial map={note} roughness={0.8} />
        </mesh>
      )}
      <HitProxy
        id="journals"
        size={[0.22, 0.03, 0.3]}
        position={[0, 0.015, 0]}
        enabled={onDesk}
        onActivate={() => navigate({ view: 'publications', page: 1 })}
      />
    </group>
  );
}
