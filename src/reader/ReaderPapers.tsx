import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import {
  Color,
  DoubleSide,
  MathUtils,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PlaneGeometry,
  Quaternion,
  SRGBColorSpace,
  TextureLoader,
  Vector3,
  type PerspectiveCamera,
  type Texture,
} from 'three';
import paperBend from '../scene/shaders/paperBend.vert.glsl?raw';
import { FOLDER, STACK_TOP } from '../objects/ProjectsFolder';
import { projects } from '../content/projects';
import { T, pageRect, setPhase, useReader, type PileSheet } from './readerStore';

const PAGE_W = 0.21;
const PAGE_H = 0.297;
/** Reader distance in front of the camera (DESK_SPEC §4.1). */
const READ_DIST = 0.42;

// ---------- page textures (baked at build time from the same React page components) ----------
const loader = new TextureLoader();
const cache = new Map<string, Texture>();
export function pageTexture(kind: string, n: number): Texture {
  const key = `${kind}-${String(n).padStart(2, '0')}`;
  let t = cache.get(key);
  if (!t) {
    t = loader.load(`${import.meta.env.BASE_URL}assets/pages/${key}.webp`);
    t.colorSpace = SRGBColorSpace;
    t.anisotropy = 8;
    cache.set(key, t);
  }
  return t;
}

// ---------- poses ----------
interface SheetPose {
  pos: Vector3;
  quat: Quaternion;
  scale: number;
}
const newPose = (): SheetPose => ({ pos: new Vector3(), quat: new Quaternion(), scale: 1 });

const X = new Vector3(1, 0, 0);
const Y = new Vector3(0, 1, 0);
/** Lying face-up in the folder, page top toward −X (landscape inside the folder). */
const FLAT = new Quaternion()
  .setFromAxisAngle(Y, FOLDER.rotY)
  .multiply(new Quaternion().setFromAxisAngle(Y, Math.PI / 2))
  .multiply(new Quaternion().setFromAxisAngle(X, -Math.PI / 2));

function stackPose(out: SheetPose, lift = 0) {
  out.pos.set(FOLDER.x, FOLDER.y + STACK_TOP + 0.0008 + lift, FOLDER.z + 0.004);
  out.quat.copy(FLAT);
  out.scale = 1;
  return out;
}

const PILE_ORIGIN = new Vector3(FOLDER.x + 0.305, FOLDER.y + 0.0006, FOLDER.z - 0.03);
function pilePose(out: SheetPose, s: PileSheet, index: number) {
  out.pos.set(PILE_ORIGIN.x + s.dx, PILE_ORIGIN.y + index * 0.0005, PILE_ORIGIN.z + s.dz);
  out.quat.copy(FLAT).premultiply(new Quaternion().setFromAxisAngle(Y, s.rot));
  out.scale = 1;
  return out;
}

const tmpV = new Vector3();
/** In front of the camera, exactly where the DOM page sits (pageRect). `drag` is in page widths. */
function readerPose(out: SheetPose, camera: PerspectiveCamera, w: number, h: number, drag = 0) {
  const r = pageRect(w, h);
  const worldH = 2 * READ_DIST * Math.tan(MathUtils.degToRad(camera.fov) / 2);
  const pageH = (worldH * r.h) / h;
  const x = (r.cx / w - 0.5) * worldH * (w / h);
  const y = (0.5 - r.cy / h) * worldH;
  const pageW = pageH / 1.4142;
  tmpV.set(x + drag * pageW * 1.05, y - Math.abs(drag) * pageH * 0.04, -READ_DIST);
  out.pos.copy(camera.localToWorld(tmpV));
  out.quat.copy(camera.quaternion).multiply(new Quaternion().setFromAxisAngle(new Vector3(0, 0, 1), -drag * 0.17));
  out.scale = pageH / PAGE_H;
  return out;
}

const easeInOut = (t: number) => (t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2);

function blend(out: SheetPose, a: SheetPose, b: SheetPose, t: number, arc: number) {
  const e = easeInOut(MathUtils.clamp(t, 0, 1));
  out.pos.lerpVectors(a.pos, b.pos, e);
  out.pos.y += Math.sin(Math.PI * e) * arc;
  out.quat.slerpQuaternions(a.quat, b.quat, e);
  out.scale = MathUtils.lerp(a.scale, b.scale, e);
  return e;
}

// ---------- paper mesh ----------
const geometry = new PlaneGeometry(PAGE_W, PAGE_H, 24, 2);

