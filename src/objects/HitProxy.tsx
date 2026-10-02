import { useEffect, useState, type ReactNode } from 'react';
import type { ThreeEvent } from '@react-three/fiber';
import { isTouch } from '../app/capabilities';
import { useDesk } from '../app/store';

interface Props {
  id: string;
  /** Visual bounds of the object (m); the proxy is 1.3× (1.8× on touch). */
  size: [number, number, number];
  position?: [number, number, number];
  enabled: boolean;
  onActivate: () => void;
  children?: ReactNode;
}

/** A generous invisible hit target with hover state and a pointer cursor (DESK_SPEC §4.0). */
export function HitProxy({ id, size, position = [0, 0, 0], enabled, onActivate }: Props) {
  const k = isTouch() ? 1.8 : 1.3;
  const setHovered = useDesk((s) => s.setHovered);
  const [over, setOver] = useState(false);

  useEffect(() => {
    if (!enabled && over) {
      setOver(false);
      setHovered(null);
      document.body.style.cursor = '';
    }
  }, [enabled, over, setHovered]);

  const enter = (e: ThreeEvent<PointerEvent>) => {
    if (!enabled) return;
    e.stopPropagation();
    setOver(true);
    setHovered(id);
    document.body.style.cursor = 'pointer';
  };
  const leave = () => {
    setOver(false);
    setHovered(null);
    document.body.style.cursor = '';
  };

  return (
    <mesh
      position={position}
      onPointerOver={enter}
      onPointerOut={leave}
      onClick={(e) => {
        if (!enabled) return;
        e.stopPropagation();
        leave();
        onActivate();
      }}
    >
      <boxGeometry args={[size[0] * k, size[1] * k, size[2] * k]} />
      <meshBasicMaterial visible={false} />
    </mesh>
  );
}
