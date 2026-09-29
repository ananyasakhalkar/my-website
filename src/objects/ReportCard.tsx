import { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { CanvasTexture, MathUtils, Quaternion, SRGBColorSpace, Vector3, type Group, type MeshStandardMaterial, type Texture } from 'three';
import { profile } from '../content/profile';
import { education } from '../content/education';
import { navigate, useRoute } from '../app/routes';
import { useDesk } from '../app/store';
import { useView, viewProgress } from '../app/viewStore';
import { DESK_TOP } from '../scene/constants';
import { HitProxy } from './HitProxy';
import { registerTag } from '../ui/ObjectTag';

/** Report card placement (DESK_SPEC §4.0), portrait on the desk, rotated −7°. */
export const CARD = { x: -0.08, z: 0.24, w: 0.16, d: 0.22, rotY: MathUtils.degToRad(-7) };

async function coverTexture(): Promise<Texture> {
  try {
    await Promise.all([document.fonts.load('700 40px "Courier Prime"'), document.fonts.load('400 40px Newsreader')]);
  } catch {
    // generic fallbacks
  }
  const W = 640;
  const H = 880;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const x = c.getContext('2d')!;
  x.fillStyle = '#F3E9D2';
  x.fillRect(0, 0, W, H);
  // Embossed double border.
  x.strokeStyle = 'rgba(31,42,68,0.55)';
  x.lineWidth = 4;
  x.strokeRect(28, 28, W - 56, H - 56);
  x.lineWidth = 1.5;
  x.strokeRect(40, 40, W - 80, H - 80);
  x.fillStyle = '#1F2A44';
  x.textAlign = 'center';
  x.font = '700 50px "Courier Prime", monospace';
  x.fillText('R E P O R T   C A R D', W / 2, 190);
  x.fillRect(150, 222, W - 300, 3);
  x.textAlign = 'left';
  x.font = '400 34px "Courier Prime", monospace';
  x.fillText('Name:', 80, 430);
  x.fillText('Session', 80, 540);
  x.font = '400 40px Newsreader, Georgia, serif';
  x.fillText(profile.name, 200, 430);
  x.fillText(education.session, 240, 540);
  x.fillStyle = 'rgba(31,42,68,0.45)';
  x.fillRect(190, 442, 370, 2);
  x.fillRect(230, 552, 330, 2);
  // Pencil tick doodle.
  x.strokeStyle = 'rgba(70,70,70,0.55)';
  x.lineWidth = 5;
  x.lineCap = 'round';
  x.beginPath();
  x.moveTo(470, 720);
  x.lineTo(495, 750);
  x.lineTo(545, 680);
  x.stroke();
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

const easeInOut = (t: number) => (t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2);
const FLAT = new Quaternion()
  .setFromAxisAngle(new Vector3(0, 1, 0), CARD.rotY)
  .multiply(new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), -Math.PI / 2));
const HOME = new Vector3(CARD.x, DESK_TOP + 0.002, CARD.z);

/** The report card: lifts on hover, flies up to be opened (the spread itself is crisp DOM). */
export function ReportCard() {
  const route = useRoute((s) => s.route);
  const hovered = useDesk((s) => s.hovered === 'report-card');
  const onDesk = route.view === 'desk';
  const camera = useThree((s) => s.camera);
  const [cover, setCover] = useState<Texture | null>(null);
  useEffect(() => {
    let tex: Texture | null = null;
    let live = true;
    void coverTexture().then((t) => {
      if (!live) return t.dispose();
      tex = t;
      setCover(t);
    });
    return () => {
      live = false;
      tex?.dispose();
    };
  }, []);

  const root = useRef<Group>(null);
  const card = useRef<Group>(null);
  const mats = useRef<MeshStandardMaterial[]>([]);
  const lift = useRef({ y: 0, v: 0 });
  const tmp = useMemo(() => ({ p: new Vector3(), q: new Quaternion(), f: new Vector3() }), []);
  useEffect(() => (root.current ? registerTag('report-card', 'report card →', root.current, [0, 0.04, -0.06]) : undefined), []);

  useFrame((_, dt) => {
    const g = card.current;
    if (!g) return;
    const l = lift.current;
    const h = Math.min(dt, 0.05);
    l.v += (300 * ((hovered && onDesk ? 0.01 : 0) - l.y) - 22 * l.v) * h;
    l.y += l.v * h;

    const v = useView.getState();
    const mine = v.key === 'report-card';
    const p = viewProgress();
    // 0 on the desk, 1 held up in front of the camera.
    let u = 0;
    if (mine && v.phase === 'opening') u = easeInOut(MathUtils.clamp((p - 0.15) / 0.75, 0, 1));
    else if (mine && v.phase === 'rest') u = 1;
    else if (mine && v.phase === 'closing') u = 1 - easeInOut(p);

    tmp.f.set(0, 0, -0.5).applyQuaternion(camera.quaternion);
    tmp.p.copy(camera.position).add(tmp.f);
    g.position.lerpVectors(HOME, tmp.p, u);
    g.position.y += l.y + Math.sin(Math.PI * u) * 0.06;
    g.quaternion.slerpQuaternions(FLAT, camera.quaternion, u);
    // Hand over to the DOM spread: fade out as it arrives, fade back in as it leaves.
    const opacity = mine && v.phase === 'rest' ? 0 : 1 - MathUtils.smoothstep(u, 0.75, 1);
    mats.current.forEach((m) => {
      m.opacity = opacity;
      m.transparent = opacity < 1;
    });
    g.visible = opacity > 0.01;
    // Hover: the corner curls up a little.
    g.rotateX(hovered && onDesk ? -0.05 : 0);
  });

  return (
    <>
      {/* The card moves in world space (desk → in front of the camera). */}
      <group ref={card} position={HOME.toArray()}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[CARD.w, CARD.d, 0.0012]} />
          <meshStandardMaterial ref={(m) => { if (m) mats.current[0] = m; }} color="#EADFC5" roughness={0.85} />
        </mesh>
        <mesh position-z={0.0007}>
          <planeGeometry args={[CARD.w, CARD.d]} />
          <meshStandardMaterial
            key={cover ? 'tex' : 'none'}
            ref={(m) => { if (m) mats.current[1] = m; }}
            map={cover}
            color={cover ? '#ffffff' : '#F3E9D2'}
            roughness={0.85}
          />
        </mesh>
      </group>
      <group ref={root} position={HOME.toArray()}>
      <HitProxy
        id="report-card"
        size={[CARD.w, 0.02, CARD.d]}
        position={[0, 0.01, 0]}
        enabled={onDesk}
        onActivate={() => navigate({ view: 'report-card' })}
      />
      </group>
    </>
  );
}
