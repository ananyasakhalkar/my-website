uniform float uTime;
uniform float uIntensity;
uniform float uSeed;
varying vec2 vUv;

void main() {
  float across = 1.0 - smoothstep(0.1, 0.5, abs(vUv.x - 0.5));
  float along = smoothstep(0.0, 0.18, vUv.y) * (1.0 - smoothstep(0.55, 1.0, vUv.y));
  float n = fbm3(vec3(vUv.x * 3.0 + uSeed, vUv.y * 4.0 - uTime * 0.6, uSeed * 2.0));
  float a = across * along * smoothstep(0.35, 0.8, n) * uIntensity;
  gl_FragColor = vec4(vec3(1.0, 0.97, 0.92), a * 0.5);
}
