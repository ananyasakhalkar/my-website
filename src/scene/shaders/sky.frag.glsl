// Late-afternoon sky: pale blue overhead to peach at the horizon, with a warm glow toward the sun.
uniform vec3 uTop;
uniform vec3 uHorizon;
uniform vec3 uGlow;
uniform vec3 uSunPos;
varying vec3 vWorld;

void main() {
  float h = clamp((vWorld.y + 2.0) / 22.0, 0.0, 1.0);
  vec3 col = mix(uHorizon, uTop, smoothstep(0.25, 1.0, h));
  float g = exp(-distance(vWorld.xy, uSunPos.xy) / 14.0);
  col += uGlow * g * 0.9;
  gl_FragColor = vec4(col, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
