import { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { MathUtils, type Group, type Texture } from 'three';
import { projects } from '../content/projects';
import { navigate, useRoute } from '../app/routes';
import { useDesk } from '../app/store';
import { T, useReader } from '../reader/readerStore';
import { DESK_TOP } from '../scene/constants';
import { seeded } from '../scene/textures';
import { wind } from '../scene/wind';
import { HitProxy } from './HitProxy';
import { registerTag } from '../ui/ObjectTag';
import { folderCoverTexture } from './folderTexture';

/** Folder placement on the felt mat (DESK_SPEC §4.0), sizes in metres. */
export const FOLDER = { x: -0.44, z: 0.12, w: 0.31, d: 0.24, y: DESK_TOP + 0.003, rotY: 0.04 };
const CARD = 0.0016;
const SHEET = 0.0004;
const MANILA = '#E3C98F';

const outBack = (t: number, s = 1.2) => 1 + (s + 1) * (t - 1) ** 3 + s * (t - 1) ** 2;
const inOutCubic = (t: number) => (t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2);

/** Height of the top of the paper stack above the folder's back cover. */
export const STACK_TOP = CARD + SHEET * projects.length;

/** The PROJECTS folder: hinged cover, peeking paper edges, hover lift; opens the project reader. */
export function ProjectsFolder() {
  const route = useRoute((s) => s.route);
  const hovered = useDesk((s) => s.hovered === 'folder');
  const onDesk = route.view === 'desk';
  const [cover, setCover] = useState<Texture | null>(null);

  useEffect(() => {
    let tex: Texture | null = null;
    let live = true;
    void folderCoverTexture('PROJECTS', `${projects.length} enclosed`).then((t) => {
      if (live) {
        tex = t;
        setCover(t);
      } else t.dispose();
    });
    return () => {
      live = false;
      tex?.dispose();
    };
  }, []);

  const sheets = useMemo(() => {
    const r = seeded(77);
    return projects.map((_, i) => ({
      y: CARD + SHEET * (i + 0.5),
      dx: (r() - 0.5) * 0.008,
      dz: 0.012 + r() * 0.02, // peek out at the front edge, unevenly
      rot: (r() - 0.5) * 0.03,
      tone: 0.95 + r() * 0.05,
    }));
  }, []);

  const root = useRef<Group>(null);
  useEffect(() => (root.current ? registerTag('folder', 'projects →', root.current, [0.03, 0.05, -0.08]) : undefined), []);
  const coverHinge = useRef<Group>(null);
  const sheetRefs = useRef<(Group | null)[]>([]);
  const lift = useRef({ y: 0, v: 0 });

  useFrame((_, dt) => {
    // Hover lift: a spring toward 10 mm (stiffness 300, damping 22).
    const l = lift.current;
    const target = hovered && onDesk ? 0.01 : 0;
    l.v += (300 * (target - l.y) - 22 * l.v) * Math.min(dt, 0.05);
    l.y += l.v * Math.min(dt, 0.05);
    if (root.current) root.current.position.y = FOLDER.y + l.y;

    // Cover angle follows the reader choreography.
    const s = useReader.getState();
    const t = performance.now() - s.t0;
    let a = 0;
    if (s.kind === 'projects') {
      if (s.phase === 'opening') a = outBack(MathUtils.clamp((t - T.coverDelay) / T.coverOpen, 0, 1));
      else if (s.phase === 'closing') a = 1 - inOutCubic(MathUtils.clamp((t - T.close * 0.45) / (T.close * 0.4), 0, 1));
      else a = 1;
    }
    if (coverHinge.current) coverHinge.current.rotation.z = a * MathUtils.degToRad(172);

    // Paper edges lift a hair on gusts.
    sheetRefs.current.forEach((g, i) => {
      if (g) g.rotation.x = -Math.max(0, wind.gust) * 0.012 * wind.motion * ((i % 3) + 1) * 0.5;
    });
  });

  return (
    <group ref={root} position={[FOLDER.x, FOLDER.y, FOLDER.z]} rotation-y={FOLDER.rotY}>
      {/* Back cover with its tab */}
      <mesh position={[0, CARD / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[FOLDER.w, CARD, FOLDER.d]} />
        <meshStandardMaterial color={MANILA} roughness={0.85} />
      </mesh>
      <mesh position={[FOLDER.w * 0.22, CARD / 2, -FOLDER.d / 2 - 0.012]} castShadow receiveShadow>
        <boxGeometry args={[0.1, CARD, 0.026]} />
        <meshStandardMaterial color={MANILA} roughness={0.85} />
      </mesh>

      {/* Paper stack; edges peek out unevenly at the front */}
      {sheets.map((s, i) => (
        <group key={i} ref={(g) => { sheetRefs.current[i] = g; }} position={[s.dx, s.y, s.dz - 0.006]} rotation-y={s.rot}>
          <mesh castShadow receiveShadow>
            <boxGeometry args={[0.297, SHEET, 0.21]} />
            <meshStandardMaterial color={[s.tone, s.tone * 0.985, s.tone * 0.95]} roughness={0.9} />
          </mesh>
        </group>
      ))}

      {/* Front cover, hinged on its left edge */}
      <group ref={coverHinge} position={[-FOLDER.w / 2, STACK_TOP + CARD / 2, 0]}>
        <mesh position={[FOLDER.w / 2, 0, 0]} castShadow receiveShadow>
          <boxGeometry args={[FOLDER.w, CARD, FOLDER.d - 0.004]} />
          <meshStandardMaterial color={MANILA} roughness={0.85} />
        </mesh>
        <mesh position={[FOLDER.w / 2, CARD / 2 + 0.0002, 0]} rotation-x={-Math.PI / 2} receiveShadow>
          <planeGeometry args={[FOLDER.w, FOLDER.d - 0.004]} />
          {/* Re-keyed so the shader recompiles once the async cover texture arrives. */}
          <meshStandardMaterial key={cover ? 'tex' : 'plain'} map={cover} color={cover ? '#ffffff' : MANILA} roughness={0.85} />
        </mesh>
      </group>

      <HitProxy
        id="folder"
        size={[FOLDER.w, 0.03, FOLDER.d + 0.03]}
        position={[0, 0.015, 0]}
        enabled={onDesk}
        onActivate={() => navigate({ view: 'projects', page: 1 })}
      />
    </group>
  );
}
