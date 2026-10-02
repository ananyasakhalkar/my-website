import { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { CanvasTexture, MathUtils, PlaneGeometry, SRGBColorSpace, type Group, type Texture } from 'three';
import { profile } from '../content/profile';
import { navigate, useRoute } from '../app/routes';
import { useDesk } from '../app/store';
import { DESK_TOP } from '../scene/constants';
import { wind } from '../scene/wind';
import { HitProxy } from './HitProxy';
import { registerTag } from '../ui/ObjectTag';

/** Open A5 notebook, angled 8° (DESK_SPEC §4.0/§4.7). */
export const NOTEBOOK = { x: -0.02, z: -0.2, w: 0.296, d: 0.21, rotY: MathUtils.degToRad(8) };

function dotted(ctx: CanvasRenderingContext2D, W: number, H: number) {
  ctx.fillStyle = '#FAF6EC';
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = 'rgba(60,60,80,0.22)';
  for (let y = 40; y < H; y += 36) for (let x = 40; x < W; x += 36) ctx.fillRect(x, y, 3, 3);
}

/** Left page: her name in handwriting; right page: the lede and status, legible from the hero camera. */
async function pageTextures(): Promise<[Texture, Texture]> {
  try {
    await document.fonts.load('600 120px Caveat');
  } catch {
    // generic cursive fallback
  }
  const W = 720;
  const H = 1020;
  const make = (draw: (ctx: CanvasRenderingContext2D) => void) => {
    const c = document.createElement('canvas');
    c.width = W;
    c.height = H;
    const ctx = c.getContext('2d')!;
    dotted(ctx, W, H);
    ctx.fillStyle = '#23304f';
    draw(ctx);
    const t = new CanvasTexture(c);
    t.colorSpace = SRGBColorSpace;
    t.anisotropy = 8;
    return t;
  };
  const wrap = (ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxW: number, lh: number) => {
    let line = '';
    for (const w of text.split(' ')) {
      const test = line ? line + ' ' + w : w;
      if (ctx.measureText(test).width > maxW && line) {
        ctx.fillText(line, x, y);
        y += lh;
        line = w;
      } else line = test;
    }
    ctx.fillText(line, x, y);
    return y + lh;
  };
  const left = make((ctx) => {
    ctx.save();
    ctx.translate(90, 420);
    ctx.rotate(-0.07);
    ctx.font = '600 118px Caveat, cursive';
    ctx.fillText(profile.name.split(' ')[0]!, 0, 0);
    ctx.fillText(profile.name.split(' ').slice(1).join(' '), 60, 120);
    ctx.restore();
  });
  const right = make((ctx) => {
    ctx.font = '600 52px Caveat, cursive';
    const y = wrap(ctx, profile.lede, 70, 150, W - 130, 60);
    ctx.fillStyle = '#9b2c22';
    ctx.font = '600 46px Caveat, cursive';
    wrap(ctx, profile.status, 70, y + 50, W - 130, 54);
  });
  return [left, right];
}

/** The open notebook: intro and "Beyond research" (#/about, #/about/2). */
export function Notebook() {
  const route = useRoute((s) => s.route);
  const hovered = useDesk((s) => s.hovered === 'notebook');
  const onDesk = route.view === 'desk';
  const [pages, setPages] = useState<[Texture, Texture] | null>(null);
  useEffect(() => {
    let made: Texture[] = [];
    let live = true;
    void pageTextures().then((t) => {
      made = t;
      if (live) setPages(t);
      else t.forEach((x) => x.dispose());
    });
    return () => {
      live = false;
      made.forEach((x) => x.dispose());
    };
  }, []);

  const ribbon = useMemo(() => new PlaneGeometry(0.008, 0.07, 1, 8).translate(0, -0.035, 0), []);
  useEffect(() => () => ribbon.dispose(), [ribbon]);

  const root = useRef<Group>(null);
  const ribbonRef = useRef<Group>(null);
  const lift = useRef({ y: 0, v: 0 });
  useEffect(() => (root.current ? registerTag('notebook', 'about me →', root.current, [0, 0.04, -0.08]) : undefined), []);

  useFrame((_, dt) => {
    const l = lift.current;
    const h = Math.min(dt, 0.05);
    l.v += (300 * ((hovered && onDesk ? 0.008 : 0) - l.y) - 22 * l.v) * h;
    l.y += l.v * h;
    if (root.current) root.current.position.y = DESK_TOP + l.y;
    const r = ribbonRef.current;
    if (r) r.rotation.x = -0.3 - (Math.sin(wind.time * 1.7) * 0.08 + wind.gust * 0.25) * wind.motion;
  });

  const pageW = NOTEBOOK.w / 2;
  return (
    <group ref={root} position={[NOTEBOOK.x, DESK_TOP, NOTEBOOK.z]} rotation-y={NOTEBOOK.rotY}>
      {/* Cloth cover under the pages */}
      <mesh position={[0, 0.002, 0]} castShadow receiveShadow>
        <boxGeometry args={[NOTEBOOK.w + 0.012, 0.004, NOTEBOOK.d + 0.01]} />
        <meshStandardMaterial color="#2E4A5C" roughness={0.95} />
      </mesh>
      {/* Page blocks, gently rising toward the spine gutter */}
      {[-1, 1].map((side) => (
        <group key={side} position={[(side * pageW) / 2, 0.007, 0]} rotation-z={side * -0.035}>
          <mesh castShadow receiveShadow>
            <boxGeometry args={[pageW - 0.004, 0.006, NOTEBOOK.d - 0.004]} />
            <meshStandardMaterial color="#F3EEE2" roughness={0.9} />
          </mesh>
          <mesh position-y={0.0031} rotation-x={-Math.PI / 2} receiveShadow>
            <planeGeometry args={[pageW - 0.004, NOTEBOOK.d - 0.004]} />
            <meshStandardMaterial key={pages ? 'tex' : 'none'} map={pages ? pages[side < 0 ? 0 : 1] : null} color={pages ? '#ffffff' : '#FAF6EC'} roughness={0.92} />
          </mesh>
        </group>
      ))}
      {/* Ribbon bookmark over the bottom edge */}
      <group ref={ribbonRef} position={[0.012, 0.009, NOTEBOOK.d / 2]}>
        <mesh geometry={ribbon}>
          <meshStandardMaterial color="#9b2c22" roughness={0.7} side={2} />
        </mesh>
      </group>
      {/* Fountain pen, cap off, across the right page */}
      <group position={[0.1, 0.014, 0.045]} rotation={[0, 0.5, Math.PI / 2]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.0055, 0.0048, 0.11, 16]} />
          <meshStandardMaterial color="#141416" roughness={0.3} metalness={0.2} />
        </mesh>
        <mesh position-y={0.064} castShadow>
          <coneGeometry args={[0.0042, 0.018, 16]} />
          <meshStandardMaterial color="#C9A45A" roughness={0.25} metalness={0.95} />
        </mesh>
      </group>
      <mesh position={[-0.02, 0.009, -0.13]} rotation={[0, -0.3, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.0062, 0.0062, 0.06, 16]} />
        <meshStandardMaterial color="#141416" roughness={0.3} metalness={0.2} />
      </mesh>
      <HitProxy
        id="notebook"
        size={[NOTEBOOK.w, 0.03, NOTEBOOK.d]}
        position={[0, 0.012, 0]}
        enabled={onDesk}
        onActivate={() => navigate({ view: 'about', page: 1 })}
      />
    </group>
  );
}
