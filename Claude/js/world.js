// 레벨: 윤 진사 댁 (안채 · 헛간 · 우물 · 장독대 · 당산나무 · 담장 · 대문)
(function () {
  'use strict';
  const HG = (window.HG = window.HG || {});

  HG.buildWorld = function (scene) {
    const M = HG.M, B = new HG.Builder();
    // 벽은 달빛 그림자를 바깥면에서도 드리운다 — 안쪽 면만 드리우면 벽 밑동을 따라 달빛이 가는 선으로 샌다
    for (const k of ['plaster', 'plaster2', 'mud', 'woodPlank', 'hanjiWall']) if (HG.M[k]) HG.M[k].shadowSide = THREE.DoubleSide;
    const W = { doors: {}, proxies: [], occluders: [], noCast: [], noRecv: [], WELL: { x: 7.5, z: 1.5 }, TREE: { x: 9, z: 7.6 } };
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
    // (모든 상자를 기록해 두었다가, 같은 방향의 면이 같은 평면에서 겹치는 곳 — 깜박임의 원인 — 을 전수조사한다)
    const AUD = (HG.auditBoxes = []);
    const bx = (mat, x0, x1, y0, y1, z0, z1, s, grain) => {
      AUD.push({ lo: [Math.min(x0, x1), Math.min(y0, y1), Math.min(z0, z1)], hi: [Math.max(x0, x1), Math.max(y0, y1), Math.max(z0, z1)], m: mat });
      return B.add(HG.box(x1 - x0, y1 - y0, z1 - z0, s || 1.5, grain), mat, (x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
    };
    HG.auditOverlaps = function () {
      const out = [], n = AUD.length, name = (m) => Object.keys(M).find((k) => M[k] === m) || 'mat';
      for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
        const a = AUD[i], b = AUD[j];
        for (let ax = 0; ax < 3; ax++) {
          const u = (ax + 1) % 3, v = (ax + 2) % 3;
          const ou = Math.min(a.hi[u], b.hi[u]) - Math.max(a.lo[u], b.lo[u]), ov = Math.min(a.hi[v], b.hi[v]) - Math.max(a.lo[v], b.lo[v]);
          if (ou < 0.006 || ov < 0.006) continue;
          for (const side of ['lo', 'hi']) if (Math.abs(a[side][ax] - b[side][ax]) < 0.0025) {
            // 겹친 영역 바로 바깥이 다른 상자(또는 땅)로 덮여 있으면 보이지 않으므로 제외
            const c = a[side][ax], dir = side === 'lo' ? -1 : 1;
            const u0 = Math.max(a.lo[u], b.lo[u]), u1 = Math.min(a.hi[u], b.hi[u]), v0 = Math.max(a.lo[v], b.lo[v]), v1 = Math.min(a.hi[v], b.hi[v]);
            let visible = false;
            for (const [fu, fv] of [[0.5, 0.5], [0.08, 0.08], [0.92, 0.08], [0.08, 0.92], [0.92, 0.92]]) {
              const p = [0, 0, 0]; p[ax] = c + dir * 0.003; p[u] = u0 + (u1 - u0) * fu; p[v] = v0 + (v1 - v0) * fv;
              if (p[1] < 0) continue;   // 땅속
              let covered = false;
              for (let k = 0; k < n && !covered; k++) { const q = AUD[k]; covered = p[0] > q.lo[0] && p[0] < q.hi[0] && p[1] > q.lo[1] && p[1] < q.hi[1] && p[2] > q.lo[2] && p[2] < q.hi[2]; }
              if (!covered) { visible = true; break; }
            }
            if (!visible) continue;
            out.push({ axis: 'xyz'[ax], side, at: +a[side][ax].toFixed(3), a: name(a.m) + ' ' + a.lo.map((q) => q.toFixed(2)) + '~' + a.hi.map((q) => q.toFixed(2)), b: name(b.m) + ' ' + b.lo.map((q) => q.toFixed(2)) + '~' + b.hi.map((q) => q.toFixed(2)), area: +(ou * ov).toFixed(4) });
          }
        }
      }
      return out;
    };
    const rnd = HG.rng(1790);
    const FL = 0.6, ZC = -7.9, RY = 2.88, RD = 3.7;
    // 배치: 서쪽 안마당(x -13~13)과 동쪽 사랑마당(x 13~33)을 내외담이 가르고, 중문으로 통한다. 대문은 사랑마당 남쪽.
    const GX = 23, EX = 33, JZ0 = 3.1, JZ1 = 4.9;
    W.GATE = { x: GX, z: 11.5 }; W.JUNG = { x: 13, z: (JZ0 + JZ1) / 2 };

    // ================= 땅 =================
    {
      const sh = new THREE.Shape();
      sh.moveTo(-90, -90); sh.lineTo(90, -90); sh.lineTo(90, 90); sh.lineTo(-90, 90); sh.closePath();
      const hole = new THREE.Path(); hole.absarc(W.WELL.x, -W.WELL.z, 0.63, 0, Math.PI * 2, true); sh.holes.push(hole);
      const gg = new THREE.ShapeGeometry(sh, 28); gg.rotateX(-Math.PI / 2); HG.scaleUV(gg, 1 / 4.5);
      const ground = new THREE.Mesh(gg, M.ground); ground.receiveShadow = true; scene.add(ground);
    }
    // 디딤돌
    {
      const path = [];
      for (let i = 0; i < 15; i++) path.push([GX + Math.sin(i * 1.3) * 0.22, 9.6 - i * 0.95]);          // 대문 → 사랑채
      for (let i = 0; i < 11; i++) path.push([GX - 1.2 - i * 0.92, 4.0 + Math.sin(i * 1.7) * 0.2]);    // 사랑마당 → 중문
      for (let i = 0; i < 9; i++) path.push([11.6 - i * 0.95, 4.0 - i * 0.08 + Math.sin(i * 1.1) * 0.15]); // 중문 → 안마당
      for (let i = 0; i < 9; i++) path.push([2.6 - i * 0.3 + Math.sin(i * 1.3) * 0.15, 3.0 - i * 0.92]);   // 안마당 → 안채 댓돌
      path.forEach((p, i) => { if (Math.hypot(p[0] - 4.3, p[1] - 4.6) < 1.0) return; B.add(HG.rockGeo(100 + i, 0.3 + rnd() * 0.12, 0.05, 0.24 + rnd() * 0.1), M.rock, p[0], 0.012, p[1], 0, rnd() * 3, 0); });
    }

    // ================= 담장 =================
    // 토석담: 흙 심 위에 돌을 줄줄이 박고, 흙으로 덮은 담머리에 기와를 얹는다
    const WH = 1.85, wallStones = [];
    // 담 기와는 달빛과 등불을 받아 골이 읽히도록 조금 더 밝고 매끈하게
    const tileWall = M.tile.clone(); tileWall.roughness = 0.55; tileWall.emissive = new THREE.Color(0x1a2230); tileWall.emissiveIntensity = 0.5;
    function wallSeg(x0, z0, x1, z1, inx, inz, both) {
      const alongX = Math.abs(x1 - x0) > Math.abs(z1 - z0), len = alongX ? Math.abs(x1 - x0) : Math.abs(z1 - z0);
      const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2, ry = alongX ? 0 : Math.PI / 2;
      B.add(HG.box(alongX ? len : 0.46, WH, alongX ? 0.46 : len, 2.4), M.mud, cx, WH / 2, cz);
      // 담머리: 흙으로 다진 받침 + 그 위에 딱 얹힌 기와 (떠 보이지 않게)
      B.add(HG.box(alongX ? len + 0.1 : 0.6, 0.11, alongX ? 0.6 : len + 0.1, 2.4), M.mud, cx, WH + 0.055, cz);
      const tri = new THREE.Shape(); tri.moveTo(-0.3, 0); tri.lineTo(0.3, 0); tri.lineTo(0, 0.2); tri.closePath();
      const core = new THREE.ExtrudeGeometry(tri, { depth: len + 0.1, bevelEnabled: false }); core.translate(0, 0, -(len + 0.1) / 2); HG.scaleUV(core, 1 / 2.4);
      B.add(core, M.mud, cx, WH + 0.11, cz, 0, alongX ? Math.PI / 2 : 0, 0);
      const r = HG.roofGeo({ L: len + 0.24, D: 0.37, H: 0.23, sp: 0.2, tubeR: 0.045, nt: 3, thick: 0.03, noRafters: true, ridgeR: 0.065 });
      for (const k of ['top', 'tubes', 'ridge']) B.add(r[k], tileWall, cx, WH + 0.115, cz, 0, ry, 0);
      // 안쪽 면에 박힌 돌 (아래는 크고 위로 갈수록 작다)
      // 넓적한 돌을 가로로 눕혀 줄 맞춰 쌓는다 (줄눈은 흙)
      // 막돌을 흙에 박아 쌓는다: 크기 · 간격 · 높이가 제각각이고, 일부는 흙에 반쯤 묻혔다
      for (let side = 0; side < (both ? 2 : 1); side++) for (let row = 0; row < 7; row++) {
        if (side === 1 && row === 0) { inx = -inx; inz = -inz; }
        const y0 = 0.12 + row * 0.25; let d = -len / 2 + rnd() * 0.3;
        while (d < len / 2 - 0.08) {
          const big = rnd() < 0.2, w = Math.min((big ? 0.5 : 0.2) + rnd() * (big ? 0.25 : 0.26), len / 2 - d), hh = (big ? 0.13 : 0.085) + rnd() * 0.045;
          const bury = rnd() < 0.3 ? 0.06 + rnd() * 0.04 : 0, off = 0.205 - bury;
          const px = alongX ? cx + d + w * 0.5 : cx + inx * off, pz = alongX ? cz + inz * off : cz + d + w * 0.5;
          if (rnd() > 0.06) wallStones.push({ x: px, y: y0 + (rnd() - 0.5) * 0.07 + (big ? 0.02 : 0), z: pz, sx: alongX ? w * 0.6 : 0.09, sy: hh, sz: alongX ? 0.09 : w * 0.6, r: (rnd() - 0.5) * 0.22, c: 0.5 + rnd() * 0.6, k: (rnd() * 3) | 0 });
          d += w + rnd() * 0.05;
        }
      }
      if (alongX) cb(x0, x1, cz - 0.3, cz + 0.3); else cb(cx - 0.3, cx + 0.3, z0, z1);
    }
    wallSeg(-13, 11.5, 13, 11.5, 0, -1);                                            // 안마당 남쪽
    wallSeg(13, 11.5, GX - 1.45, 11.5, 0, -1); wallSeg(GX + 1.45, 11.5, EX, 11.5, 0, -1); // 사랑마당 남쪽 (대문 양옆)
    wallSeg(-13, -14, EX, -14, 0, 1); wallSeg(-13, -14, -13, 11.5, 1, 0); wallSeg(EX, -14, EX, 11.5, -1, 0);
    wallSeg(13, -14, 13, JZ0 - 0.2, -1, 0, true); wallSeg(13, JZ1 + 0.2, 13, 11.5, -1, 0, true); // 내외담 (양면에 돌)
    { // 중문: 문짝 없이 늘 열려 있는 작은 문
      for (const pz of [JZ0 - 0.06, JZ1 + 0.06]) { bx(M.wood, 12.86, 13.14, 0, 2.5, pz - 0.13, pz + 0.13, 1.2, 'y'); bx(M.stone, 12.78, 13.22, 0, 0.14, pz - 0.2, pz + 0.2, 1.2); cc(13, pz, 0.2); }
      bx(M.wood, 12.9, 13.1, 2.2, 2.42, JZ0 - 0.4, JZ1 + 0.4, 1.2, 'z'); bx(M.wood, 12.93, 13.07, 0.14, 0.22, JZ0 + 0.07, JZ1 - 0.07, 1.2, 'z');
      const r = HG.roofGeo({ L: JZ1 - JZ0 + 1.5, D: 0.95, H: 0.6, lift: 0.1, ridgeLift: 0.06, sp: 0.24, tubeR: 0.058, nt: 5, thick: 0.07, rafterSp: 0.3 });
      for (const k of ['top', 'tubes', 'ridge']) B.add(r[k], M.tile, 13, 2.5, (JZ0 + JZ1) / 2, 0, Math.PI / 2, 0);
      B.add(r.under, M.plaster2, 13, 2.5, (JZ0 + JZ1) / 2, 0, Math.PI / 2, 0); B.add(r.rafters, M.wood, 13, 2.5, (JZ0 + JZ1) / 2, 0, Math.PI / 2, 0);
    }
    {
      const d = new THREE.Object3D(), col = new THREE.Color();
      for (let k = 0; k < 3; k++) {
        const list = wallStones.filter((s) => s.k === k), im = new THREE.InstancedMesh(HG.rockGeo(1300 + k, 1, 1, 1, 2), M.rock, list.length);
        list.forEach((s, i) => { d.position.set(s.x, s.y, s.z); d.rotation.set(s.r, 0, s.r); d.scale.set(s.sx, s.sy, s.sz); d.updateMatrix(); im.setMatrixAt(i, d.matrix); col.setRGB(s.c, s.c * 0.97, s.c * 0.92); im.setColorAt(i, col); });
        im.castShadow = false; im.receiveShadow = true; im.frustumCulled = false; scene.add(im);
      }
    }

    // ================= 대문 =================
    {
      for (const s of [-1, 1]) {
        bx(M.wood, GX + s * 1.32 - 0.14, GX + s * 1.32 + 0.14, 0.16, 2.75, 11.36, 11.64, 1.2, 'y');
        bx(M.stone, GX + s * 1.32 - 0.22, GX + s * 1.32 + 0.22, 0, 0.16, 11.28, 11.72, 1.2);
      }
      bx(M.wood, GX - 1.75, GX + 1.75, 2.42, 2.66, 11.39, 11.61, 1.2, 'x');
      bx(M.wood, GX - 1.18, GX + 1.18, 2.25, 2.42, 11.45, 11.55, 1.2, 'x');
      bx(M.wood, GX - 1.18, GX + 1.18, 0, 0.1, 11.42, 11.58, 1.2, 'x');
      const r = HG.roofGeo({ L: 4.6, D: 1.15, H: 0.75, lift: 0.14, ridgeLift: 0.08, sp: 0.25, tubeR: 0.062, nt: 6, thick: 0.08, rafterSp: 0.3 });
      for (const k of ['top', 'tubes', 'ridge']) B.add(r[k], M.tile, GX, 2.78, 11.5);
      B.add(r.under, M.plaster2, GX, 2.78, 11.5); B.add(r.rafters, M.wood, GX, 2.78, 11.5);
      W.gateBlock = cb(GX - 1.5, GX + 1.5, 11.3, 11.7);
      // 문짝
      const mkLeaf = (hx, dir) => {
        const g = new THREE.Group(), b = new HG.Builder();
        b.add(HG.box(1.17, 2.14, 0.06, 1.3, 'y'), M.woodPlank, 0.585, 1.17, 0);   // 두 짝이 가운데서 틈 없이 맞닿는다
        for (const y of [0.35, 1.17, 2.0]) {
          for (const sz of [-1, 1]) {
            b.add(HG.box(1.16, 0.09, 0.02, 1), M.iron, 0.58, y, sz * 0.04);
            for (let i = 0; i < 6; i++) b.add(new THREE.SphereGeometry(0.022, 6, 4), M.iron, 0.1 + i * 0.19, y, sz * 0.055);
          }
        }
        b.add(new THREE.TorusGeometry(0.07, 0.012, 6, 14), M.iron, 1.02, 1.3, -dir * 0.06);
        // 빗장걸이는 문짝에 붙어 있어야 한다 (문이 열릴 때 함께 돌아간다)
        b.add(HG.box(0.06, 0.2, 0.1, 1), M.iron, 0.42, 1.12, -dir * 0.085);
        b.add(HG.box(0.06, 0.03, 0.06, 1), M.iron, 0.42, 1.04, -dir * 0.14);
        b.build(g);
        g.position.set(hx, 0.1, 11.5); g.rotation.y = dir > 0 ? 0 : Math.PI; scene.add(g);
        return g;
      };
      W.gateL = mkLeaf(GX - 1.17, 1); W.gateR = mkLeaf(GX + 1.17, -1);
      const bar = new THREE.Mesh(HG.box(1.9, 0.11, 0.09, 1.2, 'x'), M.wood); bar.position.set(GX, 1.22, 11.37); bar.castShadow = true; scene.add(bar); W.gateBar = bar;
      proxy('gate', GX, 1.2, 11.35, 2.3, 2.2, 0.3);
      // 사랑마당 살림: 노둣돌 · 평상 · 장작 · 감나무
      B.add(HG.rockGeo(1800, 0.45, 0.2, 0.3), M.rock, GX + 2.6, 0.12, 9.9); cc(GX + 2.6, 9.9, 0.5);
      bx(M.woodPale, 27.0, 29.2, 0.36, 0.42, 1.2, 2.7, 1.3, 'x');
      for (const [px, pz] of [[27.1, 1.3], [29.1, 1.3], [27.1, 2.6], [29.1, 2.6]]) bx(M.wood, px - 0.05, px + 0.05, 0, 0.36, pz - 0.05, pz + 0.05, 1, 'y');
      cb(27.0, 29.2, 1.2, 2.7);
      for (let i = 0; i < 40; i++) { const row = Math.floor(i / 10), k = i % 10; B.add(HG.cyl(0.07 + rnd() * 0.03, 0.07 + rnd() * 0.03, 0.55, 7, 0.7), i % 3 ? M.bark : M.woodPale, 30.3 + k * 0.19 + (row % 2) * 0.09, 0.09 + row * 0.16, -3.4 + (rnd() - 0.5) * 0.06, Math.PI / 2, 0, rnd() * 3); }
      cb(30.1, 32.4, -3.8, -3.0);
      const pt = HG.treeGeo(31, { trunk: 1.9, radius: 0.26, depth: 5, spread: 0.7, taper: 0.76, firstSplit: 3, leader: 2, upBias: 0.2, droop: 0.2, roots: 5 });
      const ptm = new THREE.Mesh(pt, M.bark); ptm.position.set(29.6, 0, 6.6); ptm.castShadow = true; ptm.receiveShadow = true; scene.add(ptm); cc(29.6, 6.6, 0.45);
    }

    // ================= 안채 =================
    // 기단 · 마루
    // 다섯 칸: 부엌(-10~-6) · 안방(-6~-2) · 대청(-2~2) · 건넌방(2~6) · 작은방(6~10) — 일곱 식구가 살던 집
    const XS = [-10, -6, -2, 2, 6, 10], KF = 0.3; // KF: 부엌 바닥 (기단 높이)
    bx(M.stone, -11, 11, 0, 0.3, -11.4, -4.4, 1.5);
    zones.push({ x0: -11, x1: 11, z0: -11.4, z1: -4.4, h: 0.3, surf: 'stone' });
    bx(M.stone, -1.7, 1.7, 0.3, 0.46, -5.14, -4.66, 1.5);
    zones.push({ x0: -1.7, x1: 1.7, z0: -5.14, z1: -4.66, h: 0.46, surf: 'stone' });
    bx(M.woodFloor, -6.0, 9.97, 0.52, FL, -10.59, -5.22, 1.5, 'x');
    zones.push({ x0: -6.06, x1: 10.06, z0: -10.56, z1: -5.22, h: FL, surf: 'wood' });
    zones.push({ x0: -5.94, x1: -2.06, z0: -10.44, z1: -6.56, h: FL + 0.006, surf: 'paper' });
    zones.push({ x0: 2.06, x1: 5.94, z0: -10.44, z1: -6.56, h: FL + 0.006, surf: 'paper' });
    bx(M.black, -5.9, 9.9, 0.3, 0.52, -10.5, -5.55);
    bx(M.wood, -6.06, 10.06, 0.38, 0.52, -5.3, -5.22, 1.2, 'x');
    bx(M.wood, -6.06, -5.98, 0.3, 0.52, -6.4, -5.3, 1.2, 'z'); // 마루 서쪽 마구리
    bx(M.jangpan, -5.94, -2.06, FL, FL + 0.006, -10.44, -6.56, 1.3);
    bx(M.jangpan, 2.06, 5.94, FL, FL + 0.006, -10.44, -6.56, 1.3);
    // 기둥 · 주춧돌
    for (const z of [-5.3, -6.5, -10.5]) for (const x of XS) {
      const y0 = z === -5.3 ? 0.42 : x <= -6 ? KF : FL;
      bx(M.wood, x - 0.1, x + 0.1, y0, 3.0, z - 0.1, z + 0.1, 1.2, 'y');
      if (z === -5.3) { B.add(HG.rockGeo(300 + x, 0.2, 0.09, 0.2), M.rock, x, 0.36, z); cc(x, z, 0.15); }
    }
    // 도리 · 보
    for (const z of [-5.3, -6.5, -10.5]) bx(M.wood, -10.25, 10.25, 2.9, 3.12, z - 0.09, z + 0.09, 1.2, 'x');
    for (const x of XS) {
      bx(M.wood, x - 0.11, x + 0.11, 2.92, 3.2, -10.7, -5.1, 1.2, 'z');
      bx(M.wood, x - 0.08, x + 0.08, 3.2, RY + 2.4 - 0.42, ZC - 0.08, ZC + 0.08, 1.2, 'y');
    }
    bx(M.wood, -11.0, 11.0, RY + 2.4 - 0.44, RY + 2.4 - 0.24, ZC - 0.1, ZC + 0.1, 1.2, 'x');
    // 벽
    bx(M.plaster, -10, -6, KF - 0.07, 2.9,-10.56, -10.44, 2.2);
    bx(M.plaster, -6, -2, FL - 0.07, 2.9,-10.56, -10.44, 2.2); bx(M.plaster, 2, 10, FL - 0.07, 2.9,-10.56, -10.44, 2.2);
    bx(M.woodPlank, -2, 2, FL - 0.07, 2.9,-10.54, -10.47, 1.5, 'y');
    for (const sx of [-1, 1]) { // 대청 뒤 판문 (틀끼리 면이 겹치지 않게 맞춤)
      bx(M.wood, sx * 1.0 - 0.6, sx * 1.0 + 0.6, 2.25, 2.33, -10.47, -10.43, 1.2, 'x');
      bx(M.wood, sx * 1.0 - 0.6, sx * 1.0 + 0.6, 0.9, 0.98, -10.47, -10.43, 1.2, 'x');
      bx(M.wood, sx * 1.0 - 0.6, sx * 1.0 - 0.53, 0.98, 2.25, -10.47, -10.432, 1.2, 'y');
      bx(M.wood, sx * 1.0 + 0.53, sx * 1.0 + 0.6, 0.98, 2.25, -10.47, -10.432, 1.2, 'y');
      bx(M.wood, sx * 1.0 - 0.02, sx * 1.0 + 0.02, 0.98, 2.25, -10.47, -10.44, 1.2, 'y');
      B.add(new THREE.TorusGeometry(0.04, 0.008, 5, 12), M.iron, sx * 1.0 + 0.08, 1.6, -10.43);
    }
    cb(-10.1, 10.1, -10.62, -10.4);
    bx(M.plaster, -10.06, -9.94, KF - 0.07, 2.9,-10.5, -6.5, 2.2); bx(M.plaster, 9.94, 10.06, FL - 0.07, 2.9,-10.5, -6.5, 2.2);
    bx(M.plaster, -6.06, -5.94, KF - 0.07, 2.9,-10.5, -6.5, 2.2);
    cb(-10.12, -9.9, -10.5, -6.5); cb(9.9, 10.12, -10.5, -6.5);
    cb(-6.12, -5.9, -10.5, -6.5);
    // 창호 재질
    const hanjiTex = HG.T.hanji.map, insideTex = HG.drawHanjiInside();
    W.hanjiLit = new THREE.MeshStandardMaterial({ map: hanjiTex, normalMap: HG.T.hanji.normalMap, roughness: 0.9, side: THREE.DoubleSide, emissive: 0xff8a3a, emissiveMap: hanjiTex, emissiveIntensity: 0.9 });
    W.insideLit = new THREE.MeshStandardMaterial({ map: insideTex, roughness: 0.9, emissive: 0x7088c0, emissiveMap: insideTex, emissiveIntensity: 0.0 });
    const insideDark = new THREE.MeshStandardMaterial({ map: insideTex, color: 0xa1988a, roughness: 0.95, emissive: 0x7088c0, emissiveMap: insideTex, emissiveIntensity: 0.1 });
    // 방 앞벽과 띠살 창호 (안방 · 건넌방 · 작은방)
    for (const c of [-4, 4, 8]) {
      const lit = c === -4;
      // (벽은 창틀 바깥 가장자리에서 끝난다 — 벽 마구리와 창틀 면이 같은 평면에서 겹치면 깜박인다)
      bx(M.plaster, c - 2, c - 0.86, FL - 0.07, 2.9,-6.56, -6.44, 2.2); bx(M.plaster, c + 0.86, c + 2, FL - 0.07, 2.9,-6.56, -6.44, 2.2);
      bx(M.plaster, c - 0.86, c + 0.86, 2.47, 2.9, -6.56, -6.44, 2.2);
      bx(M.woodPlank, c - 0.86, c + 0.86, FL, 0.84, -6.55, -6.45, 1.2, 'y');
      bx(M.wood, c - 0.86, c + 0.86, 2.4, 2.47, -6.58, -6.42, 1.2, 'x'); bx(M.wood, c - 0.86, c + 0.86, 0.84, 0.9, -6.58, -6.42, 1.2, 'x');
      bx(M.wood, c - 0.86, c - 0.8, 0.9, 2.4, -6.58, -6.42, 1.2, 'y'); bx(M.wood, c + 0.8, c + 0.86, 0.9, 2.4, -6.58, -6.42, 1.2, 'y');
      HG.latticeLeaf(B, 0.8, 1.48, c - 0.4, 1.66, -6.5, 0, lit ? W.hanjiLit : M.hanji, lit ? W.insideLit : insideDark);
      HG.latticeLeaf(B, 0.8, 1.48, c + 0.4, 1.66, -6.5, 0, lit ? W.hanjiLit : M.hanji, lit ? W.insideLit : insideDark);
      cb(c - 2, c + 2, -6.6, -6.4);
      bx(M.hanjiWall, c - 1.94, c + 1.94, 2.84, 2.88, -10.44, -6.56, 1.2);   // 천장
      bx(M.wood, c - 2, c + 2, FL, FL + 0.12, -10.58, -10.42, 1.2, 'x');     // 하인방
    }
    // 부엌 (서쪽 끝 칸): 흙바닥, 판문이 열린 채
    {
      const c = -8;
      bx(M.plaster, -10, -8.88, KF - 0.07, 2.9,-6.56, -6.44, 2.2); bx(M.plaster, -7.12, -6, KF - 0.07, 2.9,-6.56, -6.44, 2.2);
      bx(M.plaster, -8.88, -7.12, 2.34, 2.9, -6.56, -6.44, 2.2);
      bx(M.wood, -8.88, -7.12, 2.25, 2.34, -6.6, -6.4, 1.2, 'x');
      bx(M.wood, -8.88, -8.8, KF, 2.25, -6.6, -6.4, 1.2, 'y'); bx(M.wood, -7.2, -7.12, KF, 2.25, -6.6, -6.4, 1.2, 'y');
      bx(M.wood, -8.8, -7.2, KF, KF + 0.07, -6.58, -6.42, 1.2, 'x');
      cb(-10, -8.8, -6.6, -6.4); cb(-7.2, -6, -6.6, -6.4);
      for (const s of [-1, 1]) { // 안으로 열어젖힌 판문 두 짝
        // 문짝은 문설주에서 조금 띄워 안쪽에 단다 (문설주와 면이 겹쳐 깜박이지 않게)
        // 활짝 열어 안쪽 벽에 붙여 둔 문짝. 문설주 옆을 비워, 문짝 그림자가 문설주에 톱니 모양으로 걸리지 않게 한다
        const g = HG.box(0.74, 1.86, 0.04, 1.3, 'y'); g.translate(s * 0.39, 0, 0);
        B.add(g, M.woodPlank, c - s * 0.92, KF + 1.02, -6.635, 0, Math.PI + s * 0.05, 0);
        const bar = HG.box(0.66, 0.07, 0.025, 1.2, 'x'); bar.translate(s * 0.39, 0, 0.034); B.add(bar, M.wood, c - s * 0.92, KF + 0.55, -6.635, 0, Math.PI + s * 0.05, 0); B.add(bar, M.wood, c - s * 0.92, KF + 1.5, -6.635, 0, Math.PI + s * 0.05, 0);
      }
      bx(M.mud, -9.94, -6.06, KF, KF + 0.012, -10.44, -6.56, 2.6);                      // 흙바닥
      // 부뚜막과 가마솥
      bx(M.mud, -9.94, -7.1, KF, KF + 0.52, -10.44, -9.5, 2.2);
      const sotMat = new THREE.MeshStandardMaterial({ color: 0x55504a, roughness: 0.5, metalness: 0.15 });
      const emberMat = new THREE.MeshStandardMaterial({ color: 0x120805, roughness: 1, emissive: 0x4a1203, emissiveIntensity: 0.5 });
      const sot = [[0, 0.02], [0.2, 0.05], [0.3, 0.16], [0.33, 0.26], [0.36, 0.27], [0.36, 0.29], [0.3, 0.29]].map((p) => new THREE.Vector2(p[0], p[1]));
      const lidP = [[0.31, 0.29], [0.28, 0.33], [0.12, 0.38], [0.05, 0.39], [0.05, 0.43], [0, 0.43]].map((p) => new THREE.Vector2(p[0], p[1]));
      for (const sxp of [-9.2, -7.85]) {
        B.add(new THREE.LatheGeometry(sot, 22), sotMat, sxp, KF + 0.3, -9.97); B.add(new THREE.LatheGeometry(lidP, 22), sotMat, sxp, KF + 0.3, -9.97);
        // 아궁이: 돌로 두른 아가리 안쪽에 식어 가는 재의 불그레한 빛
        bx(emberMat, sxp - 0.17, sxp + 0.17, KF + 0.04, KF + 0.27, -9.515, -9.497);
        bx(M.stone, sxp - 0.24, sxp - 0.17, KF + 0.012, KF + 0.3, -9.53, -9.47, 0.8); bx(M.stone, sxp + 0.17, sxp + 0.24, KF + 0.012, KF + 0.3, -9.53, -9.47, 0.8); bx(M.stone, sxp - 0.24, sxp + 0.24, KF + 0.3, KF + 0.36, -9.535, -9.465, 0.8);
        for (let i = 0; i < 4; i++) B.add(HG.cyl(0.03, 0.035, 0.5, 6, 0.6), M.bark, sxp - 0.1 + i * 0.06, KF + 0.06, -9.35 + (i % 2) * 0.05, Math.PI / 2, 0.2 * (i - 1.5), 0);
      }
      cb(-9.94, -7.1, -10.44, -9.42);
      // 살강: 엎어 놓은 밥그릇 일곱 개
      bx(M.woodPale, -9.92, -9.62, KF + 1.25, KF + 1.28, -9.3, -7.1, 1.2, 'z');
      for (const pz of [-9.2, -8.2, -7.2]) bx(M.wood, -9.92, -9.64, KF + 1.1, KF + 1.25, pz - 0.02, pz + 0.02, 1, 'x');
      const bw = [[0, 0], [0.035, 0], [0.04, 0.008], [0.062, 0.045], [0.066, 0.07], [0.058, 0.07], [0.036, 0.018], [0, 0.018]].map((p) => new THREE.Vector2(p[0], p[1]));
      const bowlMat = new THREE.MeshStandardMaterial({ color: 0x8d897e, roughness: 0.62 }); W.noCast.push(bowlMat);   // 작은 그릇은 그림자를 드리우지 않는다 (가까운 등불에 각진 덩어리 그림자가 생겼다)
      for (let i = 0; i < 7; i++) B.add(new THREE.LatheGeometry(bw, 24), bowlMat, -9.77, KF + 1.35, -9.12 + i * 0.3, Math.PI, 0, 0);   // 사기 밥그릇 (놋그릇은 빛을 받아 스스로 빛나는 것처럼 보였다)
      proxy('bowls', -9.75, KF + 1.35, -8.2, 0.4, 0.35, 2.3);
      proxy('sot', -8.5, KF + 0.72, -9.97, 2.0, 0.5, 0.8);
      // 걸이대에 걸린 헛간 열쇠
      const key = new THREE.Group();
      const kr = new THREE.Mesh(new THREE.TorusGeometry(0.028, 0.006, 5, 12), M.brass), ks = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.11, 0.006), M.brass), kb = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.03, 0.006), M.brass);
      ks.position.y = -0.08; kb.position.set(0.012, -0.12, 0); key.add(kr, ks, kb); key.position.set(-6.16, KF + 1.4, -7.32); key.rotation.y = Math.PI / 2; scene.add(key); W.keyMesh = key;
      proxy('key', -6.2, KF + 1.36, -7.32, 0.25, 0.4, 0.3);
      addJar(-6.5, -7.2, 0.34, 0.8, KF); cc(-6.5, -7.2, 0.4);                                   // 물독
      B.add(new THREE.SphereGeometry(0.11, 12, 8, 0, 6.3, 1.57, 1.57), M.woodPale, -6.5, KF + 0.92, -7.2); // 바가지
      for (let i = 0; i < 16; i++) B.add(HG.cyl(0.035, 0.045, 0.6, 6, 0.6), M.bark, -6.45 + (i % 2) * 0.04, KF + 0.06 + Math.floor(i / 4) * 0.085, -10.2 + (i % 4) * 0.11, 0, 0, Math.PI / 2 + 0.03 * i); // 땔감
      cb(-6.9, -6.1, -10.4, -9.7);
      // 부엌 살림: 소쿠리 · 걸어 둔 조리와 바가지 · 도마 · 물동이 · 시렁
      const bask = [[0, 0], [0.16, 0.0], [0.24, 0.08], [0.27, 0.16], [0.25, 0.16], [0.22, 0.09], [0.15, 0.02], [0, 0.02]].map((p) => new THREE.Vector2(p[0], p[1]));
      for (let i = 0; i < 3; i++) B.add(new THREE.LatheGeometry(bask, 16), M.thatch, -9.3 + i * 0.02, KF + 0.02 + i * 0.07, -7.0, 0, i, 0);
      cc(-9.3, -7.0, 0.3);
      bx(M.wood, -6.12, -6.08, KF + 1.5, KF + 1.56, -9.4, -7.15, 1.2, 'z');                                 // 못을 박은 걸이대
      for (let i = 0; i < 4; i++) { const pz = -9.2 + i * 0.5; B.add(new THREE.SphereGeometry(0.1 + (i % 2) * 0.02, 12, 8, 0, 6.3, 1.57, 1.57), i % 2 ? M.woodPale : M.thatch, -6.2, KF + 1.36, pz, 0, 0, 1.4); B.add(HG.cyl(0.006, 0.006, 0.16, 4, 0.3), M.rope, -6.12, KF + 1.46, pz); }
      bx(M.woodPale, -8.75, -8.25, KF + 0.52, KF + 0.56, -9.9, -9.62, 1, 'x');                              // 도마
      B.add(HG.box(0.2, 0.004, 0.05, 1), M.iron, -8.45, KF + 0.565, -9.74, 0, 0.5, 0); B.add(HG.cyl(0.012, 0.014, 0.1, 6, 1), M.wood, -8.58, KF + 0.57, -9.8, Math.PI / 2, 0.5, 0);
      addJar(-9.55, -7.75, 0.2, 0.42, KF);
      bx(M.woodPale, -9.3, -6.1, 2.2, 2.24, -10.3, -10.0, 1.2, 'x');                                        // 시렁
      for (let i = 0; i < 4; i++) addJar(-8.9 + i * 0.75, -10.15, 0.13 + (i % 2) * 0.03, 0.26 + (i % 2) * 0.06, 2.24);
      zones.push({ x0: -9.94, x1: -6.06, z0: -10.44, z1: -6.44, h: KF + 0.01, surf: 'dirt' });
    }
    // 문이 난 칸막이벽 (방과 방, 방과 대청 사이)
    function partition(wx) {
      bx(M.plaster, wx - 0.06, wx + 0.06, FL - 0.07, 2.9,-10.5, -8.76, 2.2); bx(M.plaster, wx - 0.06, wx + 0.06, FL - 0.07, 2.9,-7.64, -6.5, 2.2);
      bx(M.plaster, wx - 0.06, wx + 0.06, 2.52, 2.9, -8.76, -7.64, 2.2);
      bx(M.wood, wx - 0.08, wx + 0.08, 2.45, 2.52, -8.76, -7.64, 1.2, 'z');
      bx(M.wood, wx - 0.08, wx + 0.08, FL, 2.45, -8.76, -8.7, 1.2, 'y'); bx(M.wood, wx - 0.08, wx + 0.08, FL, 2.45, -7.7, -7.64, 1.2, 'y');
      cb(wx - 0.1, wx + 0.1, -10.5, -8.7); cb(wx - 0.1, wx + 0.1, -7.7, -6.5);
    }
    // 방 안쪽의 귀기둥 · 굽도리 · 중방 · 반자틀. doorW/doorE: 서쪽/동쪽 벽에 문이 있는가
    function roomTrim(c, doorW, doorE) {
      const d = 0.03, pw = 0.09, xw = c - 1.94, xe = c + 1.94;
      for (const px of [xw + pw / 2, xe - pw / 2]) for (const pz of [-10.44 + pw / 2, -6.56 - pw / 2]) bx(M.wood, px - pw / 2, px + pw / 2, FL + 0.006, 2.84, pz - pw / 2, pz + pw / 2, 1.2, 'y');
      const xa = xw + pw, xb = xe - pw, za = -10.44 + pw, zb = -6.56 - pw;
      [[FL + 0.006, FL + 0.1, 0], [FL + 1.02, FL + 1.1, 1], [2.75, 2.808, 2]].forEach(([y0, y1, kind]) => {
        const top = kind === 2;
        const side = (x0, x1, door) => { if (top || !door) bx(M.wood, x0, x1, y0, y1, za, zb, 1.2, 'z'); else { bx(M.wood, x0, x1, y0, y1, za, -8.76, 1.2, 'z'); bx(M.wood, x0, x1, y0, y1, -7.64, zb, 1.2, 'z'); } };
        bx(M.wood, xa, xb, y0, y1, -10.44, -10.44 + d, 1.2, 'x');
        side(xw, xw + d, doorW); side(xe - d, xe, doorE);
        if (top) bx(M.wood, xa, xb, y0, y1, -6.56 - d, -6.56, 1.2, 'x');
        else { bx(M.wood, xa, c - 0.86, y0, y1, -6.56 - d, -6.56, 1.2, 'x'); bx(M.wood, c + 0.86, xb, y0, y1, -6.56 - d, -6.56, 1.2, 'x'); }
      });
      // 반자돌림대: 천장 격자의 끝이 벽에서 테두리로 마감된다
      bx(M.wood, xw + d, xe - d, 2.806, 2.84, -10.44 + d, -10.44 + d + 0.05, 1.2, 'x'); bx(M.wood, xw + d, xe - d, 2.806, 2.84, -6.56 - d - 0.05, -6.56 - d, 1.2, 'x');
      bx(M.wood, xw + d, xw + d + 0.05, 2.804, 2.84, -10.44 + d + 0.05, -6.56 - d - 0.05, 1.2, 'z'); bx(M.wood, xe - d - 0.05, xe - d, 2.804, 2.84, -10.44 + d + 0.05, -6.56 - d - 0.05, 1.2, 'z');
      // 반자틀: 두 방향의 살을 높이를 달리해 면이 겹치지 않게 한다
      for (let i = 1; i < 6; i++) bx(M.wood, xw + i * 0.647 - 0.015, xw + i * 0.647 + 0.015, 2.82, 2.84, -10.44 + d + 0.05, -6.56 - d - 0.05, 1.2, 'z');
      for (let i = 1; i < 6; i++) bx(M.wood, xw + d + 0.05, xe - d - 0.05, 2.812, 2.84, -10.44 + i * 0.647 - 0.012, -10.44 + i * 0.647 + 0.012, 1.2, 'x');
    }
    // 대청 쪽에서 본 칸막이벽의 띠장 (기둥에서 문틀까지)
    function hallRails(xf, dir) {
      const d = 0.03, a = Math.min(xf, xf + dir * d), b = Math.max(xf, xf + dir * d);
      [[FL + 0.006, FL + 0.1, 0], [FL + 1.02, FL + 1.1, 1], [2.75, 2.84, 2]].forEach(([y0, y1, kind]) => {
        if (kind === 2) bx(M.wood, a, b, y0, y1, -10.4, -6.6, 1.2, 'z'); else { bx(M.wood, a, b, y0, y1, -10.4, -8.76, 1.2, 'z'); bx(M.wood, a, b, y0, y1, -7.64, -6.6, 1.2, 'z'); }
      });
    }
    partition(-2); partition(2); partition(6);
    roomTrim(-4, false, true); roomTrim(4, true, true); roomTrim(8, true, false);
    hallRails(-1.94, 1); hallRails(1.94, -1);
    // 지붕 · 박공
    const woodD = M.wood.clone(); woodD.side = THREE.DoubleSide;
    function roofOn(ox, L, xs) {
      const rf = HG.roofGeo({ L: L, D: RD, H: 2.4, lift: 0.45, ridgeLift: 0.25, sp: 0.29, tubeR: 0.078, nt: 12, thick: 0.1, ridgeR: 0.17 });
      for (const k of ['top', 'tubes', 'ridge']) B.add(rf[k], M.tile, ox, RY, ZC);
      B.add(rf.under, M.plaster2, ox, RY, ZC); B.add(rf.rafters, M.wood, ox, RY, ZC);
      for (const x of xs) { // 박공벽
        const s = new THREE.Shape(), n = 16;
        s.moveTo(ZC - 2.6, 3.0);
        for (let i = 0; i <= n; i++) { const z = ZC - 2.6 + (5.2 * i) / n; s.lineTo(z, RY + rf.yAt(x - ox, Math.abs(z - ZC) / RD) - 0.11); }
        s.lineTo(ZC + 2.6, 3.0);
        const g = new THREE.ShapeGeometry(s); g.rotateY(-Math.PI / 2); HG.scaleUV(g, 1 / 2.2); B.add(g, M.plaster2, x, 0, 0);
      }
      for (const x of [ox - L / 2 - 0.02, ox + L / 2 + 0.02]) { // 박공널
        const s = new THREE.Shape(), n = 16, pts = [];
        for (let i = 0; i <= n; i++) { const z = ZC - RD + (2 * RD * i) / n; pts.push([z, RY + rf.yAt(x - ox, Math.abs(z - ZC) / RD)]); }
        s.moveTo(pts[0][0], pts[0][1] + 0.02); pts.forEach((p) => s.lineTo(p[0], p[1] + 0.02));
        for (let i = n; i >= 0; i--) s.lineTo(pts[i][0], pts[i][1] - 0.3);
        const g = new THREE.ShapeGeometry(s); g.rotateY(-Math.PI / 2); HG.scaleUV(g, 1 / 1.2); B.add(g, woodD, x, 0, 0);
      }
    }
    roofOn(0, 22.6, XS);

    // ================= 사랑채 (동쪽 사랑마당: 사랑방 · 사랑대청 · 작은사랑) =================
    {
      const OX = GX, SX = [OX - 6, OX - 2, OX + 2, OX + 6];
      bx(M.stone, OX - 7, OX + 7, 0, 0.3, -11.4, -4.4, 1.5);
      zones.push({ x0: OX - 7, x1: OX + 7, z0: -11.4, z1: -4.4, h: 0.3, surf: 'stone' });
      bx(M.stone, OX - 0.85, OX + 0.85, 0.3, 0.46, -5.14, -4.66, 1.5);
      zones.push({ x0: OX - 0.85, x1: OX + 0.85, z0: -5.14, z1: -4.66, h: 0.46, surf: 'stone' });
      bx(M.woodFloor, OX - 5.97, OX + 5.97, 0.52, FL, -10.59, -5.22, 1.5, 'x');
      zones.push({ x0: OX - 6.06, x1: OX + 6.06, z0: -10.56, z1: -5.22, h: FL, surf: 'wood' });
      bx(M.black, OX - 5.9, OX + 5.9, 0.3, 0.52, -10.5, -5.55);
      bx(M.wood, OX - 6.06, OX + 6.06, 0.38, 0.52, -5.3, -5.24, 1.2, 'x');
      for (const c of [OX - 4, OX + 4]) { bx(M.jangpan, c - 1.94, c + 1.94, FL, FL + 0.006, -10.44, -6.56, 1.3); zones.push({ x0: c - 1.94, x1: c + 1.94, z0: -10.44, z1: -6.56, h: FL + 0.006, surf: 'paper' }); }
      for (const z of [-5.3, -6.5, -10.5]) for (const x of SX) {
        bx(M.wood, x - 0.1, x + 0.1, z === -5.3 ? 0.42 : FL, 3.0, z - 0.1, z + 0.1, 1.2, 'y');
        if (z === -5.3) { B.add(HG.rockGeo(340 + x, 0.2, 0.09, 0.2), M.rock, x, 0.36, z); cc(x, z, 0.15); }
      }
      for (const z of [-5.3, -6.5, -10.5]) bx(M.wood, OX - 6.25, OX + 6.25, 2.9, 3.12, z - 0.09, z + 0.09, 1.2, 'x');
      for (const x of SX) { bx(M.wood, x - 0.11, x + 0.11, 2.92, 3.2, -10.7, -5.1, 1.2, 'z'); bx(M.wood, x - 0.08, x + 0.08, 3.2, RY + 2.4 - 0.42, ZC - 0.08, ZC + 0.08, 1.2, 'y'); }
      bx(M.wood, OX - 7.0, OX + 7.0, RY + 2.4 - 0.44, RY + 2.4 - 0.24, ZC - 0.1, ZC + 0.1, 1.2, 'x');
      bx(M.plaster, OX - 6, OX - 2, FL - 0.07, 2.9,-10.56, -10.44, 2.2); bx(M.plaster, OX + 2, OX + 6, FL - 0.07, 2.9,-10.56, -10.44, 2.2);
      bx(M.woodPlank, OX - 2, OX + 2, FL - 0.07, 2.9,-10.54, -10.47, 1.5, 'y');
      cb(OX - 6.1, OX + 6.1, -10.62, -10.4);
      bx(M.plaster, OX - 6.06, OX - 5.94, FL - 0.07, 2.9,-10.5, -6.5, 2.2); bx(M.plaster, OX + 5.94, OX + 6.06, FL - 0.07, 2.9,-10.5, -6.5, 2.2);
      cb(OX - 6.12, OX - 5.9, -10.5, -6.5); cb(OX + 5.9, OX + 6.12, -10.5, -6.5);
      for (const c of [OX - 4, OX + 4]) {
        bx(M.plaster, c - 2, c - 0.86, FL - 0.07, 2.9,-6.56, -6.44, 2.2); bx(M.plaster, c + 0.86, c + 2, FL - 0.07, 2.9,-6.56, -6.44, 2.2);
        bx(M.plaster, c - 0.86, c + 0.86, 2.47, 2.9, -6.56, -6.44, 2.2);
        bx(M.woodPlank, c - 0.86, c + 0.86, FL, 0.84, -6.55, -6.45, 1.2, 'y');
        bx(M.wood, c - 0.86, c + 0.86, 2.4, 2.47, -6.58, -6.42, 1.2, 'x'); bx(M.wood, c - 0.86, c + 0.86, 0.84, 0.9, -6.58, -6.42, 1.2, 'x');
        bx(M.wood, c - 0.86, c - 0.8, 0.9, 2.4, -6.58, -6.42, 1.2, 'y'); bx(M.wood, c + 0.8, c + 0.86, 0.9, 2.4, -6.58, -6.42, 1.2, 'y');
        HG.latticeLeaf(B, 0.8, 1.48, c - 0.4, 1.66, -6.5, 0, M.hanji, insideDark); HG.latticeLeaf(B, 0.8, 1.48, c + 0.4, 1.66, -6.5, 0, M.hanji, insideDark);
        cb(c - 2, c + 2, -6.6, -6.4);
        bx(M.hanjiWall, c - 1.94, c + 1.94, 2.84, 2.88, -10.44, -6.56, 1.2);
        bx(M.wood, c - 2, c + 2, FL, FL + 0.12, -10.58, -10.45, 1.2, 'x');
      }
      partition(OX - 2); partition(OX + 2);
      roomTrim(OX - 4, false, true); roomTrim(OX + 4, true, false);
      hallRails(OX - 1.94, 1); hallRails(OX + 1.94, -1);
      roofOn(OX, 14.6, SX);
      // --- 사랑대청: 현판 · 바둑판 · 화로 ---
      bx(M.wood, OX - 0.9, OX + 0.9, 2.3, 2.75, -10.47, -10.44, 1.2, 'x');
      { // 현판 「守拙齋」
        const hc = document.createElement('canvas'); hc.width = 512; hc.height = 128; const hx2 = hc.getContext('2d');
        hx2.fillStyle = '#15100b'; hx2.fillRect(0, 0, 512, 128); hx2.strokeStyle = '#5a4526'; hx2.lineWidth = 6; hx2.strokeRect(6, 6, 500, 116);
        hx2.fillStyle = '#c9b88a'; hx2.font = 'bold 84px "Batang","Gungsuh","Malgun Gothic",serif'; hx2.textAlign = 'center'; hx2.textBaseline = 'middle';
        ['守', '拙', '齋'].forEach((ch, i) => hx2.fillText(ch, 400 - i * 144, 66));   // 오른쪽에서 왼쪽으로
        const ht = new THREE.CanvasTexture(hc); ht.colorSpace = THREE.SRGBColorSpace;
        const hm = new THREE.Mesh(new THREE.PlaneGeometry(1.62, 0.36), new THREE.MeshStandardMaterial({ map: ht, roughness: 0.7 })); hm.position.set(OX, 2.525, -10.435); scene.add(hm);
        proxy('hyeonpan', OX, 2.35, -10.15, 1.9, 0.9, 0.6);   // 높이 걸려 있어 손이 닿는 범위를 넉넉히 잡는다
      }
      proxy('baduk', OX - 0.95, FL + 0.3, -8.35, 0.6, 0.3, 0.6);
      // 댓돌 위의 신: 가죽신 한 켤레와 짚신 한 켤레
      {
        const leather = new THREE.MeshStandardMaterial({ color: 0x241a13, roughness: 0.55 }), insole = new THREE.MeshStandardMaterial({ color: 0x6a5a44, roughness: 0.95 });
        for (let i = 0; i < 2; i++) for (const s of [-0.065, 0.065]) {
          const mat = i ? M.thatch : leather, X = OX - 0.3 + i * 0.6 + s, Z = -4.9 + i * 0.03, ry = 0.06 * (i ? 1 : -1) + s * 0.8;
          const hull = new THREE.SphereGeometry(1, 16, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2); hull.scale(0.047, 0.05, 0.128); hull.translate(0, 0.05, 0);   // 운두
          const toe = new THREE.SphereGeometry(1, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2); toe.scale(0.046, 0.034, 0.062); toe.translate(0, 0.05, -0.066);       // 신코
          const heel = new THREE.SphereGeometry(1, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2); heel.scale(0.04, 0.016, 0.03); heel.translate(0, 0.05, 0.098);       // 뒤축
          const sole = new THREE.CircleGeometry(1, 18); sole.rotateX(-Math.PI / 2); sole.scale(0.04, 1, 0.115); sole.translate(0, 0.022, 0);
          B.add(hull, mat, X, 0.46, Z, 0, ry, 0); B.add(toe, mat, X, 0.46, Z, 0, ry, 0); B.add(heel, mat, X, 0.46, Z, 0, ry, 0); B.add(sole, insole, X, 0.46, Z, 0, ry, 0);
        }
      }
      proxy('shoes', OX, 0.6, -4.9, 1.4, 0.3, 0.5);
      // 말구유와 말뚝 (말은 없다)
      bx(M.woodPale, 30.9, 32.3, 0.32, 0.36, -1.6, -0.6, 1.2, 'z'); bx(M.woodPale, 30.9, 30.94, 0.36, 0.66, -1.6, -0.6, 1.2, 'z'); bx(M.woodPale, 32.26, 32.3, 0.36, 0.66, -1.6, -0.6, 1.2, 'z');
      bx(M.woodPale, 30.94, 32.26, 0.36, 0.66, -1.6, -1.56, 1.2, 'x'); bx(M.woodPale, 30.94, 32.26, 0.36, 0.66, -0.64, -0.6, 1.2, 'x');
      for (const [px, pz] of [[31.0, -1.5], [32.2, -1.5], [31.0, -0.7], [32.2, -0.7]]) bx(M.wood, px - 0.04, px + 0.04, 0, 0.32, pz - 0.04, pz + 0.04, 1, 'y');
      bx(M.thatch, 30.96, 32.24, 0.362, 0.5, -1.54, -0.66, 0.5);                                              // 먹다 남은 여물
      B.add(HG.cyl(0.05, 0.06, 1.3, 8, 1), M.wood, 30.2, 0.65, -1.1); B.add(new THREE.TorusGeometry(0.05, 0.008, 5, 12), M.iron, 30.2, 1.1, -1.03);
      B.add(HG.cyl(0.012, 0.012, 0.9, 5, 0.3), M.rope, 30.2, 0.62, -0.96, 0.18, 0, 0);                        // 끊긴 고삐
      cb(30.86, 32.34, -1.64, -0.56); cc(30.2, -1.1, 0.12);
      proxy('trough', 31.4, 0.6, -1.1, 1.8, 0.8, 1.3);
      bx(M.woodPale, OX - 1.2, OX - 0.7, FL, FL + 0.22, -8.6, -8.1, 1, 'x');
      for (let i = 0; i < 9; i++) B.add(new THREE.SphereGeometry(0.014, 8, 5), i % 2 ? M.white : M.black, OX - 1.1 + (i % 3) * 0.14, FL + 0.228, -8.5 + Math.floor(i / 3) * 0.13);
      cb(OX - 1.22, OX - 0.68, -8.62, -8.08);
      const hw = [[0, 0], [0.16, 0], [0.2, 0.06], [0.21, 0.2], [0.19, 0.2], [0.17, 0.07], [0, 0.07]].map((p) => new THREE.Vector2(p[0], p[1]));
      B.add(new THREE.LatheGeometry(hw, 16), M.bronze, OX + 1.0, FL, -9.4); cc(OX + 1.0, -9.4, 0.26);
      // --- 사랑방 (진사의 방): 서안과 일기 · 문갑 · 책 · 갓 ---
      {
        const c = OX - 4;
        bx(M.wood, c - 0.3, c + 0.42, FL + 0.25, FL + 0.28, -9.72, -9.36, 1, 'x');
        bx(M.wood, c - 0.27, c - 0.24, FL + 0.006, FL + 0.25, -9.7, -9.38, 1, 'y'); bx(M.wood, c + 0.36, c + 0.39, FL + 0.006, FL + 0.25, -9.7, -9.38, 1, 'y');
        bx(M.black, c + 0.22, c + 0.35, FL + 0.28, FL + 0.305, -9.62, -9.5);
        B.add(new THREE.CylinderGeometry(0.006, 0.008, 0.2, 6), M.wood, c + 0.16, FL + 0.288, -9.5, Math.PI / 2, 0.4, 0);
        { const g = new THREE.PlaneGeometry(0.21, 0.27); g.rotateX(-Math.PI / 2); B.add(g, M.letter, c - 0.04, FL + 0.284, -9.54, 0, 0.18, 0); }
        proxy('note1', c + 0.02, FL + 0.35, -9.54, 0.7, 0.3, 0.45);
        cb(c - 0.32, c + 0.44, -9.74, -9.34);
        bx(M.fabric, c - 0.35, c + 0.45, FL + 0.006, FL + 0.05, -9.2, -8.5, 1);                               // 보료
        bx(M.wood, c - 1.84, c - 0.5, FL + 0.006, FL + 0.36, -10.38, -10.05, 1.3, 'x');                        // 문갑
        for (let i = 0; i < 4; i++) bx(M.brass, c - 1.72 + i * 0.33, c - 1.66 + i * 0.33, FL + 0.16, FL + 0.22, -10.05, -10.044);
        cb(c - 1.86, c - 0.48, -10.4, -10.03);
        for (let i = 0; i < 9; i++) bx(i % 2 ? M.hanjiWall : M.letter2, c - 1.7 + (i % 3) * 0.36, c - 1.48 + (i % 3) * 0.36, FL + 0.36 + Math.floor(i / 3) * 0.024, FL + 0.382 + Math.floor(i / 3) * 0.024, -10.33 + (i % 2) * 0.02, -10.1 + (i % 2) * 0.02, 0.5); // 책 더미
        const gat = [[0, 0.1], [0.07, 0.1], [0.075, 0.0], [0.2, -0.012], [0.205, 0.0], [0.08, 0.012]].map((p) => new THREE.Vector2(p[0], p[1]));
        B.add(new THREE.LatheGeometry(gat, 20), M.black, c + 1.84, 1.9, -9.2, 0, 0, Math.PI / 2);            // 벽에 걸린 갓
        B.add(new THREE.CylinderGeometry(0.008, 0.008, 0.08, 5), M.wood, c + 1.9, 1.98, -9.2, 0, 0, Math.PI / 2);
      }
      // --- 작은사랑 (서방님의 방): 이불 · 책상 · 쓰다 만 글 ---
      {
        const c = OX + 4;
        bx(M.fabric, c + 0.3, c + 1.3, FL + 0.006, FL + 0.06, -9.7, -7.8, 1);
        bx(M.quiltBlue, c + 0.33, c + 1.27, FL + 0.06, FL + 0.1, -9.3, -7.85, 1);
        B.add(HG.cyl(0.085, 0.085, 0.5, 12, 1), M.fabric, c + 0.8, FL + 0.14, -9.5, 0, 0, Math.PI / 2);
        bx(M.wood, c - 1.75, c - 1.05, FL + 0.25, FL + 0.28, -10.2, -9.8, 1, 'x');   // (서안은 문짝이 열리며 쓸고 지나가는 자리에서 멀찍이, 방 안쪽 구석 벽 앞에 둔다)
        bx(M.wood, c - 1.72, c - 1.69, FL + 0.006, FL + 0.25, -10.18, -9.82, 1, 'y'); bx(M.wood, c - 1.11, c - 1.08, FL + 0.006, FL + 0.25, -10.18, -9.82, 1, 'y');
        { const g = new THREE.PlaneGeometry(0.21, 0.27); g.rotateX(-Math.PI / 2); B.add(g, M.letter2, c - 1.4, FL + 0.284, -10.0, 0, -0.3, 0); }
        B.add(new THREE.CylinderGeometry(0.006, 0.008, 0.2, 6), M.wood, c - 1.17, FL + 0.288, -9.92, Math.PI / 2, 1.1, 0);
        proxy('note3', c - 1.4, FL + 0.35, -10.0, 0.7, 0.3, 0.45);
        cb(c - 1.77, c - 1.03, -10.22, -9.78);
        // 사방탁자: 층널마다 눕혀 쌓은 책 더미 (두께가 있는 책)
        for (const px of [c - 0.6, c + 1.76]) for (const pz of [-10.385, -10.05]) bx(M.wood, px, px + 0.04, FL + 0.006, FL + 1.34, pz, pz + 0.04, 1, 'y');
        for (let j = 0; j < 4; j++) bx(M.wood, c - 0.62, c + 1.82, FL + 0.08 + j * 0.42, FL + 0.105 + j * 0.42, -10.4, -10.0, 1.2, 'x');
        for (let j = 0; j < 3; j++) for (let i = 0; i < 4; i++) {
          const nb = 2 + ((i * 7 + j * 3) % 4), x0 = c - 0.5 + i * 0.56 + (j % 2) * 0.06;
          for (let k = 0; k < nb; k++) bx(k % 2 ? M.hanjiWall : M.woodPale, x0 + (k % 3) * 0.008, x0 + 0.3 + (k % 3) * 0.008, FL + 0.106 + j * 0.42 + k * 0.034, FL + 0.136 + j * 0.42 + k * 0.034, -10.33 + (k % 2) * 0.012, -10.1 + (k % 2) * 0.012, 0.4);
        }
        cb(c - 0.64, c + 1.84, -10.42, -9.98);
      }
    }

    // ---- 대청 소품 ----
    // (진사의 일기는 사랑채 사랑방으로 옮겼다. 안채 대청에는 정화수를 올린 소반)
    B.add(new THREE.CylinderGeometry(0.23, 0.23, 0.02, 12), M.wood, 0.7, FL + 0.25, -9.5);
    for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2 + 0.78; bx(M.wood, 0.7 + Math.cos(a) * 0.17 - 0.012, 0.7 + Math.cos(a) * 0.17 + 0.012, FL, FL + 0.24, -9.5 + Math.sin(a) * 0.17 - 0.012, -9.5 + Math.sin(a) * 0.17 + 0.012, 1, 'y'); }
    { const bwl = [[0, 0], [0.04, 0], [0.045, 0.01], [0.07, 0.05], [0.075, 0.075], [0.066, 0.075], [0.04, 0.02], [0, 0.02]].map((p) => new THREE.Vector2(p[0], p[1])); B.add(new THREE.LatheGeometry(bwl, 14), M.white, 0.7, FL + 0.26, -9.5); }
    cc(0.7, -9.5, 0.26);
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
      B.add(HG.rockGeo(1700, 0.31, 0.085, 0.13), M.rock, 4.75, FL + 0.075, -7.3);
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
      B.add(new THREE.CylinderGeometry(0.018, 0.018, 1.5, 8), M.wood, 5.66, 2.3, -9.6, Math.PI / 2, 0, 0);
      for (const pz of [-10.25, -8.95]) B.add(HG.cyl(0.006, 0.006, 0.5, 5, 0.3), M.rope, 5.66, 2.55, pz);
      const cm = HG.windify(M.fabric.clone(), 0.03);
      const robe = new THREE.Group();
      // 횃대에 걸쳐 접어 넌 옷: 앞자락 · 뒷자락 · 늘어진 소매 (겹이 져서 두께가 보인다)
      const mkc = (w, h, seed, fold, x, y, z, rz) => { const m = new THREE.Mesh(HG.clothGeo(w, h, 14, 16, seed, fold), cm); m.position.set(x, y, z); m.rotation.z = rz || 0; robe.add(m); return m; };
      mkc(0.66, 1.18, 61, 0.055, 0, 0.02, 0.035); mkc(0.62, 0.8, 62, 0.05, 0.02, 0.02, -0.04);
      mkc(0.27, 0.86, 63, 0.04, -0.44, 0.02, 0.03, -0.05); mkc(0.27, 0.8, 64, 0.04, 0.45, 0.02, 0.028, 0.06);
      mkc(0.035, 0.55, 65, 0.01, 0.06, -0.2, 0.075, 0.08); mkc(0.035, 0.45, 66, 0.01, 0.1, -0.2, 0.078, -0.06);
      robe.position.set(5.66, 2.31, -9.6); robe.rotation.y = -Math.PI / 2;
      robe.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
      scene.add(robe); W.robe = robe;
    }

    // ================= 헛간 =================
    {
      const x0 = -11.5, x1 = -7.5, z0 = -1.5, z1 = 3.5, h = 2.1;
      // (벽 · 기둥 · 문틀 · 밑돌은 서로 맞닿기만 하고, 같은 평면에서 면이 겹치지 않도록 길이와 높이를 조금씩 달리한다)
      bx(M.mud, x0 - 0.1, x0 + 0.1, 0, h, z0 + 0.1, z1 - 0.1, 2); bx(M.mud, x0 - 0.1, x1 + 0.1, 0, h + 0.004, z0 - 0.1, z0 + 0.1, 2); bx(M.mud, x0 - 0.1, x1 + 0.1, 0, h + 0.004, z1 - 0.1, z1 + 0.1, 2);
      bx(M.mud, x1 - 0.1, x1 + 0.1, 0, h, z0 + 0.1, 0.34, 2); bx(M.mud, x1 - 0.1, x1 + 0.1, 0, h, 1.66, z1 - 0.1, 2); bx(M.mud, x1 - 0.1, x1 + 0.1, 1.97, h, 0.5, 1.5, 2);
      for (const [px, pz] of [[x0, z0], [x1, z0], [x0, z1], [x1, z1], [x1, 0.42], [x1, 1.58], [x0, 1.0]]) bx(M.wood, px - 0.13, px + 0.13, pz === 0.42 || pz === 1.58 ? 0 : 0.224, h + 0.05, pz - 0.08, pz + 0.08, 1.2, 'y');
      bx(M.wood, x1 - 0.12, x1 + 0.12, 1.85, 1.97, 0.5, 1.5, 1.2, 'z');
      bx(M.stoneWall, x0 - 0.16, x1 + 0.16, 0, 0.224, z0 - 0.16, z0 + 0.16, 1.4); bx(M.stoneWall, x0 - 0.16, x1 + 0.16, 0, 0.224, z1 - 0.16, z1 + 0.16, 1.4);
      bx(M.stoneWall, x0 - 0.155, x0 + 0.155, 0, 0.22, z0 + 0.16, z1 - 0.16, 1.4); bx(M.stoneWall, x1 - 0.155, x1 + 0.155, 0, 0.22, z0 + 0.16, 0.335, 1.4); bx(M.stoneWall, x1 - 0.155, x1 + 0.155, 0, 0.22, 1.665, z1 - 0.16, 1.4);
      cb(x0 - 0.15, x0 + 0.15, z0, z1); cb(x0, x1, z0 - 0.15, z0 + 0.15); cb(x0, x1, z1 - 0.15, z1 + 0.15); cb(x1 - 0.15, x1 + 0.15, z0, 0.5); cb(x1 - 0.15, x1 + 0.15, 1.5, z1);
      zones.push({ x0: x0, x1: x1, z0: z0, z1: z1, h: 0.0, surf: 'dirt' });
      bx(M.mud, x0, x1 + 0.3, -0.05, 0.012, z0, z1, 2.6);
      for (const bz of [-0.4, 1.0, 2.4]) bx(M.wood, x0 + 0.06, x1 - 0.06, 1.98, 2.14, bz - 0.07, bz + 0.07, 1.2, 'x');
      bx(M.wood, x0 - 0.05, x1 + 0.05, h, h + 0.1, z0 - 0.12, z0 + 0.0, 1.2, 'x'); bx(M.wood, x0 - 0.05, x1 + 0.05, h, h + 0.1, z1, z1 + 0.12, 1.2, 'x');
      B.add(HG.thatchGeo(2.85, 3.35, 1.55, 9), M.thatch, -9.5, 2.02, 1.0);
      { const under = HG.thatchGeo(2.85, 3.35, 1.55, 9); under.scale(0.94, 1, 0.94); B.add(under, M.thatch, -9.5, 1.95, 1.0); } // 아래에서 올려다보면 두툼한 이엉 속겹이 보인다
      { // 처마 밑면: 벽 위에서 처마 끝까지 이엉 속을 메운다 (안에서 문 밖으로 올려다볼 때 처마가 얇은 판으로 보이지 않게)
        const pos = [], uv = [], idx = [], na = 96, e = 0.8, hx = 2.85 * 0.9, hz = 3.35 * 0.9, wx = 2.12, wz = 2.62;
        for (let i = 0; i <= na; i++) {
          const a = (i / na) * Math.PI * 2, c = Math.cos(a), s = Math.sin(a);
          const ox = hx * Math.sign(c) * Math.pow(Math.abs(c), e), oz = hz * Math.sign(s) * Math.pow(Math.abs(s), e);
          const k = Math.min(wx / Math.max(1e-6, Math.abs(ox)), wz / Math.max(1e-6, Math.abs(oz)), 1);   // 같은 방향의 벽 바깥면
          pos.push(ox * k, 2.0, oz * k, ox, 1.8, oz); uv.push(i / na * 24, 0, i / na * 24, 1);
          if (i < na) { const p = i * 2; idx.push(p, p + 1, p + 2, p + 1, p + 3, p + 2); }
        }
        const sofMat = M.thatch.clone(); sofMat.side = THREE.DoubleSide; sofMat.color.multiplyScalar(0.75);
        B.add(HG.makeGeo(pos, uv, idx), sofMat, -9.5, 0, 1.0);
      }
      { // 이엉을 눌러 맨 새끼줄 (고사새끼)
        const hx = 2.85, hz = 3.35, hh = 1.55, n = 2.5;
        const yD = (x, z) => { const f = Math.pow(Math.pow(Math.abs(x) / hx, n) + Math.pow(Math.abs(z) / hz, n), 1 / n); if (f >= 1) return -0.1; const b = Math.asin(Math.min(1, Math.pow(f, 1 / 0.85))); return hh * Math.pow(Math.cos(b), 1.25); };
        const rope = (pts) => B.add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 40, 0.022, 5, false), M.rope, -9.5, 2.02, 1.0);
        // 새끼줄은 지붕 면을 타고 넘어가 끝이 처마 밑으로 감겨 들어간다 (끝이 허공에 삐져나오지 않게)
        for (const x of [-2.0, -1.2, -0.4, 0.4, 1.2, 2.0]) {
          const zl = hz * Math.pow(Math.max(0, 1 - Math.pow(Math.abs(x) / hx, n)), 1 / n), p = [new THREE.Vector3(x, -0.36, -zl * 0.97)];
          for (let i = 0; i <= 24; i++) { const z = -zl * 0.94 + (zl * 1.88 * i) / 24; p.push(new THREE.Vector3(x, yD(x, z) + 0.035, z)); }
          p.push(new THREE.Vector3(x, -0.36, zl * 0.97)); rope(p);
        }
        for (const z of [-2.5, -1.5, -0.5, 0.5, 1.5, 2.5]) {
          const xl = hx * Math.pow(Math.max(0, 1 - Math.pow(Math.abs(z) / hz, n)), 1 / n), p = [new THREE.Vector3(-xl * 0.97, -0.36, z)];
          for (let i = 0; i <= 24; i++) { const x = -xl * 0.94 + (xl * 1.88 * i) / 24; p.push(new THREE.Vector3(x, yD(x, z) + 0.04, z)); }
          p.push(new THREE.Vector3(xl * 0.97, -0.36, z)); rope(p);
        }
      }
      // 천장: 서까래 위에 얹은 이엉 (벽 위가 뚫려 보이지 않도록)
      { const ceilMat = M.thatch.clone(); W.noRecv.push(ceilMat); bx(ceilMat, x0 - 0.05, x1 + 0.05, 2.2, 2.28, z0 - 0.05, z1 + 0.05, 0.7); }   // 낮은 천장에는 등불 그림자를 받지 않는다 (들보 옆에 톱니 그림자가 생겼다)
      const rafMat = M.bark.clone(); W.noRecv.push(rafMat);
      for (let i = 0; i < 9; i++) B.add(HG.cyl(0.045, 0.05, 4.2, 7, 1.2), rafMat, x0 + 0.25 + i * 0.44, 2.17, 1.0 + (i % 2 ? 0.05 : -0.05), Math.PI / 2, 0, 0);
      bx(M.mud, x0 + 0.14, x1 - 0.14, 2.104, 2.2, z0 + 0.1, z0 + 0.14, 3); bx(M.mud, x0 + 0.14, x1 - 0.14, 2.104, 2.2, z1 - 0.14, z1 - 0.1, 3);
      bx(M.mud, x0 + 0.1, x0 + 0.14, 2.1, 2.2, z0 + 0.1, z1 - 0.1, 3); bx(M.mud, x1 - 0.14, x1 - 0.1, 2.1, 2.2, z0 + 0.1, z1 - 0.1, 3);
      // 벽 안쪽 구조재: 샛기둥과 중방
      for (const px of [-10.5, -9.5, -8.5]) for (const pz of [z0 + 0.12, z1 - 0.12]) bx(M.wood, px - 0.05, px + 0.05, 0.23, 2.09, pz - 0.035, pz + 0.035, 1.2, 'y');
      for (const pz of [-0.3, 2.3]) bx(M.wood, x0 + 0.085, x0 + 0.155, 0.23, 2.09, pz - 0.05, pz + 0.05, 1.2, 'y');
      for (const pz of [-0.6, 2.5]) bx(M.wood, x1 - 0.155, x1 - 0.085, 0.23, 2.09, pz - 0.05, pz + 0.05, 1.2, 'y');
      bx(M.wood, x0 + 0.16, x1 - 0.16, 1.12, 1.2, z0 + 0.09, z0 + 0.15, 1.2, 'x'); bx(M.wood, x0 + 0.16, x1 - 0.16, 1.12, 1.2, z1 - 0.15, z1 - 0.09, 1.2, 'x');
      bx(M.wood, x0 + 0.09, x0 + 0.15, 1.115, 1.205, z0 + 0.1, z1 - 0.1, 1.2, 'z');
      bx(M.wood, x1 - 0.15, x1 - 0.09, 1.115, 1.205, z0 + 0.1, 0.34, 1.2, 'z'); bx(M.wood, x1 - 0.15, x1 - 0.09, 1.115, 1.205, 1.66, z1 - 0.1, 1.2, 'z');
      // 벽에 기대 세운 것들
      for (let i = 0; i < 5; i++) B.add(HG.cyl(0.018, 0.022, 1.7 + (i % 3) * 0.12, 6, 1), i % 2 ? M.woodPale : M.bark, -8.9 + i * 0.09, 0.85, 3.25 - i * 0.012, -0.16, 0, 0.03 * (i - 2));
      B.add(HG.box(0.5, 0.03, 0.4, 1, 'x'), M.woodPale, -9.3, 0.36, -1.2, 0.05, 0.3, 0); B.add(HG.cyl(0.2, 0.17, 0.34, 14, 1), M.woodPale, -9.3, 0.17, -1.2);
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
      for (let i = 0; i < 6; i++) { const l = 0.5 + rnd() * 0.7; if (i === 4) continue; B.add(HG.cyl(0.012, 0.012, l, 5, 0.3), M.rope, -10.6 + i * 0.5 + rnd() * 0.2, 1.98 - l / 2, [-0.4, 2.4][i % 2] + (rnd() - 0.5) * 0.1); }
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
    roomDoor('doorS', 6, -7.7, Math.PI / 2, Math.PI / 2 + 1.72);              // 건넌방 → 작은방 (건넌방 쪽 빈 벽으로 열린다 — 작은방 쪽으로 열면 문짝이 이부자리 위를 지나간다)
    roomDoor('doorSa', GX - 2, -7.7, Math.PI / 2, Math.PI / 2 + 1.72);        // 사랑대청 → 사랑방
    roomDoor('doorSb', GX + 2, -8.7, -Math.PI / 2, -Math.PI / 2 + 1.72);      // 사랑대청 → 작은사랑

    // ---- 작은방 (아이들 방): 건넌방 안쪽 문으로 드나든다 ----
    {
      zones.push({ x0: 6.06, x1: 9.94, z0: -10.44, z1: -6.56, h: FL + 0.006, surf: 'paper' });
      bx(M.jangpan, 6.06, 9.94, FL, FL + 0.006, -10.44, -6.56, 1.3);
      for (let i = 0; i < 3; i++) { // 나란히 깔린 작은 이불 셋
        const x0 = 6.5 + i * 1.05;
        bx(M.fabric, x0, x0 + 0.8, FL + 0.006, FL + 0.05, -9.9, -8.6, 1);
        bx(i === 1 ? M.quiltRed : M.quiltBlue, x0 + 0.03, x0 + 0.77, FL + 0.05, FL + 0.085, -9.55, -8.63, 1);
        B.add(HG.cyl(0.06, 0.06, 0.34, 10, 1), M.fabric, x0 + 0.4, FL + 0.11, -9.75, 0, 0, Math.PI / 2);
      }
      // 팽이 · 제기 · 굴렁쇠
      B.add(new THREE.ConeGeometry(0.035, 0.07, 10), M.woodPale, 8.6, FL + 0.03, -7.3, Math.PI - 1.3, 0, 0);
      B.add(new THREE.ConeGeometry(0.03, 0.06, 10), M.wood, 8.85, FL + 0.03, -7.1, Math.PI - 1.4, 1, 0);
      B.add(new THREE.TorusGeometry(0.2, 0.008, 5, 22), M.iron, 9.86, FL + 0.22, -7.6, 0, Math.PI / 2, 0);
      for (let i = 0; i < 5; i++) B.add(HG.box(0.012, 0.11, 0.003, 1), M.hanji, 9.2 + (i % 2) * 0.01, FL + 0.07, -7.0, 0.3 * (i - 2), i, 0.3 * (i - 2)); // 제기
      { const g = new THREE.PlaneGeometry(0.2, 0.26); g.rotateX(-Math.PI / 2); B.add(g, M.letter2, 7.7, FL + 0.012, -7.5, 0, 0.4, 0); }
      proxy('note4', 7.7, FL + 0.12, -7.5, 0.5, 0.3, 0.5);
      bx(M.wood, 8.6, 9.86, FL + 0.006, FL + 0.9, -10.38, -10.0, 1.3, 'y');                                  // 낮은 장
      for (let i = 0; i < 2; i++) bx(M.brass, 8.95 + i * 0.5, 9.01 + i * 0.5, FL + 0.4, FL + 0.5, -10.0, -9.994);
      cb(8.58, 9.88, -10.4, -9.98);
    }

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
      const JX = 0.85, JZ = 5.1; // 안채를 넓히면서 장독대를 우물 뒤편으로 옮김
      bx(M.stone, 8.2 + JX, 11.7 + JX, 0, 0.18, -8.9 + JZ, -5.7 + JZ, 1.3);
      const jars = [[8.75, -8.3, 0.4, 0.95], [9.65, -8.35, 0.36, 0.85], [10.5, -8.3, 0.42, 1.0], [11.25, -8.2, 0.3, 0.7], [8.7, -7.4, 0.3, 0.66], [9.45, -7.45, 0.27, 0.6], [10.2, -7.4, 0.3, 0.7], [11.0, -7.35, 0.25, 0.55],
        [8.6, -6.6, 0.2, 0.42], [9.2, -6.55, 0.22, 0.45], [9.85, -6.6, 0.18, 0.36], [10.5, -6.5, 0.2, 0.4], [11.1, -6.55, 0.16, 0.32]];
      jars.forEach((j) => addJar(j[0] + JX, j[1] + JZ, j[2], j[3], 0.18));
      cb(8.2 + JX, 11.7 + JX, -8.9 + JZ, -5.7 + JZ);
      // 절구
      const mp = [[0, 0], [0.2, 0], [0.16, 0.2], [0.24, 0.5], [0.2, 0.5], [0.1, 0.25], [0, 0.25]].map((q) => new THREE.Vector2(q[0], q[1]));
      B.add(new THREE.LatheGeometry(mp, 14), M.woodPale, 8.3, 0, -2.4);
      B.add(HG.cyl(0.03, 0.05, 0.9, 7, 1), M.woodPale, 8.35, 0.72, -2.4, 0.25, 0, 0.1);
      cc(8.3, -2.4, 0.3);
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
        // 줄에 걸쳐 넌 빨래: 앞뒤 두 겹
        const m = new THREE.Mesh(HG.clothGeo(w, h, 16, 18, Math.round(x * 10 + 99), 0.06), cm); m.position.z = 0.03; grp.add(m);
        const bk = new THREE.Mesh(HG.clothGeo(w * 0.97, h * 0.7, 16, 14, Math.round(x * 10 + 199), 0.055), cm); bk.position.set(0.015, 0, -0.035); grp.add(bk);
        if (sleeves) for (const s of [-1, 1]) {
          const sl = new THREE.Mesh(HG.clothGeo(0.27, 0.82, 6, 10, 7 + s, 0.04), cm);
          sl.position.set(s * (w / 2 + 0.11), 0, 0.02); sl.rotation.z = s * 0.06; grp.add(sl);
        }
        grp.position.set(x, 2.07, z); grp.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } }); scene.add(grp);
      };
      hang(-5.75, 0.8, 0.95); hang(-4.3, 0.62, 1.5, true); hang(-3.0, 0.95, 0.7);
    }

    // ================= 굿판 (하다 만 굿 자리와 모닥불) =================
    {
      const fx = 4.3, fz = 4.6;
      W.FIRE = { x: fx, z: fz };
      for (let i = 0; i < 10; i++) { const a = (i / 10) * 6.28 + rnd() * 0.2; B.add(HG.rockGeo(1500 + i, 0.11 + rnd() * 0.04, 0.08, 0.09), M.rock, fx + Math.cos(a) * 0.43, 0.05, fz + Math.sin(a) * 0.43, 0, -a, 0); }
      const char = new THREE.MeshStandardMaterial({ map: HG.T.bark.map, normalMap: HG.T.bark.normalMap, color: 0x2a2624, roughness: 1 });
      for (let i = 0; i < 7; i++) { const a = (i / 7) * 3.14 + rnd(); B.add(HG.cyl(0.035, 0.045, 0.6 + rnd() * 0.2, 7, 0.6), char, fx + Math.cos(a) * 0.05, 0.08 + i * 0.012, fz + Math.sin(a) * 0.05, Math.PI / 2 - 0.25 + rnd() * 0.2, a, 0); }
      for (let i = 0; i < 9; i++) { // 세워 쌓은 장작
        const a = (i / 9) * 6.28 + rnd() * 0.3, l = 0.62 + rnd() * 0.18, q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(-Math.cos(a) * 0.62, 0.78, -Math.sin(a) * 0.62).normalize());
        const e = new THREE.Euler().setFromQuaternion(q);
        B.add(HG.cyl(0.03, 0.045, l, 7, 0.6), i % 3 ? char : M.bark, fx + Math.cos(a) * 0.17, 0.27, fz + Math.sin(a) * 0.17, e.x, e.y, e.z);
      }
      for (let i = 0; i < 6; i++) B.add(HG.cyl(0.04, 0.05, 0.55, 7, 0.6), M.bark, fx + 0.95 + (i % 3) * 0.11, 0.05 + Math.floor(i / 3) * 0.09, fz - 0.75 + rnd() * 0.05, Math.PI / 2, 0.5, 0); // 곁에 쌓아 둔 장작
      // 잉걸불
      const ec = document.createElement('canvas'); ec.width = ec.height = 256; const ex = ec.getContext('2d');
      ex.fillStyle = '#0a0706'; ex.fillRect(0, 0, 256, 256);
      for (let i = 0; i < 420; i++) {
        const a = rnd() * 6.28, r = Math.pow(rnd(), 0.7) * 118, px = 128 + Math.cos(a) * r, py = 128 + Math.sin(a) * r, s = 3 + rnd() * 9, hot = 1 - r / 130;
        const g = ex.createRadialGradient(px, py, 0, px, py, s);
        g.addColorStop(0, `rgba(255,${(120 + 110 * hot * rnd()) | 0},${(20 + 60 * hot * rnd()) | 0},${0.35 + 0.6 * hot})`); g.addColorStop(1, 'rgba(120,20,0,0)');
        ex.fillStyle = g; ex.fillRect(px - s, py - s, s * 2, s * 2);
      }
      const et = new THREE.CanvasTexture(ec); et.colorSpace = THREE.SRGBColorSpace;
      const em = new THREE.MeshStandardMaterial({ map: et, emissiveMap: et, emissive: 0xffffff, emissiveIntensity: 1.6, roughness: 1 });
      const bed = new THREE.Mesh(new THREE.CircleGeometry(0.36, 20), em); bed.rotation.x = -Math.PI / 2; bed.position.set(fx, 0.045, fz); scene.add(bed);
      const mound = new THREE.Mesh(new THREE.SphereGeometry(0.2, 14, 8, 0, 6.3, 0, 1.3), em); mound.scale.set(1, 0.45, 1); mound.position.set(fx, 0.03, fz); scene.add(mound);
      W.fireMat = em;
      cc(fx, fz, 0.55);
      proxy('fire', fx, 0.45, fz, 1.3, 1.0, 1.3);
      // 멍석 · 제상
      const matG = HG.box(2.3, 0.025, 1.5, 0.9); B.add(matG, M.thatch, fx - 1.75, 0.016, fz + 0.5, 0, 0.18, 0);
      const tx = fx - 1.9, tz = fz + 0.45;
      B.add(HG.box(0.95, 0.03, 0.5, 1, 'x'), M.wood, tx, 0.33, tz, 0, 0.18, 0);
      for (const [lx, lz] of [[-0.4, -0.2], [0.4, -0.2], [-0.4, 0.2], [0.4, 0.2]]) { const e = new THREE.Vector3(lx, 0, lz).applyEuler(new THREE.Euler(0, 0.18, 0)); B.add(HG.box(0.04, 0.3, 0.04, 1, 'y'), M.wood, tx + e.x, 0.17, tz + e.z, 0, 0.18, 0); }
      const bw = [[0, 0], [0.04, 0], [0.045, 0.01], [0.07, 0.05], [0.075, 0.075], [0.066, 0.075], [0.04, 0.02], [0, 0.02]].map((p) => new THREE.Vector2(p[0], p[1]));
      [[-0.3, 0.05], [0, 0.08], [0.3, 0.04], [-0.15, -0.12], [0.18, -0.13]].forEach((p, i) => {
        const e = new THREE.Vector3(p[0], 0, p[1]).applyEuler(new THREE.Euler(0, 0.18, 0));
        B.add(new THREE.LatheGeometry(bw, 14), i % 2 ? M.brass : M.white, tx + e.x, 0.345, tz + e.z);
        if (i < 3) B.add(new THREE.SphereGeometry(0.058, 10, 7, 0, 6.3, 0, 1.5), M.white, tx + e.x, 0.4, tz + e.z);
      });
      for (const s of [-0.42, 0.42]) { const e = new THREE.Vector3(s, 0, 0.17).applyEuler(new THREE.Euler(0, 0.18, 0)); B.add(HG.cyl(0.012, 0.03, 0.2, 8, 1), M.brass, tx + e.x, 0.445, tz + e.z); B.add(HG.cyl(0.011, 0.012, 0.07, 8, 1), M.white, tx + e.x, 0.58, tz + e.z); }
      B.add(HG.box(0.5, 0.012, 0.012, 1), M.brass, tx + 0.1, 0.045, tz - 0.55, 0, 0.9, 0); // 신칼
      for (let i = 0; i < 7; i++) B.add(new THREE.SphereGeometry(0.014, 6, 5), M.brass, tx - 0.3 + (i % 3) * 0.03, 0.05, tz - 0.6 + Math.floor(i / 3) * 0.03); // 방울
      cb(tx - 0.55, tx + 0.55, tz - 0.35, tz + 0.35);
      // 신장대 (오방색 천)
      const px = fx - 0.9, pz = fz - 1.25;
      B.add(HG.cyl(0.018, 0.03, 2.7, 7, 1), M.woodPale, px, 1.35, pz, 0.03, 0, -0.03); cc(px, pz, 0.1);
      const fms = M.cloth.map((m) => { const c = HG.windify(m.clone(), 0.2); return c; });
      for (let i = 0; i < 5; i++) {
        const m = new THREE.Mesh(HG.clothGeo(0.13, 1.0 + (i % 3) * 0.25, 3, 12, 900 + i, 0.03), fms[i]);
        m.position.set(px + Math.cos(i * 1.26) * 0.03, 2.62 - i * 0.03, pz + Math.sin(i * 1.26) * 0.03); m.rotation.y = i * 1.26; m.castShadow = true; scene.add(m);
      }
    }

    // 짚신
    // 일곱 식구의 짚신 일곱 켤레 (아이 것은 작다)
    for (let i = 0; i < 7; i++) for (const s of [-0.06, 0.06]) {
      const k = i === 3 || i === 6 ? 0.7 : 1, g = new THREE.SphereGeometry(1, 10, 6); g.scale(0.045 * k, 0.02, 0.12 * k);
      B.add(g, M.thatch, -1.35 + i * 0.45 + s * k + (i === 2 ? 0.05 : 0), 0.48, -4.9 + (i === 2 && s > 0 ? 0.09 : 0) + (i % 2) * 0.03, 0, i === 2 && s > 0 ? 0.7 : 0.05 * (i - 3), 0);
    }

    // ================= 주변 숲 =================
    {
      const TB = new HG.Builder();
      let n = 0, guard = 0;
      while (n < 42 && guard++ < 900) {
        const x = -34 + rnd() * 90, z = (rnd() - 0.5) * 84;
        const inside = x > -15.5 && x < EX + 2.5 && z > -16.5 && z < 14;
        if (inside || Math.hypot((x - 10) * 0.85, z) > 44 || (Math.abs(x - GX) < 3.5 && z > 11)) continue;
        const sc = 0.8 + rnd() * 0.9;
        const g = HG.treeGeo(2000 + n, { trunk: 2.2 * sc, radius: 0.2 * sc, depth: 4, spread: 0.6, taper: 0.75, firstSplit: 3, leader: 3, upBias: 0.25, droop: 0.1 });
        TB.add(g, M.bark, x, 0, z, 0, rnd() * 6, 0); n++;
      }
      TB.build(scene);
      for (let i = 0; i < 26; i++) {
        const a = rnd() * 6.28, r = 17 + rnd() * 22, s = 0.3 + rnd() * 0.9;
        B.add(HG.rockGeo(700 + i, s, s * 0.6, s * 0.8), M.rock, 10 + Math.cos(a) * r * 1.5, s * 0.15, Math.sin(a) * r, 0, rnd() * 6, 0);
      }
      for (let i = 0; i < 12; i++) { const x = -12 + rnd() * 24, z = -13 + rnd() * 23; if (Math.abs(x) < 11.5 && z < -4) continue; const s = 0.08 + rnd() * 0.12; B.add(HG.rockGeo(800 + i, s, s * 0.5, s), M.rock, x, 0.02, z, 0, rnd() * 6, 0); }
    }

    // ================= 마른 풀 =================
    {
      const blade = new THREE.PlaneGeometry(0.016, 0.5, 1, 4); blade.translate(0, 0.25, 0);
      const p = blade.attributes.position, nrm = blade.attributes.normal;
      for (let i = 0; i < p.count; i++) { const y = p.getY(i) / 0.5; p.setX(i, p.getX(i) * (1 - y * 0.9)); p.setZ(i, y * y * 0.12); nrm.setXYZ(i, 0, 1, 0.2); }
      const gm = HG.windify(new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 1, side: THREE.DoubleSide }), 0.09, true);
      const N = 36000, im = new THREE.InstancedMesh(blade, gm, N), d = new THREE.Object3D(), c = new THREE.Color();
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
        if (outside) { x = -30 + rnd() * 80; z = (rnd() - 0.5) * 60; if (inRect(x, z, -13.3, EX + 0.3, -14.3, 11.8)) continue; if (Math.abs(x - GX) < 1.2 && z > 11) continue; }
        else {
          x = -12.7 + rnd() * (EX - 0.3 + 12.7); z = -13.7 + rnd() * 24.9;
          const dw = Math.min(x + 12.75, EX - 0.25 - x, z + 13.75, 11.25 - z, Math.abs(x - 13) - 0.25);
          if (inRect(x, z, GX - 7.1, GX + 7.1, -11.5, -4.3) || (Math.abs(x - GX) < 0.9 && z > -4.4) || (Math.abs(z - 4) < 0.9 && x > 10.5 && x < GX + 1) || Math.abs(x - 13) < 0.4 || inRect(x, z, 26.8, 29.4, 1.0, 2.9)) continue;
          const nearTree = Math.hypot(x - 9, z - 7.6) < 2.6, nearShed = inRect(x, z, -12, -7, -2.2, 4.6), nearPile = Math.hypot(x - 7.3, z - 9.3) < 1.6;
          const nn = HG.noise.fbm((x + 40) / 64, (z + 40) / 64, 8, 8, 3);
          if (!(dw < 0.9 + nn * 1.6 || nearTree || nearShed || nearPile || nn > 0.66)) continue;
          if (inRect(x, z, -11.1, 11.1, -11.5, -4.3) || inRect(x, z, -11.65, -7.35, -1.65, 3.65) || inRect(x, z, 8.95, 12.65, -3.9, -0.5)) continue;
          if (Math.hypot(x - 7.5, z - 1.5) < 1.0 || Math.hypot(x - 9, z - 7.6) < 0.9 || (Math.abs(x - 1.4) < 1.3 && z > -4.4 && z < 3.6)) continue;
          if (inRect(x, z, 1.0, 5.2, 2.9, 6.2)) continue;
        }
        cx0 = x; cz0 = z; cl = 5 + ((rnd() * 9) | 0);
      }
      im.count = k; im.receiveShadow = true; im.castShadow = false; im.frustumCulled = false; scene.add(im);
    }

    const meshes = B.build(scene, { noCast: W.noCast });
    meshes.forEach((m) => { if (W.noRecv.includes(m.material)) m.receiveShadow = false; });
    meshes.forEach((m) => { if (m.material === M.plaster || m.material === M.mud || m.material === M.woodPlank || m.material === M.stoneWall) W.occluders.push(m); });
    return W;
  };
})();
