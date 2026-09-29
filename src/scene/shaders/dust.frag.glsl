uniform vec3 uColor;
varying float vLit;

void main() {
  vec2 d = gl_PointCoord - 0.5;
  float a = smoothstep(0.5, 0.0, length(d)) * vLit;
  if (a < 0.01) discard;
  gl_FragColor = vec4(uColor * a, a);
}
