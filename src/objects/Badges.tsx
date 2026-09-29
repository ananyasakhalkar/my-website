import { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import {
  CanvasTexture,
  CatmullRomCurve3,
  MathUtils,
  Quaternion,
  SRGBColorSpace,
  TubeGeometry,
  Vector3,
  type Group,
  type Texture,
} from 'three';
import { experience, type Role } from '../content/experience';
import { navigate, useRoute } from '../app/routes';
import { useDesk } from '../app/store';
import { useView, viewProgress } from '../app/viewStore';
import { DESK_TOP } from '../scene/constants';
import { seeded } from '../scene/textures';
import { HitProxy } from './HitProxy';
import { registerTag } from '../ui/ObjectTag';

/** Neutral band colours (no logos): Jio blue, APMSIDC teal, Reliance maroon, freelance graphite. */
export const BAND: Record<Role['id'], string> = {
  jio: '#1B3A6B',
  apmsidc: '#1F6F6F',
  reliance: '#7A2230',
  freelance: '#3A3D42',
};
const BADGE = { w: 0.054, h: 0.086 };
export const BADGES = { x: 0.36, z: -0.26 };

async function badgeTexture(role: Role, back: boolean): Promise<Texture> {
  try {
    await Promise.all([document.fonts.load('600 44px Geist'), document.fonts.load('700 30px "Courier Prime"')]);
  } catch {
    // generic fallbacks
  }
  const W = 512;
  const H = 816;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const x = c.getContext('2d')!;
  x.fillStyle = '#FBF8F2';
  x.fillRect(0, 0, W, H);
  x.fillStyle = BAND[role.id];
  x.fillRect(0, 0, W, back ? H : 210);
  // Clip slot.
  x.fillStyle = back ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.25)';
  x.beginPath();
  x.roundRect(W / 2 - 60, 50, 120, 22, 11);
  x.fill();
  if (!back) {
    const wrap = (text: string, font: string, y: number, lh: number, maxW: number) => {
      x.font = font;
      const words = text.split(' ');
      let line = '';
      for (const w of words) {
        const test = line ? `${line} ${w}` : w;
        if (x.measureText(test).width > maxW && line) {
          x.fillText(line, 48, y);
          y += lh;
          line = w;
        } else line = test;
      }
      x.fillText(line, 48, y);
      return y + lh;
    };
    x.fillStyle = '#1b1b1d';
    x.textBaseline = 'alphabetic';
    let y = wrap(role.org, '600 50px Geist, system-ui, sans-serif', 330, 60, W - 96);
    x.fillStyle = '#4a4540';
    y = wrap(role.role, '400 38px Geist, system-ui, sans-serif', y + 20, 48, W - 96);
    x.fillStyle = BAND[role.id];
    x.font = '700 30px "Courier Prime", monospace';
    x.fillText(role.dates.toUpperCase(), 48, H - 70);
  }
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

const easeInOut = (t: number) => (t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2);
const UP = new Vector3(0, 1, 0);
const FLAT = new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), -Math.PI / 2);

function useBadgeTextures() {
  const [tex, setTex] = useState<{ front: Texture; back: Texture }[] | null>(null);
  useEffect(() => {
    let live = true;
    let made: Texture[] = [];
    void Promise.all(experience.map(async (r) => ({ front: await badgeTexture(r, false), back: await badgeTexture(r, true) }))).then((t) => {
      made = t.flatMap((x) => [x.front, x.back]);
      if (live) setTex(t);
      else made.forEach((m) => m.dispose());
    });
    return () => {
      live = false;
      made.forEach((m) => m.dispose());
    };
  }, []);
  return tex;
}

