// 귀신 — 우물에 빠져 죽은 며느리
// 조각한 얼굴 + 안구 + 입체 이빨 + 몸을 타고 흐르는 헤어 카드 + 굽은 자세 / 웅크린 자세
(function () {
  'use strict';
  const HG = (window.HG = window.HG || {});
  const lerp = (a, b, t) => a + (b - a) * t;
  const sstep = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

  function cv(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
  function tex(c, srgb) { const t = new THREE.CanvasTexture(c); t.anisotropy = 16; if (srgb !== false) t.colorSpace = THREE.SRGBColorSpace; return t; }

  // 입 모양 (얼굴 좌표, m). xn = x / MW
  const MW = 0.047;
  const mouthU = (xn) => -0.05 + 0.021 * xn * xn, mouthL = (xn) => -0.075 + 0.046 * xn * xn;

  // 얼굴 정면 평면 투영 텍스처. 1024px = 가로 0.24m, 세로 0.28m
  const PX = (x) => 512 + (x * 1024) / 0.24, PY = (y) => 512 - (y * 1024) / 0.28;
  function drawFace(kind) {
    const c = cv(1024, 1024), x = c.getContext('2d'), rnd = HG.rng(kind === 'grin' ? 13 : 29);
    const grin = kind === 'grin';
    x.fillStyle = '#a9adab'; x.fillRect(0, 0, 1024, 1024);
    for (let i = 0; i < 700; i++) {
      const dark = rnd() < 0.62;
      x.fillStyle = dark ? `rgba(58,66,78,${0.02 + rnd() * 0.06})` : `rgba(226,228,220,${0.02 + rnd() * 0.05})`;
      x.beginPath(); x.ellipse(rnd() * 1024, rnd() * 1024, 5 + rnd() * 44, 4 + rnd() * 30, rnd() * 3, 0, 7); x.fill();
    }
    for (let i = 0; i < 16000; i++) { x.fillStyle = `rgba(${rnd() < 0.55 ? '34,38,46' : '226,226,218'},${rnd() * 0.14})`; x.fillRect(rnd() * 1024, rnd() * 1024, 1 + rnd() * 1.5, 1 + rnd() * 1.5); }
    let g = x.createRadialGradient(512, 500, 200, 512, 520, 520);
    g.addColorStop(0, 'rgba(14,16,22,0)'); g.addColorStop(0.55, 'rgba(14,16,22,0.5)'); g.addColorStop(1, 'rgba(6,7,10,0.94)');
    x.fillStyle = g; x.fillRect(0, 0, 1024, 1024);
    for (let i = 0; i < 16; i++) { x.fillStyle = `rgba(52,62,104,${0.05 + rnd() * 0.08})`; x.beginPath(); x.ellipse(260 + rnd() * 500, 250 + rnd() * 600, 40 + rnd() * 90, 30 + rnd() * 70, rnd() * 3, 0, 7); x.fill(); }
    // 꺼진 볼 · 관자놀이
    for (const s of [-1, 1]) { g = x.createRadialGradient(PX(s * 0.05), PY(-0.03), 10, PX(s * 0.05), PY(-0.03), 130); g.addColorStop(0, 'rgba(20,22,30,0.5)'); g.addColorStop(1, 'rgba(20,22,30,0)'); x.fillStyle = g; x.fillRect(0, 0, 1024, 1024); }
    // 핏줄
    x.lineCap = 'round';
    for (let i = 0; i < 70; i++) {
      let px = 230 + rnd() * 560, py = 130 + rnd() * 760, a = rnd() * 6.28;
      x.strokeStyle = `rgba(${rnd() < 0.5 ? '38,44,84' : '70,30,46'},${0.14 + rnd() * 0.24})`; x.lineWidth = 0.6 + rnd() * 1.6; x.beginPath(); x.moveTo(px, py);
      for (let k = 0; k < 10; k++) { a += (rnd() - 0.5) * 1.1; px += Math.cos(a) * (8 + rnd() * 12); py += Math.sin(a) * (8 + rnd() * 12); x.lineTo(px, py); }
      x.stroke();
    }
    // 눈구멍: 완전히 꺼진 검은 구덩이
    for (const s of [-1, 1]) {
      const ex = PX(s * 0.034), ey = PY(0.018);
      x.save(); x.translate(ex, ey); x.scale(1.22, 1.0);
      g = x.createRadialGradient(0, 0, 8, 0, 0, 116);
      if (grin) { g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(0.5, 'rgba(2,1,3,0.99)'); g.addColorStop(0.74, 'rgba(26,12,22,0.7)'); g.addColorStop(1, 'rgba(50,34,48,0)'); }
      else { g.addColorStop(0, 'rgba(10,8,12,0.85)'); g.addColorStop(0.45, 'rgba(20,14,22,0.66)'); g.addColorStop(0.8, 'rgba(46,38,52,0.28)'); g.addColorStop(1, 'rgba(60,50,60,0)'); }
      x.fillStyle = g; x.beginPath(); x.arc(0, 0, 116, 0, 7); x.fill(); x.restore();
      if (!grin) {
        x.strokeStyle = 'rgba(6,5,8,0.92)'; x.lineWidth = 5; x.beginPath(); x.moveTo(ex - 52, ey + 4); x.quadraticCurveTo(ex, ey + 24, ex + 52, ey + 2); x.stroke();
        x.strokeStyle = 'rgba(8,6,10,0.5)'; x.lineWidth = 2;
        for (let k = 0; k < 9; k++) { const t = k / 8, lx = ex - 46 + t * 92, ly = ey + 6 + Math.sin(t * Math.PI) * 15; x.beginPath(); x.moveTo(lx, ly); x.lineTo(lx + (t - 0.5) * 10, ly + 9 + rnd() * 5); x.stroke(); }
      }
      for (let k = 0; k < (grin ? 8 : 4); k++) { // 눈에서 흘러내린 검은 물
        let px = ex + (rnd() - 0.5) * 96, py = ey + 44 + rnd() * 30; const end = py + 140 + rnd() * 380;
        x.strokeStyle = `rgba(4,3,6,${0.32 + rnd() * 0.45})`; x.lineWidth = 2 + rnd() * 7; x.beginPath(); x.moveTo(px, py);
        while (py < end) { py += 14; px += (rnd() - 0.5) * 5; x.lineTo(px, py); } x.stroke();
      }
    }
    // 주름 · 눈꺼풀 · 꺼진 눈가
    const crease = (pts, w, a) => { x.strokeStyle = `rgba(14,12,18,${a})`; x.lineWidth = w; x.beginPath(); x.moveTo(pts[0], pts[1]); x.quadraticCurveTo(pts[2], pts[3], pts[4], pts[5]); x.stroke(); x.strokeStyle = `rgba(215,215,205,${a * 0.35})`; x.lineWidth = w * 0.7; x.beginPath(); x.moveTo(pts[0], pts[1] + w * 1.1); x.quadraticCurveTo(pts[2], pts[3] + w * 1.1, pts[4], pts[5] + w * 1.1); x.stroke(); };
    for (const s of [-1, 1]) {
      const ex = PX(s * 0.034), ey = PY(0.018);
      crease([ex - 84, ey - 30, ex, ey - 92, ex + 84, ey - 34], 5, 0.55);                 // 윗눈꺼풀 주름
      crease([ex - 70, ey + 62, ex, ey + 100, ex + 78, ey + 56], 4, 0.45);                // 눈밑
      for (let k = 0; k < 4; k++) crease([ex + s * 92, ey - 14 + k * 14, ex + s * 118, ey - 20 + k * 20, ex + s * 142, ey - 30 + k * 30], 2, 0.35); // 눈가 잔주름
      crease([512 + s * 46, PY(-0.016), 512 + s * 118, PY(-0.03), 512 + s * 150, PY(-0.062)], 6, 0.5);  // 팔자주름
      crease([512 + s * 150, PY(-0.01), 512 + s * 176, PY(-0.045), 512 + s * 150, PY(-0.085)], 5, 0.4); // 꺼진 볼
    }
    for (let k = 0; k < 4; k++) crease([512 - 150 + rnd() * 20, PY(0.062 + k * 0.011), 512, PY(0.058 + k * 0.011) - 8 + rnd() * 8, 512 + 150 - rnd() * 20, PY(0.062 + k * 0.011)], 2.5, 0.3); // 이마
    for (let k = 0; k < 60; k++) { const px = 300 + rnd() * 424, py = 250 + rnd() * 600, l = 8 + rnd() * 26, a = rnd() * 6.28; crease([px, py, px + Math.cos(a) * l * 0.5 + (rnd() - 0.5) * 6, py + Math.sin(a) * l * 0.5, px + Math.cos(a) * l, py + Math.sin(a) * l], 1.2, 0.22); }
    x.fillStyle = 'rgba(6,4,7,0.9)';
    for (const s of [-1, 1]) { x.beginPath(); x.ellipse(512 + s * 21, PY(-0.022), 11, 7, s * 0.4, 0, 7); x.fill(); }
    x.strokeStyle = 'rgba(16,15,22,0.36)'; x.lineWidth = 10;
    for (const s of [-1, 1]) { x.beginPath(); x.moveTo(512 + s * 22, 468); x.quadraticCurveTo(512 + s * 31, 540, 512 + s * 42, PY(-0.02)); x.stroke(); }
    // 입
    const hw = (MW * 1024) / 0.24;
    if (grin) {
      const up = (t) => PY(mouthU(2 * t - 1)), lo = (t) => PY(mouthL(2 * t - 1));
      const path = (grow) => { x.beginPath(); for (let k = 0; k <= 40; k++) { const t = k / 40; x.lineTo(512 - hw + t * hw * 2, up(t) - grow); } for (let k = 40; k >= 0; k--) { const t = k / 40; x.lineTo(512 - hw + t * hw * 2, lo(t) + grow); } x.closePath(); };
      g = x.createRadialGradient(512, PY(-0.055), 50, 512, PY(-0.055), 300); g.addColorStop(0, 'rgba(34,8,14,0.7)'); g.addColorStop(1, 'rgba(34,8,14,0)');
      x.fillStyle = g; x.fillRect(150, 400, 724, 600);
      path(10); x.fillStyle = 'rgba(52,20,30,0.95)'; x.fill();    // 검붉게 썩은 입술
      path(0); x.fillStyle = '#020001'; x.fill();
      for (const s of [-1, 1]) { // 귀 쪽으로 찢어진 입꼬리
        const cx = 512 + s * hw, cy = PY(mouthU(1));
        x.strokeStyle = 'rgba(70,10,18,0.55)'; x.lineWidth = 18; x.beginPath(); x.moveTo(cx - s * 6, cy); x.quadraticCurveTo(cx + s * 44, cy - 34, cx + s * 96, cy - 104); x.stroke();
        x.strokeStyle = 'rgba(8,1,3,0.96)'; x.lineWidth = 7; x.stroke();
        for (let k = 0; k < 5; k++) { const t = (k + 0.5) / 5, qx = cx + s * 96 * t, qy = cy - 104 * t * t - 20 * t; x.strokeStyle = 'rgba(10,2,4,0.8)'; x.lineWidth = 2.5; x.beginPath(); x.moveTo(qx - 9, qy - 7 * s); x.lineTo(qx + 9, qy + 7 * s); x.stroke(); }
      }
    } else {
      const my = PY(-0.056);
      x.strokeStyle = 'rgba(34,20,32,0.92)'; x.lineWidth = 7; x.beginPath(); x.moveTo(512 - 80, my + 8); x.quadraticCurveTo(512, my - 10, 512 + 80, my + 8); x.stroke();
      x.fillStyle = 'rgba(64,48,66,0.5)'; x.beginPath(); x.ellipse(512, my + 15, 66, 17, 0, 0, 7); x.fill(); x.beginPath(); x.ellipse(512, my - 13, 60, 12, 0, 0, 7); x.fill();
    }
    for (let i = 0; i < 34; i++) { x.fillStyle = `rgba(24,26,20,${0.08 + rnd() * 0.16})`; x.beginPath(); x.ellipse(rnd() * 1024, rnd() * 1024, 10 + rnd() * 50, 8 + rnd() * 30, rnd() * 3, 0, 7); x.fill(); }
    return tex(c);
  }
  function drawEye() {
    const c = cv(512, 256), x = c.getContext('2d'), rnd = HG.rng(4);
    x.fillStyle = '#c9c5ba'; x.fillRect(0, 0, 512, 256);
    x.strokeStyle = 'rgba(110,14,14,0.6)';
    for (let i = 0; i < 90; i++) { let px = rnd() * 512, py = rnd() * 256; x.lineWidth = 0.5 + rnd() * 1.2; x.beginPath(); x.moveTo(px, py); for (let k = 0; k < 6; k++) { px += (128 - px) * 0.12 + (rnd() - 0.5) * 12; py += (128 - py) * 0.12 + (rnd() - 0.5) * 10; x.lineTo(px, py); } x.stroke(); }
    const g = x.createRadialGradient(128, 128, 30, 128, 128, 170); g.addColorStop(0, 'rgba(60,24,24,0)'); g.addColorStop(1, 'rgba(40,14,14,0.7)'); x.fillStyle = g; x.fillRect(0, 0, 512, 256);
    x.fillStyle = '#1c1210'; x.beginPath(); x.ellipse(128, 128, 66, 94, 0, 0, 7); x.fill();
    x.fillStyle = '#000'; x.beginPath(); x.ellipse(128, 128, 60, 86, 0, 0, 7); x.fill();
    return tex(c);
  }
  function drawHair(n, seed) {
    const c = cv(256, 1024), x = c.getContext('2d'), rnd = HG.rng(seed);
    x.lineCap = 'round';
    for (let i = 0; i < n; i++) {
      let px = 8 + rnd() * 240, py = 0; const end = 1024 * (0.45 + rnd() * 0.55), wob = 0.5 + rnd() * 2.5, ph = rnd() * 6;
      const v = 6 + ((rnd() * rnd() * 46) | 0);
      x.strokeStyle = `rgba(${v},${v},${v + 2},1)`; x.lineWidth = 2.5 + rnd() * 4; x.beginPath(); x.moveTo(px, py);
      while (py < end) { py += 18; px += Math.sin(py * 0.012 + ph) * wob + (rnd() - 0.5) * 1.2; x.lineTo(px, py); }
      x.stroke();
    }
    const t = tex(c); t.minFilter = THREE.LinearFilter; t.generateMipmaps = false; return t;
  }
  // 물에 젖고 더러워진 삼베 수의
  function clothMaps() {
    const N = HG.noise, fbm = N.fbm;
    const m = HG.genMaps(512, (u, v, o) => {
      const w = fbm(u, v, 3, 3, 3), fold = fbm(u + w * 0.12, v, 16, 2, 3), cr = fbm(u, v, 22, 22, 3), big = fbm(u + 0.2, v + 0.6, 4, 4, 4);
      const mud = N.ss(0.55, 0.72, fbm(u + 0.31, v, 5, 5, 4)), tide = 1 - N.ss(0, 0.014, Math.abs(fbm(u, v + 0.3, 3, 7, 3) - 0.5));
      const weave = 0.5 + 0.5 * Math.sin(u * 6.283 * 90) * Math.sin(v * 6.283 * 90);
      let t = (0.62 + 0.3 * big + 0.16 * (fold - 0.5) + 0.1 * (cr - 0.5)) * (1 - tide * 0.3) * (0.97 + 0.03 * weave);
      let r = 0.64 * t, g = 0.66 * t, b = 0.66 * t;
      r = N.mix(r, 0.25 * (0.6 + cr), mud * 0.75); g = N.mix(g, 0.22 * (0.6 + cr), mud * 0.75); b = N.mix(b, 0.17 * (0.6 + cr), mud * 0.75);
      o.r = N.c01(r); o.g = N.c01(g); o.b = N.c01(b);
      o.h = fold * 1.0 + cr * 0.35 + weave * 0.03; o.ro = 0.96 - mud * 0.22 - tide * 0.1;
    }, 3.2);
    return m;
  }
  function skinMaps() {
    const N = HG.noise, fbm = N.fbm;
    return HG.genMaps(512, (u, v, o) => {   // 모공 · 잔주름 · 튼 살결
      const a = fbm(u, v, 64, 64, 3), b = fbm(u, v, 9, 14, 3), w = N.worley(u, v, 30), e1 = w.f2 - w.f1, w2f = N.worley(u + 0.37, v + 0.11, 90).f1;
      o.r = o.g = o.b = 0.5; o.h = a * 0.45 + b * 0.5 - (1 - N.ss(0, 0.05, e1)) * 0.6 - (1 - N.ss(0.05, 0.22, w2f)) * 0.35; o.ro = 0.45 + 0.3 * a;
    }, 3.0);
  }

  // 타원 단면을 이어 붙인 로프트. secs: [{c:[x,y,z], rx, rz}]
  function loft(secs, radial, vScale) {
    const pos = [], uv = [], idx = [], n = radial;
    let acc = 0;
    for (let i = 0; i < secs.length; i++) {
      const s = secs[i]; if (i) acc += Math.hypot(s.c[0] - secs[i - 1].c[0], s.c[1] - secs[i - 1].c[1], s.c[2] - secs[i - 1].c[2]);
      for (let j = 0; j <= n; j++) { const a = (j / n) * Math.PI * 2; pos.push(s.c[0] + Math.cos(a) * s.rx, s.c[1], s.c[2] + Math.sin(a) * s.rz); uv.push(j / n, acc * (vScale || 2)); }
      if (i < secs.length - 1) for (let j = 0; j < n; j++) { const a = i * (n + 1) + j, b = a + n + 1; idx.push(a, b, a + 1, a + 1, b, b + 1); }
    }
    return HG.makeGeo(pos, uv, idx);
  }
  const dense = (secs, k) => { // 단면 사이를 부드럽게 보간
    const out = [];
    for (let i = 0; i < secs.length - 1; i++) for (let j = 0; j < k; j++) {
      const t = j / k, a = secs[i], b = secs[i + 1];
      out.push({ c: [lerp(a.c[0], b.c[0], t), lerp(a.c[1], b.c[1], t), lerp(a.c[2], b.c[2], t)], rx: lerp(a.rx, b.rx, t), rz: lerp(a.rz, b.rz, t) });
    }
    out.push(secs[secs.length - 1]); return out;
  };

  // 상체 단면 (엉덩이 y=0 기준). 등이 굽고 목이 앞으로 빠진 자세
  // (실루엣을 단순하게: 곧게 선 자세, 좁은 어깨)
  const TOR = [[0.0, 0.15, 0.102, 0.0], [0.1, 0.136, 0.094, 0.0], [0.2, 0.124, 0.088, 0.0], [0.3, 0.134, 0.092, 0.004], [0.38, 0.144, 0.094, 0.008], [0.42, 0.14, 0.088, 0.011], [0.45, 0.124, 0.078, 0.014], [0.475, 0.098, 0.066, 0.017], [0.495, 0.066, 0.054, 0.019], [0.51, 0.046, 0.046, 0.02]];   // 둥글게 흘러내리는 어깨
  const NECK = [[0.5, 0.04, 0.042, 0.02], [0.55, 0.035, 0.038, 0.03], [0.6, 0.036, 0.04, 0.044]];
  function torAt(y) { // → [rx, rz, cz]
    if (y <= 0) return [0.15 - y * 0.26, 0.102 - y * 0.2, 0];
    const L = TOR.concat(NECK.slice(1));
    for (let i = 0; i < L.length - 1; i++) if (y <= L[i + 1][0]) { const t = (y - L[i][0]) / (L[i + 1][0] - L[i][0]); return [lerp(L[i][1], L[i + 1][1], t), lerp(L[i][2], L[i + 1][2], t), lerp(L[i][3], L[i + 1][3], t)]; }
    return null;
  }

  HG.Ghost = class {
    constructor(scene) {
      const g = (this.group = new THREE.Group());
      this.mats = [];
      const mk = (m) => { this.mats.push(m); return m; };
      const CM = clothMaps(); for (const k of ['map', 'normalMap', 'roughnessMap']) CM[k].repeat.set(2, 2);
      const cloth = mk(new THREE.MeshStandardMaterial({ map: CM.map, normalMap: CM.normalMap, roughnessMap: CM.roughnessMap, normalScale: new THREE.Vector2(2.3, 2.3), color: 0xbdb9ae, roughness: 1, side: THREE.DoubleSide, vertexColors: true, emissive: 0x8e8c88, emissiveIntensity: 0.026 }));
      this.cloth = cloth;
      const hairSolid = mk(new THREE.MeshStandardMaterial({ color: 0x08080a, roughness: 0.6, side: THREE.DoubleSide }));
      const hairCard = mk(HG.windify(new THREE.MeshStandardMaterial({ map: drawHair(210, 5), color: 0x2c2c31, roughness: 0.8, side: THREE.DoubleSide, alphaTest: 0.3, alphaToCoverage: true }), 0.014, false, 0));
      const hairThin = mk(HG.windify(new THREE.MeshStandardMaterial({ map: drawHair(64, 9), color: 0x1b1b1f, roughness: 0.85, side: THREE.DoubleSide, alphaTest: 0.3, alphaToCoverage: true }), 0.02, false, 0));
      this.faces = { grin: drawFace('grin'), calm: drawFace('calm') };
      const SM = skinMaps(); SM.normalMap.repeat.set(3, 3);
      const skin = (this.skin = mk(new THREE.MeshStandardMaterial({ map: this.faces.grin, normalMap: SM.normalMap, normalScale: new THREE.Vector2(1.7, 1.7), roughness: 0.5, emissive: 0x7c7e80, emissiveIntensity: 0.035 })));
      const skin2 = mk(new THREE.MeshStandardMaterial({ color: 0x8b9596, roughness: 0.55, normalMap: SM.normalMap, normalScale: new THREE.Vector2(0.6, 0.6), emissive: 0x6c7c8c, emissiveIntensity: 0.04 }));
      const handMat = mk(new THREE.MeshStandardMaterial({ color: 0x59605f, roughness: 0.7 }));
      const nail = mk(new THREE.MeshStandardMaterial({ color: 0x1c181c, roughness: 0.35 }));
      const eyeMat = mk(new THREE.MeshStandardMaterial({ map: drawEye(), roughness: 0.05 }));
      const toothMat = mk(new THREE.MeshStandardMaterial({ color: 0x857a5c, roughness: 0.38 }));
      const gumMat = mk(new THREE.MeshStandardMaterial({ color: 0x1a0507, roughness: 0.4 }));
      const add = (geo, mat, x, y, z, parent, noShadow) => { const m = new THREE.Mesh(geo, mat); m.position.set(x || 0, y || 0, z || 0); m.castShadow = !noShadow; m.receiveShadow = true; (parent || g).add(m); return m; };
      // 정점색: 아래로 갈수록 젖고 어두워진다
      const dirty = (geo, y0, y1, base) => {
        const p = geo.attributes.position, col = new Float32Array(p.count * 3);
        for (let i = 0; i < p.count; i++) {
          const k = 1 - (p.getY(i) - y0) / (y1 - y0), n = HG.noise.fbm(p.getX(i) * 2.1 + 5, p.getY(i) * 1.3 + p.getZ(i) * 2.3 + 7, 6, 6, 4);
          const v = (base || 1) * (1.0 - 0.72 * Math.pow(Math.max(0, Math.min(1, k)), 1.5)) * (0.62 + 0.62 * n);
          col[i * 3] = v; col[i * 3 + 1] = v * 0.99; col[i * 3 + 2] = v * 0.96;
        }
        geo.setAttribute('color', new THREE.BufferAttribute(col, 3)); return geo;
      };

      // ---------- 치마 (깊은 주름) ----------
      const sp = [[0.02, 1.03], [0.15, 1.01], [0.186, 0.9], [0.225, 0.64], [0.275, 0.34], [0.325, 0.09], [0.335, 0.0]].map((p) => new THREE.Vector2(p[0], p[1]));
      const sk = new THREE.LatheGeometry(sp, 120), pp = sk.attributes.position;
      for (let i = 0; i < pp.count; i++) {
        const x = pp.getX(i), y = pp.getY(i), z = pp.getZ(i), a = Math.atan2(z, x), k = Math.pow(1 - y / 1.03, 0.8);
        const fo = Math.sin(a * 8 + 0.4 + 0.6 * Math.sin(a * 3)) * 0.5 + 0.5;
        const f = 1 + (0.12 * fo * fo - 0.03 + 0.02 * Math.sin(a * 19 + 1.3)) * k;   // 아래로 갈수록 깊어지는 세로 주름
        const hem = y < 0.06 ? 0.02 * Math.sin(a * 5) : 0;
        pp.setXYZ(i, x * f, y + hem, z * f * 0.86);
      }
      sk.computeVertexNormals(); dirty(sk, 0, 1.03);
      this.skirt = add(sk, cloth);
      this.knees = [];
      for (const s of [-1, 1]) { const kg = new THREE.SphereGeometry(0.105, 18, 12); dirty(kg, -0.6, 0.25); const k = add(kg, cloth, s * 0.12, 0.5, 0.3); k.scale.set(1.0, 1.45, 1.25); k.visible = false; this.knees.push(k); }

      // ---------- 상체 ----------
      const upper = (this.upper = new THREE.Group()); upper.position.y = 0.98; g.add(upper);
      const tg = loft(dense(TOR.map((s) => ({ c: [0, s[0], s[3]], rx: s[1], rz: s[2] })), 4), 36, 2);
      { const q = tg.attributes.position; for (let i = 0; i < q.count; i++) { const y = q.getY(i), a = Math.atan2(q.getZ(i), q.getX(i)); const f = 1 + 0.018 * Math.sin(a * 9 + y * 22) * sstep(0.45, 0.2, y) + 0.012 * Math.sin(y * 60 + a * 2); q.setX(i, q.getX(i) * f); q.setZ(i, (q.getZ(i) - torAt(Math.max(0, y))[2]) * f + torAt(Math.max(0, y))[2]); } }
      tg.computeVertexNormals(); dirty(tg, -1.3, 0.52); add(tg, cloth, 0, 0, 0, upper);
      const ng = loft(dense(NECK.map((s) => ({ c: [0, s[0], s[3]], rx: s[1], rz: s[2] })), 3), 16, 2); add(ng, skin2, 0, 0, 0, upper);
      // 팔: 몸에 붙여 곧게 늘어뜨린 긴 소매. 손은 소매 속에 감추고 손끝만 살짝 보인다
      this.arms = [];
      for (const s of [-1, 1]) {
        const piv = new THREE.Group(); piv.position.set(s * 0.142, 0.43, 0.012); upper.add(piv);
        // 어깨에서 팔꿈치로 살짝 뒤로, 팔꿈치에서 손목으로 앞으로 — 굽은 팔의 흐름만 남긴다
        const secs = dense([{ c: [0, 0.015, 0], rx: 0.05, rz: 0.054 }, { c: [s * 0.012, -0.14, -0.012], rx: 0.052, rz: 0.056 }, { c: [s * 0.02, -0.31, -0.016], rx: 0.054, rz: 0.056 }, { c: [s * 0.018, -0.47, 0.018], rx: 0.058, rz: 0.054 }, { c: [s * 0.008, -0.63, 0.066], rx: 0.066, rz: 0.05 }], 5);
        const sl = loft(secs, 22, 2), q = sl.attributes.position;
        for (let i = 0; i < q.count; i++) {
          const y = q.getY(i), a = Math.atan2(q.getZ(i), q.getX(i)), dd = -y / 0.63, wr = 1 + 0.1 * dd * Math.sin(a * 4 + s * 2 + y * 5) + 0.05 * Math.sin(y * 34 + a) * (dd > 0.3 && dd < 0.6 ? 1 : 0.3);   // 소매의 세로 주름과 팔꿈치 구김
          q.setX(i, q.getX(i) * wr); q.setZ(i, q.getZ(i) * wr);
          if (y < -0.6) q.setY(i, y - 0.02 - 0.02 * Math.sin(a * 3 + s));
        }
        sl.computeVertexNormals(); dirty(sl, -1.75, 0.1); add(sl, cloth, 0, 0, 0, piv);
        // 손은 소매 속에 있고 손끝만 어둡게 비친다
        const hg2 = new THREE.SphereGeometry(1, 12, 10); hg2.scale(0.024, 0.05, 0.014); add(hg2, handMat, s * 0.008, -0.625, 0.07, piv, true).rotation.x = -0.3;
        piv.userData.s = s; this.arms.push(piv);
      }

      // ---------- 머리 ----------
      const HC = { x: 0, y: 0.626, z: 0.05 };   // 목을 살짝 앞으로 뺀다
      const head = (this.head = new THREE.Group()); head.position.set(HC.x, HC.y, HC.z); upper.add(head);
      const RX = 0.084, RY = 0.118, RZ = 0.099;
      const gauss = (d, s) => Math.exp(-(d * d) / (s * s));
      // 조각 이전의 기본 형태 (이빨 위치 계산에도 사용)
      const baseShape = (ux, uy, uz) => {
        let x = ux * RX, y = uy * RY, z = uz * RZ;
        if (y < 0) { const k = Math.pow(-y / RY, 1.5); x *= 1 - 0.46 * k; z *= 1 - 0.2 * k; }
        if (y > 0.03) x *= 1 - 0.1 * Math.min(1, (y - 0.03) / 0.08);
        return [x, y, z];
      };
      const hg = new THREE.SphereGeometry(1, 128, 96), hp = hg.attributes.position, huv = hg.attributes.uv;
      const calmZ = new Float32Array(hp.count).fill(NaN);
      for (let i = 0; i < hp.count; i++) {
        let [x, y, z] = baseShape(hp.getX(i), hp.getY(i), hp.getZ(i));
        if (z > 0) {
          const fr = Math.min(1, z / (RZ * 0.5));
          for (const s of [-1, 1]) {
            z -= 0.022 * gauss(Math.hypot((x - s * 0.034) * 0.8, (y - 0.018) * 1.05), 0.0205) * fr;   // 눈구멍
            z += 0.0055 * gauss(Math.hypot((x - s * 0.052) * 0.7, y + 0.006), 0.017) * fr;             // 광대
            z -= 0.008 * gauss(Math.hypot((x - s * 0.046) * 0.8, y + 0.04), 0.022) * fr;               // 꺼진 볼
          }
          z += 0.0065 * gauss(y - 0.046, 0.011) * gauss(x, 0.06) * fr;                                 // 눈썹뼈
          z -= 0.003 * gauss(y - 0.08, 0.03) * fr;
          const ny = y + 0.004, along = ny < 0.036 && ny > -0.026 ? 1 : gauss(ny < 0 ? ny + 0.026 : ny - 0.036, 0.006);
          z += (0.007 + 0.016 * Math.max(0, Math.min(1, (0.03 - ny) / 0.05))) * gauss(x, 0.0105) * along * fr; // 코
          z += 0.0045 * gauss(y + 0.094, 0.018) * gauss(x, 0.028) * fr;                                // 턱끝
          // 입: 벌어진 구멍
          const xn = x / MW;
          calmZ[i] = z - 0.0025 * gauss(y + 0.056, 0.004) * gauss(x, 0.03) * fr;   // 다문 입술의 얕은 골
          if (Math.abs(xn) < 1.15) {
            const yu = mouthU(xn), yl = mouthL(xn), inside = sstep(yl - 0.002, yl + 0.003, y) * sstep(yu + 0.002, yu - 0.003, y) * sstep(1.12, 0.92, Math.abs(xn));
            z -= 0.026 * inside;
            z += 0.0035 * (gauss(y - yu - 0.004, 0.004) + gauss(y - yl + 0.004, 0.004)) * sstep(1.1, 0.8, Math.abs(xn)) * (1 - inside); // 입술
          }
        }
        hp.setXYZ(i, x, y, z); if (!(z > 0) || isNaN(calmZ[i])) calmZ[i] = z;
        huv.setXY(i, z > -0.02 ? 0.5 + x / 0.24 : 0.02, z > -0.02 ? 0.5 + y / 0.28 : 0.02);
      }
      // 두 가지 얼굴 형태: 벌어진 입(원귀) / 다문 입(해원)
      const grinPos = hp.array.slice(), calmPos = hp.array.slice();
      for (let i = 0; i < hp.count; i++) calmPos[i * 3 + 2] = calmZ[i];
      hp.array.set(calmPos); hg.computeVertexNormals(); const calmNrm = hg.attributes.normal.array.slice();
      hp.array.set(grinPos); hg.computeVertexNormals(); const grinNrm = hg.attributes.normal.array.slice();
      this.headGeo = hg; this.shapes = { grin: [grinPos, grinNrm], calm: [calmPos, calmNrm] };
      add(hg, skin, 0, 0, 0, head);
      const surfZ = (x, y) => { const k = y < 0 ? Math.pow(-y / RY, 1.5) : 0, rx = RX * (1 - 0.46 * k), q = 1 - (x / rx) * (x / rx) - (y / RY) * (y / RY); return RZ * (1 - 0.2 * k) * Math.sqrt(Math.max(0.02, q)); };
      // 안구
      this.eyes = [];
      for (const s of [-1, 1]) { const e = add(new THREE.SphereGeometry(0.0158, 26, 18), eyeMat, s * 0.034, 0.0175, 0.0635, head, true); e.userData.s = s; this.eyes.push(e); }
      // 이빨과 입속
      const teeth = (this.teeth = new THREE.Group()); head.add(teeth);
      const tr = HG.rng(31);
      // 이빨: 촘촘히 맞물리되 크기 · 기울기 · 색이 제각각이고, 뿌리는 검붉은 잇몸에 묻힌다
      const tMats = [toothMat, mk(new THREE.MeshStandardMaterial({ color: 0x6b6048, roughness: 0.45 })), mk(new THREE.MeshStandardMaterial({ color: 0x97906f, roughness: 0.34 })), mk(new THREE.MeshStandardMaterial({ color: 0x4a3f30, roughness: 0.5 }))];
      const gumPink = mk(new THREE.MeshStandardMaterial({ color: 0x3a1216, roughness: 0.35 }));
      const row = (n, span, up) => {
        for (let i = 0; i < n; i++) {
          const xn = ((i + 0.5) / n) * span * 2 - span + (tr() - 0.5) * 0.02, x = xn * MW, ye = up ? mouthU(xn) : mouthL(xn), k = 0.55 + 0.45 * (1 - xn * xn);
          const h = (up ? 0.0095 : 0.007) * k * (0.7 + tr() * 0.6), w = ((span * 2 * MW) / n) * (0.98 + tr() * 0.22);
          const tgk = new THREE.CylinderGeometry(w * (0.4 + tr() * 0.1), w * 0.52, h, 8); tgk.scale(1, 1, 0.62); tgk.translate(0, up ? -h / 2 : h / 2, 0);
          const z = surfZ(x, ye) - (up ? 0.0065 : 0.0085) - Math.abs(xn) * 0.002 + (tr() - 0.5) * 0.0016;
          const m = add(tgk, tMats[(tr() * tMats.length) | 0], x, ye + (up ? 0.0022 : -0.0018) + (tr() - 0.5) * 0.0012, z, teeth, true);
          m.rotation.y = Math.asin(Math.max(-0.9, Math.min(0.9, x / RX))) * 0.9; m.rotation.z = (tr() - 0.5) * 0.3; m.rotation.x = (tr() - 0.5) * 0.22;
          const gg = new THREE.SphereGeometry(w * 0.62, 8, 6); gg.scale(1, 0.75, 0.7); add(gg, gumPink, x, ye + (up ? 0.003 : -0.0028), z - 0.0012, teeth, true).rotation.y = m.rotation.y;
        }
      };
      row(16, 0.93, true); row(14, 0.8, false);
      const gum = new THREE.SphereGeometry(1, 16, 10); gum.scale(0.042, 0.02, 0.02); add(gum, gumMat, 0, -0.058, 0.056, teeth, true);
      // 정수리
      const cap = new THREE.SphereGeometry(1, 30, 18, 0, Math.PI * 2, 0, Math.PI * 0.56); cap.rotateX(-0.6); cap.scale(RX + 0.008, RY + 0.007, RZ + 0.008); add(cap, hairSolid, 0, 0.002, -0.004, head);

      // ---------- 머리카락: 머리를 감싸 내려와 어깨 · 등 · 가슴을 타고 흐른다 ----------
      const hair = (this.hair = new THREE.Group()); hair.position.set(HC.x, HC.y, HC.z); upper.add(hair);
      this.frontL = new THREE.Group(); this.frontR = new THREE.Group(); hair.add(this.frontL, this.frontR);
      const rnd = HG.rng(66);
      const card = (a0, len, w, off, drift, seed, conform, aDrift) => {
        const n = 24, pos = [], uv = [], idx = [], s1 = 0.165, ph = seed * 1.7;
        let qx = 0, qz = 0, started = false;
        for (let j = 0; j <= n; j++) {
          const s = (len * j) / n; let px, py, pz;
          const a = a0 + (aDrift || 0) * sstep(0.12, 0.42, s);   // 이마 아래부터 비스듬히 흘러 턱 아래에서 모인다
          if (s < s1) { const th = 0.2 + (s / s1) * (Math.PI / 2 - 0.2), rr = Math.sin(th); px = Math.sin(a) * rr * (RX + off); pz = Math.cos(a) * rr * (RZ + off); py = Math.cos(th) * (RY + off); }
          else {
            const d = s - s1, k = 1 + drift * d; px = Math.sin(a) * (RX + off) * k + Math.sin(d * 7 + ph) * 0.003 * d; pz = Math.cos(a) * (RZ + off) * k + Math.cos(d * 6 + ph) * 0.003 * d; py = -d;
            if (conform) { // 몸에 닿으면 바깥으로 밀려나고, 그 뒤로는 그 자리에서 아래로 늘어진다
              if (started) { px = lerp(px, qx, 0.9); pz = lerp(pz, qz, 0.9); }
              const t = torAt(HC.y + py);
              if (t) { const m = 0.02 + off, ex = px / (t[0] + m), ez = (HC.z + pz - t[2]) / (t[1] + m), e = Math.hypot(ex, ez); if (e < 1 && e > 1e-4) { const f = lerp(1, 1 / e, 0.85); px *= f; pz = t[2] + (HC.z + pz - t[2]) * f - HC.z; } }
              qx = px; qz = pz; started = true;
            }
          }
          const tx = Math.cos(a), tz = -Math.sin(a), ww = w * (1 - 0.75 * Math.pow(j / n, 2.2));   // 끝으로 갈수록 가늘게 풀린다
          pos.push(px - (tx * ww) / 2, py, pz - (tz * ww) / 2, px + (tx * ww) / 2, py, pz + (tz * ww) / 2);
          uv.push(0, 1 - j / n, 1, 1 - j / n);
          if (j < n) { const q = j * 2; idx.push(q, q + 2, q + 1, q + 1, q + 2, q + 3); }
        }
        return HG.makeGeo(pos, uv, idx);
      };
      // 뒤 · 옆: 머리에서 어깨를 덮고 허리 아래까지 내려오는 매끈한 한 덩어리 (잔가닥 없이 단순한 실루엣)
      // 머리 → 잘록한 목 → 흘러내리는 어깨선 → 허리 아래. 끝은 들쭉날쭉하게 풀린다
      const cp = [[0.03, 0.118], [0.075, 0.098], [0.1, 0.04], [0.105, -0.03], [0.096, -0.09], [0.09, -0.125], [0.104, -0.16], [0.132, -0.2], [0.154, -0.25], [0.166, -0.32], [0.168, -0.44], [0.16, -0.58], [0.142, -0.72], [0.12, -0.82], [0.1, -0.9]].map((p) => new THREE.Vector2(p[0], p[1]));
      const cloak = new THREE.LatheGeometry(cp, 64, 0.72, Math.PI * 2 - 1.44), cq = cloak.attributes.position;
      for (let i = 0; i < cq.count; i++) {
        let x = cq.getX(i), y = cq.getY(i), z = cq.getZ(i); const a = Math.atan2(x, z), zs = lerp(1, 0.74, sstep(-0.12, -0.3, y));
        const gr = 1 + 0.02 * Math.sin(a * 21) * sstep(-0.1, -0.3, y) + 0.012 * Math.sin(a * 47 + y * 6);   // 가닥의 골
        if (y < -0.6) y -= sstep(-0.6, -0.9, y) * (0.13 * HG.noise.vnoise(a * 4 + 30, 2.2, 256, 256) + 0.06 * Math.sin(a * 13));  // 풀린 끝
        cq.setXYZ(i, x * gr, y, z * zs * gr - 0.012 * sstep(-0.1, -0.3, y));
      }
      cloak.computeVertexNormals(); HG.scaleUV(cloak, 4, 1);
      const cloakTex = drawHair(300, 7); cloakTex.wrapS = THREE.RepeatWrapping;
      const cloakMat = mk(new THREE.MeshStandardMaterial({ map: cloakTex, color: 0x34343a, roughness: 0.82, side: THREE.DoubleSide }));
      const cm = new THREE.Mesh(cloak, cloakMat); cm.castShadow = true; cm.receiveShadow = true; hair.add(cm);
      // 앞: 얼굴을 덮는 곧은 앞머리. 한쪽 눈과 입이 드러나는 틈만 남긴다
      // 가닥마다 길이와 굵기가 다르고, 틈 양옆의 가닥은 턱 아래에서 서로 모여 틈을 닫는다
      for (let i = 0; i < 25; i++) {
        const a = -1.0 + (i / 24) * 2.0 + (rnd() - 0.5) * 0.03;                             // a = 0 정면
        if (a > -0.62 && a < 0.56) continue;   // 틈과 그 왼쪽 가장자리는 아래의 가는 가닥들로만 채운다
        const nearGap = a >= 0.56 && a < 0.85 ? -1 : 0;
        const geo = card(a, 0.34 + rnd() * 0.5, 0.03 + rnd() * 0.028, 0.004 + rnd() * 0.016, 0, i, false, nearGap * (0.16 + rnd() * 0.1));
        const m = new THREE.Mesh(geo, nearGap || i % 2 ? hairThin : hairCard); m.castShadow = false; m.receiveShadow = true;   // 틈 가까이는 성긴 가닥 — 경계가 판처럼 곧게 떨어지지 않는다
        (a < 0.38 ? this.frontL : this.frontR).add(m);
      }
      // 틈 가장자리에서 얼굴 위로 걸쳐 내려오는 가는 가닥 몇 줄 (경계가 곧은 판처럼 보이지 않게)
      // 얼굴 한쪽을 덮는 머리는 굵기 · 길이 · 방향이 제각각인 가닥들 — 가장자리가 들쭉날쭉하고 사이로 살이 비친다
      for (let i = 0; i < 44; i++) {
        const left = i < 36, t = rnd(), a = left ? -0.66 + Math.pow(t, 1.7) * 0.86 : 0.4 + rnd() * 0.18;   // 틈 쪽으로 갈수록 성기다
        const edge = left ? Math.max(0, Math.min(1, (a + 0.4) / 0.5)) : 1;                    // 틈에 가까울수록 가늘고 짧다
        const geo = card(a, lerp(0.75, 0.24, edge) + rnd() * 0.25, lerp(0.034, 0.007, edge) + rnd() * 0.008, 0.004 + rnd() * 0.026, 0, 70 + i, false, -0.12 + rnd() * 0.5);
        const m = new THREE.Mesh(geo, edge < 0.25 && rnd() < 0.6 ? hairCard : hairThin); m.castShadow = false; (left ? this.frontL : this.frontR).add(m);
      }
      // 눈과 볼 위를 가로질러 흘러내린 굵은 가닥 몇 줄 (머리카락의 경계가 곧은 선으로 끊기지 않게)
      [[0.05, 0.36, -0.3], [0.14, 0.44, -0.5], [0.6, 0.38, 0.4]].forEach(([a, len, dr], i) => {   // 눈(a≈0.38)은 가리지 않고 그 양옆으로 비켜 흐른다
        const m = new THREE.Mesh(card(a, len, 0.012 + (i % 2) * 0.006, 0.014 + i * 0.004, 0, 90 + i, false, dr), hairCard); m.castShadow = false; this.frontL.add(m);
      });
      // 등 뒤로 덩어리 밖으로 흘러내린 몇 가닥 (일자로 잘린 끝을 가린다)
      for (let i = 0; i < 12; i++) {
        const a = Math.PI + (i / 11 - 0.5) * 3.6 + (rnd() - 0.5) * 0.2;
        const geo = card(a, 0.95 + rnd() * 0.35, 0.05 + rnd() * 0.03, 0.03, 0.06, 40 + i, true, 0);
        const m = new THREE.Mesh(geo, hairCard); m.castShadow = false; hair.add(m);
      }

      g.visible = false; scene.add(g);
      this.reveal = 0; this.opacity = 1; this.twitch = 0; this.pose = 0; this.soft = 0; this.t = 0;
    }
    place(x, y, z) { this.group.position.set(x, y, z); }
    faceTo(x, z) { this.group.rotation.y = Math.atan2(x - this.group.position.x, z - this.group.position.z); }
    show(v) { this.group.visible = v; }
    warm(renderer) { for (const k in this.faces) renderer.initTexture(this.faces[k]); }
    setFace(kind) {
      const grin = kind === 'grin'; this.skin.map = this.faces[kind];   // (재질을 다시 컴파일시키지 않는다 — 나타나는 순간 화면이 멎는다)
      const sh = this.shapes[kind], ga = this.headGeo.attributes;
      ga.position.array.set(sh[0]); ga.normal.array.set(sh[1]); ga.position.needsUpdate = true; ga.normal.needsUpdate = true;
      for (const e of this.eyes) e.visible = grin; this.teeth.visible = grin; this.soft = grin ? 0 : 1;
    }
    setOpacity(o) {
      this.opacity = o;
      for (const m of this.mats) { m.transparent = o < 1; m.opacity = o; m.depthWrite = o > 0.5; }
    }
    update(dt, time) {
      if (!this.group.visible) return;
      this.t += dt;
      const c = this.pose, r = this.reveal, so = this.soft, tw = this.twitch > 0 ? 1 : 0;
      this.twitch = Math.max(0, this.twitch - dt);
      // 멀리 있을수록 희미한 달빛처럼 떠오르게 한다 (추격 때 위치를 읽을 수 있도록)
      const far = sstep(3.5, 9, this.camDist == null ? 3 : this.camDist);
      this.cloth.emissiveIntensity = lerp(0.026, 0.16, far); this.cloth.emissive.setRGB(lerp(0.27, 0.34, far), lerp(0.26, 0.4, far), lerp(0.25, 0.5, far));
      const lean = lerp(0.07, 0.42, c) - 0.07 * so + Math.sin(time * 0.5) * 0.012;
      this.upper.position.y = lerp(0.98, 0.56, c); this.upper.position.z = lerp(0, -0.04, c);
      this.upper.rotation.x = lean; this.upper.rotation.z = Math.sin(time * 0.37) * 0.015 * (1 - so) + tw * Math.sin(time * 61) * 0.02;
      this.skirt.scale.set(1 + 0.25 * c, 1 - 0.42 * c, 1 + 0.75 * c); this.skirt.position.z = 0.16 * c;
      for (const k of this.knees) k.visible = false;   // 웅크린 무릎은 치마 한 덩어리로 덮는다
      const hz = (0.26 + Math.sin(time * 0.6) * 0.04) * (1 - r) * (1 - 0.8 * so) + tw * Math.sin(time * 70) * 0.16 + r * Math.sin(time * 53) * 0.03;
      const hx = lerp(0.3, -0.42, c) * (1 - r) - r * (0.06 + lean) + 0.02 * so + Math.sin(time * 0.43) * 0.02;   // 평소에는 고개를 숙이고 있다
      this.head.rotation.set(hx, Math.sin(time * 0.31) * 0.05 * (1 - r), hz);
      // 앞머리는 기울기와 무관하게 아래로 늘어지고, 드러날 때는 틈 쪽만 크게 걷힌다
      this.frontL.rotation.set(-lean, -r * (0.2 + 0.25 * so), 0); this.frontR.rotation.set(-lean, r * 1.05, 0);
      for (const e of this.eyes) { e.rotation.y = Math.sin(time * 0.9) * 0.06 + tw * Math.sin(time * 90) * 0.3; e.rotation.x = Math.sin(time * 1.3) * 0.04 - r * 0.05 + 0.2 * c; }
      for (const a of this.arms) {
        const s = a.userData.s;
        a.rotation.x = lerp(-0.02, -0.55, c) * (1 - 0.6 * so) - r * 0.55 * (1 - so) - 0.12 * so + Math.sin(time * 0.7 + s) * 0.025 + tw * Math.sin(time * 47 + s) * 0.05;
        a.rotation.z = s * (0.025 + 0.16 * c) - s * r * 0.1 - s * 0.06 * so; a.rotation.y = -s * 0.5 * so;   // 해원: 두 손을 앞에 모은다
      }
    }
  };
})();
