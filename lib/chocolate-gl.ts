/**
 * Tempered chocolate, drawn in one fragment shader.
 *
 * A molded bar (squares with chamfered edges, each embossed with the six-petal
 * rosette, plus a panel carrying the brand name) lies on a dark table. A key
 * light follows the pointer, or the phone's tilt, so the gloss slides across the
 * bevels. The rim light and the glow around the bar take the season's colour.
 */

type Vec3 = [number, number, number];

export interface ChocolateOptions {
  word: string;
  fontFamily: string;
  glow: string; // hex
  reducedMotion: boolean;
  /** Element that receives taps to move the light (usually the hero) */
  stage: HTMLElement;
  /** Text the bar must not sit behind; its real text extents are measured */
  avoid?: HTMLElement | null;
  onHint?: (kind: 'pointer' | 'tilt' | 'tap') => void;
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
uniform vec3  uLight;
uniform vec3  uGlow;
uniform float uExposure;
uniform vec3  uBarC;
uniform vec3  uAxX;
uniform vec3  uAxY;
uniform vec3  uAxZ;
uniform vec2  uGrid;
uniform float uHeader;
uniform float uTanH;
uniform sampler2D uWord;
uniform vec2  uWordSize;
uniform float uHasWord;

const float MARGIN = 0.17;
const float BASE_H = 0.085;
const float SQ_H = 0.16;
const float SQ_BEVEL = 0.12;
const float GAP = 0.05;
const float SQ_R = 0.07;
const float OUT_R = 0.16;
const float OUT_BEVEL = 0.055;

float sdBox(vec2 p, vec2 b, float r) {
  vec2 q = abs(p) - b + r;
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
}

// Straight chamfer with rounded shoulders (C1-continuous), 0 -> 1
float ramp(float x) {
  x = clamp(x, 0.0, 1.0);
  const float k = 0.22;
  if (x < k) return x * x / (2.0 * k * (1.0 - k));
  if (x > 1.0 - k) return 1.0 - (1.0 - x) * (1.0 - x) / (2.0 * k * (1.0 - k));
  return (x - 0.5 * k) / (1.0 - k);
}

vec2 halfSize() { return vec2(uGrid.x * 0.5 + MARGIN, (uGrid.y + uHeader) * 0.5 + MARGIN); }

// Six petals, six seasons: a low relief on every square
float rosette(vec2 c) {
  float r = length(c);
  float a = atan(c.y, c.x);
  float petal = 0.05 + 0.13 * pow(abs(cos(3.0 * a)), 0.85);
  float body = 1.0 - smoothstep(-0.012, 0.012, r - petal);
  float dome = 0.5 + 0.5 * smoothstep(0.19, 0.02, r);
  float hole = 1.0 - smoothstep(0.02, 0.034, r);
  return body * dome * 0.026 - hole * 0.022;
}

float heightAt(vec2 q, out float occ) {
  occ = 0.0;
  vec2 hb = halfSize();
  float dOut = sdBox(q, hb, OUT_R);
  if (dOut > 0.0) return 0.0;
  float h = BASE_H * ramp(-dOut / OUT_BEVEL);

  float gridTop = -hb.y + MARGIN + uGrid.y;
  float d = 1.0;
  float top = 0.0;
  if (q.y < gridTop) {
    vec2 g = q - vec2(-uGrid.x * 0.5, -hb.y + MARGIN);
    vec2 id = floor(g);
    if (id.x >= 0.0 && id.x < uGrid.x && id.y >= 0.0) {
      vec2 c = fract(g) - 0.5;
      d = sdBox(c, vec2(0.5 - GAP), SQ_R);
      float rise = ramp(-d / SQ_BEVEL);
      h += SQ_H * rise;
      top = smoothstep(0.9, 1.0, rise);
      h += rosette(c) * top;
    }
  } else {
    vec2 p = q - vec2(0.0, gridTop + uHeader * 0.5);
    d = sdBox(p, vec2(uGrid.x * 0.5 - GAP, uHeader * 0.5 - GAP), SQ_R * 1.4);
    float rise = ramp(-d / SQ_BEVEL);
    h += SQ_H * rise;
    top = smoothstep(0.9, 1.0, rise);
    if (uHasWord > 0.5) {
      vec2 uv = p / uWordSize + 0.5;
      if (uv.x > 0.0 && uv.x < 1.0 && uv.y > 0.0 && uv.y < 1.0) {
        float w = texture2D(uWord, vec2(uv.x, 1.0 - uv.y)).r;
        h += smoothstep(0.18, 0.82, w) * 0.034 * top;
      }
    }
  }
  // Grooves between pieces sit in shadow
  occ = smoothstep(-SQ_BEVEL * 0.55, 0.0, d) * (1.0 - smoothstep(0.0, 0.17, d));
  return h;
}

float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}
vec3 aces(vec3 x) { return clamp((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0); }

void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uRes) / (0.5 * uRes.y);
  vec3 rd = normalize(vec3(uv * uTanH, -1.0));
  float t = dot(uBarC, uAxZ) / dot(rd, uAxZ);
  vec3 P = rd * t;
  vec3 rel = P - uBarC;
  vec2 q = vec2(dot(rel, uAxX), dot(rel, uAxY));

  float occ, tmp;
  float h = heightAt(q, occ);
  const float e = 0.0032;
  float hx = heightAt(q + vec2(e, 0.0), tmp) - heightAt(q - vec2(e, 0.0), tmp);
  float hy = heightAt(q + vec2(0.0, e), tmp) - heightAt(q - vec2(0.0, e), tmp);
  vec3 nl = normalize(vec3(-hx / (2.0 * e), -hy / (2.0 * e), 1.0));
  vec2 mq = q * 55.0;
  nl = normalize(nl + vec3(noise(mq) - 0.5, noise(mq + 19.7) - 0.5, 0.0) * 0.03);
  vec3 n = normalize(nl.x * uAxX + nl.y * uAxY + nl.z * uAxZ);

  vec3 S = P + uAxZ * h;
  vec3 V = normalize(-S);
  vec3 Lv = uLight - S;
  float Ld = length(Lv);
  vec3 L = Lv / Ld;
  float atten = 1.0 / (1.0 + 0.018 * Ld * Ld);
  vec3 key = vec3(1.0, 0.92, 0.82) * 6.0;

  vec2 hb = halfSize();
  float dOut = sdBox(q, hb, OUT_R);
  float bar = 1.0 - smoothstep(-0.004, 0.004, dOut);

  // Chocolate: very dark albedo, wrapped diffuse with a warm terminator,
  // a sharp gloss core over a satin sheen, and season-tinted reflections on the bevels
  vec3 albedo = vec3(0.034, 0.0135, 0.0068) * (0.88 + 0.24 * noise(q * 7.0));
  float ndl = dot(n, L);
  float wrap = max((ndl + 0.3) / 1.3, 0.0);
  vec3 warm = mix(vec3(1.0, 0.62, 0.42), vec3(1.0), smoothstep(0.0, 0.6, ndl));
  vec3 H = normalize(L + V);
  float ndh = max(dot(n, H), 0.0);
  float ndv = max(dot(n, V), 0.001);
  float F = 0.045 + 0.955 * pow(1.0 - ndv, 5.0);
  float spec = pow(ndh, 220.0) * 34.0 + pow(ndh, 30.0) * 1.6;
  vec3 R = reflect(-V, n);
  // Reflections take only part of the season colour, so cool seasons don't turn the chocolate grey
  vec3 skyCol = mix(vec3(1.0, 0.84, 0.7), uGlow, 0.45);
  vec3 sky = skyCol * (0.05 + 0.8 * smoothstep(-0.2, 0.85, R.y));
  // A softbox: the broad, soft-edged reflection that makes tempered chocolate look glossy
  float rl = dot(R, L);
  vec3 box = key * (1.3 * smoothstep(0.972, 0.992, rl) + 0.12 * pow(max(rl, 0.0), 12.0));
  float ao = 1.0 - 0.66 * occ;
  vec3 choc = albedo * (key * atten * wrap * 0.6 * warm + vec3(0.07, 0.055, 0.045) + uGlow * 0.03) * ao
            + key * atten * spec * F
            + (sky * 0.9 + box) * F * ao;

  // Table: lit pool, soft shadow of the bar, season glow around it
  vec3 Lt = normalize(uLight - P);
  float lz = max(dot(Lt, uAxZ), 0.08);
  vec2 ld = vec2(dot(Lt, uAxX), dot(Lt, uAxY)) / lz;
  float sd = sdBox(q + ld * (BASE_H + SQ_H) * 0.95, hb, OUT_R);
  float shadow = mix(0.18, 1.0, smoothstep(-0.12, 0.6, sd));
  float contact = mix(0.3, 1.0, smoothstep(0.0, 0.32, dOut));
  vec3 table = vec3(0.015, 0.0095, 0.0068) * key * max(dot(uAxZ, Lt), 0.0) * atten * shadow * contact;
  table += uGlow * (0.045 * exp(-max(dOut, 0.0) * 1.15) + 0.01) * contact;

  vec3 col = mix(table, choc, bar);
  col *= uExposure;
  vec2 vg = uv * vec2(0.5, 0.78);
  col *= 1.0 - 0.22 * dot(vg, vg);
  col = pow(aces(col), vec3(1.0 / 2.2));
  col += (hash(gl_FragCoord.xy + fract(uTime) * 61.0) - 0.5) / 255.0;
  gl_FragColor = vec4(col, 1.0);
}
`;

const TAN_H = 0.36;
const MARGIN = 0.17; // keep in sync with the shader

interface Layout {
  sx: number; // bar centre on screen, NDC
  sy: number;
  dist: number;
  spin: number;
  tilt: number;
  cols: number;
  rows: number;
  header: number;
}

interface TextBox { left: number; right: number; top: number; bottom: number } // NDC

/**
 * Fit the bar into the space the headline leaves free: beside it on wide
 * screens, above it on narrow ones. Allowed to bleed off the far edges.
 */
function layoutFor(aspect: number, text: TextBox | null, stacked: boolean): Layout {
  const base = stacked
    ? { spin: -0.3, tilt: -0.46, cols: 4, rows: 4, header: 1.05 }
    : { spin: -0.4, tilt: -0.5, cols: 4, rows: 5, header: 1.05 };
  const hw = base.cols / 2 + MARGIN;
  const hh = (base.rows + base.header) / 2 + MARGIN;
  const cs = Math.abs(Math.cos(base.spin));
  const ss = Math.abs(Math.sin(base.spin));
  const boxW = hw * cs + hh * ss; // rotated half-extent, world units
  const boxH = (hw * ss + hh * cs) * Math.cos(base.tilt);

  if (!stacked) {
    // The rotated bar's left-most point is its low corner, beside the (narrower) paragraph
    const left = (text ? text.right : -0.1) - 0.02;
    const halfNdc = clamp((1.14 - left) / 2, 0.36, 0.72);
    let dist = boxW / (TAN_H * aspect * halfNdc);
    dist = Math.max(dist, boxH / (TAN_H * 1.12)); // may bleed a little top and bottom
    const realHalf = boxW / (dist * TAN_H * aspect);
    const sy = text ? clamp((text.top + text.bottom) / 2 - 0.04, -0.3, 0.15) : -0.05;
    return { ...base, dist, sx: left + realHalf, sy };
  }
  // Top limit keeps the name panel below the transparent header
  const bottom = (text ? text.top : 0) + 0.05;
  const halfNdc = clamp((0.98 - bottom) / 2, 0.3, 0.7);
  const dist = Math.max(boxH / (TAN_H * halfNdc), boxW / (TAN_H * aspect * 1.25));
  const realHalf = boxH / (dist * TAN_H);
  return { ...base, dist, sx: 0.12, sy: bottom + realHalf };
}

const dot = (a: Vec3, b: Vec3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const scale = (a: Vec3, s: number): Vec3 => [a[0] * s, a[1] * s, a[2] * s];
const add = (a: Vec3, b: Vec3): Vec3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const norm = (a: Vec3): Vec3 => scale(a, 1 / Math.hypot(a[0], a[1], a[2]));
const clamp = (x: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, x));

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

/** Brand name as a soft height map (white = raised), blurred so the letters get bevels. */
async function wordHeightMap(word: string, fontFamily: string) {
  const w = 1024;
  const h = 256;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return null;
  let size = 200;
  try {
    await document.fonts.load(`${size}px ${fontFamily}`, word);
  } catch {
    /* fall back to whatever serif is available */
  }
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, w, h);
  ctx.font = `${size}px ${fontFamily}, Georgia, serif`;
  const width = ctx.measureText(word).width;
  if (width > w * 0.84) {
    size *= (w * 0.84) / width;
    ctx.font = `${size}px ${fontFamily}, Georgia, serif`;
  }
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(word, w / 2, h / 2 + size * 0.05);

  const src = ctx.getImageData(0, 0, w, h).data;
  const a = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) a[i] = src[i * 4] / 255;
  const b = new Float32Array(w * h);
  const r = 4;
  // Two separable box-blur passes ≈ gaussian
  for (let pass = 0; pass < 2; pass++) {
    for (let y = 0; y < h; y++) {
      let acc = 0;
      for (let x = -r; x <= r; x++) acc += a[y * w + clamp(x, 0, w - 1)];
      for (let x = 0; x < w; x++) {
        b[y * w + x] = acc / (2 * r + 1);
        acc += a[y * w + clamp(x + r + 1, 0, w - 1)] - a[y * w + clamp(x - r, 0, w - 1)];
      }
    }
    for (let x = 0; x < w; x++) {
      let acc = 0;
      for (let y = -r; y <= r; y++) acc += b[clamp(y, 0, h - 1) * w + x];
      for (let y = 0; y < h; y++) {
        a[y * w + x] = acc / (2 * r + 1);
        acc += b[clamp(y + r + 1, 0, h - 1) * w + x] - b[clamp(y - r, 0, h - 1) * w + x];
      }
    }
  }
  const out = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) out[i] = Math.round(a[i] * 255);
  return { data: out, w, h };
}

export function createChocolateRenderer(canvas: HTMLCanvasElement, opts: ChocolateOptions): ChocolateRenderer | null {
  const gl = canvas.getContext('webgl', {
    antialias: false, alpha: false, depth: false, stencil: false,
    premultipliedAlpha: false, powerPreference: 'high-performance',
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
    res: U('uRes'), time: U('uTime'), light: U('uLight'), glow: U('uGlow'), exposure: U('uExposure'),
    barC: U('uBarC'), axX: U('uAxX'), axY: U('uAxY'), axZ: U('uAxZ'), grid: U('uGrid'), header: U('uHeader'),
    tanH: U('uTanH'), word: U('uWord'), wordSize: U('uWordSize'), hasWord: U('uHasWord'),
  };

  const tex = gl.createTexture();
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, 1, 1, 0, gl.LUMINANCE, gl.UNSIGNED_BYTE, new Uint8Array([0]));
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.uniform1i(u.word, 0);
  gl.uniform1f(u.tanH, TAN_H);
  let hasWord = 0;
  let disposed = false;

  wordHeightMap(opts.word, opts.fontFamily).then((map) => {
    if (!map || disposed) return;
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, map.w, map.h, 0, gl.LUMINANCE, gl.UNSIGNED_BYTE, map.data);
    hasWord = 1;
    drawNow();
  });

  // ── State ────────────────────────────────────────────────────
  let aspect = 1;
  let layout = layoutFor(1, null, false);
  let placedLight = false;
  const glow = hexToLinear(opts.glow);
  let glowTarget = glow.slice() as Vec3;
  const pointer = { x: 0, y: 0, tx: 0, ty: 0, last: -Infinity };
  const started = performance.now();
  const introMs = opts.reducedMotion ? 0 : 2200;
  let raf = 0;
  let prev = started;
  let onScreen = true;
  let lastInput: 'pointer' | 'tilt' | 'tap' | null = null;

  function restPoint() {
    return { x: layout.sx - 0.42, y: layout.sy + 0.42 };
  }

  function frame(axisSpin = 0, axisTilt = 0) {
    const spin = layout.spin + axisSpin;
    const tilt = layout.tilt + axisTilt;
    const cs = Math.cos(spin), ss = Math.sin(spin), ct = Math.cos(tilt), st = Math.sin(tilt);
    const axX: Vec3 = [cs, ss * ct, ss * st];
    const axY: Vec3 = [-ss, cs * ct, cs * st];
    const axZ: Vec3 = [0, -st, ct];
    const C: Vec3 = [layout.sx * layout.dist * TAN_H * aspect, layout.sy * layout.dist * TAN_H, -layout.dist];
    return { axX, axY, axZ, C };
  }

  /** Put the light where its mirror reflection lands under the pointer. */
  function lightFor(nx: number, ny: number, f: ReturnType<typeof frame>): Vec3 {
    const d = norm([nx * TAN_H * aspect, ny * TAN_H, -1]);
    const N = f.axZ;
    const t = dot(f.C, N) / dot(d, N);
    const P = scale(d, t);
    const r = add(d, scale(N, -2 * dot(d, N)));
    return add(P, scale(r, 5.2));
  }

  /** Union of the text fragments inside `avoid`, in canvas NDC. */
  function measureText(rect: DOMRect): TextBox | null {
    if (!opts.avoid) return null;
    const range = document.createRange();
    range.selectNodeContents(opts.avoid);
    let l = Infinity, r = -Infinity, t = Infinity, b = -Infinity;
    for (const f of Array.from(range.getClientRects())) {
      if (!f.width || !f.height) continue;
      l = Math.min(l, f.left); r = Math.max(r, f.right + 24); // + button padding
      t = Math.min(t, f.top); b = Math.max(b, f.bottom);
    }
    range.detach();
    if (!Number.isFinite(l)) return null;
    const nx = (x: number) => ((x - rect.left) / rect.width) * 2 - 1;
    const ny = (y: number) => -(((y - rect.top) / rect.height) * 2 - 1);
    return { left: nx(l), right: nx(r), top: ny(t), bottom: ny(b) };
  }

  function resize() {
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    let dpr = Math.min(window.devicePixelRatio || 1, 1.75);
    const maxPixels = 2_600_000;
    if (rect.width * rect.height * dpr * dpr > maxPixels) dpr = Math.sqrt(maxPixels / (rect.width * rect.height));
    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);
    gl!.viewport(0, 0, canvas.width, canvas.height);
    aspect = rect.width / rect.height;
    layout = layoutFor(aspect, measureText(rect), window.matchMedia('(max-width: 760px)').matches);
    if (!placedLight) {
      placedLight = true;
      const r = restPoint();
      pointer.x = pointer.tx = opts.reducedMotion ? r.x : layout.sx - 1.4;
      pointer.y = pointer.ty = opts.reducedMotion ? r.y : layout.sy + 1.0;
    }
    drawNow();
  }

  /** Draw immediately (not waiting for the next animation frame), then keep going if needed. */
  function drawNow() {
    if (disposed) return;
    if (raf) { cancelAnimationFrame(raf); raf = 0; }
    render(performance.now());
  }

  function toNdc(clientX: number, clientY: number) {
    const rect = canvas.getBoundingClientRect();
    return { x: ((clientX - rect.left) / rect.width) * 2 - 1, y: -(((clientY - rect.top) / rect.height) * 2 - 1) };
  }

  function note(kind: 'pointer' | 'tilt' | 'tap') {
    if (lastInput !== kind) { lastInput = kind; opts.onHint?.(kind); }
  }

  const onPointerMove = (e: PointerEvent) => {
    if (e.pointerType !== 'mouse' && e.pointerType !== 'pen') return;
    const p = toNdc(e.clientX, e.clientY);
    pointer.tx = p.x; pointer.ty = p.y; pointer.last = performance.now();
    note('pointer');
    wake();
  };
  const onPointerDown = (e: PointerEvent) => {
    if (e.pointerType !== 'touch') return;
    const p = toNdc(e.clientX, e.clientY);
    pointer.tx = p.x; pointer.ty = p.y; pointer.last = performance.now();
    wake();
  };
  const onTilt = (e: DeviceOrientationEvent) => {
    if (e.gamma == null || e.beta == null) return;
    const r = restPoint();
    pointer.tx = r.x + 0.2 + clamp(e.gamma / 28, -1, 1) * 0.95;
    pointer.ty = r.y - 0.2 + clamp((e.beta - 55) / 26, -1, 1) * -0.85;
    pointer.last = performance.now();
    note('tilt');
    wake();
  };

  function render(now: number) {
    raf = 0;
    const dt = Math.min(0.05, (now - prev) / 1000);
    prev = now;
    const t = (now - started) / 1000;
    const intro = introMs ? clamp((now - started) / introMs, 0, 1) : 1;
    const ease = 1 - Math.pow(1 - intro, 3);

    // Idle: the light drifts slowly around the bar
    const idle = now - pointer.last > 2600;
    if (idle && !opts.reducedMotion && intro >= 1) {
      const r = restPoint();
      pointer.tx = r.x + 0.3 + Math.cos(t * 0.32) * 0.62;
      pointer.ty = r.y - 0.25 + Math.sin(t * 0.47) * 0.45;
    } else if (intro < 1 && pointer.last === -Infinity) {
      const r = restPoint();
      pointer.tx = r.x; pointer.ty = r.y;
    }
    const k = 1 - Math.exp(-dt * (intro < 1 ? 1.7 : idle ? 1.2 : 6));
    pointer.x += (pointer.tx - pointer.x) * k;
    pointer.y += (pointer.ty - pointer.y) * k;
    const kg = 1 - Math.exp(-dt * 2.5);
    for (let i = 0; i < 3; i++) glow[i] += (glowTarget[i] - glow[i]) * kg;

    const par = opts.reducedMotion ? 0 : 1;
    const f = frame(clamp(pointer.x - layout.sx, -1.5, 1.5) * 0.035 * par, clamp(pointer.y - layout.sy, -1.5, 1.5) * -0.04 * par);
    const L = lightFor(pointer.x, pointer.y, f);

    gl!.uniform2f(u.res, canvas.width, canvas.height);
    gl!.uniform1f(u.time, t);
    gl!.uniform3f(u.light, L[0], L[1], L[2]);
    gl!.uniform3f(u.glow, glow[0], glow[1], glow[2]);
    gl!.uniform1f(u.exposure, 0.12 + 0.88 * ease);
    gl!.uniform3f(u.barC, f.C[0], f.C[1], f.C[2]);
    gl!.uniform3f(u.axX, f.axX[0], f.axX[1], f.axX[2]);
    gl!.uniform3f(u.axY, f.axY[0], f.axY[1], f.axY[2]);
    gl!.uniform3f(u.axZ, f.axZ[0], f.axZ[1], f.axZ[2]);
    gl!.uniform2f(u.grid, layout.cols, layout.rows);
    gl!.uniform1f(u.header, layout.header);
    gl!.uniform2f(u.wordSize, layout.cols - 0.7, (layout.cols - 0.7) / 4);
    gl!.uniform1f(u.hasWord, hasWord);
    gl!.drawArrays(gl!.TRIANGLES, 0, 3);

    const settling = Math.abs(pointer.tx - pointer.x) + Math.abs(pointer.ty - pointer.y) > 0.0005
      || Math.abs(glowTarget[0] - glow[0]) + Math.abs(glowTarget[1] - glow[1]) + Math.abs(glowTarget[2] - glow[2]) > 0.0005;
    const animating = intro < 1 || settling || (!opts.reducedMotion && idle);
    if (animating) wake();
  }

  function wake() {
    if (!raf && onScreen && !disposed && document.visibilityState === 'visible') {
      raf = requestAnimationFrame((n) => render(n));
    }
  }

  const ro = new ResizeObserver(resize);
  ro.observe(canvas);
  if (opts.avoid) ro.observe(opts.avoid);
  document.fonts?.ready.then(() => { if (!disposed) resize(); });
  const io = new IntersectionObserver(([entry]) => {
    onScreen = entry.isIntersecting;
    if (onScreen) { prev = performance.now(); wake(); }
  });
  io.observe(canvas);
  const onVisibility = () => { prev = performance.now(); wake(); };
  const onLost = (e: Event) => { e.preventDefault(); disposed = true; };

  window.addEventListener('pointermove', onPointerMove, { passive: true });
  opts.stage.addEventListener('pointerdown', onPointerDown, { passive: true });
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
      opts.stage.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('deviceorientation', onTilt);
      document.removeEventListener('visibilitychange', onVisibility);
      canvas.removeEventListener('webglcontextlost', onLost);
      gl.deleteTexture(tex);
      gl.deleteBuffer(buf);
      gl.deleteProgram(prog);
    },
  };
}
