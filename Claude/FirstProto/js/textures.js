// 절차적 PBR 텍스처 · 재질 생성기 (외부 이미지 파일 없음)
(function () {
  'use strict';
  const HG = (window.HG = window.HG || {});

  HG.rng = function (seed) {
    let s = seed >>> 0;
    return function () {
      s = (s + 0x6d2b79f5) | 0;
      let t = Math.imul(s ^ (s >>> 15), 1 | s);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };

  // ---------- 노이즈 ----------
  const R = new Float32Array(514), P = new Uint16Array(514);
  (function () {
    const r = HG.rng(90210);
    const p = [];
    for (let i = 0; i < 256; i++) { R[i] = r(); p[i] = i; }
    for (let i = 255; i > 0; i--) { const j = (r() * (i + 1)) | 0; const t = p[i]; p[i] = p[j]; p[j] = t; }
    for (let i = 0; i < 514; i++) { P[i] = p[i & 255]; R[i] = R[i & 255]; }
  })();

  function vnoise(x, y, px, py) {
    const xi = Math.floor(x), yi = Math.floor(y);
    const xf = x - xi, yf = y - yi;
    const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
    const x0 = ((xi % px) + px) % px, x1 = (x0 + 1) % px;
    const y0 = ((yi % py) + py) % py, y1 = (y0 + 1) % py;
    const a = R[P[P[x0] + y0]], b = R[P[P[x1] + y0]], c = R[P[P[x0] + y1]], d = R[P[P[x1] + y1]];
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  }
  // 타일 가능한 fbm. fx, fy 는 정수 주파수
  function fbm(u, v, fx, fy, oct) {
    let s = 0, a = 0.5, n = 0;
    for (let i = 0; i < oct; i++) {
      const px = Math.min(fx, 256), py = Math.min(fy, 256);
      s += a * vnoise(u * px, v * py, px, py);
      n += a; a *= 0.5; fx *= 2; fy *= 2;
    }
    return s / n;
  }
  const W = { f1: 0, f2: 0, id: 0 };
  function worley(u, v, n) {
    const x = u * n, y = v * n, xi = Math.floor(x), yi = Math.floor(y);
    let f1 = 9, f2 = 9, id = 0;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      const cx = xi + dx, cy = yi + dy;
      const wx = ((cx % n) + n) % n, wy = ((cy % n) + n) % n;
      const h = P[P[wx] + wy];
      const qx = cx + 0.15 + 0.7 * R[h], qy = cy + 0.15 + 0.7 * R[h + 1];
      const d = Math.hypot(qx - x, qy - y);
      if (d < f1) { f2 = f1; f1 = d; id = h; } else if (d < f2) f2 = d;
    }
    W.f1 = f1; W.f2 = f2; W.id = id;
    return W;
  }
  const c01 = (x) => (x < 0 ? 0 : x > 1 ? 1 : x);
  const mix = (a, b, t) => a + (b - a) * t;
  const ss = (a, b, x) => { const t = c01((x - a) / (b - a)); return t * t * (3 - 2 * t); };
  HG.noise = { vnoise, fbm, worley, ss, mix, c01 };

  // ---------- 맵 생성 ----------
  function canvasTex(data, N, srgb) {
    const c = document.createElement('canvas'); c.width = c.height = N;
    const ctx = c.getContext('2d');
    ctx.putImageData(new ImageData(data, N, N), 0, 0);
    return finishTex(new THREE.CanvasTexture(c), srgb);
  }
  function finishTex(t, srgb) {
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.anisotropy = 16;
    if (srgb) t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }
  HG.finishTex = finishTex;

  // fn(u, v, o) → o.r,o.g,o.b (sRGB 0..1), o.h (높이), o.ro (거칠기)
  HG.genMaps = function (N, fn, nStrength) {
    const col = new Uint8ClampedArray(N * N * 4), rg = new Uint8ClampedArray(N * N * 4), nm = new Uint8ClampedArray(N * N * 4);
    const Hh = new Float32Array(N * N), o = { r: 0, g: 0, b: 0, h: 0, ro: 1 };
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      o.ro = 1; o.h = 0;
      fn((x + 0.5) / N, (y + 0.5) / N, o);
      const i = (y * N + x), k = i * 4;
      col[k] = o.r * 255; col[k + 1] = o.g * 255; col[k + 2] = o.b * 255; col[k + 3] = 255;
      const q = c01(o.ro) * 255; rg[k] = q; rg[k + 1] = q; rg[k + 2] = q; rg[k + 3] = 255;
      Hh[i] = o.h;
    }
    const s = (nStrength || 2) * (N / 512);
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      const xm = (x + N - 1) % N, xp = (x + 1) % N, ym = (y + N - 1) % N, yp = (y + 1) % N;
      const dx = (Hh[y * N + xp] - Hh[y * N + xm]) * s, dy = (Hh[yp * N + x] - Hh[ym * N + x]) * s;
      const l = 1 / Math.hypot(dx, dy, 1), k = (y * N + x) * 4;
      nm[k] = (-dx * l * 0.5 + 0.5) * 255; nm[k + 1] = (dy * l * 0.5 + 0.5) * 255; nm[k + 2] = (l * 0.5 + 0.5) * 255; nm[k + 3] = 255;
    }
    return { map: canvasTex(col, N, true), normalMap: canvasTex(nm, N, false), roughnessMap: canvasTex(rg, N, false) };
  };

  // ---------- 개별 텍스처 정의 ----------
  const defs = {};

  function woodFn(base, opts) {
    opts = opts || {};
    const seam = opts.seam || 0, rmin = opts.rmin == null ? 0.72 : opts.rmin;
    return function (u, v, o) {
      const warp = fbm(u, v, 3, 3, 3);
      const g = fbm(u + warp * 0.03, v, 96, 3, 2);
      const g2 = fbm(u, v + warp * 0.2, 10, 2, 3);
      const ring = Math.pow(Math.abs(Math.sin((u * 14 + warp * 2.2 + g2 * 1.5) * Math.PI)), 0.5);
      const crack = ss(0.74, 0.82, fbm(u, v, 128, 2, 2)) * ss(0.4, 0.7, fbm(u, v, 6, 3, 2));
      const weather = fbm(u, v, 5, 7, 4);
      let t = 0.5 + 0.3 * g + 0.25 * g2;
      t *= 0.72 + 0.28 * ring;
      t *= 1 - crack * 0.6;
      let sm = 0;
      if (seam) { const f = (u * seam) % 1; sm = 1 - ss(0.0, 0.035, Math.min(f, 1 - f)); t *= 1 - sm * 0.75; t *= 0.9 + 0.2 * R[(Math.floor(u * seam) * 37) & 255]; }
      const gray = ss(0.45, 0.8, weather) * (opts.gray == null ? 0.35 : opts.gray);
      const l = (base[0] + base[1] + base[2]) / 3;
      o.r = c01(mix(base[0], l * 1.15, gray) * t * 1.5);
      o.g = c01(mix(base[1], l * 1.15, gray) * t * 1.5);
      o.b = c01(mix(base[2], l * 1.2, gray) * t * 1.5);
      o.h = g * 0.5 + ring * 0.25 - crack * 0.8 - sm * 1.2;
      o.ro = mix(rmin, 1, c01(g * 0.6 + gray * 0.6 + crack));
    };
  }
  defs.wood = [512, woodFn([0.2, 0.135, 0.085]), 2.2];
  defs.woodFloor = [512, woodFn([0.27, 0.17, 0.09], { seam: 5, rmin: 0.38, gray: 0.15 }), 1.8];
  defs.woodPlank = [512, woodFn([0.2, 0.14, 0.09], { seam: 4, rmin: 0.7, gray: 0.45 }), 2.4];
  defs.woodPale =[512, woodFn([0.42, 0.33, 0.22], { seam: 3, rmin: 0.8, gray: 0.5 }), 2.2];

  defs.plaster = [512, function (u, v, o) {
    const n = fbm(u, v, 5, 5, 5), f = fbm(u, v, 64, 64, 2);
    worley(u, v, 6);
    const region = ss(0.6, 0.72, fbm(u, v, 3, 3, 2));
    const crack = (1 - ss(0.0, 0.013, W.f2 - W.f1)) * region * 0.6;
    const stain = ss(0.48, 0.75, fbm(u + 0.37, v, 2, 5, 4));
    const drip = ss(0.55, 0.8, fbm(u, v, 24, 2, 3)) * 0.35;
    let t = 0.78 + 0.22 * n - 0.1 * f;
    let r = 0.66 * t, g = 0.61 * t, b = 0.5 * t;
    const st = c01(stain * 0.55 + drip);
    r = mix(r, 0.3, st); g = mix(g, 0.26, st); b = mix(b, 0.19, st);
    const k = 1 - crack * 0.7;
    o.r = r * k; o.g = g * k; o.b = b * k;
    o.h = n * 0.5 + f * 0.2 - crack * 0.9;
    o.ro = 0.93;
  }, 1.6];

  defs.mud = [512, function (u, v, o) {
    const n = fbm(u, v, 6, 6, 5), f = fbm(u, v, 80, 80, 2);
    const straw = ss(0.72, 0.8, fbm(u, v, 30, 140, 2)) + ss(0.74, 0.8, fbm(u + 0.5, v, 150, 26, 2));
    worley(u, v, 5);
    const crack = (1 - ss(0.0, 0.018, W.f2 - W.f1)) * ss(0.5, 0.68, fbm(u + 0.2, v, 3, 3, 2)) * 0.7;
    const t = 0.7 + 0.35 * n - 0.12 * f;
    let r = 0.36 * t, g = 0.27 * t, b = 0.17 * t;
    const s = c01(straw);
    r = mix(r, 0.52, s * 0.6); g = mix(g, 0.43, s * 0.6); b = mix(b, 0.25, s * 0.6);
    const k = 1 - crack * 0.55;
    o.r = r * k; o.g = g * k; o.b = b * k;
    o.h = n * 0.6 + f * 0.25 + s * 0.3 - crack * 1.0;
    o.ro = 0.97;
  }, 2.4];

  defs.stoneWall = [512, function (u, v, o) {
    const w = worley(u + fbm(u, v, 6, 6, 2) * 0.03, v, 7);
    const edge = w.f2 - w.f1, id = w.id;
    const stone = ss(0.05, 0.3, edge);
    const n = fbm(u, v, 40, 40, 3), n2 = fbm(u, v, 9, 9, 3);
    const tone = 0.55 + 0.6 * R[id] ;
    const warm = R[id + 7];
    let r = (0.3 + 0.08 * warm) * tone, g = 0.29 * tone, b = (0.27 - 0.04 * warm) * tone;
    const k = 0.75 + 0.4 * n;
    r *= k; g *= k; b *= k;
    const moss = ss(0.6, 0.8, n2) * 0.4;
    r = mix(r, 0.12, moss); g = mix(g, 0.16, moss); b = mix(b, 0.08, moss);
    const mr = 0.2 * (0.7 + 0.5 * n), mg = 0.155 * (0.7 + 0.5 * n), mb = 0.1 * (0.7 + 0.5 * n);
    o.r = mix(mr, r, stone); o.g = mix(mg, g, stone); o.b = mix(mb, b, stone);
    o.h = stone * (0.75 + 0.25 * Math.sqrt(c01(edge * 1.6))) + n * 0.12;
    o.ro = mix(1, 0.82, stone);
  }, 5];

  defs.stone = [512, function (u, v, o) {
    const n = fbm(u, v, 6, 6, 5), sp = fbm(u, v, 128, 128, 2), sp2 = vnoise(u * 256, v * 256, 256, 256);
    const row = Math.floor(v * 4), fu = (u * 3 + (row % 2) * 0.5) % 1, fv = (v * 4) % 1;
    const seam = 1 - Math.min(ss(0, 0.03, Math.min(fu, 1 - fu)), ss(0, 0.045, Math.min(fv, 1 - fv)));
    const bid = R[(row * 17 + Math.floor(u * 3 + (row % 2) * 0.5) * 5) & 255];
    let t = (0.62 + 0.4 * n) * (0.85 + 0.25 * bid) + (sp - 0.5) * 0.25 + (sp2 > 0.86 ? -0.12 : 0);
    const moss = ss(0.55, 0.8, fbm(u + 0.2, v, 4, 4, 4)) * 0.35;
    let r = 0.39 * t, g = 0.385 * t, b = 0.37 * t;
    r = mix(r, 0.14, moss); g = mix(g, 0.17, moss); b = mix(b, 0.1, moss);
    const k = 1 - seam * 0.75;
    o.r = r * k; o.g = g * k; o.b = b * k;
    o.h = n * 0.35 + sp * 0.2 - seam * 1.2;
    o.ro = 0.86 + 0.1 * sp;
  }, 2.5];

  defs.rock = [256, function (u, v, o) {
    const n = fbm(u, v, 4, 4, 5), sp = fbm(u, v, 64, 64, 2);
    const t = 0.55 + 0.5 * n + (sp - 0.5) * 0.3;
    const moss = ss(0.55, 0.75, fbm(u + 0.4, v, 3, 3, 4)) * 0.5;
    o.r = mix(0.36 * t, 0.12, moss); o.g = mix(0.35 * t, 0.16, moss); o.b = mix(0.33 * t, 0.09, moss);
    o.h = n * 0.6 + sp * 0.3; o.ro = 0.9;
  }, 3];

  defs.ground = [1024, function (u, v, o) {
    const n = fbm(u, v, 6, 6, 6), f = fbm(u, v, 96, 96, 2);
    const w = worley(u, v, 48);
    const peb = (1 - ss(0.06 + 0.16 * R[w.id + 5], 0.1 + 0.2 * R[w.id + 5], w.f1)) * (R[w.id] > 0.8 ? 1 : 0);
    const pt = 0.6 + 0.6 * R[w.id + 3];
    const big = fbm(u + 0.11, v + 0.3, 3, 3, 5);
    const snow = ss(0.5, 0.63, big + (fbm(u, v, 24, 24, 3) - 0.5) * 0.12);
    const wet = ss(0.38, 0.28, big);
    let t = 0.62 + 0.5 * n - 0.2 * f;
    let r = 0.43 * t, g = 0.36 * t, b = 0.275 * t;
    r = mix(r, 0.5 * pt, peb); g = mix(g, 0.485 * pt, peb); b = mix(b, 0.46 * pt, peb);
    r *= 1 - wet * 0.45; g *= 1 - wet * 0.42; b *= 1 - wet * 0.38;
    const sv = 0.74 + 0.16 * n;
    r = mix(r, sv * 0.93, snow); g = mix(g, sv * 0.97, snow); b = mix(b, sv * 1.06, snow);
    o.r = c01(r); o.g = c01(g); o.b = c01(b);
    o.h = mix(n * 0.5 + f * 0.3 + peb * 0.6, 0.75 + n * 0.25 + f * 0.04, snow);
    o.ro = mix(mix(0.95, 0.45, wet), 0.7, snow);
  }, 2.6];

  defs.tile = [512, function (u, v, o) {
    const n = fbm(u, v, 8, 8, 5), f = fbm(u, v, 96, 96, 2);
    const fv = (v * 6) % 1;
    const lap = 1 - ss(0.0, 0.08, fv);
    const moss = ss(0.56, 0.78, fbm(u + 0.6, v, 5, 5, 4));
    const frost = ss(0.62, 0.8, fbm(u, v + 0.4, 4, 4, 4)) * 0.45;
    let t = 0.55 + 0.6 * n - 0.15 * f;
    let r = 0.115 * t, g = 0.12 * t, b = 0.128 * t;
    r = mix(r, 0.07, moss * 0.6); g = mix(g, 0.1, moss * 0.6); b = mix(b, 0.05, moss * 0.6);
    r = mix(r, 0.62, frost); g = mix(g, 0.66, frost); b = mix(b, 0.74, frost);
    const k = 1 - lap * 0.6;
    o.r = r * k; o.g = g * k; o.b = b * k;
    o.h = n * 0.3 + f * 0.15 + fv * 0.9 + frost * 0.2;
    o.ro = mix(0.62, 0.9, c01(n + moss));
  }, 2.4];

  defs.thatch = [512, function (u, v, o) {
    const st = fbm(u + fbm(u, v, 4, 4, 2) * 0.02, v, 128, 5, 2), st2 = fbm(u, v, 200, 10, 1);
    const n = fbm(u, v, 5, 5, 4);
    const layer = (v * 5 + n * 0.5) % 1;
    const lap = 1 - ss(0, 0.12, layer);
    let t = (0.45 + 0.75 * st) * (0.7 + 0.4 * n) * (1 - lap * 0.5) * (0.8 + 0.3 * st2);
    const rot = ss(0.55, 0.8, fbm(u + 0.3, v, 3, 3, 3)) * 0.55;
    o.r = c01(mix(0.43, 0.17, rot) * t); o.g = c01(mix(0.34, 0.14, rot) * t); o.b = c01(mix(0.19, 0.1, rot) * t);
    o.h = st * 0.8 + st2 * 0.2 - lap * 0.8;
    o.ro = 1;
  }, 3.2];

  defs.onggi = [256, function (u, v, o) {
    const n = fbm(u, v, 5, 5, 5), f = fbm(u, v, 64, 64, 2);
    const drip = ss(0.5, 0.8, fbm(u, v, 20, 2, 3));
    const t = 0.65 + 0.5 * n;
    o.r = c01(mix(0.36, 0.2, drip) * t); o.g = c01(mix(0.19, 0.11, drip) * t); o.b = c01(mix(0.115, 0.075, drip) * t);
    o.h = n * 0.4 + f * 0.15;
    o.ro = mix(0.3, 0.62, c01(n * 0.8 + f * 0.5 - drip * 0.3));
  }, 1];

  defs.bark = [512, function (u, v, o) {
    const warp = fbm(u, v, 4, 4, 3);
    const ridge = 1 - Math.abs(fbm(u + warp * 0.05, v, 18, 3, 3) * 2 - 1);
    const fine = fbm(u, v, 80, 20, 2);
    const moss = ss(0.6, 0.8, fbm(u + 0.2, v, 3, 4, 4)) * 0.4;
    const t = 0.3 + 0.9 * ridge * ridge + 0.2 * fine;
    o.r = mix(0.17 * t, 0.09, moss); o.g = mix(0.145 * t, 0.12, moss); o.b = mix(0.12 * t, 0.06, moss);
    o.h = ridge * ridge + fine * 0.2;
    o.ro = 0.95;
  }, 4.5];

  defs.fabric = [512, function (u, v, o) {
    const wv = 0.5 + 0.25 * Math.sin(u * Math.PI * 2 * 64) + 0.25 * Math.sin(v * Math.PI * 2 * 64);
    const n = fbm(u, v, 4, 4, 4), st = ss(0.6, 0.85, fbm(u + 0.5, v, 3, 5, 4));
    const t = 0.86 + 0.025 * wv + 0.12 * n;
    o.r = c01(mix(0.86, 0.5, st * 0.5) * t); o.g = c01(mix(0.85, 0.46, st * 0.5) * t); o.b = c01(mix(0.8, 0.36, st * 0.5) * t);
    o.h = wv * 0.16 + n * 0.45; o.ro = 0.96;
  }, 1.2];

  defs.hanji = [256, function (u, v, o) {
    const n = fbm(u, v, 4, 4, 4);
    const fib = ss(0.7, 0.82, fbm(u, v, 20, 120, 2)) + ss(0.72, 0.82, fbm(u + 0.3, v, 110, 18, 2));
    const st = ss(0.55, 0.85, fbm(u + 0.2, v + 0.6, 3, 3, 4));
    const t = 0.86 + 0.14 * n - 0.07 * c01(fib);
    o.r = c01(mix(0.87, 0.6, st * 0.6) * t); o.g = c01(mix(0.82, 0.5, st * 0.6) * t); o.b = c01(mix(0.7, 0.34, st * 0.6) * t);
    o.h = n * 0.3 + c01(fib) * 0.4; o.ro = 0.9;
  }, 0.8];

  defs.jangpan = [512, function (u, v, o) {
    const n = fbm(u, v, 5, 5, 5), f = fbm(u, v, 64, 64, 2);
    const fu = (u * 3) % 1, fv = (v * 2) % 1;
    const seam = 1 - Math.min(ss(0, 0.012, Math.min(fu, 1 - fu)), ss(0, 0.012, Math.min(fv, 1 - fv)));
    const worn = ss(0.5, 0.75, fbm(u + 0.3, v, 3, 3, 4));
    const t = 0.75 + 0.3 * n;
    o.r = c01(mix(0.5, 0.36, worn) * t * (1 - seam * 0.5));
    o.g = c01(mix(0.36, 0.27, worn) * t * (1 - seam * 0.5));
    o.b = c01(mix(0.16, 0.15, worn) * t * (1 - seam * 0.5));
    o.h = n * 0.2 + f * 0.1 - seam * 0.6;
    o.ro = mix(0.32, 0.7, c01(worn + f * 0.4));
  }, 1.2];

  defs.rope = [128, function (u, v, o) {
    const tw = 0.5 + 0.5 * Math.sin((u * 3 + v * 14) * Math.PI * 2);
    const n = fbm(u, v, 32, 32, 2);
    const t = 0.5 + 0.5 * tw + 0.2 * n;
    o.r = c01(0.5 * t); o.g = c01(0.4 * t); o.b = c01(0.22 * t);
    o.h = tw; o.ro = 1;
  }, 3];

  // ---------- 2D 캔버스 그림 텍스처 ----------
  function cv(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
  function texFrom(c, srgb, noRepeat) {
    const t = new THREE.CanvasTexture(c);
    t.anisotropy = 16;
    if (srgb !== false) t.colorSpace = THREE.SRGBColorSpace;
    if (!noRepeat) t.wrapS = t.wrapT = THREE.RepeatWrapping;
    return t;
  }
  function speckle(ctx, w, h, n, a, rnd) {
    for (let i = 0; i < n; i++) {
      ctx.fillStyle = `rgba(${rnd() < 0.5 ? '60,40,10' : '255,240,200'},${a * rnd()})`;
      ctx.fillRect(rnd() * w, rnd() * h, 1 + rnd() * 2, 1 + rnd() * 2);
    }
  }

  HG.drawTalisman = function () {
    const c = cv(256, 512), x = c.getContext('2d'), rnd = HG.rng(77);
    x.fillStyle = '#c4a03c'; x.fillRect(0, 0, 256, 512);
    const g = x.createLinearGradient(0, 0, 256, 512);
    g.addColorStop(0, 'rgba(255,230,150,0.25)'); g.addColorStop(1, 'rgba(90,50,10,0.35)');
    x.fillStyle = g; x.fillRect(0, 0, 256, 512);
    speckle(x, 256, 512, 2500, 0.25, rnd);
    x.strokeStyle = '#8a1208'; x.fillStyle = '#8a1208'; x.lineCap = 'round'; x.lineJoin = 'round';
    x.lineWidth = 7; x.strokeRect(22, 22, 212, 468);
    x.lineWidth = 3; x.strokeRect(34, 34, 188, 444);
    x.font = 'bold 64px "Batang","Gungsuh","Malgun Gothic",serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
    x.fillText('勅', 128, 84); x.fillText('令', 128, 152);
    x.lineWidth = 9;
    x.beginPath(); x.moveTo(128, 196); x.lineTo(128, 400); x.stroke();
    for (let i = 0; i < 5; i++) {
      const y = 215 + i * 36, wv = 62 - i * 5;
      x.lineWidth = 7 - i * 0.6;
      x.beginPath(); x.moveTo(128 - wv, y + 12); x.quadraticCurveTo(128 - wv * 0.4, y - 16, 128, y);
      x.quadraticCurveTo(128 + wv * 0.4, y + 16, 128 + wv, y - 10); x.stroke();
      x.beginPath(); x.arc(128 - wv, y + 12, 4, 0, 7); x.arc(128 + wv, y - 10, 4, 0, 7); x.fill();
    }
    x.lineWidth = 6;
    x.beginPath(); x.arc(128, 352, 30, 0.3, Math.PI * 2.2); x.stroke();
    x.font = 'bold 58px "Batang","Gungsuh","Malgun Gothic",serif';
    x.fillText('鬼', 128, 440);
    x.globalCompositeOperation = 'multiply';
    for (let i = 0; i < 9; i++) {
      x.fillStyle = `rgba(70,45,15,${0.1 + rnd() * 0.15})`;
      x.beginPath(); x.ellipse(rnd() * 256, rnd() * 512, 20 + rnd() * 50, 15 + rnd() * 40, rnd() * 3, 0, 7); x.fill();
    }
    return texFrom(c, true, true);
  };

  HG.drawLetter = function (seed) {
    const c = cv(256, 320), x = c.getContext('2d'), rnd = HG.rng(seed);
    x.fillStyle = '#cdbf98'; x.fillRect(0, 0, 256, 320);
    speckle(x, 256, 320, 1800, 0.2, rnd);
    x.fillStyle = 'rgba(18,14,10,0.85)';
    for (let col = 0; col < 9; col++) {
      const cx = 232 - col * 25; let y = 22 + rnd() * 10;
      const end = 250 + rnd() * 50;
      while (y < end) {
        const hh = 7 + rnd() * 9;
        x.beginPath(); x.ellipse(cx + (rnd() - 0.5) * 3, y + hh / 2, 5 + rnd() * 3, hh / 2, rnd() * 0.6, 0, 7); x.fill();
        y += hh + 3 + rnd() * 3;
      }
    }
    x.globalCompositeOperation = 'multiply';
    x.fillStyle = 'rgba(120,90,50,0.3)';
    x.beginPath(); x.ellipse(60, 250, 70, 50, 0.4, 0, 7); x.fill();
    return texFrom(c, true, true);
  };

  HG.drawScreen = function (seed) {
    const c = cv(256, 768), x = c.getContext('2d'), rnd = HG.rng(seed);
    x.fillStyle = '#b9a67e'; x.fillRect(0, 0, 256, 768);
    speckle(x, 256, 768, 3000, 0.18, rnd);
    for (let L = 0; L < 5; L++) {
      const baseY = 200 + L * 105, amp = 110 - L * 12, a = 0.18 + L * 0.13;
      const g = x.createLinearGradient(0, baseY - amp, 0, baseY + 130);
      g.addColorStop(0, `rgba(20,22,24,${a})`); g.addColorStop(1, 'rgba(20,22,24,0)');
      x.fillStyle = g; x.beginPath(); x.moveTo(0, 768);
      const ph = rnd() * 10;
      for (let px = 0; px <= 256; px += 4) {
        const n = fbm(px / 256 + ph, L * 0.37, 3, 3, 5);
        const peak = Math.pow(Math.abs(Math.sin(px / 256 * (2 + L) + ph)), 1.6);
        x.lineTo(px, baseY - amp * (0.25 + 0.75 * peak) * (0.5 + n));
      }
      x.lineTo(256, 768); x.fill();
    }
    x.strokeStyle = 'rgba(15,15,15,0.7)';
    for (let i = 0; i < 5; i++) {
      const tx = 30 + rnd() * 196, ty = 610 + rnd() * 90, th = 50 + rnd() * 60;
      x.lineWidth = 3; x.beginPath(); x.moveTo(tx, ty); x.quadraticCurveTo(tx + 8, ty - th / 2, tx - 4, ty - th); x.stroke();
      x.lineWidth = 1.2;
      for (let b = 0; b < 7; b++) { const by = ty - th * (0.4 + rnd() * 0.6); x.beginPath(); x.moveTo(tx, by); x.lineTo(tx + (rnd() - 0.5) * 50, by - rnd() * 22); x.stroke(); }
    }
    x.fillStyle = 'rgba(140,25,15,0.75)'; x.fillRect(206, 60, 22, 22);
    x.fillStyle = 'rgba(15,12,10,0.8)';
    for (let i = 0; i < 7; i++) { x.beginPath(); x.ellipse(217, 100 + i * 17, 6, 7, rnd(), 0, 7); x.fill(); }
    x.strokeStyle = '#2a1d12'; x.lineWidth = 14; x.strokeRect(0, 0, 256, 768);
    x.strokeStyle = '#5a4526'; x.lineWidth = 3; x.strokeRect(11, 11, 234, 746);
    return texFrom(c, true, true);
  };

  // 방 안에서 본 창호지 (바깥 살의 그림자가 비침)
  HG.drawHanjiInside = function () {
    const c = cv(256, 512), x = c.getContext('2d'), rnd = HG.rng(5);
    x.fillStyle = '#d2c5a2'; x.fillRect(0, 0, 256, 512);
    speckle(x, 256, 512, 2500, 0.15, rnd);
    x.fillStyle = 'rgba(40,28,14,0.42)';
    for (let i = 1; i < 8; i++) x.fillRect(i * 32 - 2, 0, 4, 512);
    const rows = [40, 56, 72, 88, 216, 232, 248, 264, 280, 408, 424, 440, 456];
    rows.forEach((y) => x.fillRect(0, y, 256, 4));
    x.fillStyle = 'rgba(30,20,10,0.75)';
    x.fillRect(0, 0, 256, 14); x.fillRect(0, 498, 256, 14); x.fillRect(0, 0, 12, 512); x.fillRect(244, 0, 12, 512);
    x.globalCompositeOperation = 'multiply';
    for (let i = 0; i < 6; i++) { x.fillStyle = `rgba(110,85,45,${0.1 + rnd() * 0.2})`; x.beginPath(); x.ellipse(rnd() * 256, rnd() * 512, 30 + rnd() * 60, 20 + rnd() * 50, rnd() * 3, 0, 7); x.fill(); }
    return texFrom(c, true, true);
  };

  HG.drawSilhouette = function () {
    const c = cv(256, 512), x = c.getContext('2d');
    x.filter = 'blur(7px)';
    x.fillStyle = 'rgba(0,0,0,0.92)';
    x.beginPath(); x.ellipse(128, 92, 34, 42, 0, 0, 7); x.fill();
    x.beginPath(); x.moveTo(92, 80); x.quadraticCurveTo(70, 220, 86, 330); x.lineTo(170, 330); x.quadraticCurveTo(186, 220, 164, 80); x.fill();
    x.beginPath(); x.moveTo(84, 150); x.quadraticCurveTo(128, 120, 172, 150); x.lineTo(206, 512); x.lineTo(50, 512); x.fill();
    x.beginPath(); x.moveTo(64, 170); x.lineTo(40, 360); x.lineTo(62, 364); x.lineTo(90, 180); x.fill();
    x.beginPath(); x.moveTo(192, 170); x.lineTo(216, 360); x.lineTo(194, 364); x.lineTo(166, 180); x.fill();
    return texFrom(c, true, true);
  };

  HG.drawFace = function () {
    const c = cv(1024, 512), x = c.getContext('2d'), rnd = HG.rng(13);
    x.scale(2, 2);
    x.fillStyle = '#aab3b4'; x.fillRect(0, 0, 512, 256);
    for (let i = 0; i < 60; i++) { x.fillStyle = `rgba(${rnd() < 0.5 ? '70,80,95' : '150,140,150'},${0.05 + rnd() * 0.08})`; x.beginPath(); x.ellipse(rnd() * 512, rnd() * 256, 8 + rnd() * 30, 6 + rnd() * 20, rnd() * 3, 0, 7); x.fill(); }
    const cx = 128;
    const eye = (ex) => {
      let g = x.createRadialGradient(ex, 112, 2, ex, 112, 26);
      g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(0.5, 'rgba(5,0,5,0.95)'); g.addColorStop(1, 'rgba(40,20,40,0)');
      x.fillStyle = g; x.beginPath(); x.ellipse(ex, 112, 22, 26, 0, 0, 7); x.fill();
      x.fillStyle = 'rgba(235,235,225,0.9)'; x.beginPath(); x.arc(ex + 1, 114, 2.2, 0, 7); x.fill();
    };
    eye(cx - 27); eye(cx + 27);
    let g = x.createRadialGradient(cx, 178, 2, cx, 178, 30);
    g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(0.7, 'rgba(10,0,0,0.95)'); g.addColorStop(1, 'rgba(60,20,30,0)');
    x.fillStyle = g; x.beginPath(); x.ellipse(cx, 180, 15, 30, 0, 0, 7); x.fill();
    x.strokeStyle = 'rgba(40,45,70,0.5)'; x.lineWidth = 1;
    for (let i = 0; i < 26; i++) {
      let px = cx + (rnd() - 0.5) * 110, py = 40 + rnd() * 190; x.beginPath(); x.moveTo(px, py);
      for (let k = 0; k < 6; k++) { px += (rnd() - 0.5) * 16; py += rnd() * 14; x.lineTo(px, py); } x.stroke();
    }
    x.fillStyle = 'rgba(20,10,20,0.35)'; x.beginPath(); x.ellipse(cx, 140, 5, 10, 0, 0, 7); x.fill();
    return texFrom(c, true, true);
  };

  HG.drawPuff = function () {
    const c = cv(256, 256), x = c.getContext('2d'), rnd = HG.rng(3);
    for (let i = 0; i < 40; i++) {
      const px = 128 + (rnd() - 0.5) * 120, py = 128 + (rnd() - 0.5) * 90, r = 30 + rnd() * 50;
      const g = x.createRadialGradient(px, py, 0, px, py, r);
      g.addColorStop(0, 'rgba(255,255,255,0.09)'); g.addColorStop(1, 'rgba(255,255,255,0)');
      x.fillStyle = g; x.fillRect(0, 0, 256, 256);
    }
    return texFrom(c, false, true);
  };

  HG.drawFlame = function () {
    const c = cv(64, 128), x = c.getContext('2d');
    const g = x.createRadialGradient(32, 84, 2, 32, 70, 52);
    g.addColorStop(0, 'rgba(255,255,235,1)'); g.addColorStop(0.25, 'rgba(255,215,120,0.95)');
    g.addColorStop(0.6, 'rgba(255,120,30,0.45)'); g.addColorStop(1, 'rgba(255,60,0,0)');
    x.fillStyle = g; x.beginPath(); x.moveTo(32, 6); x.bezierCurveTo(58, 60, 54, 112, 32, 120); x.bezierCurveTo(10, 112, 6, 60, 32, 6); x.fill();
    return texFrom(c, true, true);
  };

  // ---------- 재질 ----------
  HG.buildMaterials = async function (onProgress) {
    const T = (HG.T = {}), M = (HG.M = {});
    const names = Object.keys(defs);
    for (let i = 0; i < names.length; i++) {
      const d = defs[names[i]];
      T[names[i]] = HG.genMaps(d[0], d[1], d[2]);
      if (onProgress) onProgress((i + 1) / names.length, names[i]);
      await new Promise((r) => setTimeout(r, 0));
    }
    const std = (maps, o) => new THREE.MeshStandardMaterial(Object.assign({ map: maps.map, normalMap: maps.normalMap, roughnessMap: maps.roughnessMap, roughness: 1, metalness: 0 }, o || {}));
    const ns = (v) => new THREE.Vector2(v, v);
    M.wood = std(T.wood, { normalScale: ns(1.0) });
    M.woodFloor = std(T.woodFloor, { normalScale: ns(0.8) });
    M.woodPale = std(T.woodPale, { normalScale: ns(1.0) });
    M.woodPlank = std(T.woodPlank, { normalScale: ns(1.1) });
    M.plaster = std(T.plaster, { normalScale: ns(0.8) });
    M.plaster2 = std(T.plaster, { normalScale: ns(0.8), side: THREE.DoubleSide });
    M.mud = std(T.mud, { normalScale: ns(1.2) });
    M.stoneWall = std(T.stoneWall, { normalScale: ns(1.6) });
    M.stone = std(T.stone, { normalScale: ns(1.2) });
    M.rock = std(T.rock, { normalScale: ns(1.3) });
    M.ground = std(T.ground, { normalScale: ns(1.3) });
    M.tile = std(T.tile, { normalScale: ns(1.0), side: THREE.DoubleSide });
    M.thatch = std(T.thatch, { normalScale: ns(1.6), side: THREE.DoubleSide });
    M.onggi = std(T.onggi, { normalScale: ns(0.4) });
    M.bark = std(T.bark, { normalScale: ns(1.8) });
    M.fabric = std(T.fabric, { normalScale: ns(0.5), side: THREE.DoubleSide });
    M.hemp = std(T.fabric, { normalScale: ns(0.8), side: THREE.DoubleSide, color: 0xb59a66 });
    M.hanji = std(T.hanji, { normalScale: ns(0.4), side: THREE.DoubleSide });
    M.hanjiWall = std(T.hanji, { normalScale: ns(0.5), color: 0xcfc4a8 });
    M.jangpan = std(T.jangpan, { normalScale: ns(0.5) });
    M.rope = std(T.rope, { normalScale: ns(1.2) });
    M.iron = new THREE.MeshStandardMaterial({ color: 0x15130f, roughness: 0.55, metalness: 0.9 });
    M.brass = new THREE.MeshStandardMaterial({ color: 0x8a6a2c, roughness: 0.38, metalness: 1.0 });
    M.bronze = new THREE.MeshStandardMaterial({ color: 0x4c3a22, roughness: 0.45, metalness: 0.9 });
    M.black = new THREE.MeshStandardMaterial({ color: 0x050505, roughness: 0.6 });
    M.white = new THREE.MeshStandardMaterial({ color: 0xc8c4b8, roughness: 0.5 });
    M.wax = new THREE.MeshStandardMaterial({ color: 0xd8cfb0, roughness: 0.5, emissive: 0x5a3008, emissiveIntensity: 0.5 });
    M.quiltRed = std(T.fabric, { color: 0x7a1c1c, normalScale: ns(0.6) });
    M.quiltBlue = std(T.fabric, { color: 0x1d2c4d, normalScale: ns(0.6) });
    M.cloth = [0x7d2420, 0x27406e, 0xa88a35, 0xb9b4a6, 0x2c4f38].map((c) => std(T.fabric, { color: c, side: THREE.DoubleSide, normalScale: ns(0.5) }));
    M.water = new THREE.MeshStandardMaterial({ color: 0x020304, roughness: 0.04, metalness: 0.2 });
    M.talisman = new THREE.MeshStandardMaterial({ map: HG.drawTalisman(), roughness: 0.85, side: THREE.DoubleSide, emissive: 0x2a1c05, emissiveIntensity: 0.25 });
    M.letter = new THREE.MeshStandardMaterial({ map: HG.drawLetter(21), roughness: 0.9, side: THREE.DoubleSide });
    M.letter2 = new THREE.MeshStandardMaterial({ map: HG.drawLetter(88), roughness: 0.9, side: THREE.DoubleSide });
  };
})();
