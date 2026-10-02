// Late-afternoon sky: pale blue overhead to peach at the horizon, with a warm glow toward the sun.
uniform vec3 uTop;
uniform vec3 uHorizon;
uniform vec3 uGlow;
uniform vec3 uSunPos;
uniform float uNight;
varying vec3 vWorld;

void main() {
  float h = clamp((vWorld.y + 2.0) / 22.0, 0.0, 1.0);
  vec3 col = mix(uHorizon, uTop, smoothstep(0.25, 1.0, h));
  float g = exp(-distance(vWorld.xy, uSunPos.xy) / 14.0);
  col += uGlow * g * 0.9;
  // Night: deep dusk blue, a few stars and a thin moon.
  vec3 dusk = mix(vec3(0.035, 0.042, 0.1), vec3(0.008, 0.012, 0.035), smoothstep(0.15, 0.9, h));
  vec2 cell = floor(vWorld.xy * 1.6);
  float star = step(0.992, fract(sin(dot(cell, vec2(12.9898, 78.233))) * 43758.5453));
  star *= 1.0 - smoothstep(0.0, 0.12, length(fract(vWorld.xy * 1.6) - 0.5));
  star *= smoothstep(0.3, 0.6, h);
  vec2 m = vWorld.xy - vec2(6.0, 12.0);
  float moon = (1.0 - smoothstep(1.1, 1.18, length(m))) * smoothstep(0.95, 1.2, length(m - vec2(0.45, 0.2)));
  vec3 night = dusk + vec3(1.0) * star * 1.4 + vec3(1.0, 0.97, 0.9) * moon * 2.0;
  col = mix(col, night, uNight);
  gl_FragColor = vec4(col, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
