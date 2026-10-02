// Paper curl around the page's long axis (DESK_SPEC §4.1 "bend"): uBend is the total curl in radians.
uniform float uBend;
uniform float uWidth;

vec3 bendPosition(vec3 p) {
  if (abs(uBend) < 1e-4) return p;
  float r = uWidth / uBend;
  float a = p.x / r;
  return vec3(r * sin(a), p.y, p.z - r * (1.0 - cos(a)));
}

vec3 bendNormal(vec3 p) {
  if (abs(uBend) < 1e-4) return vec3(0.0, 0.0, 1.0);
  float a = p.x / (uWidth / uBend);
  return normalize(vec3(sin(a), 0.0, cos(a)));
}
