uniform float uTime;
uniform float uOpacity;
uniform vec3 uColor;
varying vec2 vLocal;
varying vec3 vWorld;

void main() {
  float edge = 1.0 - smoothstep(0.12, 0.5, abs(vLocal.x));
  float along = pow(clamp(1.0 - vLocal.y, 0.0, 1.0), 1.35) * smoothstep(0.0, 0.06, vLocal.y);
  float n = fbm3(vWorld * vec3(2.2, 2.2, 2.2) + vec3(0.0, uTime * 0.03, -uTime * 0.06));
  float a = uOpacity * edge * along * (0.45 + 0.9 * n);
  gl_FragColor = vec4(uColor * a, a);
}
