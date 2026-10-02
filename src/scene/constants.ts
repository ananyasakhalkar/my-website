import { Vector3 } from 'three';

/** Scene units are metres; Y up; the viewer sits at +Z looking toward -Z (DESK_SPEC preamble). */
export const DESK_TOP = 0.76;
export const WALL_Z = -1.2;
export const WALL_DEPTH = 0.25;

export const ROOM = { width: 4.6, height: 3.0, front: 2.8 };

/** Window opening in the back wall. */
export const WIN = { width: 1.6, height: 1.5, sill: 0.98 };
export const WIN_X0 = -WIN.width / 2;
export const WIN_X1 = WIN.width / 2;
export const WIN_Y0 = WIN.sill;
export const WIN_Y1 = WIN.sill + WIN.height;
/** The casement frame sits near the outer face of the reveal; sashes open inward. */
export const FRAME_Z = WALL_Z - WALL_DEPTH + 0.05;
export const SASH_OPEN = (25 * Math.PI) / 180;

/** Curtains hang in front of the deep sill. */
export const CURTAIN = { width: 0.8, height: 2.3, rodY: 2.58, z: -1.03, gapX: 0.52 };

/**
 * Direction sunlight travels (from the sun into the room): behind-left, ~28° elevation, chosen so the
 * window-frame and glazing-bar shadows fall across the desk.
 */
export const SUN_DIR = new Vector3(0.32, -0.56, 1).normalize();
export const SUN_COLOR = '#FFD29A';

/** Area that must stay empty for the coffee spill (DESK_SPEC §4.0). */
export const SPILL_ZONE = { x0: 0.05, x1: 0.62, z0: 0.04, z1: 0.38 };
