/**
 * Tempered chocolate, drawn in one fragment shader on a transparent canvas.
 *
 * A thick molded bar floats in front of the page: every square carries the
 * brand letter, the top panel carries the name, and the bar casts a soft shadow
 * on whatever sits behind it. A key light follows the pointer (or phone tilt).
 * One corner is snapped off on arrival; click or tap a square to snap another.
 * After a pause the squares grow back.
 */

type Vec3 = [number, number, number];

export interface ChocolateOptions {
  /** Molded on the top panel */
  word: string;
  wordFont: string;
  /** Molded on every square */
  glyph: string;
  glyphFont: string;
  glow: string; // hex
  reducedMotion: boolean;
  /** The bar is fitted into this element's box */
  stage: HTMLElement;
  /** Receives clicks and taps (usually the hero section) */
  events: HTMLElement;
  onSnap?: () => void;
  onRegrow?: () => void;
}

export interface ChocolateRenderer {
  setGlow(hex: string): void;
  destroy(): void;
}

const VERT = `
attribute vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }
`;

const FRAG = `
precision highp float;

uniform vec2  uRes;
uniform float uTime;
uniform float uTanH;
uniform vec3  uLight;
uniform vec3  uGlow;
uniform float uExposure;

uniform vec3  uBarC;
uniform vec3  uAxX;
uniform vec3  uAxY;
uniform vec3  uAxZ;
uniform vec2  uGrid;
uniform float uHeader;
uniform sampler2D uCells;
uniform sampler2D uGlyph;
uniform sampler2D uWord;
uniform vec2  uWordSize;
uniform float uHasGlyph;
uniform float uHasWord;

#define NP 3
uniform vec4  uPC[NP]; // loose piece centre + opacity (0 = unused)
uniform vec3  uPX[NP];
uniform vec3  uPY[NP];

const float MARGIN = 0.07;
const float T = 0.24;
const float SQ_H = 0.17;
const float SQ_BEVEL = 0.13;
const float GAP = 0.055;
const float SQ_R = 0.07;
const float OUT_R = 0.1;
const float GROW = 1.2;

float sdBox(vec2 p, vec2 b, float r) {
  vec2 q = abs(p) - b + r;
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
}

// Straight chamfer with rounded shoulders, 0 -> 1
float ramp(float x) {
  x = clamp(x, 0.0, 1.0);
  const float k = 0.22;
  if (x < k) return x * x / (2.0 * k * (1.0 - k));
  if (x > 1.0 - k) return 1.0 - (1.0 - x) * (1.0 - x) / (2.0 * k * (1.0 - k));
  return (x - 0.5 * k) / (1.0 - k);
}

vec2 halfSize() { return vec2(uGrid.x * 0.5 + MARGIN, (uGrid.y + uHeader) * 0.5 + MARGIN); }
vec2 gridOrigin() { return vec2(-uGrid.x * 0.5, -halfSize().y + MARGIN); }
float gridTop() { return gridOrigin().y + uGrid.y; }
float presence(vec2 id) { return texture2D(uCells, (id + 0.5) / uGrid).r * GROW; }

float glyph(vec2 c) {
  if (uHasGlyph < 0.5) return 0.0;
  vec2 uv = c / 0.66 + 0.5;
  if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) return 0.0;
  return smoothstep(0.2, 0.8, texture2D(uGlyph, vec2(uv.x, 1.0 - uv.y)).r);
}

// One square: chamfered pillow with the letter molded on top. Height above the slab.
float square(vec2 c, float grow, out float occ) {
  float d = sdBox(c, vec2(0.5 - GAP), SQ_R);
  float rise = ramp(-d / SQ_BEVEL);
  float top = smoothstep(0.9, 1.0, rise);
  occ = smoothstep(-SQ_BEVEL * 0.55, 0.0, d) * (1.0 - smoothstep(0.0, 0.17, d));
  return (SQ_H * rise + glyph(c) * 0.024 * top) * grow;
}

float barHeight(vec2 q, out float occ) {
  occ = 0.0;
  float y1 = gridTop();
  if (q.y < y1) {
    vec2 g = q - gridOrigin();
    vec2 id = floor(g);
    if (id.x < 0.0 || id.x > uGrid.x - 1.0 || id.y < 0.0) return 0.0;
    return square(fract(g) - 0.5, clamp(presence(id), 0.0, GROW), occ);
  }
  vec2 pc = q - vec2(0.0, y1 + uHeader * 0.5);
  float d = sdBox(pc, vec2(uGrid.x * 0.5 - GAP, uHeader * 0.5 - GAP), SQ_R * 1.4);
  float rise = ramp(-d / SQ_BEVEL);
  float top = smoothstep(0.9, 1.0, rise);
  float w = 0.0;
  if (uHasWord > 0.5) {
    vec2 uv = pc / uWordSize + 0.5;
    if (uv.x > 0.0 && uv.x < 1.0 && uv.y > 0.0 && uv.y < 1.0)
      w = smoothstep(0.18, 0.82, texture2D(uWord, vec2(uv.x, 1.0 - uv.y)).r);
  }
  occ = smoothstep(-SQ_BEVEL * 0.55, 0.0, d) * (1.0 - smoothstep(0.0, 0.17, d));
  return SQ_H * rise + w * 0.034 * top;
}

// Outline of the bar, with snapped squares (and the rim beside them) cut away
float barSd(vec2 q) {
  float d = sdBox(q, halfSize(), OUT_R);
  if (q.y < gridTop()) {
    vec2 id = clamp(floor(q - gridOrigin()), vec2(0.0), uGrid - 1.0);
    if (presence(id) < 0.02) {
      vec2 lo = id;
      vec2 hi = id + 1.0;
      if (id.x < 0.5) lo.x -= 1.0;
      if (id.x > uGrid.x - 1.5) hi.x += 1.0;
      if (id.y < 0.5) lo.y -= 1.0;
      d = max(d, -sdBox(q - gridOrigin() - 0.5 * (lo + hi), 0.5 * (hi - lo), 0.0));
    }
  }
  return d;
}

float pieceSd(vec2 q) { return sdBox(q, vec2(0.5), 0.06); }

float solidSd(vec2 q, float kind) { return kind < 0.5 ? barSd(q) : pieceSd(q); }
float solidHeight(vec2 q, float kind, out float occ) {
  if (kind < 0.5) return barHeight(q, occ);
  return square(q, 1.0, occ);
}

// Ray from the camera (at the origin) against a slab in the frame (C, X, Y, Z):
// top face at local z = 0, underside at z = -T. kind 0 = the bar, 1 = a loose piece.
// face: 1 top, 0 underside, 0.5 wall.
float hitSlab(vec3 rd, vec3 C, vec3 X, vec3 Y, vec3 Z, float kind,
              out vec3 n, out float cov, out float occ, out float face) {
  n = Z; cov = 0.0; occ = 0.0; face = 1.0;
  vec3 ol = vec3(dot(-C, X), dot(-C, Y), dot(-C, Z));
  vec3 dl = vec3(dot(rd, X), dot(rd, Y), dot(rd, Z));
  if (abs(dl.z) < 1e-4) return -1.0;
  float tTop = -ol.z / dl.z;
  float tBot = (-T - ol.z) / dl.z;
  bool fromTop = tTop < tBot;
  float tA = fromTop ? tTop : tBot;
  float tB = fromTop ? tBot : tTop;
  if (tB <= 0.0) return -1.0;
  vec2 qA = ol.xy + dl.xy * tA;
  vec2 qB = ol.xy + dl.xy * tB;
  float sA = solidSd(qA, kind);
  float sB = solidSd(qB, kind);
  float px = max(tA, 0.1) * 2.0 * uTanH / uRes.y / max(abs(dl.z), 0.25);
  float cA = clamp(0.5 - sA / px, 0.0, 1.0);
  float cB = clamp(0.5 - sB / px, 0.0, 1.0);

  if (sA <= 0.0 || (cA > 0.0 && sB > 0.0 && cA >= cB)) {
    cov = sA <= 0.0 ? 1.0 : cA;
    if (!fromTop) { n = -Z; face = 0.0; return tA; }
    float o;
    float s = solidHeight(qA, kind, o) / abs(dl.z);
    vec2 q = qA - dl.xy * s; // one parallax step up onto the raised squares
    const float e = 0.003;
    solidHeight(q, kind, occ);
    float hx = solidHeight(q + vec2(e, 0.0), kind, o) - solidHeight(q - vec2(e, 0.0), kind, o);
    float hy = solidHeight(q + vec2(0.0, e), kind, o) - solidHeight(q - vec2(0.0, e), kind, o);
    vec3 nl = normalize(vec3(-hx / (2.0 * e), -hy / (2.0 * e), 1.0));
    n = normalize(nl.x * X + nl.y * Y + nl.z * Z);
    return tA - s;
  }

  if (sB <= 0.0 || cB > 0.0) {
    float a = 0.0;
    float b = 1.0;
    for (int i = 0; i < 6; i++) {
      float m = 0.5 * (a + b);
      if (solidSd(mix(qA, qB, m), kind) < 0.0) b = m; else a = m;
    }
    vec2 qw = mix(qA, qB, b);
    vec2 g2;
    if (kind < 0.5 && sdBox(qw, halfSize(), OUT_R) < -0.03) {
      // Wall of a snapped-out hole: along a grid line, facing into the hole
      vec2 f = fract(qw - gridOrigin());
      vec2 dist = min(f, 1.0 - f);
      vec2 toHole = qA - qw;
      g2 = dist.x < dist.y ? vec2(sign(toHole.x), 0.0) : vec2(0.0, sign(toHole.y));
    } else {
      const float e2 = 0.002;
      g2 = normalize(vec2(solidSd(qw + vec2(e2, 0.0), kind) - solidSd(qw - vec2(e2, 0.0), kind),
                          solidSd(qw + vec2(0.0, e2), kind) - solidSd(qw - vec2(0.0, e2), kind)) + 1e-6);
    }
    n = normalize(g2.x * X + g2.y * Y);
    face = 0.5;
    occ = 0.2;
    cov = sB <= 0.0 ? 1.0 : cB;
    return mix(tA, tB, b);
  }
  return -1.0;
}

float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}
vec3 aces(vec3 x) { return clamp((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0); }
float ggx(float NoH, float a) { float a2 = a * a; float d = NoH * NoH * (a2 - 1.0) + 1.0; return a2 / (3.14159 * d * d); }

// A photo studio: a big softbox up-left, a strip light on the right, season-tinted sky behind
vec3 studio(vec3 R) {
  vec3 white = vec3(1.0, 0.9, 0.78);
  float soft = smoothstep(0.62, 0.97, dot(R, normalize(vec3(-0.55, 0.62, 0.56))));
  float strip = smoothstep(0.955, 0.99, dot(R, normalize(vec3(0.9, 0.15, 0.4))));
  float sky = smoothstep(-0.15, 0.9, R.y);
  return white * (soft * 1.2 + strip * 1.7) + mix(white, uGlow, 0.45) * sky * 0.42;
}

vec3 shade(vec3 P, vec3 n, float occ, float face) {
  vec3 V = normalize(-P);
  vec3 Lv = uLight - P;
  float Ld = length(Lv);
  vec3 L = Lv / Ld;
  float atten = 1.0 / (1.0 + 0.016 * Ld * Ld);
  vec3 key = vec3(1.0, 0.93, 0.85) * 6.5 * atten;

  vec3 albedo = vec3(0.034, 0.0135, 0.0068) * (0.9 + 0.2 * noise(P.xy * 5.0 + P.z));
  float NoL = dot(n, L);
  float wrap = max((NoL + 0.3) / 1.3, 0.0);
  vec3 warm = mix(vec3(1.0, 0.6, 0.4), vec3(1.0), smoothstep(0.0, 0.6, NoL));
  float NoV = max(dot(n, V), 0.001);
  vec3 H = normalize(L + V);
  float NoH = max(dot(n, H), 0.0);
  float F = 0.045 + 0.955 * pow(1.0 - NoV, 5.0);
  float gloss = face < 0.25 ? 0.3 : 1.0; // the underside is duller
  float spec = (ggx(NoH, 0.07) * 0.6 + ggx(NoH, 0.24) * 0.4) * gloss;
  vec3 R = reflect(-V, n);
  float ao = 1.0 - 0.66 * occ;
  vec3 box = vec3(1.0, 0.93, 0.85) * 1.3 * smoothstep(0.972, 0.992, dot(R, L)) * atten;

  vec3 col = albedo * (key * wrap * 0.6 * warm + vec3(0.07, 0.055, 0.045) + uGlow * 0.03) * ao;
  col += key * spec * F * max(NoL, 0.0) * 0.25;
  col += (studio(R) + box) * F * ao * gloss;
  float rim = pow(1.0 - NoV, 3.0) * smoothstep(-0.2, 0.8, dot(n, normalize(vec3(0.1, 0.75, -0.65))));
  col += mix(vec3(1.0, 0.7, 0.45), uGlow, 0.6) * rim * 0.3;
  return col;
}

// Soft shadow on an imaginary backdrop a little behind the bar
float shadowAt(vec3 rd) {
  const float DROP = 1.5;
  vec3 ol = vec3(dot(-uBarC, uAxX), dot(-uBarC, uAxY), dot(-uBarC, uAxZ));
  vec3 dl = vec3(dot(rd, uAxX), dot(rd, uAxY), dot(rd, uAxZ));
  if (dl.z > -1e-4) return 0.0;
  float tb = (-T - DROP - ol.z) / dl.z;
  vec3 B = ol + dl * tb;
  vec3 Lw = uLight - (uBarC + B.x * uAxX + B.y * uAxY + B.z * uAxZ);
  vec3 L = normalize(vec3(dot(Lw, uAxX), dot(Lw, uAxY), dot(Lw, uAxZ)));
  if (L.z < 0.05) return 0.0;
  vec2 qs = B.xy + L.xy * ((DROP + T * 0.5) / L.z);
  return 0.55 * (1.0 - smoothstep(-0.35, 0.56, barSd(qs)));
}

void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uRes) / (0.5 * uRes.y);
  vec3 rd = normalize(vec3(uv * uTanH, -1.0));

  vec3 n;
  float cov, occ, face;
  vec4 barL = vec4(0.0);
  float tBar = hitSlab(rd, uBarC, uAxX, uAxY, uAxZ, 0.0, n, cov, occ, face);
  if (tBar > 0.0) barL = vec4(shade(rd * tBar, n, occ, face), 1.0) * cov;

  vec4 pieceL = vec4(0.0);
  float tPiece = 1e9;
  for (int i = 0; i < NP; i++) {
    if (uPC[i].w <= 0.0) continue;
    vec3 X = uPX[i];
    vec3 Y = uPY[i];
    vec3 pn;
    float pc, po, pf;
    float tp = hitSlab(rd, uPC[i].xyz, X, Y, cross(X, Y), 1.0, pn, pc, po, pf);
    if (tp > 0.0 && tp < tPiece) {
      tPiece = tp;
      pieceL = vec4(shade(rd * tp, pn, po, pf), 1.0) * (pc * uPC[i].w);
    }
  }

  vec4 col = (tBar < 0.0 || tPiece < tBar) ? pieceL + (1.0 - pieceL.a) * barL : barL + (1.0 - barL.a) * pieceL;
  vec3 c = col.a > 0.0 ? col.rgb / col.a : vec3(0.0);
  c = pow(aces(c * uExposure), vec3(1.0 / 2.2)) + (hash(gl_FragCoord.xy + fract(uTime) * 61.0) - 0.5) / 255.0;
  float a = col.a + (1.0 - col.a) * shadowAt(rd) * uExposure;
  gl_FragColor = vec4(c * col.a, a);
}
`;