function makePaperMaterial(map: Texture) {
  const m = new MeshStandardMaterial({
    map,
    emissiveMap: map,
    emissive: new Color(0.42, 0.41, 0.39),
    roughness: 0.92,
    side: DoubleSide,
  });
  const uniforms = { uBend: { value: 0 }, uWidth: { value: PAGE_W } };
  m.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', `#include <common>\n${paperBend}`)
      .replace('#include <beginnormal_vertex>', 'vec3 objectNormal = bendNormal(position);')
      .replace('#include <begin_vertex>', 'vec3 transformed = bendPosition(position);');
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <emissivemap_fragment>',
      `#include <emissivemap_fragment>
      if (!gl_FrontFacing) { diffuseColor.rgb = vec3(0.96, 0.95, 0.92); totalEmissiveRadiance = vec3(0.2); }`,
    );
  };
  return { material: m, uniforms };
}

type Role = 'active' | 'leaving';

function Sheet({ page, role }: { page: number; role: Role }) {
  const camera = useThree((s) => s.camera) as PerspectiveCamera;
  const size = useThree((s) => s.size);
  const mesh = useRef<Mesh>(null);
  const mat = useMemo(() => makePaperMaterial(pageTexture('projects', page)), [page]);
  useEffect(() => () => mat.material.dispose(), [mat]);
  const poses = useMemo(() => ({ a: newPose(), b: newPose(), out: newPose() }), []);

  useFrame(() => {
    const s = useReader.getState();
    const t = performance.now() - s.t0;
    const { a, b, out } = poses;
    let bend = 0;
    let lit = 1;
    const reader = () => readerPose(b, camera, size.width, size.height, role === 'active' && (s.phase === 'drag' || s.phase === 'settle') ? s.drag : 0);

    if (role === 'active') {
      if (s.phase === 'opening') {
        stackPose(a);
        reader();
        const u = (t - T.liftDelay) / T.flight;
        const e = blend(out, a, b, u, 0.09);
        bend = Math.sin(Math.PI * e) * 0.35;
        lit = e;
      } else if (s.phase === 'turning' && s.leaving) {
        // Forward: lift from the folder. Back: pick it up from the read pile.
        if (s.leaving.dir === 1) stackPose(a);
        else pilePose(a, { page, rot: 0, dx: 0, dz: 0 }, s.pile.length);
        reader();
        const u = (t - T.turnDelay) / T.turn;
        const e = blend(out, a, b, u, 0.07);
        bend = Math.sin(Math.PI * e) * 0.3;
        lit = e;
      } else if (s.phase === 'closing') {
        reader();
        stackPose(a);
        const e = blend(out, b, a, t / (T.close * 0.5), 0.06);
        bend = Math.sin(Math.PI * e) * 0.25;
        lit = 1 - e;
      } else {
        reader();
        out.pos.copy(b.pos);
        out.quat.copy(b.quat);
        out.scale = b.scale;
      }
    } else if (s.leaving) {
      // The page we just left: onto the read pile (forward) or back into the folder (back).
      readerPose(a, camera, size.width, size.height, s.drag);
      if (s.leaving.dir === 1) {
        const top = s.pile[s.pile.length - 1];
        pilePose(b, top ?? { page, rot: 0, dx: 0, dz: 0 }, s.pile.length - 1);
      } else stackPose(b);
      const e = blend(out, a, b, t / T.turn, 0.05);
      bend = -Math.sin(Math.PI * e) * 0.3;
      lit = 1 - e;
    }

    const m = mesh.current;
    if (!m) return;
    m.position.copy(out.pos);
    m.quaternion.copy(out.quat);
    m.scale.setScalar(out.scale);
    mat.uniforms.uBend.value = bend;
    // Scene-lit on the desk, self-lit at the reader pose so it matches the DOM page at hand-off.
    mat.material.emissive.setScalar(MathUtils.lerp(0.42, 0.86, lit));
    mat.material.color.setScalar(MathUtils.lerp(1, 0.3, lit));
  });

  return <mesh ref={mesh} geometry={geometry} material={mat.material} castShadow frustumCulled={false} renderOrder={20} />;
}

function PileSheets() {
  const pile = useReader((s) => s.pile);
  const leaving = useReader((s) => s.leaving);
  const phase = useReader((s) => s.phase);
  const shown = pile.filter((p) => !(phase === 'turning' && leaving?.dir === 1 && p === pile[pile.length - 1]));
  return (
    <>
      {shown.map((p, i) => (
        <PileSheetMesh key={p.page} sheet={p} index={i} />
      ))}
    </>
  );
}

