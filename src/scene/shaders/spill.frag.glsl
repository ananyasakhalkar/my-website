// Coffee spill (DESK_SPEC §4.3): injected into MeshStandardMaterial so it gets real window reflections.
uniform float uSpread;   // 0..1 spread progress
uniform float uDry;      // 0..1 dry-down
uniform float uFade;     // 1 visible, → 0 when refilled
uniform float uDevelop;  // 0..1 contact text develop
uniform float uMugRing;  // 0..1 mug-ring stain
uniform float uGhost;    // faint permanent ring after refill
uniform vec2 uLand;      // landing point (world XZ)
uniform vec2 uCentre;    // final puddle centre (world XZ)
uniform vec2 uRadii;     // final puddle radii (m)
uniform vec2 uMug;       // mug position (world XZ)
uniform vec4 uZone;      // x0, z0, x1, z1: where liquid may go
uniform vec4 uTextRect;  // x0, z0, x1, z1 of the contact text
uniform sampler2D uText;
varying vec2 vSpill;     // world XZ

float sdBox(vec2 p, vec4 r) {
  vec2 c = 0.5 * (r.xy + r.zw);
  vec2 h = 0.5 * (r.zw - r.xy);
  vec2 d = abs(p - c) - h;
  return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0);
}

// Returns the spill colour/alpha at world point p, and a thin meniscus glint.
vec4 spill(vec2 p, out float edgeGlint) {
  // Grows from a small pool at the landing point into an ellipse centred on the text, drifting as it spreads.
  float g = pow(uSpread, 0.55);
  vec2 centre = mix(uLand, uCentre, smoothstep(0.0, 1.0, g));
  vec2 radii = mix(vec2(0.02), uRadii, g);
  vec2 q = (p - centre) / radii;
  // Fingers: domain-warped noise creeping unevenly along the edge (in normalized units).
  vec2 w = p * 11.0;
  float warp = fbm3(vec3(w, 3.1));
  float fingers = (fbm3(vec3(w * 1.6 + warp * 2.0, 7.7)) - 0.5) * 0.22 + (fbm3(vec3(p * 38.0, 2.0)) - 0.5) * 0.05;
  float d = (length(q) - 1.0 + fingers) * min(radii.x, radii.y);
  // Liquid stops at the felt mat on the left and at the desk's front edge.
  d = max(d, sdBox(p, uZone));
  float inside = 1.0 - smoothstep(-0.0012, 0.0012, d);
  float thick = smoothstep(0.0, 0.05, -d);

  vec3 wetCol = mix(vec3(0.26, 0.13, 0.05), vec3(0.06, 0.028, 0.012), thick);
  float wetA = mix(0.62, 0.95, thick);
  // Dried: translucent amber stain, so the darker pigment text reads clearly on it.
  vec3 dryCol = mix(vec3(0.36, 0.2, 0.09), vec3(0.27, 0.14, 0.06), thick);
  float dryA = mix(0.55, 0.8, thick);
  // Coffee-ring effect: pigment gathers at the drying edge.
  float band = smoothstep(-0.008, -0.0012, d) * inside;
  dryCol = mix(dryCol, vec3(0.13, 0.065, 0.028), band);
  dryA = mix(dryA, 0.92, band);

  vec3 col = mix(wetCol, dryCol, uDry);
  // The pool starts 2 cm wide: fade it in so nothing shows before the spill.
  float a = mix(wetA, dryA, uDry) * inside * smoothstep(0.0, 0.02, uSpread);
  edgeGlint = (1.0 - smoothstep(0.0, 0.0022, abs(d + 0.0016))) * (1.0 - uDry) * inside;

  // Contact details develop in the coffee, a little behind the advancing front.
  vec2 tuv = (p - uTextRect.xy) / (uTextRect.zw - uTextRect.xy);
  if (tuv.x > 0.0 && tuv.x < 1.0 && tuv.y > 0.0 && tuv.y < 1.0) {
    float ink = texture2D(uText, vec2(tuv.x, 1.0 - tuv.y)).a;
    float behind = 1.0 - smoothstep(-0.04, -0.01, d);
    float k = ink * behind * uDevelop;
    col = mix(col, vec3(0.035, 0.016, 0.007), k);
    a = max(a, k);
  }
  return vec4(col, a * uFade);
}

// Mug ring stain: a thin, broken circle where the mug stood, plus two satellite drips.
vec4 stains(vec2 p) {
  float r = length(p - uMug);
  float ang = atan(p.y - uMug.y, p.x - uMug.x);
  float broken = smoothstep(0.25, 0.6, fbm3(vec3(ang * 2.0, 0.0, 4.0)));
  float ring = (1.0 - smoothstep(0.0004, 0.0022, abs(r - 0.04))) * broken;
  float drips = (1.0 - smoothstep(0.004, 0.006, length(p - (uLand + vec2(0.05, -0.035)))))
              + (1.0 - smoothstep(0.0025, 0.004, length(p - (uLand + vec2(-0.03, -0.05)))));
  float a = ring * max(uMugRing * 0.55 * uFade, uGhost * 0.22) + drips * uMugRing * 0.5 * uFade;
  return vec4(0.40, 0.24, 0.12, a);
}