const TAN_H = 0.36;
const MARGIN = 0.07; // keep in sync with the shader
const SQ_H = 0.17;
const GROW = 1.2;
const COLS = 4;
const ROWS = 4;
const HEADER = 1.0;
const NP = 3;
const DECOR: [number, number] = [COLS - 1, ROWS - 1]; // the corner that snaps off on arrival (top right)
const REGROW_AFTER = 6500;
const FIT = 1.18; // let the bar spill a little past its stage box

const dot = (a: Vec3, b: Vec3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const scale = (a: Vec3, s: number): Vec3 => [a[0] * s, a[1] * s, a[2] * s];
const add = (...vs: Vec3[]): Vec3 => vs.reduce<Vec3>((acc, v) => [acc[0] + v[0], acc[1] + v[1], acc[2] + v[2]], [0, 0, 0]);
const cross = (a: Vec3, b: Vec3): Vec3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const norm = (a: Vec3): Vec3 => scale(a, 1 / Math.hypot(a[0], a[1], a[2]));
const clamp = (x: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, x));
const mix = (a: number, b: number, t: number) => a + (b - a) * t;
const easeOut = (t: number) => 1 - Math.pow(1 - clamp(t, 0, 1), 3);
const easeBack = (t: number) => {
  const x = clamp(t, 0, 1) - 1;
  return 1 + 2.4 * x * x * x + 1.4 * x * x;
};

