// 레벨: 윤 진사 댁 (안채 · 헛간 · 우물 · 장독대 · 당산나무 · 담장 · 대문)
(function () {
  'use strict';
  const HG = (window.HG = window.HG || {});

  HG.buildWorld = function (scene) {
    const M = HG.M, B = new HG.Builder();
    const W = { doors: {}, proxies: [], occluders: [], WELL: { x: 7.5, z: 1.5 }, TREE: { x: 9, z: 7.6 } };
    const col = (HG.col = { boxes: [], circles: [] });
    const zones = (HG.zones = []);
    const cb = (x0, x1, z0, z1) => { const b = { x0: Math.min(x0, x1), x1: Math.max(x0, x1), z0: Math.min(z0, z1), z1: Math.max(z0, z1), on: true }; col.boxes.push(b); return b; };
    const cc = (x, z, r) => { const c = { x, z, r, on: true }; col.circles.push(c); return c; };
    const proxyMat = new THREE.MeshBasicMaterial({ visible: false });
    const proxy = (key, x, y, z, sx, sy, sz) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), proxyMat);
      m.position.set(x, y, z); m.userData.key = key; scene.add(m); W.proxies.push(m); return m;
    };
    // 범위로 상자 추가
    const bx = (mat, x0, x1, y0, y1, z0, z1, s, grain) => B.add(HG.box(x1 - x0, y1 - y0, z1 - z0, s || 1.5, grain), mat, (x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
    const rnd = HG.rng(1790);
    const FL = 0.6, ZC = -7.9, RY = 2.88, RD = 3.7;

    // ================= 땅 =================
    {
      const sh = new THREE.Shape();
      sh.moveTo(-90, -90); sh.lineTo(90, -90); sh.lineTo(90, 90); sh.lineTo(-90, 90); sh.closePath();
      const hole = new THREE.Path(); hole.absarc(W.WELL.x, -W.WELL.z, 0.63, 0, Math.PI * 2, true); sh.holes.push(hole);
      const gg = new THREE.ShapeGeometry(sh, 28); gg.rotateX(-Math.PI / 2); HG.scaleUV(gg, 1 / 4.5);
      const ground = new THREE.Mesh(gg, M.ground); ground.receiveShadow = true; scene.add(ground);
    }
    // 디딤돌
    for (let i = 0; i < 15; i++) {
      const z = 9.6 - i * 0.95, x = Math.sin(i * 1.3) * 0.22;
      const g = HG.rockGeo(100 + i, 0.3 + rnd() * 0.12, 0.05, 0.24 + rnd() * 0.1);
      B.add(g, M.rock, x, 0.012, z, 0, rnd() * 3, 0);
    }

    // ================= 담장 =================
    const WH = 1.9;
    function wallSeg(x0, z0, x1, z1) {
      const alongX = Math.abs(x1 - x0) > Math.abs(z1 - z0), len = alongX ? Math.abs(x1 - x0) : Math.abs(z1 - z0);
      const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
      B.add(HG.box(alongX ? len : 0.5, WH, alongX ? 0.5 : len, 1.7), M.stoneWall, cx, WH / 2, cz);
      const r = HG.roofGeo({ L: len + 0.2, D: 0.44, H: 0.2, sp: 0.21, tubeR: 0.046, nt: 2, thick: 0.07, noRafters: true, ridgeR: 0.07 });
      const ry = alongX ? 0 : Math.PI / 2;
      for (const k of ['top', 'under', 'tubes', 'ridge']) B.add(r[k], M.tile, cx, WH + 0.07, cz, 0, ry, 0);
      if (alongX) cb(x0, x1, cz - 0.3, cz + 0.3); else cb(cx - 0.3, cx + 0.3, z0, z1);
    }
    wallSeg(-13, 11.5, -1.45, 11.5); wallSeg(1.45, 11.5, 13, 11.5);
    wallSeg(-13, -14, 13, -14); wallSeg(-13, -14, -13, 11.5); wallSeg(13, -14, 13, 11.5);

    // ================= 대문 =================
    {
      for (const s of [-1, 1]) {
        bx(M.wood, s * 1.32 - 0.14, s * 1.32 + 0.14, 0, 2.75, 11.36, 11.64, 1.2, 'y');
        bx(M.stone, s * 1.32 - 0.22, s * 1.32 + 0.22, 0, 0.16, 11.28, 11.72, 1.2);
      }
      bx(M.wood, -1.75, 1.75, 2.42, 2.66, 11.39, 11.61, 1.2, 'x');
      bx(M.wood, -1.2, 1.2, 2.25, 2.42, 11.45, 11.55, 1.2, 'x');
      bx(M.wood, -1.2, 1.2, 0, 0.1, 11.42, 11.58, 1.2, 'x');
      const r = HG.roofGeo({ L: 4.6, D: 1.15, H: 0.75, lift: 0.14, ridgeLift: 0.08, sp: 0.25, tubeR: 0.062, nt: 6, thick: 0.08, rafterSp: 0.3 });
      for (const k of ['top', 'tubes', 'ridge']) B.add(r[k], M.tile, 0, 2.78, 11.5);
      B.add(r.under, M.plaster2, 0, 2.78, 11.5); B.add(r.rafters, M.wood, 0, 2.78, 11.5);
      W.gateBlock = cb(-1.5, 1.5, 11.3, 11.7);
      // 문짝
      const mkLeaf = (hx, dir) => {
        const g = new THREE.Group(), b = new HG.Builder();
        b.add(HG.box(1.16, 2.14, 0.06, 1.3, 'y'), M.woodPlank, 0.58, 1.17, 0);
        for (const y of [0.35, 1.17, 2.0]) {
          for (const sz of [-1, 1]) {
            b.add(HG.box(1.16, 0.09, 0.02, 1), M.iron, 0.58, y, sz * 0.04);
            for (let i = 0; i < 6; i++) b.add(new THREE.SphereGeometry(0.022, 6, 4), M.iron, 0.1 + i * 0.19, y, sz * 0.055);
          }
        }
        b.add(new THREE.TorusGeometry(0.07, 0.012, 6, 14), M.iron, 1.02, 1.3, -0.06);
        b.build(g);
        g.position.set(hx, 0.1, 11.5); g.rotation.y = dir > 0 ? 0 : Math.PI; scene.add(g);
        return g;
      };
      W.gateL = mkLeaf(-1.17, 1); W.gateR = mkLeaf(1.17, -1);
      const bar = new THREE.Mesh(HG.box(1.9, 0.11, 0.09, 1.2, 'x'), M.wood); bar.position.set(0, 1.22, 11.39); bar.castShadow = true; scene.add(bar); W.gateBar = bar;
      for (const s of [-1, 1]) bx(M.iron, s * 0.75 - 0.03, s * 0.75 + 0.03, 1.12, 1.32, 11.36, 11.47);
      proxy('gate', 0, 1.2, 11.35, 2.3, 2.2, 0.3);
    }

    // ================= 안채 =================
    // 기단 · 마루
    bx(M.stone, -7, 7, 0, 0.3, -11.4, -4.4, 1.5);
    zones.push({ x0: -7, x1: 7, z0: -11.4, z1: -4.4, h: 0.3, surf: 'stone' });
    bx(M.stone, -0.85, 0.85, 0.3, 0.46, -5.14, -4.66, 1.5);
    zones.push({ x0: -0.85, x1: 0.85, z0: -5.14, z1: -4.66, h: 0.46, surf: 'stone' });
    bx(M.woodFloor, -6.06, 6.06, 0.52, FL, -10.5, -5.22, 1.5, 'x');
    zones.push({ x0: -6.06, x1: 6.06, z0: -10.56, z1: -5.22, h: FL, surf: 'wood' });
    zones.push({ x0: -5.94, x1: -2.06, z0: -10.44, z1: -6.56, h: FL + 0.006, surf: 'paper' });
    zones.push({ x0: 2.06, x1: 5.94, z0: -10.44, z1: -6.56, h: FL + 0.006, surf: 'paper' });
    bx(M.black, -5.9, 5.9, 0.3, 0.52, -10.5, -5.55);
    bx(M.wood, -6.06, 6.06, 0.38, 0.52, -5.3, -5.22, 1.2, 'x');
    bx(M.jangpan, -5.94, -2.06, FL, FL + 0.006, -10.44, -6.56, 1.3);
    bx(M.jangpan, 2.06, 5.94, FL, FL + 0.006, -10.44, -6.56, 1.3);
    // 기둥 · 주춧돌
    for (const z of [-5.3, -6.5, -10.5]) for (const x of [-6, -2, 2, 6]) {
      const y0 = z === -5.3 ? 0.42 : FL;
      bx(M.wood, x - 0.1, x + 0.1, y0, 3.0, z - 0.1, z + 0.1, 1.2, 'y');
      if (z === -5.3) { B.add(HG.rockGeo(300 + x, 0.2, 0.09, 0.2), M.rock, x, 0.36, z); cc(x, z, 0.15); }
    }
    // 도리 · 보
    for (const z of [-5.3, -6.5, -10.5]) bx(M.wood, -6.25, 6.25, 2.9, 3.12, z - 0.09, z + 0.09, 1.2, 'x');
    for (const x of [-6, -2, 2, 6]) {
      bx(M.wood, x - 0.11, x + 0.11, 2.92, 3.2, -10.7, -5.1, 1.2, 'z');
      bx(M.wood, x - 0.08, x + 0.08, 3.2, RY + 2.4 - 0.42, ZC - 0.08, ZC + 0.08, 1.2, 'y');
    }
    bx(M.wood, -7.0, 7.0, RY + 2.4 - 0.44, RY + 2.4 - 0.24, ZC - 0.1, ZC + 0.1, 1.2, 'x');
    // 벽
    bx(M.plaster, -6, -2, FL, 2.9, -10.56, -10.44, 2.2); bx(M.plaster, 2, 6, FL, 2.9, -10.56, -10.44, 2.2);
    bx(M.woodPlank, -2, 2, FL, 2.9, -10.54, -10.47, 1.5, 'y');
    for (const sx of [-1, 1]) { // 대청 뒤 판문
      bx(M.wood, sx * 1.0 - 0.6, sx * 1.0 + 0.6, 2.25, 2.33, -10.47, -10.43, 1.2, 'x');
      bx(M.wood, sx * 1.0 - 0.6, sx * 1.0 + 0.6, 0.9, 0.98, -10.47, -10.43, 1.2, 'x');
      bx(M.wood, sx * 1.0 - 0.6, sx * 1.0 - 0.53, 0.9, 2.33, -10.47, -10.43, 1.2, 'y');
      bx(M.wood, sx * 1.0 + 0.53, sx * 1.0 + 0.6, 0.9, 2.33, -10.47, -10.43, 1.2, 'y');
      bx(M.wood, sx * 1.0 - 0.02, sx * 1.0 + 0.02, 0.98, 2.25, -10.47, -10.44, 1.2, 'y');
      B.add(new THREE.TorusGeometry(0.04, 0.008, 5, 12), M.iron, sx * 1.0 + 0.08, 1.6, -10.43);
    }
    cb(-6.1, 6.1, -10.62, -10.4);
    bx(M.plaster, -6.06, -5.94, FL, 2.9, -10.5, -6.5, 2.2); bx(M.plaster, 5.94, 6.06, FL, 2.9, -10.5, -6.5, 2.2);
    cb(-6.12, -5.9, -10.5, -6.5); cb(5.9, 6.12, -10.5, -6.5);
    // 창호 재질
    const hanjiTex = HG.T.hanji.map, insideTex = HG.drawHanjiInside();
    W.hanjiLit = new THREE.MeshStandardMaterial({ map: hanjiTex, normalMap: HG.T.hanji.normalMap, roughness: 0.9, side: THREE.DoubleSide, emissive: 0xff8a3a, emissiveMap: hanjiTex, emissiveIntensity: 0.9 });
    W.insideLit = new THREE.MeshStandardMaterial({ map: insideTex, roughness: 0.9, emissive: 0x7088c0, emissiveMap: insideTex, emissiveIntensity: 0.0 });
    const insideDark = new THREE.MeshStandardMaterial({ map: insideTex, roughness: 0.9, emissive: 0x7088c0, emissiveMap: insideTex, emissiveIntensity: 0.1 });
    for (const sx of [-1, 1]) {
      const c = sx * 4;
      bx(M.plaster, c - 2, c - 0.8, FL, 2.9, -6.56, -6.44, 2.2); bx(M.plaster, c + 0.8, c + 2, FL, 2.9, -6.56, -6.44, 2.2);
      bx(M.plaster, c - 0.8, c + 0.8, 2.4, 2.9, -6.56, -6.44, 2.2);
      bx(M.woodPlank, c - 0.8, c + 0.8, FL, 0.9, -6.55, -6.45, 1.2, 'y');
      bx(M.wood, c - 0.86, c + 0.86, 2.4, 2.47, -6.58, -6.42, 1.2, 'x'); bx(M.wood, c - 0.86, c + 0.86, 0.86, 0.92, -6.58, -6.42, 1.2, 'x');
      bx(M.wood, c - 0.86, c - 0.8, 0.9, 2.4, -6.58, -6.42, 1.2, 'y'); bx(M.wood, c + 0.8, c + 0.86, 0.9, 2.4, -6.58, -6.42, 1.2, 'y');
      HG.latticeLeaf(B, 0.8, 1.48, c - 0.4, 1.66, -6.5, 0, sx < 0 ? W.hanjiLit : M.hanji, sx < 0 ? W.insideLit : insideDark);
      HG.latticeLeaf(B, 0.8, 1.48, c + 0.4, 1.66, -6.5, 0, sx < 0 ? W.hanjiLit : M.hanji, sx < 0 ? W.insideLit : insideDark);
      cb(c - 2, c + 2, -6.6, -6.4);
      // 방과 대청 사이 벽
      const wx = sx * 2;
      bx(M.plaster, wx - 0.06, wx + 0.06, FL, 2.9, -10.5, -8.7, 2.2); bx(M.plaster, wx - 0.06, wx + 0.06, FL, 2.9, -7.7, -6.5, 2.2);
      bx(M.plaster, wx - 0.06, wx + 0.06, 2.45, 2.9, -8.7, -7.7, 2.2);
      bx(M.wood, wx - 0.08, wx + 0.08, 2.45, 2.52, -8.76, -7.64, 1.2, 'z');
      bx(M.wood, wx - 0.08, wx + 0.08, FL, 2.45, -8.76, -8.7, 1.2, 'y'); bx(M.wood, wx - 0.08, wx + 0.08, FL, 2.45, -7.7, -7.64, 1.2, 'y');
      cb(wx - 0.1, wx + 0.1, -10.5, -8.7); cb(wx - 0.1, wx + 0.1, -7.7, -6.5);
      // 천장
      bx(M.hanjiWall, c - 1.94, c + 1.94, 2.84, 2.88, -10.44, -6.56, 1.2);
    }
    // 하인방
    for (const sx of [-1, 1]) { bx(M.wood, sx * 4 - 2, sx * 4 + 2, FL, FL + 0.12, -10.58, -10.42, 1.2, 'x'); }
    // 지붕
    const roof = HG.roofGeo({ L: 14.6, D: RD, H: 2.4, lift: 0.45, ridgeLift: 0.25, sp: 0.29, tubeR: 0.078, nt: 12, thick: 0.1, ridgeR: 0.17 });
    for (const k of ['top', 'tubes', 'ridge']) B.add(roof[k], M.tile, 0, RY, ZC);
    B.add(roof.under, M.plaster2, 0, RY, ZC); B.add(roof.rafters, M.wood, 0, RY, ZC);
    // 박공
    const woodD = M.wood.clone(); woodD.side = THREE.DoubleSide;
    function gable(x) {
      const s = new THREE.Shape(), n = 16;
      s.moveTo(ZC - 2.6, 3.0);
      for (let i = 0; i <= n; i++) { const z = ZC - 2.6 + (5.2 * i) / n; s.lineTo(z, RY + roof.yAt(x, Math.abs(z - ZC) / RD) - 0.11); }
      s.lineTo(ZC + 2.6, 3.0);
      const g = new THREE.ShapeGeometry(s); g.rotateY(-Math.PI / 2); HG.scaleUV(g, 1 / 2.2); B.add(g, M.plaster2, x, 0, 0);
    }
    [-6, -2, 2, 6].forEach(gable);
    function bargeboard(x) {
      const s = new THREE.Shape(), n = 16, pts = [];
      for (let i = 0; i <= n; i++) { const z = ZC - RD + (2 * RD * i) / n; pts.push([z, RY + roof.yAt(x, Math.abs(z - ZC) / RD)]); }
      s.moveTo(pts[0][0], pts[0][1] + 0.02); pts.forEach((p) => s.lineTo(p[0], p[1] + 0.02));
      for (let i = n; i >= 0; i--) s.lineTo(pts[i][0], pts[i][1] - 0.3);
      const g = new THREE.ShapeGeometry(s); g.rotateY(-Math.PI / 2); HG.scaleUV(g, 1 / 1.2); B.add(g, woodD, x, 0, 0);
    }
    bargeboard(-7.28); bargeboard(7.28);

    // ---- 대청 소품 ----
    bx(M.wood, 0.3, 1.02, FL + 0.25, FL + 0.28, -9.72, -9.36, 1, 'x');
    bx(M.wood, 0.33, 0.36, FL, FL + 0.25, -9.7, -9.38, 1, 'y'); bx(M.wood, 0.96, 0.99, FL, FL + 0.25, -9.7, -9.38, 1, 'y');
    bx(M.black, 0.82, 0.95, FL + 0.28, FL + 0.305, -9.62, -9.5);
    B.add(new THREE.CylinderGeometry(0.006, 0.008, 0.2, 6), M.wood, 0.76, FL + 0.288, -9.5, Math.PI / 2, 0.4, 0);
    { const g = new THREE.PlaneGeometry(0.21, 0.27); g.rotateX(-Math.PI / 2); B.add(g, M.letter, 0.56, FL + 0.283, -9.54, 0, 0.18, 0); }
    proxy('note1', 0.62, FL + 0.35, -9.54, 0.7, 0.3, 0.45);
    cb(0.28, 1.04, -9.74, -9.34);
    // 뒤주
    bx(M.woodPlank, -1.8, -0.86, FL + 0.1, FL + 0.82, -10.36, -9.72, 1.3, 'y');
    bx(M.wood, -1.86, -0.8, FL + 0.82, FL + 0.9, -10.42, -9.66, 1.2, 'x');
    for (const px of [-1.8, -0.92]) for (const pz of [-10.36, -9.78]) bx(M.wood, px, px + 0.06, FL, FL + 0.1, pz, pz + 0.06, 1, 'y');
    bx(M.brass, -1.4, -1.26, FL + 0.6, FL + 0.74, -9.722, -9.712);
    cb(-1.86, -0.8, -10.42, -9.66);
    W.dwiju = { x: -1.33, y: 1.1, z: -10.0 };

    // ---- 안방 ----
    {
      // 요 · 이불
      bx(M.fabric, -4.75, -3.65, FL + 0.006, FL + 0.06, -9.55, -7.55, 1);
      bx(M.quiltBlue, -4.72, -3.68, FL + 0.06, FL + 0.1, -9.1, -7.6, 1);
      bx(M.quiltRed, -4.64, -3.76, FL + 0.1, FL + 0.115, -9.02, -7.68, 1);
      B.add(HG.cyl(0.085, 0.085, 0.5, 12, 1), M.fabric, -4.2, FL + 0.14, -9.33, 0, 0, Math.PI / 2);
      const bulge = new THREE.Mesh(new THREE.SphereGeometry(1, 20, 12), M.quiltRed);
      bulge.scale.set(0.3, 0.17, 0.72); bulge.position.set(-4.2, FL + 0.1, -8.4); bulge.castShadow = true; scene.add(bulge); W.bulge = bulge;
      const bh = new THREE.Mesh(new THREE.SphereGeometry(0.11, 14, 10), M.black); bh.scale.set(1, 0.8, 1.2); bh.position.set(-4.2, FL + 0.2, -9.26); scene.add(bh); W.bulgeHair = bh;
      // 반닫이
      bx(M.wood, -5.9, -5.44, FL + 0.06, FL + 0.62, -7.92, -6.9, 1.3, 'z');
      bx(M.wood, -5.92, -5.42, FL + 0.62, FL + 0.66, -7.95, -6.87, 1.3, 'z');
      for (const pz of [-7.9, -6.96]) bx(M.wood, -5.88, -5.46, FL, FL + 0.06, pz, pz + 0.06, 1);
      bx(M.brass, -5.44, -5.432, FL + 0.38, FL + 0.56, -7.48, -7.34);
      for (const pz of [-7.8, -7.02]) { bx(M.brass, -5.44, -5.432, FL + 0.44, FL + 0.6, pz - 0.03, pz + 0.03); bx(M.brass, -5.44, -5.432, FL + 0.08, FL + 0.16, pz - 0.05, pz + 0.05); }
      B.add(new THREE.TorusGeometry(0.035, 0.006, 5, 12), M.brass, -5.425, FL + 0.4, -7.41, 0, Math.PI / 2, 0);
      cb(-5.94, -5.42, -7.96, -6.86);
      const tal = new THREE.Mesh(new THREE.PlaneGeometry(0.11, 0.25), M.talisman);
      tal.rotation.set(-Math.PI / 2, 0, 0.35); tal.position.set(-5.67, FL + 0.665, -7.4); scene.add(tal); W.tal1 = tal;
      proxy('tal1', -5.67, FL + 0.8, -7.4, 0.5, 0.4, 0.6);
      // 청동거울
      B.add(new THREE.CylinderGeometry(0.09, 0.09, 0.012, 20), M.bronze, -5.72, FL + 0.668, -7.05);
      // 촛대
      const cx = -5.45, cz = -8.45;
      const pts = [[0, 0], [0.085, 0], [0.09, 0.015], [0.03, 0.03], [0.012, 0.06], [0.012, 0.52], [0.05, 0.55], [0.055, 0.565], [0, 0.565]].map((p) => new THREE.Vector2(p[0], p[1]));
      B.add(new THREE.LatheGeometry(pts, 16), M.brass, cx, FL + 0.006, cz);
      B.add(new THREE.CylinderGeometry(0.016, 0.018, 0.13, 10), M.wax, cx, FL + 0.64, cz);
      W.candle = { x: cx, y: FL + 0.745, z: cz };
      // 병풍
      for (let i = 0; i < 4; i++) {
        const fm = new THREE.MeshStandardMaterial({ map: HG.drawScreen(40 + i), roughness: 0.8 });
        const mesh = new THREE.Mesh(new THREE.BoxGeometry(0.52, 1.56, 0.02), [M.wood, M.wood, M.wood, M.wood, fm, M.wood]);
        mesh.position.set(-5.15 + i * 0.49, FL + 0.79, -10.2 + (i % 2 ? 0.0 : 0.0)); mesh.rotation.y = i % 2 ? -0.34 : 0.34;
        mesh.position.z += 0.085; mesh.castShadow = true; mesh.receiveShadow = true; scene.add(mesh);
      }
      cb(-5.5, -3.3, -10.4, -10.0);
      // 창호지 위 그림자
      const sil = new THREE.Mesh(new THREE.PlaneGeometry(0.95, 1.9), new THREE.MeshBasicMaterial({
        map: HG.drawSilhouette(), transparent: true, opacity: 0.0, depthWrite: false, fog: false,
        clippingPlanes: [new THREE.Plane(new THREE.Vector3(1, 0, 0), 4.78), new THREE.Plane(new THREE.Vector3(-1, 0, 0), -3.22), new THREE.Plane(new THREE.Vector3(0, 1, 0), -0.94), new THREE.Plane(new THREE.Vector3(0, -1, 0), 2.38)],
      }));
      sil.rotation.y = Math.PI; sil.position.set(-6, FL + 0.95, -6.532); sil.visible = false; sil.renderOrder = 5; scene.add(sil); W.sil = sil;
    }

    // ---- 건넌방 ----
    {
      // 소반 · 밥그릇 (숟가락이 꽂힌 메)
      const sx = 3.5, sz = -8.7;
      B.add(new THREE.CylinderGeometry(0.23, 0.23, 0.02, 12), M.wood, sx, FL + 0.25, sz);
      for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2 + 0.78; B.add(HG.box(0.025, 0.24, 0.025, 1, 'y'), M.wood, sx + Math.cos(a) * 0.17, FL + 0.125, sz + Math.sin(a) * 0.17); }
      const bowl = [[0, 0], [0.03, 0], [0.035, 0.01], [0.055, 0.045], [0.06, 0.07], [0.052, 0.07], [0.03, 0.02], [0, 0.02]].map((p) => new THREE.Vector2(p[0], p[1]));
      B.add(new THREE.LatheGeometry(bowl, 16), M.brass, sx - 0.05, FL + 0.26, sz + 0.03);
      B.add(new THREE.SphereGeometry(0.05, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), M.white, sx - 0.05, FL + 0.31, sz + 0.03);
      B.add(HG.box(0.012, 0.16, 0.004, 1), M.brass, sx - 0.05, FL + 0.4, sz + 0.03, 0.12, 0, 0.1);
      B.add(new THREE.LatheGeometry(bowl, 14), M.white, sx + 0.1, FL + 0.26, sz - 0.07);
      B.add(new THREE.CylinderGeometry(0.045, 0.03, 0.015, 12), M.white, sx + 0.08, FL + 0.268, sz + 0.11);
      cc(sx, sz, 0.26);
      // 다듬잇돌
      bx(M.stone, 4.45, 5.05, FL + 0.006, FL + 0.15, -7.42, -7.18, 0.8);
      B.add(new THREE.CylinderGeometry(0.02, 0.034, 0.42, 8), M.woodPale, 4.68, FL + 0.185, -7.3, Math.PI / 2, 0, 0.5);
      B.add(new THREE.CylinderGeometry(0.02, 0.034, 0.42, 8), M.woodPale, 4.86, FL + 0.185, -7.31, Math.PI / 2, 0, -0.35);
      { const g = new THREE.PlaneGeometry(0.2, 0.26); g.rotateX(-Math.PI / 2); B.add(g, M.letter2, 4.3, FL + 0.012, -7.75, 0, -0.5, 0); }
      proxy('note2', 4.3, FL + 0.12, -7.75, 0.5, 0.3, 0.5);
      W.dadeumi = { x: 4.75, y: FL + 0.3, z: -7.3 };
      // 장롱
      bx(M.wood, 2.3, 3.7, FL + 0.05, FL + 1.55, -10.4, -9.94, 1.3, 'y');
      bx(M.wood, 2.26, 3.74, FL + 1.55, FL + 1.6, -10.42, -9.9, 1.3, 'x');
      for (let i = 0; i < 2; i++) for (let j = 0; j < 3; j++) {
        const x0 = 2.36 + i * 0.66, y0 = FL + 0.12 + j * 0.47;
        bx(M.woodPlank, x0, x0 + 0.62, y0, y0 + 0.42, -9.94, -9.925, 1, 'y');
        bx(M.brass, x0 + (i ? 0.02 : 0.54), x0 + (i ? 0.08 : 0.6), y0 + 0.16, y0 + 0.26, -9.925, -9.918);
      }
      cb(2.26, 3.74, -10.42, -9.9);
      // 횃대와 소복
      B.add(new THREE.CylinderGeometry(0.018, 0.018, 1.5, 8), M.wood, 5.82, 2.36, -8.9, Math.PI / 2, 0, 0);
      const cm = HG.windify(M.fabric.clone(), 0.035);
      const robe = new THREE.Group();
      const body = new THREE.Mesh(HG.clothGeo(0.62, 1.3, 12, 14, 61, 0.04), cm);
      robe.add(body);
      for (const s of [-1, 1]) { const sl = new THREE.Mesh(HG.clothGeo(0.28, 0.6, 5, 8, 63 + s, 0.03), cm); sl.position.set(s * 0.4, -0.02, 0.012); sl.rotation.z = s * 0.45; robe.add(sl); }
      robe.position.set(5.74, 2.35, -8.9); robe.rotation.y = -Math.PI / 2;
      robe.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
      scene.add(robe); W.robe = robe;
    }

    // ================= 헛간 =================
    {
      const x0 = -11.5, x1 = -7.5, z0 = -1.5, z1 = 3.5, h = 2.1;
      bx(M.mud, x0 - 0.1, x0 + 0.1, 0, h, z0, z1, 2); bx(M.mud, x0, x1, 0, h, z0 - 0.1, z0 + 0.1, 2); bx(M.mud, x0, x1, 0, h, z1 - 0.1, z1 + 0.1, 2);
      bx(M.mud, x1 - 0.1, x1 + 0.1, 0, h, z0, 0.5, 2); bx(M.mud, x1 - 0.1, x1 + 0.1, 0, h, 1.5, z1, 2); bx(M.mud, x1 - 0.1, x1 + 0.1, 1.85, h, 0.5, 1.5, 2);
      for (const [px, pz] of [[x0, z0], [x1, z0], [x0, z1], [x1, z1], [x1, 0.42], [x1, 1.58], [x0, 1.0]]) bx(M.wood, px - 0.13, px + 0.13, 0, h + 0.05, pz - 0.08, pz + 0.08, 1.2, 'y');
      bx(M.wood, x1 - 0.13, x1 + 0.13, 1.85, 1.97, 0.4, 1.6, 1.2, 'z');
      bx(M.stoneWall, x0 - 0.16, x1 + 0.16, 0, 0.22, z0 - 0.16, z0 + 0.16, 1.4); bx(M.stoneWall, x0 - 0.16, x1 + 0.16, 0, 0.22, z1 - 0.16, z1 + 0.16, 1.4);
      bx(M.stoneWall, x0 - 0.16, x0 + 0.16, 0, 0.22, z0, z1, 1.4); bx(M.stoneWall, x1 - 0.16, x1 + 0.16, 0, 0.22, z0, 0.42, 1.4); bx(M.stoneWall, x1 - 0.16, x1 + 0.16, 0, 0.22, 1.58, z1, 1.4);
      cb(x0 - 0.15, x0 + 0.15, z0, z1); cb(x0, x1, z0 - 0.15, z0 + 0.15); cb(x0, x1, z1 - 0.15, z1 + 0.15); cb(x1 - 0.15, x1 + 0.15, z0, 0.5); cb(x1 - 0.15, x1 + 0.15, 1.5, z1);
      zones.push({ x0: x0, x1: x1, z0: z0, z1: z1, h: 0.0, surf: 'dirt' });
      bx(M.mud, x0, x1 + 0.3, -0.05, 0.012, z0, z1, 2.6);
      for (const bz of [-0.4, 1.0, 2.4]) bx(M.wood, x0, x1, 1.98, 2.14, bz - 0.08, bz + 0.08, 1.2, 'x');
      bx(M.wood, x0 - 0.2, x1 + 0.2, h, h + 0.1, z0 - 0.2, z0 + 0.0, 1.2, 'x'); bx(M.wood, x0 - 0.2, x1 + 0.2, h, h + 0.1, z1, z1 + 0.2, 1.2, 'x');
      B.add(HG.thatchGeo(2.85, 3.35, 1.55, 9), M.thatch, -9.5, 2.02, 1.0);
      // 관
      bx(M.woodPale, -11.25, -9.4, 0.14, 0.52, 2.72, 3.28, 1.2, 'x');
      bx(M.wood, -11.0, -10.9, 0, 0.14, 2.7, 3.3, 1, 'z'); bx(M.wood, -9.8, -9.7, 0, 0.14, 2.7, 3.3, 1, 'z');
      const lid = new THREE.Mesh(HG.box(1.9, 0.05, 0.6, 1.2, 'x'), M.woodPale); lid.position.set(-10.3, 0.55, 2.92); lid.rotation.y = 0.1; lid.castShadow = true; lid.receiveShadow = true; scene.add(lid); W.coffinLid = lid;
      bx(M.black, -11.2, -9.45, 0.2, 0.5, 2.77, 3.23);
      cb(-11.3, -9.35, 2.6, 3.4);
      // 가마니
      for (let i = 0; i < 6; i++) {
        const g = HG.cyl(0.27, 0.27, 0.85, 12, 0.6); g.scale(1, 1, 0.62);
        B.add(g, M.thatch, -10.9 + (i % 2) * 0.5 + (i > 3 ? 0.2 : 0), 0.18 + Math.floor(i / 2) * 0.33, -0.95 + (i % 3) * 0.06, Math.PI / 2, 0.1 * i, Math.PI / 2);
      }
      cb(-11.4, -9.9, -1.4, -0.45);
      // 독
      addJar(-8.15, 2.95, 0.36, 0.85, 0);
      cc(-8.15, 2.95, 0.42);
      // 매달린 새끼줄 · 낫
      for (let i = 0; i < 6; i++) { const l = 0.5 + rnd() * 0.7; B.add(HG.cyl(0.012, 0.012, l, 5, 0.3), M.rope, -10.6 + i * 0.5 + rnd() * 0.2, 1.98 - l / 2, [-0.4, 2.4][i % 2] + (rnd() - 0.5) * 0.1); }
      B.add(new THREE.TorusGeometry(0.16, 0.035, 6, 14), M.rope, -8.6, 1.55, -1.36);
      B.add(new THREE.TorusGeometry(0.13, 0.008, 4, 12, 2.3), M.iron, -9.6, 1.5, -1.38, 0, 0, 0.6);
      B.add(new THREE.CylinderGeometry(0.014, 0.016, 0.34, 6), M.wood, -9.52, 1.3, -1.38, 0, 0, 0.2);
      B.add(new THREE.TorusGeometry(0.13, 0.008, 4, 12, 2.3), M.iron, -10.1, 1.56, -1.38, 0, 0, 0.9);
      B.add(new THREE.CylinderGeometry(0.014, 0.016, 0.34, 6), M.wood, -10.05, 1.35, -1.38, 0, 0, 0.35);
      // 부적 2
      const tal = new THREE.Mesh(new THREE.PlaneGeometry(0.11, 0.25), M.talisman);
      tal.rotation.y = Math.PI / 2; tal.position.set(-11.36, 1.45, 1.0); scene.add(tal); W.tal2 = tal;
      proxy('tal2', -11.3, 1.45, 1.0, 0.3, 0.6, 0.5);
      // 문
      const g = new THREE.Group(), b = new HG.Builder();
      b.add(HG.box(1.0, 1.82, 0.045, 1.3, 'y'), M.woodPlank, 0.5, 0.92, 0);
      b.add(HG.box(0.96, 0.08, 0.03, 1.2, 'x'), M.wood, 0.5, 0.4, 0.035); b.add(HG.box(0.96, 0.08, 0.03, 1.2, 'x'), M.wood, 0.5, 1.45, 0.035);
      b.add(new THREE.TorusGeometry(0.04, 0.008, 5, 12), M.iron, 0.86, 0.95, -0.03);
      b.build(g); g.position.set(-7.5, 0.02, 0.5); g.rotation.y = -Math.PI / 2; scene.add(g);
      W.doors.shed = { group: g, closed: -Math.PI / 2, open: -Math.PI / 2 + 1.75, t: 0, target: 0, col: cb(x1 - 0.12, x1 + 0.12, 0.5, 1.5), key: 'doorShed' };
      proxy('doorShed', -7.5, 0.95, 1.0, 0.25, 1.8, 1.0);
      // 지게 · 장작
      for (const s of [-0.22, 0.22]) B.add(HG.cyl(0.03, 0.035, 1.5, 6, 1), M.woodPale, -7.28, 0.72, 2.5 + s, 0, 0, 0.2 + 0, 0);
      for (const y of [0.5, 0.95]) B.add(HG.cyl(0.02, 0.02, 0.5, 6, 1), M.woodPale, -7.3 + y * 0.2 - 0.14, y, 2.5, Math.PI / 2, 0, 0);
      for (let i = 0; i < 34; i++) {
        const row = Math.floor(i / 9), k = i % 9;
        const g2 = HG.cyl(0.07 + rnd() * 0.03, 0.07 + rnd() * 0.03, 0.55, 7, 0.7);
        B.add(g2, i % 3 ? M.bark : M.woodPale, -11.2 + k * 0.19 + (row % 2) * 0.09 + rnd() * 0.02, 0.09 + row * 0.16, 3.95 + (rnd() - 0.5) * 0.06, Math.PI / 2, 0, rnd() * 3);
      }
      cb(-11.4, -9.4, 3.6, 4.3);
    }

    // 문짝 (방)
    function roomDoor(key, wx, hingeZ, closed, open) {
      const g = new THREE.Group(), b = new HG.Builder();
      HG.latticeLeaf(b, 0.98, 1.83, 0.5, 0.925, 0, 0, M.hanji, insideDark);
      b.add(new THREE.TorusGeometry(0.03, 0.006, 5, 10), M.iron, 0.9, 0.9, 0.03);
      b.build(g); g.position.set(wx, FL + 0.01, hingeZ); g.rotation.y = closed; scene.add(g);
      W.doors[key] = { group: g, closed, open, t: 0, target: 0, col: cb(wx - 0.08, wx + 0.08, -8.7, -7.7), key };
      proxy(key, wx, FL + 0.95, -8.2, 0.22, 1.85, 1.0);
    }
    roomDoor('doorW', -2, -7.7, Math.PI / 2, Math.PI / 2 + 1.72);
    roomDoor('doorE', 2, -8.7, -Math.PI / 2, -Math.PI / 2 + 1.72);

    // ================= 우물 =================
    {
      const wx = W.WELL.x, wz = W.WELL.z;
      for (let c = 0; c < 3; c++) for (let i = 0; i < 11; i++) {
        const a = ((i + c * 0.5) / 11) * Math.PI * 2, r = 0.8 + (rnd() - 0.5) * 0.04;
        const g = HG.rockGeo(1200 + c * 20 + i, 0.25 + rnd() * 0.04, 0.15 + rnd() * 0.02, 0.2);
        B.add(g, M.rock, wx + Math.cos(a) * r, 0.12 + c * 0.235, wz + Math.sin(a) * r, 0, -a + Math.PI / 2 + (rnd() - 0.5) * 0.2, 0);
      }
      const sm = M.stoneWall.clone(); sm.side = THREE.BackSide; sm.color.set(0x777777);
      const shaft = new THREE.Mesh(HG.cyl(0.64, 0.64, 5.4, 28, 1.4, true), sm); shaft.position.set(wx, -2.4, wz); shaft.receiveShadow = true; scene.add(shaft);
      const water = new THREE.Mesh(new THREE.CircleGeometry(0.64, 28), M.water); water.rotation.x = -Math.PI / 2; water.position.set(wx, -2.3, wz); scene.add(water); W.water = water;
      cc(wx, wz, 1.06);
      proxy('well', wx, 0.5, wz, 2.0, 1.4, 2.0);
      // 두레박
      const bk = [[0, 0], [0.1, 0], [0.13, 0.2], [0.115, 0.2], [0.09, 0.02], [0, 0.02]].map((p) => new THREE.Vector2(p[0], p[1]));
      B.add(new THREE.LatheGeometry(bk, 12), M.woodPale, wx - 0.57, 0.73, wz + 0.58, 0.06, 0, 0.04);
      B.add(new THREE.TorusGeometry(0.2, 0.022, 6, 16), M.rope, wx - 0.95, 0.03, wz + 1.0, Math.PI / 2, 0, 0);
      B.add(new THREE.TorusGeometry(0.16, 0.022, 6, 16), M.rope, wx - 0.93, 0.07, wz + 1.02, Math.PI / 2, 0, 0);
      W.wellTals = [];
      for (let i = 0; i < 3; i++) {
        const a = Math.PI + (i - 1) * 0.5, t = new THREE.Mesh(new THREE.PlaneGeometry(0.11, 0.25), M.talisman);
        t.position.set(wx + Math.cos(a) * 1.04, 0.44, wz + Math.sin(a) * 1.04); t.rotation.y = -a + Math.PI / 2; t.rotation.z = (i - 1) * 0.12; t.visible = false; scene.add(t); W.wellTals.push(t);
      }
    }

    // ================= 장독대 =================
    function addJar(x, z, r, h, y0) {
      const p = [[0, 0], [0.5, 0], [0.92, 0.3], [1, 0.55], [0.84, 0.84], [0.56, 0.95], [0.62, 1.0], [0.52, 1.0]].map((q) => new THREE.Vector2(q[0] * r, q[1] * h));
      B.add(new THREE.LatheGeometry(p, 20), M.onggi, x, y0 || 0, z, 0, rnd() * 6, 0);
      const l = [[0.7, 1.0], [0.66, 1.035], [0.3, 1.09], [0.14, 1.1], [0.12, 1.14], [0, 1.14]].map((q) => new THREE.Vector2(q[0] * r, q[1] * h));
      B.add(new THREE.LatheGeometry(l, 20), M.onggi, x, y0 || 0, z);
    }
    {
      bx(M.stone, 8.2, 11.7, 0, 0.18, -8.9, -5.7, 1.3);
      const jars = [[8.75, -8.3, 0.4, 0.95], [9.65, -8.35, 0.36, 0.85], [10.5, -8.3, 0.42, 1.0], [11.25, -8.2, 0.3, 0.7], [8.7, -7.4, 0.3, 0.66], [9.45, -7.45, 0.27, 0.6], [10.2, -7.4, 0.3, 0.7], [11.0, -7.35, 0.25, 0.55],
        [8.6, -6.6, 0.2, 0.42], [9.2, -6.55, 0.22, 0.45], [9.85, -6.6, 0.18, 0.36], [10.5, -6.5, 0.2, 0.4], [11.1, -6.55, 0.16, 0.32]];
      jars.forEach((j) => addJar(j[0], j[1], j[2], j[3], 0.18));
      cb(8.2, 11.7, -8.9, -5.7);
      // 절구
      const mp = [[0, 0], [0.2, 0], [0.16, 0.2], [0.24, 0.5], [0.2, 0.5], [0.1, 0.25], [0, 0.25]].map((q) => new THREE.Vector2(q[0], q[1]));
      B.add(new THREE.LatheGeometry(mp, 14), M.woodPale, 7.4, 0, -5.0);
      B.add(HG.cyl(0.03, 0.05, 0.9, 7, 1), M.woodPale, 7.45, 0.72, -5.0, 0.25, 0, 0.1);
      cc(7.4, -5.0, 0.3);
    }

    // ================= 당산나무 =================
    {
      const tx = W.TREE.x, tz = W.TREE.z;
      const tg = HG.treeGeo(7, { trunk: 2.3, radius: 0.72, depth: 6, spread: 0.72, taper: 0.8, firstSplit: 4, leader: 2, upBias: 0.22, droop: 0.3, roots: 8, straight: true });
      const tree = new THREE.Mesh(tg, M.bark); tree.position.set(tx, 0, tz); tree.castShadow = true; tree.receiveShadow = true; scene.add(tree);
      cc(tx, tz, 0.95);
      B.add(new THREE.TorusGeometry(0.645, 0.04, 7, 36), M.rope, tx, 1.32, tz, Math.PI / 2, 0, 0);
      B.add(new THREE.TorusGeometry(0.64, 0.035, 7, 36), M.rope, tx, 1.4, tz, Math.PI / 2 + 0.05, 0, 0.03);
      W.clothMat = [];
      const cms = M.cloth.map((m) => { const c = HG.windify(m.clone(), 0.16); W.clothMat.push(c); return c; });
      const wm = HG.windify(M.hanji.clone(), 0.05, false, 0); W.clothMat.push(wm);
      const strips = new THREE.Group(); scene.add(strips);
      let stripN = 0;
      const strip = (x, y, z, w, h, mat, ry) => {
        const g = HG.clothGeo(w, h, 3, 10, 300 + stripN++, w * 0.25);
        const m = new THREE.Mesh(g, mat); m.position.set(x, y, z); m.rotation.y = ry; m.castShadow = true; strips.add(m);
      };
      for (let i = 0; i < 13; i++) {
        const a = (i / 13) * Math.PI * 2 + rnd() * 0.3;
        if (Math.abs(a - Math.PI * 1.25) < 0.25) continue;
        strip(tx + Math.cos(a) * 0.685, 1.3, tz + Math.sin(a) * 0.685, 0.035 + rnd() * 0.02, 0.14 + rnd() * 0.26, wm, -a + Math.PI / 2 + (rnd() - 0.5) * 0.6);
      }
      const tips = tg.userData.tips.filter((p) => p.y > 2.3 && p.y < 5.2);
      for (let i = 0; i < 20; i++) {
        let p = tips.length ? tips[(rnd() * tips.length) | 0] : null;
        const a = rnd() * 6.28, r = 0.9 + rnd() * 1.6;
        const x = p ? tx + p.x : tx + Math.cos(a) * r, y = p ? p.y : 2.8 + rnd(), z = p ? tz + p.z : tz + Math.sin(a) * r;
        strip(x, y, z, 0.1 + rnd() * 0.06, 0.9 + rnd() * 0.9, cms[i % 5], rnd() * 6);
      }
      [[1.56, 0.07, 0], [1.71, 0.11, 3], [1.93, 0.05, 1], [2.04, 0.09, 2]].forEach((b, i) => {
        const rr = 0.72 - ((b[0] + 0.2) / 2.3) * 0.144 + 0.016;
        B.add(HG.cyl(rr - 0.004, rr + 0.004, b[1], 24, 1, true), M.cloth[b[2]], tx, b[0], tz, (rnd() - 0.5) * 0.09, i, (rnd() - 0.5) * 0.09);
      });
      // 돌무더기
      const px = 7.3, pz = 9.3;
      for (let i = 0; i < 70; i++) {
        const a = rnd() * 6.28, rr = Math.pow(rnd(), 0.7) * 0.85, hh = (1 - rr / 0.85) * 0.95;
        const s = 0.08 + rnd() * 0.1;
        B.add(HG.rockGeo(500 + i, s * (1 + rnd() * 0.5), s * 0.7, s), M.rock, px + Math.cos(a) * rr, hh * rnd() + 0.04, pz + Math.sin(a) * rr, rnd(), rnd() * 6, rnd());
      }
      B.add(HG.rockGeo(999, 0.14, 0.2, 0.12), M.rock, px, 1.0, pz);
      cc(px, pz, 0.85);
      // 부적 3
      const a = Math.PI * 1.25, tal = new THREE.Mesh(new THREE.PlaneGeometry(0.11, 0.25), M.talisman);
      tal.position.set(tx + Math.cos(a) * 0.665, 1.16, tz + Math.sin(a) * 0.665); tal.rotation.y = -a + Math.PI / 2; scene.add(tal); W.tal3 = tal;
      proxy('tal3', tx + Math.cos(a) * 0.75, 1.2, tz + Math.sin(a) * 0.75, 0.5, 0.6, 0.5);
    }

    // ================= 빨랫줄 =================
    {
      const z = 6.3, cm = HG.windify(M.fabric.clone(), 0.2); W.clothMat.push(cm);
      for (const x of [-6.4, -2.3]) {
        B.add(HG.cyl(0.035, 0.045, 2.2, 7, 1), M.woodPale, x, 1.1, z, 0, 0, (x < -4 ? 1 : -1) * 0.04);
        cc(x, z, 0.1);
      }
      B.add(HG.cyl(0.008, 0.008, 4.1, 5, 0.3), M.rope, -4.35, 2.08, z, 0, 0, Math.PI / 2);
      const hang = (x, w, h, sleeves) => {
        const grp = new THREE.Group();
        const m = new THREE.Mesh(HG.clothGeo(w, h, 14, 16, Math.round(x * 10 + 99), 0.045), cm); grp.add(m);
        if (sleeves) for (const s of [-1, 1]) {
          const sl = new THREE.Mesh(HG.clothGeo(0.3, 0.62, 5, 8, 7 + s, 0.03), cm);
          sl.position.set(s * (w / 2 + 0.07), -0.01, 0.012); sl.rotation.z = s * 0.3; grp.add(sl);
        }
        grp.position.set(x, 2.07, z); grp.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } }); scene.add(grp);
      };
      hang(-5.75, 0.8, 0.95); hang(-4.3, 0.62, 1.5, true); hang(-3.0, 0.95, 0.7);
    }

    // 짚신
    for (let i = 0; i < 3; i++) for (const s of [-0.06, 0.06]) {
      const g = new THREE.SphereGeometry(1, 10, 6); g.scale(0.045, 0.02, 0.12);
      B.add(g, M.thatch, -0.5 + i * 0.42 + s + (i === 2 ? 0.05 : 0), 0.48, -4.9 + (i === 2 && s > 0 ? 0.09 : 0), 0, i === 2 && s > 0 ? 0.7 : 0.05 * i, 0);
    }

    // ================= 주변 숲 =================
    {
      const TB = new HG.Builder();
      let n = 0, guard = 0;
      while (n < 30 && guard++ < 500) {
        const x = (rnd() - 0.5) * 80, z = (rnd() - 0.5) * 80;
        const inside = x > -15.5 && x < 15.5 && z > -16.5 && z < 14;
        if (inside || Math.hypot(x, z) > 42 || (Math.abs(x) < 3.5 && z > 11)) continue;
        const sc = 0.8 + rnd() * 0.9;
        const g = HG.treeGeo(2000 + n, { trunk: 2.2 * sc, radius: 0.2 * sc, depth: 4, spread: 0.6, taper: 0.75, firstSplit: 3, leader: 3, upBias: 0.25, droop: 0.1 });
        TB.add(g, M.bark, x, 0, z, 0, rnd() * 6, 0); n++;
      }
      TB.build(scene);
      for (let i = 0; i < 26; i++) {
        const a = rnd() * 6.28, r = 17 + rnd() * 22, s = 0.3 + rnd() * 0.9;
        B.add(HG.rockGeo(700 + i, s, s * 0.6, s * 0.8), M.rock, Math.cos(a) * r * 1.0, s * 0.15, Math.sin(a) * r, 0, rnd() * 6, 0);
      }
      for (let i = 0; i < 12; i++) { const x = -12 + rnd() * 24, z = -13 + rnd() * 23; if (Math.abs(x) < 7.5 && z < -4) continue; const s = 0.08 + rnd() * 0.12; B.add(HG.rockGeo(800 + i, s, s * 0.5, s), M.rock, x, 0.02, z, 0, rnd() * 6, 0); }
    }

    // ================= 마른 풀 =================
    {
      const blade = new THREE.PlaneGeometry(0.016, 0.5, 1, 4); blade.translate(0, 0.25, 0);
      const p = blade.attributes.position, nrm = blade.attributes.normal;
      for (let i = 0; i < p.count; i++) { const y = p.getY(i) / 0.5; p.setX(i, p.getX(i) * (1 - y * 0.9)); p.setZ(i, y * y * 0.12); nrm.setXYZ(i, 0, 1, 0.2); }
      const gm = HG.windify(new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 1, side: THREE.DoubleSide }), 0.09, true);
      const N = 26000, im = new THREE.InstancedMesh(blade, gm, N), d = new THREE.Object3D(), c = new THREE.Color();
      let k = 0, guard = 0, cx0 = 0, cz0 = 0, cl = 0;
      const inRect = (x, z, x0, x1, z0, z1) => x > x0 && x < x1 && z > z0 && z < z1;
      while (k < N && guard++ < 400000) {
        let x, z;
        if (cl > 0) { // 포기 단위로 모여 남
          cl--; x = cx0 + (rnd() - 0.5) * 0.22; z = cz0 + (rnd() - 0.5) * 0.22;
          const s = 0.35 + rnd() * 0.75;
          d.position.set(x, 0, z); d.rotation.set((rnd() - 0.5) * 0.7, rnd() * 6.28, (rnd() - 0.5) * 0.7); d.scale.set(0.8 + rnd() * 0.8, s, 1); d.updateMatrix();
          im.setMatrixAt(k, d.matrix);
          const t = rnd(); c.setRGB(0.24 + t * 0.2, 0.2 + t * 0.15, 0.1 + t * 0.07); im.setColorAt(k, c); k++;
          continue;
        }
        const outside = rnd() < 0.55;
        if (outside) { x = (rnd() - 0.5) * 60; z = (rnd() - 0.5) * 60; if (inRect(x, z, -13.3, 13.3, -14.3, 11.8)) continue; if (Math.abs(x) < 1.2 && z > 11) continue; }
        else {
          x = -12.7 + rnd() * 25.4; z = -13.7 + rnd() * 24.9;
          const dw = Math.min(x + 12.75, 12.75 - x, z + 13.75, 11.25 - z);
          const nearTree = Math.hypot(x - 9, z - 7.6) < 2.6, nearShed = inRect(x, z, -12, -7, -2.2, 4.6), nearPile = Math.hypot(x - 7.3, z - 9.3) < 1.6;
          const nn = HG.noise.fbm((x + 40) / 64, (z + 40) / 64, 8, 8, 3);
          if (!(dw < 0.9 + nn * 1.6 || nearTree || nearShed || nearPile || nn > 0.66)) continue;
          if (inRect(x, z, -7.1, 7.1, -11.5, -4.3) || inRect(x, z, -11.65, -7.35, -1.65, 3.65) || inRect(x, z, 8.1, 11.8, -9, -5.6)) continue;
          if (Math.hypot(x - 7.5, z - 1.5) < 1.0 || Math.hypot(x - 9, z - 7.6) < 0.9 || (Math.abs(x) < 0.9 && z > -4.4)) continue;
        }
        cx0 = x; cz0 = z; cl = 5 + ((rnd() * 9) | 0);
      }
      im.count = k; im.receiveShadow = true; im.castShadow = false; im.frustumCulled = false; scene.add(im);
    }

    const meshes = B.build(scene);
    meshes.forEach((m) => { if (m.material === M.plaster || m.material === M.mud || m.material === M.woodPlank || m.material === M.stoneWall) W.occluders.push(m); });
    return W;
  };
})();
