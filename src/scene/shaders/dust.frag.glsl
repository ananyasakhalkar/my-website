uniform vec3 uColor;
varying float vLit;

void main() {
  vec2 d = gl_PointCoord - 0.5;
  float a = (1.0 - smoothstep(0.0, 0.5, length(d))) * vLit;
  if (a < 0.01) discard;
  gl_FragColor = vec4(uColor * a, a);
}