/** Rotate v around unit axis k by angle a (Rodrigues). */
function rotate(v: Vec3, k: Vec3, a: number): Vec3 {
  const c = Math.cos(a);
  const s = Math.sin(a);
  return add(scale(v, c), scale(cross(k, v), s), scale(k, dot(k, v) * (1 - c)));
}

function hexToLinear(hex: string): Vec3 {
  const n = parseInt(hex.replace('#', ''), 16);
  const c = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => Math.pow(v / 255, 2.2));
  return [c[0], c[1], c[2]];
}

function compile(gl: WebGLRenderingContext, type: number, src: string) {
  const s = gl.createShader(type);
  if (!s) return null;
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
    console.warn('[chocolate-gl]', gl.getShaderInfoLog(s));
    gl.deleteShader(s);
    return null;
  }
  return s;
}

/** Text as a soft height map (white = raised), blurred so the letters get bevels. */
async function heightMap(text: string, family: string, weight: number, w: number, h: number, fill: number, blur: number) {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return null;
  try {
    await document.fonts.load(`${weight} 100px ${family}`, text);
  } catch {
    /* fall back to whatever is available */
  }
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, w, h);
  let size = h * 0.8;
  ctx.font = `${weight} ${size}px ${family}`;
  let m = ctx.measureText(text);
  const fit = Math.min((w * fill) / m.width, (h * fill) / (m.actualBoundingBoxAscent + m.actualBoundingBoxDescent));
  size *= fit;
  ctx.font = `${weight} ${size}px ${family}`;
  m = ctx.measureText(text);
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(text, w / 2, h / 2 + (m.actualBoundingBoxAscent - m.actualBoundingBoxDescent) / 2);

  const src = ctx.getImageData(0, 0, w, h).data;
  const a = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) a[i] = src[i * 4] / 255;
  const b = new Float32Array(w * h);
  for (let pass = 0; pass < 2; pass++) {
    for (let y = 0; y < h; y++) {
      let acc = 0;
      for (let x = -blur; x <= blur; x++) acc += a[y * w + clamp(x, 0, w - 1)];
      for (let x = 0; x < w; x++) {
        b[y * w + x] = acc / (2 * blur + 1);
        acc += a[y * w + clamp(x + blur + 1, 0, w - 1)] - a[y * w + clamp(x - blur, 0, w - 1)];
      }
    }
    for (let x = 0; x < w; x++) {
      let acc = 0;
      for (let y = -blur; y <= blur; y++) acc += b[clamp(y, 0, h - 1) * w + x];
      for (let y = 0; y < h; y++) {
        a[y * w + x] = acc / (2 * blur + 1);
        acc += b[clamp(y + blur + 1, 0, h - 1) * w + x] - b[clamp(y - blur, 0, h - 1) * w + x];
      }
    }
  }
  const out = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) out[i] = Math.round(a[i] * 255);
  return { data: out, w, h };
}

