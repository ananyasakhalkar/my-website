import { useEffect, useMemo } from 'react';
import { ExtrudeGeometry, Path, Shape } from 'three';
import { floorboards, plaster } from './textures';
import { ROOM, WALL_DEPTH, WALL_Z, WIN_X0, WIN_X1, WIN_Y0, WIN_Y1 } from './constants';

const HALF_W = ROOM.width / 2;

/** Back wall with a real window opening (deep reveal), side walls, floor, ceiling, skirting. */
export function Room() {
  const tex = useMemo(() => ({ plaster: plaster(), floor: floorboards() }), []);

  const wallGeo = useMemo(() => {
    const s = new Shape();
    s.moveTo(-HALF_W, 0);
    s.lineTo(HALF_W, 0);
    s.lineTo(HALF_W, ROOM.height);
    s.lineTo(-HALF_W, ROOM.height);
    s.closePath();
    const hole = new Path();
    hole.moveTo(WIN_X0, WIN_Y0);
    hole.lineTo(WIN_X0, WIN_Y1);
    hole.lineTo(WIN_X1, WIN_Y1);
    hole.lineTo(WIN_X1, WIN_Y0);
    hole.closePath();
    s.holes.push(hole);
    return new ExtrudeGeometry(s, { depth: WALL_DEPTH, bevelEnabled: false });
  }, []);

  useEffect(() => {
    tex.floor.repeat.set(2.3, 2);
    return () => {
      wallGeo.dispose();
      [tex.plaster.map, tex.plaster.bump, tex.floor].forEach((t) => t.dispose());
    };
  }, [tex, wallGeo]);

  const wallMat = (
    <meshStandardMaterial
      color="#EDE3D3"
      map={tex.plaster.map}
      bumpMap={tex.plaster.bump}
      bumpScale={0.6}
      roughness={0.95}
    />
  );
  const depth = ROOM.front - WALL_Z;

  return (
    <group>
      {/* Back wall: front face at WALL_Z, extruded away from the room. */}
      <mesh geometry={wallGeo} position={[0, 0, WALL_Z - WALL_DEPTH]} castShadow receiveShadow>
        {wallMat}
      </mesh>

      {/* Side walls */}
      {[-1, 1].map((side) => (
        <mesh
          key={side}
          position={[side * HALF_W, ROOM.height / 2, WALL_Z + depth / 2]}
          rotation={[0, -side * (Math.PI / 2), 0]}
          receiveShadow
        >
          <planeGeometry args={[depth, ROOM.height]} />
          {wallMat}
        </mesh>
      ))}

      {/* Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, WALL_Z + depth / 2]} receiveShadow>
        <planeGeometry args={[ROOM.width, depth]} />
        <meshStandardMaterial map={tex.floor} roughness={0.6} color="#E8D8C4" />
      </mesh>

      {/* Ceiling */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, ROOM.height, WALL_Z + depth / 2]}>
        <planeGeometry args={[ROOM.width, depth]} />
        <meshStandardMaterial color="#F1E9DC" roughness={1} />
      </mesh>

      {/* Skirting board */}
      <mesh position={[0, 0.06, WALL_Z + 0.01]} castShadow receiveShadow>
        <boxGeometry args={[ROOM.width, 0.12, 0.02]} />
        <meshStandardMaterial color="#F2EEE6" roughness={0.5} />
      </mesh>
    </group>
  );
}
