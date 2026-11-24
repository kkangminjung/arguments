// 어둑서니 — 올려다볼수록 커지고, 내려다보면 작아지는 그림자.
// 본디 모습은 댕기머리를 땋아 내린 아이의 새까만 윤곽이다. 얼굴이 없다.
// 자라기 시작하면 가는 실눈이 뜨이고, 자랄수록 눈과 입이 찢어지며 팔과 손끝이 길어진다. 온몸은 같은 비율로 커진다.
(function () {
  'use strict';
  const HG = (window.HG = window.HG || {});
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);

  // 마디 없이 가늘어지는 관 (pts: [x,y,z,r])
  function taper(pts, seg) {
    const curve = new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(p[0], p[1], p[2]))), n = 22, pos = [], idx = [];
    for (let i = 0; i <= n; i++) {
      const t = i / n, c = curve.getPoint(t), f = t * (pts.length - 1), i0 = Math.min(pts.length - 2, Math.floor(f)), r = pts[i0][3] + (pts[i0 + 1][3] - pts[i0][3]) * (f - i0);
      for (let j = 0; j < seg; j++) { const a = (j / seg) * Math.PI * 2; pos.push(c.x + Math.cos(a) * r, c.y, c.z + Math.sin(a) * r * 0.8); }
    }
    for (let i = 0; i < n; i++) for (let j = 0; j < seg; j++) { const a = i * seg + j, b = i * seg + ((j + 1) % seg), c = a + seg, d = b + seg; idx.push(a, b, c, b, d, c); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); return g;
  }

  HG.Shade = class {
    constructor(scene) {
      const g = (this.group = new THREE.Group()); g.rotation.order = 'YXZ'; g.visible = false; scene.add(g);
      const mat = (this.mat = new THREE.MeshBasicMaterial({ color: 0x010102, fog: false, transparent: true, opacity: 1, side: THREE.DoubleSide }));
      const add = (geo, parent, x, y, z) => { const m = new THREE.Mesh(geo, mat); m.position.set(x || 0, y || 0, z || 0); m.castShadow = false; m.receiveShadow = false; m.renderOrder = 2; (parent || g).add(m); return m; };
      // 몸: 퍼지는 치마, 짧은 저고리, 가는 목까지 한 줄의 윤곽
      const cp = [[0.02, 0], [0.24, 0], [0.262, 0.12], [0.25, 0.5], [0.215, 0.95], [0.19, 1.22], [0.205, 1.3], [0.232, 1.43], [0.2, 1.54], [0.095, 1.61], [0.078, 1.67], [0.06, 1.8]].map((p) => new THREE.Vector2(p[0], p[1]));
      const cg = new THREE.LatheGeometry(cp, 28); cg.scale(1, 1, 0.72);
      { const p = cg.attributes.position; for (let i = 0; i < p.count; i++) { const y = p.getY(i); if (y < 0.3) { const a = Math.atan2(p.getZ(i), p.getX(i)); p.setY(i, Math.max(0, y + Math.sin(a * 6) * 0.035 * (1 - y / 0.3))); } } }
      add(cg);
      // 머리: 둥글고 크다. 목에서 꺾여 내려다본다
      const neck = (this.neck = new THREE.Group()); neck.position.set(0, 1.66, 0); g.add(neck);
      const hp = [[0.02, -0.06], [0.07, -0.03], [0.12, 0.06], [0.195, 0.16], [0.22, 0.29], [0.2, 0.41], [0.13, 0.49], [0.02, 0.52]].map((p) => new THREE.Vector2(p[0], p[1]));
      const hg = new THREE.LatheGeometry(hp, 26); hg.scale(1, 1, 0.85);
      add(hg, neck);
      // 팔: 보통 아이처럼 허벅지께까지. 자라면 길어지고, 손끝이 세 갈래로 뻗는다
      this.arms = []; this.claws = [];
      for (const sg of [-1, 1]) {
        const arm = new THREE.Group(); arm.position.set(sg * 0.17, 1.5, 0); g.add(arm); this.arms.push(arm);
        // (보통 아이의 팔: 어깨에서 곧게 늘어지고, 굵기가 있고, 끝에 둥근 손이 달린다)
        add(taper([[0, 0.02, 0, 0.078], [sg * 0.09, -0.16, 0.01, 0.07], [sg * 0.135, -0.42, 0.03, 0.06], [sg * 0.15, -0.62, 0.04, 0.052], [sg * 0.15, -0.68, 0.04, 0.05]], 10), arm);
        { const hand = add(new THREE.SphereGeometry(0.058, 10, 8), arm, sg * 0.15, -0.71, 0.04); hand.scale.set(0.9, 1.25, 0.8); }
        const claw = new THREE.Group(); claw.position.set(sg * 0.15, -0.74, 0.04); arm.add(claw); this.claws.push(claw);
        for (let i = 0; i < 3; i++) add(taper([[0, 0, 0, 0.02], [(i - 1) * 0.03, -0.14, 0.006 + (i === 1 ? 0.01 : 0), 0.011], [(i - 1) * 0.055, -0.3 - (i === 1 ? 0.05 : 0), 0, 0.002]], 6), claw);
      }
      // 댕기머리: 귀 뒤에서 어깨 앞으로 넘겨 가슴께까지 땋아 내렸다. 몸과 똑같이 새까맣다 (몸에 달아, 고개를 숙여도 곧게 늘어진다)
      for (let i = 0; i < 12; i++) { const u = i / 11, m = add(new THREE.SphereGeometry(0.05 - i * 0.0018, 8, 6), g, 0.135 + Math.sin(u * 2.2) * 0.06, 1.78 - i * 0.06, 0.06 + Math.min(1, u * 3) * 0.15 - u * 0.02); m.scale.set(1.2, 0.8, 1); m.rotation.z = i % 2 ? 0.55 : -0.55; }
      add(new THREE.SphereGeometry(0.034, 8, 6), g, 0.18, 1.07, 0.2);
      for (const dx of [-0.028, 0.028]) { const r = add(new THREE.PlaneGeometry(0.05, 0.26), g, 0.18 + dx, 0.93, 0.205); r.rotation.z = dx * 6; }
      // 얼굴은 평면 도형으로만 그린다: 눈동자 없이 길게 찢어진 흰 눈(웃는 눈매)과, 귀밑까지 찢어진 흰 입. 자라기 전에는 없다
      this.eyeMat = new THREE.MeshBasicMaterial({ color: 0xf2f2f2, fog: false, transparent: true, opacity: 0, side: THREE.DoubleSide });
      this.mouthMat = new THREE.MeshBasicMaterial({ color: 0xf2f2f2, fog: false, transparent: true, opacity: 0, side: THREE.DoubleSide });
      this.eyes = [];
      {
        const sh = new THREE.Shape(), N = 20;
        for (let i = 0; i <= N; i++) { const x = -1 + (2 * i) / N, y = 0.42 * (1 - x * x); if (i) sh.lineTo(x, y); else sh.moveTo(x, y); }
        for (let i = N; i >= 0; i--) { const x = -1 + (2 * i) / N; sh.lineTo(x, 0.42 * (1 - x * x) - 0.2 * Math.pow(1 - x * x, 0.8)); }
        for (const sg of [-1, 1]) { const eg = new THREE.ShapeGeometry(sh); eg.userData.base = Float32Array.from(eg.attributes.position.array); const e = new THREE.Mesh(eg, this.eyeMat); e.renderOrder = 3; e.userData.sg = sg; e.visible = false; e.frustumCulled = false; neck.add(e); this.eyes.push(e); }
      }
      {
        const sh = new THREE.Shape(), N = 30;
        for (let i = 0; i <= N; i++) { const t = i / N, x = -1 + 2 * t, y = -0.62 * Math.sin(Math.PI * t) + 0.34 * x * x; if (i) sh.lineTo(x, y); else sh.moveTo(x, y); }
        for (let i = N; i >= 0; i--) { const t = i / N, x = -1 + 2 * t, y = -0.34 * Math.sin(Math.PI * t) + 0.34 * x * x + (i % 2 ? -0.05 : 0) * Math.sin(Math.PI * t); sh.lineTo(x, y); }
        const mg = new THREE.ShapeGeometry(sh); mg.userData.base = Float32Array.from(mg.attributes.position.array);
        this.mouth = new THREE.Mesh(mg, this.mouthMat); this.mouth.renderOrder = 3; this.mouth.visible = false; this.mouth.frustumCulled = false; neck.add(this.mouth);
      }
      for (const m of [this.eyeMat, this.mouthMat]) { m.polygonOffset = true; m.polygonOffsetFactor = -2; m.polygonOffsetUnits = -2; }
      // 눈과 입은 머리의 둥근 겉면에 붙여 그린다 — 어느 각도에서 올려다보아도, 아무리 커져도 얼굴 윤곽 밖으로 나가지 않는다
      const headR = (y) => { for (let i = 0; i < hp.length - 1; i++) if (y <= hp[i + 1].y) return hp[i].x + ((hp[i + 1].x - hp[i].x) * Math.max(0, y - hp[i].y)) / (hp[i + 1].y - hp[i].y); return 0.02; };
      this.wrap = (mesh, cx, cy, sx, sy, rot) => {
        const p = mesh.geometry.attributes.position, b = mesh.geometry.userData.base, c = Math.cos(rot), s = Math.sin(rot);
        for (let i = 0; i < p.count; i++) {
          const bx = b[i * 3] * sx, by = b[i * 3 + 1] * sy, y = clamp(cy + bx * s + by * c, 0.0, 0.47), r = headR(y), lim = r * 0.9, x = clamp(cx + bx * c - by * s, -lim, lim);
          p.setXYZ(i, x, y, 0.85 * Math.sqrt(Math.max(0, r * r - x * x)) + 0.004);
        }
        p.needsUpdate = true;
      };
      // 윤곽을 흐리는 그을음과, 등 뒤의 희부연 김 (어두운 배경 앞에서도 새까만 윤곽이 묻히지 않게)
      this.wisps = [];
      const tex = HG.drawPuff();
      for (let i = 0; i < 14; i++) {
        const sm = new THREE.SpriteMaterial({ map: tex, color: 0x000000, transparent: true, opacity: 0.0, depthWrite: false, fog: false });
        const s = new THREE.Sprite(sm); s.userData = { a: Math.random() * 6.28, h: Math.random(), sp: 0.2 + Math.random() * 0.5, r: 0.2 + Math.random() * 0.16, sc: 0.5 + Math.random() * 0.5 }; s.renderOrder = 5; g.add(s); this.wisps.push(s);
      }
      this.halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, color: 0x566684, transparent: true, opacity: 0, depthWrite: false, fog: false }));
      // (김의 아래 끝이 땅에 닿지 않게 — 땅에 잘리면 곧은 모서리가 드러난다)
      this.halo.position.set(0, 1.42, -0.45); this.halo.scale.set(2.7, 2.7, 1); this.halo.renderOrder = 1; g.add(this.halo);
      this.size = 1; this.opacity = 1; this.eye = 0; this.twitch = 0;
    }
    place(x, y, z) { this.group.position.set(x, y, z); }
    faceTo(x, z) { this.group.rotation.y = Math.atan2(x - this.group.position.x, z - this.group.position.z); }
    show(v) { this.group.visible = v; if (v) this.update(0, this.time || 0); }   // 나타나는 그 프레임부터 지금 크기로 그린다 (이전 크기가 한 프레임 비치지 않게)
    setOpacity(o) { this.opacity = o; }
    get height() { return 2.18 * this.size; }
    warm() {}
    update(dt, time) {
      this.time = time;
      if (!this.group.visible) return;
      const s = this.size, g = this.group;
      g.scale.set(s, s * (1 + Math.sin(time * 0.9) * 0.012), s);
      const k = clamp((s - 0.8) / 3.2, 0, 1), k2 = clamp((s - 2.1) / 1.6, 0, 1);   // k: 자란 정도, k2: 괴물이 된 정도
      const cow = clamp((0.66 - s) / 0.14, 0, 1);                                // 아주 작아지면 고개를 숙이고 떤다
      // 자랄수록 몸이 이쪽으로 기울고, 고개가 꺾여 내려다본다
      g.rotation.x = k * 0.2 + cow * 0.05 + Math.sin(time * 0.6) * 0.008 + cow * Math.sin(time * 19) * 0.006;
      g.rotation.z = cow * Math.sin(time * 23) * 0.006;
      this.neck.rotation.x = 0.05 + k * 0.85 + cow * 0.32 + Math.sin(time * 0.7 + 1) * 0.02;
      this.neck.rotation.z = Math.sin(time * 0.31) * 0.05 + (this.twitch > 0 ? Math.sin(time * 60) * 0.12 : 0) + k2 * Math.sin(time * 2.3) * 0.06;
      this.twitch = Math.max(0, this.twitch - dt);
      this.arms.forEach((a, i) => { a.rotation.x = Math.sin(time * 0.5 + i * 2) * 0.03 + k * 0.08; a.scale.set(1, 1 + k * 0.75, 1); });
      this.claws.forEach((c) => { c.visible = k > 0.04; c.scale.set(1, Math.max(0.05, k * 1.5), 1); });
      // 희부연 김은 늘 보는 이의 반대편(등 뒤)에 둔다 — 뒤에서 볼 때 몸을 가려 회색으로 보이지 않게
      if (this.cam) { const dx = g.position.x - this.cam.x, dz = g.position.z - this.cam.z, dl = Math.hypot(dx, dz) || 1, c = Math.cos(-g.rotation.y), sn = Math.sin(-g.rotation.y), wx = dx / dl, wz = dz / dl; this.halo.position.x = (wx * c + wz * sn) * 0.5 / s; this.halo.position.z = (-wx * sn + wz * c) * 0.5 / s; }
      this.mat.opacity = this.opacity; this.mat.depthWrite = this.opacity > 0.6;
      // 얼굴: 자라기 시작하면 가는 실눈이 뜨이고, 자랄수록 크게 찢어진다. 입은 그 뒤에 벌어진다
      const f = clamp(this.eye, 0, 1), eo = this.opacity * clamp(f * 3, 0, 1), mo = this.opacity * clamp((f - 0.45) * 3, 0, 1);
      this.eyeMat.opacity = eo; this.mouthMat.opacity = mo;
      this.eyes.forEach((e) => { e.visible = eo > 0.01; if (e.visible) this.wrap(e, e.userData.sg * 0.09, 0.275 + k * 0.01, 0.03 + f * 0.02 + k * 0.03, 0.012 + f * 0.05 + k * 0.15, -e.userData.sg * (0.14 + k * 0.16 + Math.sin(time * 1.3 + e.userData.sg) * 0.02 * k2)); });
      this.mouth.visible = mo > 0.01; if (this.mouth.visible) this.wrap(this.mouth, 0, 0.185 - k * 0.01, 0.07 + k * 0.085, 0.022 + f * 0.012 + k * 0.1 + k2 * 0.03, 0);
      this.halo.material.opacity = this.opacity * (0.5 + 0.05 * Math.sin(time * 0.8)) * (1 + cow * 0.6); this.halo.scale.setScalar(2.7 * (1 + cow * 0.35));   // 작아지면 어둠에 묻히기 쉬우므로, 등 뒤의 김을 더 짙고 넓게
      for (const sp of this.wisps) {
        const u = sp.userData; u.h += dt * u.sp * 0.12; if (u.h > 1) u.h -= 1; u.a += dt * 0.25;
        sp.position.set(Math.cos(u.a) * u.r, u.h * 2.0, Math.sin(u.a) * u.r * 0.7);
        const sc = u.sc * (0.55 + u.h * 0.5); sp.scale.set(sc, sc * 1.3, 1);
        sp.material.opacity = this.opacity * 0.5 * Math.sin(u.h * Math.PI);
      }
    }
  };
})();