/** Four clip-on ID badges on lanyards; they fan out in the air and flip to show each role (DESK_SPEC §4.6). */
export function Badges() {
  const route = useRoute((s) => s.route);
  const hovered = useDesk((s) => s.hovered);
  const onDesk = route.view === 'desk';
  const selected = route.view === 'experience' ? route.id : null;
  const camera = useThree((s) => s.camera);
  const tex = useBadgeTextures();

  const layout = useMemo(() => {
    const r = seeded(808);
    return experience.map((_, i) => ({
      desk: new Vector3(BADGES.x + (r() - 0.5) * 0.09, DESK_TOP + 0.001 + i * 0.0014, BADGES.z + (r() - 0.5) * 0.06),
      rot: (r() - 0.5) * 1.2,
    }));
  }, []);
  const lanyards = useMemo(
    () =>
      experience.map((role, i) => {
        const r = seeded(90 + i);
        const c = layout[i]!.desk;
        const pts = Array.from({ length: 9 }, (_, k) => {
          const a = (k / 9) * Math.PI * 2;
          const rad = 0.055 + r() * 0.02;
          return new Vector3(c.x + 0.02 + Math.cos(a) * rad * 1.3, DESK_TOP + 0.003 + i * 0.001, c.z - 0.05 + Math.sin(a) * rad * 0.7);
        });
        return { geo: new TubeGeometry(new CatmullRomCurve3(pts, true), 64, 0.0035, 6, true), color: BAND[role.id] };
      }),
    [layout],
  );
  useEffect(() => () => lanyards.forEach((l) => l.geo.dispose()), [lanyards]);

  const refs = useRef<(Group | null)[]>([]);
  const lanyardRefs = useRef<(Group | null)[]>([]);
  const deskRoot = useRef<Group>(null);
  const flip = useRef(experience.map(() => 0));
  const lift = useRef({ y: 0, v: 0 });
  const tmp = useMemo(() => ({ p: new Vector3(), q: new Quaternion(), q2: new Quaternion(), off: new Vector3() }), []);
  useEffect(() => (deskRoot.current ? registerTag('badges', 'experience →', deskRoot.current, [0, 0.04, -0.02]) : undefined), []);

  useFrame((_, dt) => {
    const v = useView.getState();
    const mine = v.key === 'experience';
    const p = viewProgress();
    let u = 0; // 0 on the desk, 1 fanned out in the air
    if (mine && v.phase === 'opening') u = easeInOut(MathUtils.clamp((p - 0.1) / 0.8, 0, 1));
    else if (mine && v.phase === 'rest') u = 1;
    else if (mine && v.phase === 'closing') u = 1 - easeInOut(p);

    const l = lift.current;
    const h = Math.min(dt, 0.05);
    l.v += (300 * ((hovered === 'badges' && onDesk ? 0.01 : 0) - l.y) - 22 * l.v) * h;
    l.y += l.v * h;

    experience.forEach((role, i) => {
      const g = refs.current[i];
      if (!g) return;
      const isSel = selected === role.id;
      // Fan: a hand of cards in front of the camera, most recent (index 0) in front.
      const n = experience.length;
      const a = ((n - 1) / 2 - i) * 0.3;
      tmp.off.set(Math.sin(a) * 0.075, Math.cos(a) * 0.075 - 0.09, -0.3 - i * 0.004);
      let tilt = a;
      if (selected) {
        if (isSel) {
          tmp.off.set(0, -0.005, -0.17);
          tilt = 0;
        } else tmp.off.y -= 0.05; // the others drop down out of the way
      }
      tmp.p.copy(tmp.off).applyQuaternion(camera.quaternion).add(camera.position);
      tmp.q.copy(camera.quaternion).multiply(tmp.q2.setFromAxisAngle(new Vector3(0, 0, 1), tilt));
      // Flip the selected badge over to show its back.
      const f = flip.current;
      f[i] = MathUtils.damp(f[i]!, isSel && u > 0.99 ? 1 : 0, 7, dt);
      tmp.q.multiply(tmp.q2.setFromAxisAngle(UP, Math.PI * easeInOut(MathUtils.clamp(f[i]!, 0, 1))));

      const d = layout[i]!;
      const deskQ = new Quaternion().setFromAxisAngle(UP, d.rot).multiply(FLAT);
      g.position.lerpVectors(d.desk, tmp.p, u);
      g.position.y += (1 - u) * l.y + Math.sin(Math.PI * u) * 0.05;
      g.quaternion.slerpQuaternions(deskQ, tmp.q, u);
      const ly = lanyardRefs.current[i];
      if (ly) ly.visible = u < 0.05;
    });
  });

  return (
    <>
      {experience.map((role, i) => (
        <group key={role.id} ref={(g) => { refs.current[i] = g; }}>
          <mesh castShadow receiveShadow>
            <boxGeometry args={[BADGE.w, BADGE.h, 0.0009]} />
            <meshStandardMaterial color="#F4F0E8" roughness={0.4} />
          </mesh>
          {tex && (
            <>
              <mesh position-z={0.0005}>
                <planeGeometry args={[BADGE.w, BADGE.h]} />
                <meshStandardMaterial map={tex[i]!.front} roughness={0.35} />
              </mesh>
              <mesh position-z={-0.0005} rotation-y={Math.PI}>
                <planeGeometry args={[BADGE.w, BADGE.h]} />
                <meshStandardMaterial map={tex[i]!.back} roughness={0.35} />
              </mesh>
            </>
          )}
          {/* Clip */}
          <mesh position={[0, BADGE.h / 2 + 0.005, 0]}>
            <boxGeometry args={[0.012, 0.012, 0.002]} />
            <meshStandardMaterial color="#b9bec4" metalness={0.9} roughness={0.3} />
          </mesh>
          {route.view === 'experience' && (
            <HitProxy
              id={`badge-${role.id}`}
              size={[BADGE.w, BADGE.h, 0.01]}
              enabled={selected !== role.id}
              onActivate={() => navigate({ view: 'experience', id: role.id })}
            />
          )}
        </group>
      ))}
      {lanyards.map((l, i) => (
        <group key={i} ref={(g) => { lanyardRefs.current[i] = g; }}>
          <mesh geometry={l.geo} castShadow receiveShadow>
            <meshStandardMaterial color={l.color} roughness={0.9} />
          </mesh>
        </group>
      ))}
      <group ref={deskRoot} position={[BADGES.x, DESK_TOP, BADGES.z]}>
        <HitProxy id="badges" size={[0.15, 0.02, 0.12]} position={[0, 0.01, 0]} enabled={onDesk} onActivate={() => navigate({ view: 'experience', id: null })} />
      </group>
    </>
  );
}
