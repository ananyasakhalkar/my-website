// Dust motes: drift with slow noise, carried by gusts, lit only inside the sun (traced back to the window).
uniform float uTime;
uniform float uPush;
uniform float uMotion;
uniform float uPx;          // point scale (px at 1 m)
uniform vec3 uBoxMin;
uniform vec3 uBoxSize;
uniform vec3 uSunDir;
uniform vec4 uWin;          // x0, x1, y0, y1 of the window opening
uniform float uWallZ;
attribute vec3 aSeed;
varying float vLit;

void main() {
  float t = uTime * uMotion;
  vec3 s = aSeed * 6.2831;
  vec3 drift = vec3(
    sin(t * 0.13 + s.x) * 0.06 + sin(t * 0.37 + s.y) * 0.02,
    sin(t * 0.10 + s.y) * 0.05 + t * 0.003 * (aSeed.z - 0.4),
    cos(t * 0.11 + s.z) * 0.06);
  vec3 p = position + drift + vec3(0.0, 0.0, uPush * uMotion);
  p = uBoxMin + mod(p - uBoxMin, uBoxSize);

  // Trace back toward the sun to the wall plane: lit if that ray passes through the window opening.
  float k = (uWallZ - p.z) / uSunDir.z;
  vec3 hit = p + uSunDir * k;
  float soft = 0.04;
  float inWin = smoothstep(uWin.x, uWin.x + soft, hit.x) * (1.0 - smoothstep(uWin.y - soft, uWin.y, hit.x))
              * smoothstep(uWin.z, uWin.z + soft, hit.y) * (1.0 - smoothstep(uWin.w - soft, uWin.w, hit.y));
  float twinkle = 0.65 + 0.35 * sin(uTime * (0.8 + aSeed.x) + s.z);
  vLit = inWin * twinkle;

  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_PointSize = uPx * (0.6 + aSeed.y * 1.1) / -mv.z;
  gl_Position = projectionMatrix * mv;
}