function PileSheetMesh({ sheet, index }: { sheet: PileSheet; index: number }) {
  const mat = useMemo(() => makePaperMaterial(pageTexture('projects', sheet.page)), [sheet.page]);
  useEffect(() => () => mat.material.dispose(), [mat]);
  const pose = useMemo(() => pilePose(newPose(), sheet, index), [sheet, index]);
  const mesh = useRef<Mesh>(null);
  useFrame(() => {
    // While closing, the pile flies back into the folder.
    const s = useReader.getState();
    const m = mesh.current;
    if (!m) return;
    if (s.phase === 'closing') {
      const out = newPose();
      blend(out, pose, stackPose(newPose()), (performance.now() - s.t0 - 80) / (T.close * 0.4), 0.05);
      m.position.copy(out.pos);
      m.quaternion.copy(out.quat);
    } else {
      m.position.copy(pose.pos);
      m.quaternion.copy(pose.quat);
    }
  });
  return <mesh ref={mesh} geometry={geometry} material={mat.material} castShadow receiveShadow />;
}

/** A soft dark vignette behind the page, in front of the room (all tiers). */
function Scrim() {
  const camera = useThree((s) => s.camera);
  const mesh = useRef<Mesh>(null);
  const material = useMemo(() => {
    const m = new MeshBasicMaterial({ color: '#0b0704', transparent: true, opacity: 0, depthWrite: false });
    m.onBeforeCompile = (shader) => {
      shader.vertexShader = shader.vertexShader.replace('#include <common>', '#include <common>\nvarying vec2 vS;').replace(
        '#include <begin_vertex>',
        '#include <begin_vertex>\nvS = uv;',
      );
      shader.fragmentShader = shader.fragmentShader
        .replace('#include <common>', '#include <common>\nvarying vec2 vS;')
        .replace('#include <opaque_fragment>', 'diffuseColor.a *= mix(0.55, 1.0, smoothstep(0.15, 0.75, length(vS - 0.5) * 1.4));\n#include <opaque_fragment>');
    };
    return m;
  }, []);
  useEffect(() => () => material.dispose(), [material]);
  const fwd = useMemo(() => new Vector3(), []);

  useFrame(() => {
    const s = useReader.getState();
    const t = performance.now() - s.t0;
    let o = 0;
    if (s.phase === 'opening') o = MathUtils.clamp((t - 400) / 400, 0, 1);
    else if (s.phase === 'closing') o = 1 - MathUtils.clamp(t / 400, 0, 1);
    else if (s.kind) o = 1;
    material.opacity = 0.35 * o;
    const m = mesh.current;
    if (!m) return;
    m.visible = o > 0.001;
    fwd.set(0, 0, -0.5).applyQuaternion(camera.quaternion);
    m.position.copy(camera.position).add(fwd);
    m.quaternion.copy(camera.quaternion);
  });
  return (
    <mesh ref={mesh} material={material} renderOrder={15} frustumCulled={false}>
      <planeGeometry args={[3, 3]} />
    </mesh>
  );
}

/** Advances phases on their timers (one place, so the DOM and 3D stay in step). */
function Sequencer() {
  useFrame((_, dt) => {
    const s = useReader.getState();
    const t = performance.now() - s.t0;
    if (s.phase === 'opening' && t >= T.arrive) setPhase('rest');
    else if (s.phase === 'turning' && t >= T.turnDelay + T.turn) useReader.setState({ phase: 'rest', t0: performance.now(), leaving: null, drag: 0 });
    else if (s.phase === 'settle') {
      const d = s.drag * Math.exp(-Math.min(dt, 0.05) * 14);
      if (Math.abs(d) < 0.002) useReader.setState({ phase: 'rest', drag: 0, dragVel: 0 });
      else useReader.setState({ drag: d, dragVel: 0 });
    } else if (s.phase === 'closing' && t >= T.close) useReader.setState({ kind: null, phase: 'closed', pile: [] });
  });
  return null;
}

/** The 3D side of the reader: flying pages, the read pile, the scrim. */
export function ReaderPapers() {
  const kind = useReader((s) => s.kind);
  const page = useReader((s) => s.page);
  const leaving = useReader((s) => s.leaving);
  useEffect(() => {
    // Warm the neighbouring page textures.
    if (kind) [page - 1, page, page + 1].filter((n) => n >= 1 && n <= projects.length).forEach((n) => pageTexture('projects', n));
  }, [kind, page]);
  return (
    <>
      <Sequencer />
      {kind && <Sheet key={`a${page}`} page={page} role="active" />}
      {kind && leaving && <Sheet key={`l${leaving.page}`} page={leaving.page} role="leaving" />}
      {kind && <PileSheets />}
      <Scrim />
    </>
  );
}
