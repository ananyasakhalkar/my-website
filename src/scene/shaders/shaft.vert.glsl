// Fake volumetric sun shaft: a quad billboarded around the shaft axis.
uniform vec3 uStart;
uniform vec3 uDir;
uniform float uLength;
uniform float uWidth;
varying vec2 vLocal;   // x: -0.5..0.5 across, y: 0 (window) .. 1 (far end)
varying vec3 vWorld;

void main() {
  vLocal = vec2(position.x, position.y + 0.5);
  vec3 center = uStart + uDir * (uLength * 0.5);
  vec3 toCam = normalize(cameraPosition - center);
  vec3 side = normalize(cross(uDir, toCam));
  vec3 world = uStart + uDir * (vLocal.y * uLength) + side * (position.x * uWidth);
  vWorld = world;
  gl_Position = projectionMatrix * viewMatrix * vec4(world, 1.0);
}
