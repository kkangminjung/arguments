// 지오메트리 도우미: 병합 빌더, 기와지붕, 초가지붕, 나무, 창호
(function () {
  'use strict';
  const HG = (window.HG = window.HG || {});

  HG.uTime = { value: 0 };
  HG.uWind = { value: 1 };

  // ---------- 병합 빌더 ----------
  HG.Builder = class {
    constructor() { this.map = new Map(); }
    add(geo, mat, x, y, z, rx, ry, rz) {
      let g = geo.index ? geo.toNonIndexed() : geo.clone();
      if (rx || ry || rz) { const m = new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(rx || 0, ry || 0, rz || 0)); g.applyMatrix4(m); }
      if (x || y || z) g.translate(x || 0, y || 0, z || 0);
      for (const k of Object.keys(g.attributes)) if (k !== 'position' && k !== 'normal' && k !== 'uv') g.deleteAttribute(k);
      if (!this.map.has(mat)) this.map.set(mat, []);
      this.map.get(mat).push(g);
      return this;
    }
    build(parent, opts) {
      opts = opts || {};
      const out = [];
      for (const [mat, list] of this.map) {
        const geo = HG.addons.mergeGeometries(list, false);
        const mesh = new THREE.Mesh(geo, mat);
        mesh.castShadow = opts.cast !== false && !(opts.noCast && opts.noCast.includes(mat));
        mesh.receiveShadow = opts.receive !== false;
        parent.add(mesh); out.push(mesh);
        list.forEach((g) => g.dispose());
      }
      this.map.clear();
      return out;
    }
  };

  // 월드 스케일 UV 를 가진 상자. grain: 나뭇결이 흐르는 축 ('x'|'y'|'z')
  let uvSeed = 1;
  HG.box = function (w, h, d, s, grain) {
    const g = new THREE.BoxGeometry(w, h, d);
    const uv = g.attributes.uv, dim = { x: w, y: h, z: d };
    const faces = [['z', 'y'], ['z', 'y'], ['x', 'z'], ['x', 'z'], ['x', 'y'], ['x', 'y']];
    s = s || 1;
    uvSeed = (uvSeed * 16807) % 2147483647;
    const ou = (uvSeed % 1000) / 1000, ov = ((uvSeed >> 10) % 1000) / 1000;
    for (let f = 0; f < 6; f++) {
      const ua = faces[f][0], va = faces[f][1];
      for (let i = 0; i < 4; i++) {
        const k = f * 4 + i;
        let u = uv.getX(k) * dim[ua] / s, v = uv.getY(k) * dim[va] / s;
        if (grain && grain === ua) { const t = u; u = v; v = t; }
        uv.setXY(k, u + ou, v + ov);
      }
    }
    return g;
  };
  HG.cyl = function (rt, rb, h, seg, s, open) {
    const g = new THREE.CylinderGeometry(rt, rb, h, seg || 12, 1, !!open);
    const uv = g.attributes.uv; s = s || 1;
    const circ = Math.PI * (rt + rb);
    const n = (seg || 12) + 1;
    for (let i = 0; i < n * 2; i++) uv.setXY(i, uv.getX(i) * Math.max(1, Math.round(circ / s)), uv.getY(i) * h / s);
    return g;
  };
  HG.scaleUV = function (g, su, sv) {
    const uv = g.attributes.uv;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * su, uv.getY(i) * (sv == null ? su : sv));
    return g;
  };

  function makeGeo(pos, uv, idx) {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    g.setIndex(idx);
    g.computeVertexNormals();
    return g;
  }
  HG.makeGeo = makeGeo;

  // ---------- 기와지붕 (맞배, 처마 곡선) ----------
  HG.roofProfile = function (H) { return (t) => H * (0.45 * (1 - t) + 0.55 * (1 - t) * (1 - t)); };
  HG.roofGeo = function (o) {
    const L = o.L, D = o.D, H = o.H, lift = o.lift || 0, rl = o.ridgeLift || 0, sp = o.sp || 0.3, tr = o.tubeR || 0.075;
    const nt = o.nt || 10, thick = o.thick == null ? 0.1 : o.thick, ts = o.texScale || 2.4;
    const prof = HG.roofProfile(H);
    const yAt = (x, t) => prof(t) + Math.pow(Math.abs(x) / (L / 2), 2.5) * (lift * t + rl * (1 - t));
    const nx = Math.max(2, Math.round(L / sp));
    function surface(yoff, flip) {
      const pos = [], uv = [], idx = [];
      for (const s of [-1, 1]) {
        const base = pos.length / 3;
        for (let i = 0; i <= nx; i++) {
          const x = -L / 2 + (L * i) / nx;
          for (let j = 0; j <= nt; j++) { const t = j / nt; pos.push(x, yAt(x, t) + yoff, s * D * t); uv.push(x / ts, (t * D * 1.15) / ts); }
        }
        for (let i = 0; i < nx; i++) for (let j = 0; j < nt; j++) {
          const a = base + i * (nt + 1) + j, b = a + 1, c = a + (nt + 1), d = c + 1;
          if ((s > 0) !== !!flip) idx.push(a, b, c, b, d, c); else idx.push(a, c, b, b, c, d);
        }
      }
      return makeGeo(pos, uv, idx);
    }
    // 프로파일을 따라가는 쓸기(sweep)
    function sweeps(xs, t0, t1, n, yoff, r, full, caps) {
      const pos = [], uv = [], idx = [], K = full ? 6 : 5;
      for (const xc of xs) for (const s of [-1, 1]) {
        const base = pos.length / 3;
        for (let j = 0; j <= n; j++) {
          const t = t0 + ((t1 - t0) * j) / n, yb = yAt(xc, t) + yoff;
          for (let k = 0; k <= K; k++) {
            const a = (full ? 2 : 1) * Math.PI * (k / K);
            pos.push(xc + Math.cos(a) * r, yb + Math.sin(a) * r, s * D * t);
            uv.push(k / K * 0.3, (t * D) / 1.2);
          }
        }
        for (let j = 0; j < n; j++) for (let k = 0; k < K; k++) {
          const a = base + j * (K + 1) + k, b = a + (K + 1), c = a + 1, d = b + 1;
          if (s > 0) idx.push(a, c, b, c, d, b); else idx.push(a, b, c, c, b, d);
        }
        if (caps) {
          const ci = pos.length / 3, t = t1, yb = yAt(xc, t) + yoff;
          pos.push(xc, yb, s * D * t); uv.push(0.5, 0.5);
          const row = base + n * (K + 1);
          for (let k = 0; k < K; k++) { if (s > 0) idx.push(ci, row + k, row + k + 1); else idx.push(ci, row + k + 1, row + k); }
        }
      }
      return makeGeo(pos, uv, idx);
    }
    const cols = [];
    for (let i = 0; i < nx; i++) cols.push(-L / 2 + ((i + 0.5) * L) / nx);
    const res = { top: surface(0, false), under: surface(-thick, true), tubes: sweeps(cols, 0.0, 1.0, nt, 0.004, tr, false, true), yAt: yAt };
    if (!o.noRafters) {
      const rs = [], rsp = o.rafterSp || 0.38, rn = Math.floor((L - 0.3) / rsp);
      for (let i = 0; i <= rn; i++) rs.push(-(rn * rsp) / 2 + i * rsp);
      res.rafters = sweeps(rs, 0.03, 0.975, 6, -thick - 0.062, 0.058, true, true);
    }
    // 용마루
    const pts = [];
    for (let i = 0; i <= 10; i++) { const x = -L / 2 + (L * i) / 10; pts.push(new THREE.Vector3(x, yAt(x, 0) + (o.ridgeR || 0.15) * 0.55, 0)); }
    const rr = o.ridgeR || 0.15;
    const ridge = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 20, rr, 8, false);
    const c1 = new THREE.SphereGeometry(rr * 1.15, 8, 6); c1.translate(pts[0].x, pts[0].y, 0);
    const c2 = new THREE.SphereGeometry(rr * 1.15, 8, 6); c2.translate(pts[10].x, pts[10].y, 0);
    res.ridge = HG.addons.mergeGeometries([ridge, c1, c2]);
    return res;
  };

  // ---------- 초가지붕 ----------
  HG.thatchGeo = function (hx, hz, h, seed) {
    const rnd = HG.rng(seed || 4), pos = [], uv = [], idx = [], na = 56, nb = 12, e = 2 / 3.2;
    for (let j = 0; j <= nb; j++) {
      const b = j / nb, f = Math.pow(Math.sin(b * Math.PI / 2), 0.85), yy = h * Math.pow(Math.cos(b * Math.PI / 2), 1.25);
      for (let i = 0; i <= na; i++) {
        const a = ((i % na) / na) * Math.PI * 2, c = Math.cos(a), s = Math.sin(a);
        const px = hx * Math.sign(c) * Math.pow(Math.abs(c), e) * f, pz = hz * Math.sign(s) * Math.pow(Math.abs(s), e) * f;
        const jit = j === nb ? (HG.noise.vnoise(i * 0.9, 3.3, 56, 8) - 0.5) * 0.22 : (HG.noise.vnoise(i * 0.5, j * 0.7, 28, 16) - 0.5) * 0.1 * b;
        pos.push(px, yy + jit - (j === nb ? 0.12 : 0), pz);
        uv.push((i / na) * 6, b * 1.6);
      }
    }
    for (let j = 0; j < nb; j++) for (let i = 0; i < na; i++) {
      const a = j * (na + 1) + i, b2 = a + 1, c = a + (na + 1), d = c + 1;
      idx.push(a, c, b2, b2, c, d);
    }
    rnd();
    return makeGeo(pos, uv, idx);
  };

  // ---------- 나무 ----------
  HG.treeGeo = function (seed, o) {
    const rnd = HG.rng(seed), geos = [], up = new THREE.Vector3(0, 1, 0), q = new THREE.Quaternion();
    const tips = [];
    function branch(p, dir, len, r, depth) {
      const r2 = Math.max(r * (o.taper || 0.72), 0.012);
      const seg = r > 0.25 ? 12 : r > 0.1 ? 8 : r > 0.04 ? 6 : 4;
      const g = new THREE.CylinderGeometry(r2, r, len, seg, 1, true);
      HG.scaleUV(g, Math.max(1, Math.round((r * 6.3) / 1.5)), len / 1.5);
      g.translate(0, len / 2, 0);
      q.setFromUnitVectors(up, dir); g.applyQuaternion(q); g.translate(p.x, p.y, p.z);
      geos.push(g);
      const end = p.clone().addScaledVector(dir, len);
      if (r2 > 0.03) { const sg = new THREE.SphereGeometry(r2 * 1.02, seg, 4); sg.translate(end.x, end.y, end.z); geos.push(sg); }
      if (depth <= 0) { tips.push(end); return; }
      const n = depth === o.depth ? (o.firstSplit || 3) : rnd() < 0.4 ? 3 : 2;
      for (let c = 0; c < n; c++) {
        const leader = c === 0 && depth > o.depth - (o.leader || 2);
        const ang = leader ? 0.12 + rnd() * 0.2 : (o.spread || 0.55) * (0.6 + rnd() * 0.8);
        const axis = new THREE.Vector3(rnd() - 0.5, rnd() - 0.5, rnd() - 0.5).cross(dir).normalize();
        const nd = dir.clone().applyAxisAngle(axis, ang);
        nd.y += (o.upBias || 0.15) - (depth < 2 ? (o.droop || 0) : 0); nd.normalize();
        branch(end, nd, len * (leader ? 0.85 : 0.6 + rnd() * 0.25), r2 * (leader ? 1 : 0.62 + rnd() * 0.2), depth - 1);
      }
    }
    const d0 = o.straight ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3((rnd() - 0.5) * 0.15, 1, (rnd() - 0.5) * 0.15).normalize();
    branch(new THREE.Vector3(0, -0.2, 0), d0, o.trunk, o.radius, o.depth);
    if (o.roots) for (let i = 0; i < o.roots; i++) {
      const a = (i / o.roots) * Math.PI * 2 + rnd(), rl = o.radius * (1.6 + rnd());
      const g = new THREE.CylinderGeometry(o.radius * 0.12, o.radius * 0.42, rl, 7, 1, true);
      HG.scaleUV(g, 1, rl / 1.5); g.translate(0, rl / 2, 0);
      q.setFromUnitVectors(up, new THREE.Vector3(Math.cos(a), -0.28, Math.sin(a)).normalize()); g.applyQuaternion(q);
      g.translate(Math.cos(a) * o.radius * 0.5, o.radius * 0.5, Math.sin(a) * o.radius * 0.5); geos.push(g);
    }
    const out = HG.addons.mergeGeometries(geos.map((g) => (g.index ? g.toNonIndexed() : g)));
    out.userData.tips = tips;
    return out;
  };

  // 울퉁불퉁한 돌
  HG.rockGeo = function (seed, sx, sy, sz) {
    const rnd = HG.rng(seed), g = new THREE.IcosahedronGeometry(1, 2), p = g.attributes.position, v = new THREE.Vector3();
    const ox = rnd() * 50, oy = rnd() * 50;
    for (let i = 0; i < p.count; i++) {
      v.fromBufferAttribute(p, i);
      const n = HG.noise.vnoise(v.x * 1.7 + ox + 8, v.y * 1.7 + oy + 8 + v.z * 1.3, 256, 256);
      v.multiplyScalar(0.75 + n * 0.5); p.setXYZ(i, v.x * sx, v.y * sy, v.z * sz);
    }
    g.deleteAttribute('normal');
    const m = HG.addons.mergeVertices(g, 1e-3);
    m.computeVertexNormals();
    HG.scaleUV(m, 2);
    return m;
  };

  // 띠살 창호 한 짝 (원점 = 문짝 중심, 살은 +z 쪽)
  HG.latticeLeaf = function (B, w, h, x, y, z, ry, hanjiMat, insideMat) {
    const M = HG.M, fr = 0.045, th = 0.035;
    const place = (g, m, lx, ly, lz) => {
      const e = new THREE.Euler(0, ry || 0, 0), v = new THREE.Vector3(lx, ly, lz).applyEuler(e);
      B.add(g, m, x + v.x, y + v.y, z + v.z, 0, ry || 0, 0);
    };
    place(HG.box(fr, h, th, 1.2, 'y'), M.wood, -w / 2 + fr / 2, 0, 0);
    place(HG.box(fr, h, th, 1.2, 'y'), M.wood, w / 2 - fr / 2, 0, 0);
    place(HG.box(w - fr * 2, fr, th, 1.2, 'x'), M.wood, 0, h / 2 - fr / 2, 0);
    place(HG.box(w - fr * 2, fr, th, 1.2, 'x'), M.wood, 0, -h / 2 + fr / 2, 0);
    const iw = w - fr * 2, ih = h - fr * 2, nv = Math.max(4, Math.round(iw / 0.095));
    for (let i = 1; i < nv; i++) place(HG.box(0.012, ih, 0.018, 1.2, 'y'), M.wood, -iw / 2 + (iw * i) / nv, 0, 0.006);
    const rows = [];
    for (let k = 0; k < 4; k++) rows.push(ih / 2 - 0.08 - k * 0.045);
    for (let k = -2; k <= 2; k++) rows.push(k * 0.045);
    for (let k = 0; k < 4; k++) rows.push(-ih / 2 + 0.08 + k * 0.045);
    rows.forEach((ry2) => place(HG.box(iw, 0.012, 0.014, 1.2, 'x'), M.wood, 0, ry2, 0.012));
    const pg = new THREE.PlaneGeometry(iw, ih); HG.scaleUV(pg, iw / 0.8, ih / 0.8);
    place(pg, hanjiMat || M.hanji, 0, 0, -0.004);
    if (insideMat) { const ig = new THREE.PlaneGeometry(iw + fr, ih + fr); ig.rotateY(Math.PI); place(ig, insideMat, 0, 0, -0.019); }
  };

  // 주름진 천 (위쪽 가장자리가 y=0 에 걸림)
  HG.clothGeo = function (w, h, sx, sy, seed, fold) {
    const g = new THREE.PlaneGeometry(w, h, sx, sy), p = g.attributes.position, r = HG.rng(seed || 1);
    const k1 = 9 + r() * 8, k2 = 17 + r() * 10, ph1 = r() * 6, ph2 = r() * 6, a = fold == null ? 0.035 : fold;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), y = p.getY(i), v = 0.5 - y / h;
      const z = (Math.sin(x * k1 + ph1 + v * 1.5) * a + Math.sin(x * k2 + ph2 - v * 2.2) * a * 0.45) * (0.35 + 0.65 * v);
      p.setXYZ(i, x * (1 - 0.07 * v * Math.sin(x * 3 + ph1)), y - h / 2 - Math.abs(Math.sin(x * k1 * 0.5 + ph2)) * 0.02 * v, z);
    }
    g.computeVertexNormals();
    return g;
  };

  // 바람에 흔들리는 천/풀 재질
  HG.windify = function (mat, amp, instanced, bias) {
    const bi = (bias == null ? 0.6 : bias).toFixed(3);
    mat.onBeforeCompile = (sh) => {
      sh.uniforms.uTime = HG.uTime; sh.uniforms.uWind = HG.uWind;
      sh.vertexShader = 'uniform float uTime;\nuniform float uWind;\n' + sh.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
        #ifdef USE_INSTANCING
          vec4 wp0 = instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0);
          float wk = uv.y * uv.y;
        #else
          vec4 wp0 = modelMatrix * vec4(0.0, 0.0, 0.0, 1.0);
          float wk = (1.0 - uv.y); wk = wk * (0.35 + 0.65 * wk);
        #endif
        float wph = wp0.x * 1.31 + wp0.z * 1.73 + position.x * 2.0;
        float wa = float(${amp.toFixed(4)}) * (0.25 + 0.75 * uWind);
        transformed.z += (sin(uTime * 1.9 + wph) + 0.5 * sin(uTime * 3.7 + wph * 1.9 + position.y * 3.0) + ${bi} * uWind) * wk * wa;
        transformed.x += sin(uTime * 1.3 + wph * 0.7) * wk * wa * 0.45;`);
    };
    mat.customProgramCacheKey = () => 'wind' + amp + (instanced ? 'i' : '') + bi;
    return mat;
  };
})();
