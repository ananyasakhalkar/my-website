// Steam wisp: a vertical ribbon that leans with the wind and wavers with height.
uniform float uTime;
uniform float uWind;
uniform float uGust;
uniform float uMotion;
uniform float uSeed;
varying vec2 vUv;

void main() {
  vUv = uv;
  vec3 p = position;
  float h = uv.y;
  float t = uTime * uMotion;
  p.x += sin(h * 5.0 + t * 1.3 + uSeed * 6.0) * 0.012 * h + sin(h * 11.0 - t * 2.1 + uSeed) * 0.004 * h;
  // Lean toward +Z (the breeze blows into the room) and a little sideways with gusts.
  p.z += h * h * (0.03 + uGust * 0.05) * uMotion;
  p.x += h * h * sin(t * 0.4 + uSeed * 3.0) * 0.015 * uWind;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
}
