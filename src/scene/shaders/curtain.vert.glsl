// Curtain displacement (DESK_SPEC §3). Injected into MeshStandardMaterial; the top row is pinned.
uniform float uTime;
uniform float uWind;
uniform float uGust;
uniform float uMotion;
uniform vec2 uSize;       // panel width, height (m)
uniform float uInnerEdge; // 1.0 if the free (window-side) edge is at u = 1, else 0.0
uniform float uInnerEdgeSide; // 0.0: free edge swings toward +X (left panel); 1.0: toward -X
uniform float uPhase;
varying vec3 vCWorld;

vec3 curtainPos(vec2 uv) {
  float u = uv.x;
  float v = uv.y;                        // 0 at the hem, 1 at the rod
  float t = uTime;
  float hang = pow(smoothstep(0.0, 1.0, 1.0 - v), 1.6);
  float inner = mix(1.0 - u, u, uInnerEdge);

  // Resting pleats, a little irregular.
  float pleatPhase = u * 6.2831 * 9.0 + vnoise(vec3(u * 6.0, v * 0.6, 1.3)) * 1.6;
  float pleat = 0.024 * sin(pleatPhase);

  // Slow in-and-out breathing under the base breeze, plus the (sprung) gust.
  float breath = 0.5 + 0.5 * sin(t * 6.2831 / 7.5 + uPhase);
  float amp = (0.08 * (0.25 + 0.75 * breath) + 0.24 * max(uGust, -0.1)) * uMotion;
  float billow = amp * hang
      * (0.6 + 0.4 * fbm3(vec3(u * 2.0, v * 1.5 - t * 0.35, uPhase)))
      * mix(0.55, 1.0, inner);

  float sway = 0.05 * sin(t * 0.7 + u * 3.0 + uPhase) * uWind * hang * uMotion;

  vec3 p = vec3((u - 0.5) * uSize.x, (v - 0.5) * uSize.y, 0.0);
  // Seen head-on, a billow reads through the free edge swinging in and the hem lifting, not just depth.
  float swing = billow * inner * inner * 0.75 * (1.0 - 2.0 * uInnerEdgeSide);
  p.x += sway + swing;
  p.z += pleat * mix(1.0, 0.7, hang) + billow;
  p.y += billow * hang * 0.45;
  return p;
}