interface Frame { axX: Vec3; axY: Vec3; axZ: Vec3; C: Vec3 }

interface Flyer {
  born: number;
  p0: Vec3;
  v: Vec3;
  k: Vec3;
  w: number;
  X0: Vec3;
  Y0: Vec3;
}

export function createChocolateRenderer(canvas: HTMLCanvasElement, opts: ChocolateOptions): ChocolateRenderer | null {
  const gl = canvas.getContext('webgl', {
    alpha: true, premultipliedAlpha: true, antialias: false, depth: false, stencil: false,
    powerPreference: 'high-performance',
  });
  if (!gl) return null;

  const vs = compile(gl, gl.VERTEX_SHADER, VERT);
  const fs = compile(gl, gl.FRAGMENT_SHADER, FRAG);
  if (!vs || !fs) return null;
  const prog = gl.createProgram();
  if (!prog) return null;
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    console.warn('[chocolate-gl]', gl.getProgramInfoLog(prog));
    return null;
  }
  gl.useProgram(prog);

  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const aPos = gl.getAttribLocation(prog, 'aPos');
  gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

  const U = (name: string) => gl.getUniformLocation(prog, name);
  const u = {
    res: U('uRes'), time: U('uTime'), tanH: U('uTanH'), light: U('uLight'), glow: U('uGlow'), exposure: U('uExposure'),
    barC: U('uBarC'), axX: U('uAxX'), axY: U('uAxY'), axZ: U('uAxZ'), grid: U('uGrid'), header: U('uHeader'),
    cells: U('uCells'), glyph: U('uGlyph'), word: U('uWord'), wordSize: U('uWordSize'),
    hasGlyph: U('uHasGlyph'), hasWord: U('uHasWord'),
    pc: U('uPC'), px: U('uPX'), py: U('uPY'),
  };

  function makeTexture(unit: number, filter: number) {
    const t = gl!.createTexture();
    gl!.activeTexture(gl!.TEXTURE0 + unit);
    gl!.bindTexture(gl!.TEXTURE_2D, t);
    gl!.texImage2D(gl!.TEXTURE_2D, 0, gl!.LUMINANCE, 1, 1, 0, gl!.LUMINANCE, gl!.UNSIGNED_BYTE, new Uint8Array([0]));
    gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_MIN_FILTER, filter);
    gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_MAG_FILTER, filter);
    gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_WRAP_S, gl!.CLAMP_TO_EDGE);
    gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_WRAP_T, gl!.CLAMP_TO_EDGE);
    return t;
  }
  gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
  const cellTex = makeTexture(0, gl.NEAREST);
  const glyphTex = makeTexture(1, gl.LINEAR);
  const wordTex = makeTexture(2, gl.LINEAR);
  gl.uniform1i(u.cells, 0);
  gl.uniform1i(u.glyph, 1);
  gl.uniform1i(u.word, 2);
  gl.uniform1f(u.tanH, TAN_H);
  gl.uniform2f(u.grid, COLS, ROWS);
  gl.uniform1f(u.header, HEADER);
  gl.uniform2f(u.wordSize, COLS - 0.8, (COLS - 0.8) / 4);
  let hasGlyph = 0;
  let hasWord = 0;
  let disposed = false;

  // ── Squares: presence 0..GROW per cell (0 = snapped off) ──────
  const presence = new Float32Array(COLS * ROWS).fill(1);
  const growStart = new Float64Array(COLS * ROWS).fill(-1);
  const cellBytes = new Uint8Array(COLS * ROWS);
  function uploadCells() {
    for (let i = 0; i < presence.length; i++) cellBytes[i] = Math.round((clamp(presence[i], 0, GROW) / GROW) * 255);
    gl!.activeTexture(gl!.TEXTURE0);
    gl!.bindTexture(gl!.TEXTURE_2D, cellTex);
    gl!.texImage2D(gl!.TEXTURE_2D, 0, gl!.LUMINANCE, COLS, ROWS, 0, gl!.LUMINANCE, gl!.UNSIGNED_BYTE, cellBytes);
  }
  uploadCells();

  heightMap(opts.glyph, opts.glyphFont, 700, 256, 256, 0.78, 3).then((map) => {
    if (!map || disposed) return;
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, glyphTex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, map.w, map.h, 0, gl.LUMINANCE, gl.UNSIGNED_BYTE, map.data);
    hasGlyph = 1;
    drawNow();
  });
  heightMap(opts.word, opts.wordFont, 400, 1024, 256, 0.84, 4).then((map) => {
    if (!map || disposed) return;
    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, wordTex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, map.w, map.h, 0, gl.LUMINANCE, gl.UNSIGNED_BYTE, map.data);
    hasWord = 1;
    drawNow();
  });

  // ── Layout: fit the bar into the stage element ───────────────
  let aspect = 1;
  const layout = { cx: 0.3, cy: 0, dist: 11, spin: -0.46, tilt: -0.7, narrow: false };
  const hw = COLS / 2 + MARGIN;
  const hh = (ROWS + HEADER) / 2 + MARGIN;
  const gridY0 = -hh + MARGIN;

  function fit() {
    const cr = canvas.getBoundingClientRect();
    const sr = opts.stage.getBoundingClientRect();
    if (!cr.width || !cr.height || !sr.width || !sr.height) return;
    const nx = (x: number) => ((x - cr.left) / cr.width) * 2 - 1;
    const ny = (y: number) => -(((y - cr.top) / cr.height) * 2 - 1);
    const narrow = cr.width < 760;
    layout.spin = narrow ? -0.34 : -0.46;
    layout.tilt = narrow ? -0.64 : -0.72;
    const cs = Math.abs(Math.cos(layout.spin));
    const ss = Math.abs(Math.sin(layout.spin));
    const boxW = hw * cs + hh * ss;
    const boxH = (hw * ss + hh * cs) * Math.cos(layout.tilt);
    const hx = (nx(sr.right) - nx(sr.left)) / 2;
    const hy = (ny(sr.top) - ny(sr.bottom)) / 2;
    layout.cx = (nx(sr.left) + nx(sr.right)) / 2;
    layout.cy = (ny(sr.top) + ny(sr.bottom)) / 2;
    layout.dist = Math.max(boxH / (TAN_H * hy), boxW / (TAN_H * aspect * hx)) / FIT;
    layout.narrow = narrow;
  }

  function frame(spinOff: number, tiltOff: number, lift: number): Frame {
    const spin = layout.spin + spinOff;
    const tilt = layout.tilt + tiltOff;
    const cs = Math.cos(spin), ss = Math.sin(spin), ct = Math.cos(tilt), st = Math.sin(tilt);
    return {
      axX: [cs, ss * ct, ss * st],
      axY: [-ss, cs * ct, cs * st],
      axZ: [0, -st, ct],
      C: [layout.cx * layout.dist * TAN_H * aspect, layout.cy * layout.dist * TAN_H + lift, -layout.dist],
    };
  }

  const slotCentre = (f: Frame, ix: number, iy: number) =>
    add(f.C, scale(f.axX, ix + 0.5 - COLS / 2), scale(f.axY, gridY0 + iy + 0.5));

  // ── Light, input, pieces ─────────────────────────────────────
  const glow = hexToLinear(opts.glow);
  let glowTarget = glow.slice() as Vec3;
  const pointer = { x: 0, y: 0, tx: 0, ty: 0, last: -Infinity };
  const started = performance.now();
  const motion = !opts.reducedMotion;
  const introMs = motion ? 1500 : 0;
  const decorAt = motion ? 1250 : 0; // when the corner snaps off
  let decorDone = false;
  let flyers: Flyer[] = [];
  let lastSnap = -Infinity;
  let regrowing = false;
  let current: Frame = frame(0, 0, 0);
  let raf = 0;
  let prev = started;
  let onScreen = true;
  let placedLight = false;
  const pcArr = new Float32Array(NP * 4);
  const pxArr = new Float32Array(NP * 3);
  const pyArr = new Float32Array(NP * 3);

  const restPoint = () => ({ x: layout.cx - 0.45, y: layout.cy + 0.5 });

  function resize() {
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const touch = window.matchMedia('(hover: none)').matches;
    let dpr = Math.min(window.devicePixelRatio || 1, touch ? 1.5 : 1.75);
    const maxPixels = 2_200_000;
    if (rect.width * rect.height * dpr * dpr > maxPixels) dpr = Math.sqrt(maxPixels / (rect.width * rect.height));
    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);
    gl!.viewport(0, 0, canvas.width, canvas.height);
    aspect = rect.width / rect.height;
    fit();
    if (!placedLight) {
      placedLight = true;
      const r = restPoint();
      pointer.x = pointer.tx = motion ? layout.cx - 1.5 : r.x;
      pointer.y = pointer.ty = motion ? layout.cy + 1.1 : r.y;
    }
    drawNow();
  }

  function toNdc(clientX: number, clientY: number) {
    const rect = canvas.getBoundingClientRect();
    return { x: ((clientX - rect.left) / rect.width) * 2 - 1, y: -(((clientY - rect.top) / rect.height) * 2 - 1) };
  }

  /** Which square is under this screen point? */
  function cellAt(nx: number, ny: number): number {
    const f = current;
    const d = norm([nx * TAN_H * aspect, ny * TAN_H, -1]);
    const negC = scale(f.C, -1);
    const ol: Vec3 = [dot(negC, f.axX), dot(negC, f.axY), dot(negC, f.axZ)];
    const dl: Vec3 = [dot(d, f.axX), dot(d, f.axY), dot(d, f.axZ)];
    if (dl[2] >= -1e-4) return -1;
    const t = (SQ_H * 0.6 - ol[2]) / dl[2];
    const ix = Math.floor(ol[0] + dl[0] * t + COLS / 2);
    const iy = Math.floor(ol[1] + dl[1] * t - gridY0);
    if (ix < 0 || ix >= COLS || iy < 0 || iy >= ROWS) return -1;
    const i = iy * COLS + ix;
    return presence[i] > 0.5 ? i : -1;
  }

  function snap(i: number, now: number) {
    const ix = i % COLS;
    const iy = Math.floor(i / COLS);
    presence[i] = 0;
    growStart[i] = -1;
    uploadCells();
    const f = current;
    const side = Math.random() < 0.5 ? -1 : 1;
    flyers.push({
      born: now,
      p0: add(slotCentre(f, ix, iy), scale(f.axZ, 0.02)),
      v: add(scale(f.axZ, 2.4), [side * (0.4 + Math.random() * 0.7), 1.7, 1.1]),
      k: norm([Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5]),
      w: (5 + Math.random() * 4) * side,
      X0: f.axX,
      Y0: f.axY,
    });
    if (flyers.length > NP - 1) flyers = flyers.slice(-(NP - 1));
    lastSnap = now;
    regrowing = false;
    opts.onSnap?.();
    wake();
  }

  const onPointerMove = (e: PointerEvent) => {
    if (e.pointerType !== 'mouse' && e.pointerType !== 'pen') return;
    const p = toNdc(e.clientX, e.clientY);
    pointer.tx = p.x;
    pointer.ty = p.y;
    pointer.last = performance.now();
    canvas.style.cursor = e.target === canvas && cellAt(p.x, p.y) >= 0 ? 'pointer' : '';
    wake();
  };
  const onClick = (e: MouseEvent) => {
    if (e.target !== canvas) return;
    const p = toNdc(e.clientX, e.clientY);
    const i = cellAt(p.x, p.y);
    if (i >= 0) snap(i, performance.now());
  };
  const onPointerDown = (e: PointerEvent) => {
    if (e.pointerType !== 'touch') return;
    const p = toNdc(e.clientX, e.clientY);
    pointer.tx = p.x;
    pointer.ty = p.y;
    pointer.last = performance.now();
    wake();
  };
  const onTilt = (e: DeviceOrientationEvent) => {
    if (e.gamma == null || e.beta == null) return;
    const r = restPoint();
    pointer.tx = r.x + 0.25 + clamp(e.gamma / 28, -1, 1) * 0.95;
    pointer.ty = r.y - 0.25 + clamp((e.beta - 55) / 26, -1, 1) * -0.85;
    pointer.last = performance.now();
    wake();
  };

  function updatePieces(now: number, t: number) {
    let slot = 0;
    pcArr.fill(0);
    const put = (C: Vec3, X: Vec3, Y: Vec3, alpha: number) => {
      if (slot >= NP) return;
      pcArr.set([C[0], C[1], C[2], alpha], slot * 4);
      pxArr.set(X, slot * 3);
      pyArr.set(Y, slot * 3);
      slot++;
    };

    // The corner that snaps off on arrival, then floats beside the bar
    const since = now - started - decorAt;
    if (since >= 0) {
      const di = DECOR[1] * COLS + DECOR[0];
      if (!decorDone) {
        decorDone = true;
        presence[di] = 0;
        uploadCells();
      }
      const f = current;
      const k = motion ? easeBack(since / 750) : 1;
      const home = slotCentre(f, DECOR[0], DECOR[1]);
      const bob = motion ? Math.sin(t * 1.3 + 1) * 0.07 : 0;
      // Up and out to the right on wide screens; mostly up on phones, where the bar fills the width
      const away = layout.narrow
        ? add(home, scale(f.axX, 0.2), scale(f.axY, 1.0), scale(f.axZ, 1.05 + bob))
        : add(home, scale(f.axX, 1.0), scale(f.axY, 0.55), scale(f.axZ, 1.0 + bob));
      const axisLocal = norm(add(scale(f.axX, 0.35), f.axY, scale(f.axZ, 0.25)));
      const ang = (0.62 + (motion ? Math.sin(t * 0.9) * 0.06 : 0)) * k;
      put(
        add(scale(home, 1 - k), scale(away, k)),
        rotate(f.axX, axisLocal, ang),
        rotate(f.axY, axisLocal, ang),
        1,
      );
    }

    // Snapped squares flying off
    const g: Vec3 = [0, -9, 0];
    flyers = flyers.filter((fl) => now - fl.born < (motion ? 1700 : 350));
    for (const fl of flyers) {
      const age = (now - fl.born) / 1000;
      if (!motion) {
        put(fl.p0, fl.X0, fl.Y0, 1 - age / 0.35);
        continue;
      }
      const pos = add(fl.p0, scale(fl.v, age), scale(g, 0.5 * age * age));
      const ang = fl.w * age;
      put(pos, rotate(fl.X0, fl.k, ang), rotate(fl.Y0, fl.k, ang), 1 - clamp((age - 1.1) / 0.6, 0, 1));
    }
  }

  function updateRegrow(now: number) {
    const di = DECOR[1] * COLS + DECOR[0];
    const missing: number[] = [];
    for (let i = 0; i < presence.length; i++) if (i !== di && presence[i] < 1 && growStart[i] < 0) missing.push(i);
    if (!regrowing && missing.length && now - lastSnap > REGROW_AFTER) {
      regrowing = true;
      missing.forEach((i, n) => { growStart[i] = now + n * 110; });
    }
    if (!regrowing) return;
    let active = false;
    for (let i = 0; i < presence.length; i++) {
      if (growStart[i] < 0) continue;
      const p = (now - growStart[i]) / 650;
      if (p <= 0) { active = true; continue; }
      presence[i] = motion ? easeBack(p) : 1;
      if (p >= 1) { presence[i] = 1; growStart[i] = -1; } else active = true;
    }
    uploadCells();
    if (!active) {
      regrowing = false;
      opts.onRegrow?.();
    }
  }

  function render(now: number) {
    raf = 0;
    const dt = Math.min(0.05, (now - prev) / 1000);
    prev = now;
    const t = (now - started) / 1000;
    const intro = introMs ? clamp((now - started) / introMs, 0, 1) : 1;

    // Light: follows the pointer, drifts slowly when idle
    const idle = now - pointer.last > 2600;
    const r = restPoint();
    if (idle && motion && intro >= 1) {
      pointer.tx = r.x + 0.35 + Math.cos(t * 0.32) * 0.6;
      pointer.ty = r.y - 0.3 + Math.sin(t * 0.47) * 0.42;
    } else if (intro < 1 && pointer.last === -Infinity) {
      pointer.tx = r.x;
      pointer.ty = r.y;
    }
    const k = 1 - Math.exp(-dt * (intro < 1 ? 1.8 : idle ? 1.2 : 6));
    pointer.x += (pointer.tx - pointer.x) * k;
    pointer.y += (pointer.ty - pointer.y) * k;
    const kg = 1 - Math.exp(-dt * 2.5);
    for (let i = 0; i < 3; i++) glow[i] += (glowTarget[i] - glow[i]) * kg;

    // The bar settles in from above, then floats
    const lift = motion ? (1 - easeOut(intro)) * 2.4 + Math.sin(t * 1.1) * 0.05 : 0;
    const spinOff = motion ? clamp(pointer.x - layout.cx, -1.5, 1.5) * 0.03 + Math.sin(t * 0.6) * 0.012 : 0;
    const tiltOff = motion ? clamp(pointer.y - layout.cy, -1.5, 1.5) * -0.035 : 0;
    current = frame(spinOff, tiltOff, lift);

    updatePieces(now, t);
    updateRegrow(now);

    // Light placed where its mirror reflection lands under the pointer
    const d = norm([pointer.x * TAN_H * aspect, pointer.y * TAN_H, -1]);
    const N = current.axZ;
    const P = scale(d, dot(current.C, N) / dot(d, N));
    const L = add(P, scale(add(d, scale(N, -2 * dot(d, N))), 5.2));

    gl!.uniform2f(u.res, canvas.width, canvas.height);
    gl!.uniform1f(u.time, t);
    gl!.uniform3f(u.light, L[0], L[1], L[2]);
    gl!.uniform3f(u.glow, glow[0], glow[1], glow[2]);
    gl!.uniform1f(u.exposure, mix(0.05, 1, easeOut(intro * 1.25)));
    gl!.uniform3f(u.barC, current.C[0], current.C[1], current.C[2]);
    gl!.uniform3f(u.axX, current.axX[0], current.axX[1], current.axX[2]);
    gl!.uniform3f(u.axY, current.axY[0], current.axY[1], current.axY[2]);
    gl!.uniform3f(u.axZ, current.axZ[0], current.axZ[1], current.axZ[2]);
    gl!.uniform1f(u.hasGlyph, hasGlyph);
    gl!.uniform1f(u.hasWord, hasWord);
    gl!.uniform4fv(u.pc, pcArr);
    gl!.uniform3fv(u.px, pxArr);
    gl!.uniform3fv(u.py, pyArr);
    gl!.clearColor(0, 0, 0, 0);
    gl!.clear(gl!.COLOR_BUFFER_BIT);
    gl!.drawArrays(gl!.TRIANGLES, 0, 3);

    const settling = Math.abs(pointer.tx - pointer.x) + Math.abs(pointer.ty - pointer.y) > 0.0005
      || Math.abs(glowTarget[0] - glow[0]) + Math.abs(glowTarget[1] - glow[1]) + Math.abs(glowTarget[2] - glow[2]) > 0.0005;
    const busy = intro < 1 || now - started < decorAt + 800 || flyers.length > 0 || regrowing
      || presence.some((p, i) => p < 1 && i !== DECOR[1] * COLS + DECOR[0]);
    if (motion || settling || busy) wake();
  }

  function wake() {
    if (!raf && onScreen && !disposed && document.visibilityState === 'visible') {
      raf = requestAnimationFrame((n) => render(n));
    }
  }

  /** Draw immediately (not waiting for the next animation frame), then keep going if needed. */
  function drawNow() {
    if (disposed) return;
    if (raf) { cancelAnimationFrame(raf); raf = 0; }
    render(performance.now());
  }

  const ro = new ResizeObserver(resize);
  ro.observe(canvas);
  ro.observe(opts.stage);
  document.fonts?.ready.then(() => { if (!disposed) resize(); });
  const io = new IntersectionObserver(([entry]) => {
    onScreen = entry.isIntersecting;
    if (onScreen) { prev = performance.now(); wake(); }
  });
  io.observe(canvas);
  const onVisibility = () => { prev = performance.now(); wake(); };
  const onLost = (e: Event) => { e.preventDefault(); disposed = true; };

  window.addEventListener('pointermove', onPointerMove, { passive: true });
  opts.events.addEventListener('pointerdown', onPointerDown, { passive: true });
  opts.events.addEventListener('click', onClick);
  window.addEventListener('deviceorientation', onTilt, { passive: true });
  document.addEventListener('visibilitychange', onVisibility);
  canvas.addEventListener('webglcontextlost', onLost);
  resize();

  return {
    setGlow(hex: string) {
      glowTarget = hexToLinear(hex);
      wake();
    },
    destroy() {
      disposed = true;
      if (raf) cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      window.removeEventListener('pointermove', onPointerMove);
      opts.events.removeEventListener('pointerdown', onPointerDown);
      opts.events.removeEventListener('click', onClick);
      window.removeEventListener('deviceorientation', onTilt);
      document.removeEventListener('visibilitychange', onVisibility);
      canvas.removeEventListener('webglcontextlost', onLost);
      [cellTex, glyphTex, wordTex].forEach((tex) => gl.deleteTexture(tex));
      gl.deleteBuffer(buf);
      gl.deleteProgram(prog);
    },
  };
}
