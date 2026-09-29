uniform float uTime;
uniform float uOpacity;
uniform vec3 uColor;
varying vec2 vLocal;
varying vec3 vWorld;

void main() {
  float edge = 1.0 - smoothstep(0.12, 0.5, abs(vLocal.x));
  float along = pow(clamp(1.0 - vLocal.y, 0.0, 1.0), 1.35) * smoothstep(0.0, 0.06, vLocal.y);
  float n = fbm3(vWorld * vec3(2.2, 2.2, 2.2) + vec3(0.0, uTime * 0.03, -uTime * 0.06));
  // Fade out near the camera: in close-up poses we'd otherwise be standing inside the haze.
  float near = smoothstep(0.6, 1.6, distance(cameraPosition, vWorld));
  float a = uOpacity * edge * along * near * (0.45 + 0.9 * n);
  gl_FragColor = vec4(uColor * a, a);
}
