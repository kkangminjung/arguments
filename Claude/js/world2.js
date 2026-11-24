// 레벨: 고갯마루 (장승 · 서낭나무 · 누석단 · 서낭당 · 당지기 움막 · 곳집 · 샘 · 너럭바위 · 고갯길)
(function () {
  'use strict';
  const HG = (window.HG = window.HG || {});

  HG.buildWorld = function (scene) {
    const M = HG.M, B = new HG.Builder();
    for (const k of ['plaster', 'plaster2', 'mud', 'woodPlank', 'hanjiWall', 'rock']) if (M[k]) M[k].shadowSide = THREE.DoubleSide;
    const W = { doors: {}, proxies: [], occluders: [], noCast: [], noRecv: [], chapter: 2 };
    const col = (HG.col = { boxes: [], circles: [] });
    const zones = (HG.zones = []);
    const cb = (x0, x1, z0, z1) => { const b = { x0: Math.min(x0, x1), x1: Math.max(x0, x1), z0: Math.min(z0, z1), z1: Math.max(z0, z1), on: true }; col.boxes.push(b); return b; };
    const cc = (x, z, r) => { const c = { x, z, r, on: true }; col.circles.push(c); return c; };
    const proxyMat = new THREE.MeshBasicMaterial({ visible: false });
    const proxy = (key, x, y, z, sx, sy, sz) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), proxyMat);
      m.position.set(x, y, z); m.userData.key = key; scene.add(m); W.proxies.push(m); return m;
    };
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
            const c = a[side][ax], dir = side === 'lo' ? -1 : 1;
            const u0 = Math.max(a.lo[u], b.lo[u]), u1 = Math.min(a.hi[u], b.hi[u]), v0 = Math.max(a.lo[v], b.lo[v]), v1 = Math.min(a.hi[v], b.hi[v]);
            let visible = false;
            for (const [fu, fv] of [[0.5, 0.5], [0.08, 0.08], [0.92, 0.08], [0.08, 0.92], [0.92, 0.92]]) {
              const p = [0, 0, 0]; p[ax] = c + dir * 0.003; p[u] = u0 + (u1 - u0) * fu; p[v] = v0 + (v1 - v0) * fv;
              if (p[1] < 0) continue;
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
    const rnd = HG.rng(1791);
    const canvasTex = (w, h, draw) => { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; };

    // 지점
    W.GAP = { x: 0.3, z: -15.5 };           // 어둑서니가 서는 자리
    W.LEDGE = { x: -3.4, z: -14.0, h: 2.4 }; // 너럭바위
    W.START = { x: 0, z: 17.2 };
    W.TREE = { x: -2.6, z: 3.2 };
    W.rects = [[-11.7, -7.3, -5.2, -0.8, 4.4], [7.4, 11.8, 4.8, 9.2, 3.9], [7.5, 13.7, -7.9, -1.7, 4.3]];   // 지붕 아래 (눈 · 안개가 들지 않는 곳)
    // 시야를 가리는 덩어리 (x0, x1, z0, z1, 높이): 벼랑 · 너럭바위 · 건물. 가려서 보이지 않는 것은 '쳐다본' 것으로 치지 않는다
    W.los = [[-6.4, -1.75, -17.5, -10.8, 2.62],   // (너럭바위는 가장자리 턱까지 친다 — 돌계단을 오르는 동안에는 바위에 가려 보이지 않는다)
      [-11.06, -7.94, -4.56, -1.44, 3.2], [7.9, 11.3, 5.3, 8.7, 2.8], [8.13, 13.07, -7.27, -2.33, 3.0]];
    W.indoor = (x, z) => (x > -11 && x < -8 && z > -4.5 && z < -1.5) || (x > 8 && x < 11.2 && z > 5.4 && z < 8.6) || (x > 8.2 && x < 13 && z > -7.2 && z < -2.4);

    // ================= 땅 =================
    {
      const sh = new THREE.Shape(); sh.moveTo(-90, -90); sh.lineTo(90, -90); sh.lineTo(90, 90); sh.lineTo(-90, 90); sh.closePath();
      const gg = new THREE.ShapeGeometry(sh, 4); gg.rotateX(-Math.PI / 2); HG.scaleUV(gg, 1 / 4.5);
      const ground = new THREE.Mesh(gg, M.ground); ground.receiveShadow = true; scene.add(ground);
    }
    // 길에 박힌 돌
    {
      const path = [];
      for (let i = 0; i < 32; i++) path.push([Math.sin(i * 0.9) * 0.3, 18.4 - i * 0.92]);                 // 남쪽 어귀 → 고갯길
      for (let i = 0; i < 8; i++) path.push([-1.2 - i * 0.85, -1.6 - i * 0.16 + Math.sin(i * 1.3) * 0.15]); // → 서낭당
      for (let i = 0; i < 8; i++) path.push([0.9 + i * 0.85, 6.6 + Math.sin(i * 1.7) * 0.2]);              // → 움막
      for (let i = 0; i < 8; i++) path.push([1.0 + i * 0.86, -3.6 - i * 0.14 + Math.sin(i * 1.1) * 0.15]);  // → 곳집
      for (let i = 0; i < 7; i++) path.push([-6.3 - i * 0.22 + Math.sin(i * 1.4) * 0.15, -5.8 - i * 0.8]);   // → 돌계단
      path.forEach((p, i) => B.add(HG.rockGeo(100 + i, 0.28 + rnd() * 0.14, 0.05, 0.22 + rnd() * 0.12), M.rock, p[0], 0.012, p[1], 0, rnd() * 3, 0));
    }

    // ================= 바위 절벽 =================
    // 심(상자) 위에 울퉁불퉁한 바위를 덧붙여 깎아지른 벼랑을 만든다
    let cliffN = 0;
    // 걸어 다니는 자리: 빈터, 돌계단 앞, 너럭바위 위, 그리고 굽이굽이 이어지는 고갯길 다섯 굽이
    const LANES = [[-15, 15, -10.6, 20.5], [-11, -6.4, -15.4, -10.6], [-6.4, -1.75, -17.5, -10.8],
      [-1.75, 1.75, -26, -10.6], [-1.75, 9.6, -29.2, -26], [6.4, 9.6, -42, -29.2], [-3.6, 9.6, -45.2, -42], [-3.6, -0.4, -61, -45.2]];
    W.lanes = LANES;
    const nearLane = (x, z) => LANES.some((l) => x > l[0] - 0.7 && x < l[1] + 0.7 && z > l[2] - 0.7 && z < l[3] + 0.7);
    // 고갯길의 굽이를 따라가는 길 (진행 정도를 재는 데 쓴다)과, 어둑서니가 서는 자리들
    W.PATH = [[0, -11], [0, -27.6], [8, -27.6], [8, -43.6], [-2, -43.6], [-2, -60]];
    W.GAPS = [{ x: 0.3, z: -15.5 }, { x: 4.4, z: -27.95 }, { x: 8.25, z: -36.4 }, { x: 2.6, z: -44.05 }, { x: -2.45, z: -52.6 }];
    W.GAP = W.GAPS[0]; W.EXITZ = -57.5;
    // 고갯길의 높이: 굽이를 돌 때마다 오르막이 이어지고, 마루(굽이 끝)를 넘으면 골짜기로 내려간다
    // (굽이 안쪽 모퉁이에서 높이가 툭 끊기지 않게, 가장 가까운 한 구간이 아니라 모든 구간의 진행 정도를 거리에 따라 섞는다)
    const progOf = (x, z) => { const a = W.PATH; let sw = 0, sp = 0, acc = 0; for (let i = 0; i < a.length - 1; i++) { const dx = a[i + 1][0] - a[i][0], dz = a[i + 1][1] - a[i][1], L = Math.hypot(dx, dz), t = Math.min(1, Math.max(0, ((x - a[i][0]) * dx + (z - a[i][1]) * dz) / (L * L))), d2 = (x - a[i][0] - dx * t) ** 2 + (z - a[i][1] - dz * t) ** 2, w = 1 / ((d2 + 0.04) * (d2 + 0.04)); sw += w; sp += w * (acc + t * L); acc += L; } return sp / sw; };
    const HK = [[0, 0], [2.5, 0], [7, 0.6], [16, 2.7], [21, 3.3], [30, 6.1], [38, 7.5], [46, 10.1], [52, 11.3], [57, 12.2], [61.5, 12.5], [67, 11.8], [78, 8.4], [100, 0.6]];   // 가파른 비탈과 숨 돌릴 만한 참이 번갈아 나온다
    const hLin = (p) => { if (p <= 0) return 0; for (let i = 0; i < HK.length - 1; i++) if (p <= HK[i + 1][0]) return HK[i][1] + ((HK[i + 1][1] - HK[i][1]) * (p - HK[i][0])) / (HK[i + 1][0] - HK[i][0]); return HK[HK.length - 1][1]; };
    const pathH = (p) => (hLin(p - 1.6) + hLin(p) + hLin(p + 1.6)) / 3;
    const inPass = (x, z) => z < -10.9 && (x > -6.3 || z < -20);
    W.hAt = (x, z) => {
      if (!inPass(x, z)) return 0;
      let h = pathH(z < -60 ? 67 + (-60 - z) : progOf(x, z));
      if (z < -61.2) h += Math.min(9, Math.max(0, Math.abs(x + 2) - 1.7) * 0.85) * Math.min(1, (-61.2 - z) / 2);   // 고개 너머는 양옆이 비탈진 골짜기
      return h;
    };
    // 벼랑: 속심(상자)은 안쪽으로 물려 감추고, 겉은 서로 겹친 바위 덩이로만 이룬다 — 평평한 면과 칼 같은 모서리가 드러나지 않게.
    // 바위는 벼랑 선에서 0.28 넘게 내밀지 않는다 (충돌 범위를 0.3 넓혀 두어, 시점이 바위 속에 들어가지 않는다).
    function cliff(x0, x1, z0, z1, h, opt) {
      opt = opt || {};
      const flat = !!opt.flat, ins = flat ? 0.95 : 0.62;
      // 속심은 낮고 깊게 — 곧은 윗변과 평평한 면이 바위 사이로 드러나지 않게. 비탈을 따라 높아지도록 칸칸이 나눠 세운다
      if (flat) bx(M.rock, x0 + ins, x1 - ins, 0, h - 0.3, z0 + ins, z1 - ins, 2.6);
      else {
        const nxc = Math.max(1, Math.round((x1 - x0 - 2.6) / 3)), nzc = Math.max(1, Math.round((z1 - z0 - 2.6) / 3)), wx = (x1 - x0 - 2.6) / nxc, wz = (z1 - z0 - 2.6) / nzc;
        for (let i = 0; i < nxc; i++) for (let j = 0; j < nzc; j++) { const cx = x0 + 1.3 + (i + 0.5) * wx, cz = z0 + 1.3 + (j + 0.5) * wz, top = W.hAt(cx, cz) + h - 1.5; B.add(HG.rockGeo(3900 + cliffN++, (wx / 2 + 0.9) / 1.25, (top + 1.3) / 2.2, (wz / 2 + 0.9) / 1.25), M.rock, cx, (top - 0.7) / 2, cz); }   // (상자가 아니라 둥근 바윗덩이 — 더 높은 뒤쪽 산이 앞 벼랑 너머로 비쳐도 곧은 모서리가 없다)
      }
      // 걸어 다니는 너럭바위: 속심은 깊이 감추고, 윗면은 넓적한 바위를 겹쳐 깐다 (상자의 곧은 윗변이 드러나지 않게)
      if (flat) for (let x = x0 + 0.3; x < x1; x += 0.72) for (let z = z0 + 0.3; z < z1; z += 0.72) {
        const r = 0.62 + rnd() * 0.22, lim = r * 1.25 - 0.25;
        B.add(HG.rockGeo(3000 + cliffN++, r, 0.16, r), M.rock, Math.min(Math.max(x + (rnd() - 0.5) * 0.3, x0 + lim), x1 - lim), h - 0.2, Math.min(Math.max(z + (rnd() - 0.5) * 0.3, z0 + lim), z1 - lim), 0, rnd() * 6, 0);
      }
      const per = 2 * (x1 - x0 + z1 - z0), n = Math.round(per / 0.7), rows = Math.max(2, Math.round(h / 0.9));
      for (let i = 0; i < n; i++) {
        let d = ((i + rnd() * 0.5) / n) * per, px, pz, nx = 0, nz = 0;
        if (d < x1 - x0) { px = x0 + d; pz = z1; nz = 1; } else if ((d -= x1 - x0) < z1 - z0) { px = x1; pz = z1 - d; nx = 1; } else if ((d -= z1 - z0) < x1 - x0) { px = x1 - d; pz = z0; nz = -1; } else { d -= x1 - x0; px = x0; pz = z0 + d; nx = -1; }
        if ((opt.skip && opt.skip(px, pz, nx, nz)) || (!flat && !nearLane(px, pz))) continue;   // 아무도 볼 수 없는 뒷면에는 바위를 붙이지 않는다
        const base = flat ? 0 : W.hAt(px + nx * 0.6, pz + nz * 0.6);   // 그 자리 길바닥의 높이
        for (let k = 0; k < rows; k++) {
          const s = 0.8 + rnd() * 0.55, wide = 1 + rnd() * 0.3, sy = s * (0.8 + rnd() * 0.5);
          let y = ((k + 0.5) / rows) * h + (rnd() - 0.5) * 0.3;
          if (flat) y = k === rows - 1 ? h - sy * 1.2 - (nx === 1 ? 0.1 : 0) + rnd() * 0.04 : Math.min(y, h - sy * 1.25 - 0.1); else if (k === rows - 1) y = h - sy * (0.2 + rnd() * 0.5);
          const R = s * wide * 1.25, inset = R - 0.28 * (0.55 + rnd() * 0.45), lim = R - 0.26;
          // 모서리 근처의 바위가 옆면 밖으로 삐져나오지 않게, 중심을 벼랑 안쪽으로 가둔다
          const bxc = Math.min(Math.max(px - nx * inset, x0 + lim), x1 - lim), bzc = Math.min(Math.max(pz - nz * inset, z0 + lim), z1 - lim);
          B.add(HG.rockGeo(3000 + cliffN++, s * wide, sy, s * wide, y > 0.7 && y < 2.3 ? 3 : 2), M.rock, bxc, y + base, bzc, (rnd() - 0.5) * 0.2, rnd() * 6, (rnd() - 0.5) * 0.2);
          (W.blobs = W.blobs || []).push([bxc, y + base, bzc, R, sy * 1.25]);   // (검수용: 걸을 수 있는 자리에서 시점이 바위에 닿는 곳이 없는지 계산으로 확인)
        }
      }
      if (!flat) for (let i = 0; i < Math.round(((x1 - x0) * (z1 - z0)) / 2.4); i++) { // 꼭대기를 들쭉날쭉하게
        const s = 1.1 + rnd() * 1.1, sy = s * (0.8 + rnd() * 0.5), tx = x0 + 1.4 + rnd() * (x1 - x0 - 2.8), ty = h - 1.0 + rnd() * 0.5, tz = z0 + 1.4 + rnd() * (z1 - z0 - 2.8);
        B.add(HG.rockGeo(3000 + cliffN++, s * 1.3, sy, s * 1.2), M.rock, tx, ty + W.hAt(tx, tz), tz, 0, rnd() * 6, 0);
      }
    }
    // 벼랑 덩이들 (x0, x1, z0, z1, 높이)
    const CL = [[1.75, 16.5, -26, -10.6, 4.8], [-7.2, -1.75, -29.2, -17.5, 4.2], [-11.4, -6.42, -19, -15.4, 3.6], [-17, -10.9, -17, -10.6, 3.9],
      [-7.2, 6.4, -42, -29.2, 4.6], [9.6, 16.5, -45.2, -26, 4.4], [-0.4, 16.5, -62, -45.2, 4.7], [-10, -3.6, -62, -42, 4.3]];
    CL.forEach((c) => { cliff(c[0], c[1], c[2], c[3], c[4]); W.los.push([c[0], c[1], c[2], c[3], 99]); });
    // (빈터 쪽 면은 충돌 범위를 넉넉히 두어, 바위에 코를 대고 서지 못하게 한다)
    cb(1.45, 16.8, -26.3, -10.3); cb(2.1, 16.8, -10.4, -9.85);
    cb(-7.5, -1.45, -29.5, -17.5); cb(-11.7, -6.4, -19, -14.95); cb(-17, -10.45, -17, -9.85);
    for (let i = 4; i < 8; i++) cb(CL[i][0] - 0.3, CL[i][1] + 0.3, CL[i][2] - 0.3, CL[i][3] + 0.3);
    cb(-4, 0, -62.5, -61.2);
    // 서쪽: 너럭바위 (위를 걸을 수 있으므로 통째로 막지 않고, 둘레만 막는다)
    cliff(-6.4, -1.75, -17.5, -10.8, 2.38, { flat: true, skip: (x, z, nx) => nx === -1 && z > -15.0 && z < -13.4 });
    zones.push({ x0: -6.4, x1: -1.75, z0: -17.5, z1: -10.8, h: 2.4, surf: 'stone' });
    bx(M.rock, -6.4, -5.3, 0, 2.06, -14.95, -13.45, 2.6);   // 돌계단 맨 위와 너럭바위 사이를 메우는 속심 (위는 넓적한 바위로 덮인다)
    // 너럭바위의 빈터 쪽 가장자리: 위에 서 있을 때는 막지 않는다 (빈터로 바로 뛰어내릴 수 있다)
    W.dropBlocks = [cb(-6.4, -2.1, -11.1, -10.2), cb(-6.4, -1.75, -11.1, -10.5)];
    cb(-2.05, -1.45, -17.5, -10.8); cb(-6.9, -6.1, -17.5, -14.95); cb(-6.9, -6.1, -13.35, -10.2);
    // 돌계단: 빈터에서 들어서면 곧장 마주 보이게, 너럭바위 옆구리를 따라 안쪽으로 오른다
    for (let i = 0; i < 7; i++) {
      const top = i === 6, z1 = top ? -14.4 : -11.4 - i * 0.5, z0 = top ? -15.0 : z1 - 0.5, h = top ? 2.4 : 0.4 * (i + 1), zc = (z0 + z1) / 2;
      bx(M.rock, -8.57 + i * 0.012, -6.43, 0, h - 0.06, z0 + 0.03, z1 - 0.03, 1.6);
      B.add(HG.rockGeo(3500 + i, 0.9, 0.07, top ? 0.26 : 0.2), M.rock, -7.5, h - 0.065, zc, 0, (rnd() - 0.5) * 0.08, 0);   // 닳아 둥글어진 디딤돌
      zones.push({ x0: -8.6, x1: -6.4, z0, z1, h, surf: 'stone' });
      B.add(HG.rockGeo(3600 + i, 0.34, 0.3 + Math.min(i, 5) * 0.2, 0.4), M.rock, -8.75, h * 0.45, zc, 0, rnd() * 6, 0);   // 계단 옆을 받친 돌
    }
    // 돌계단 어귀의 표지: 작은 돌탑과 흰 종이를 맨 말뚝 (당집 북쪽, 벼랑 밑)
    // (빈터에서도 눈에 띄게, 벼랑 사이 길목 한가운데 옆에 사람 허리만 한 돌탑과 긴 장대를 세운다)
    const wmark = HG.windify(new THREE.MeshStandardMaterial({ color: 0xf2f0ea, roughness: 0.9, side: THREE.DoubleSide, emissive: 0x4a5060, emissiveIntensity: 0.6 }), 0.08, false, 0);   // 달빛에도 희게 보이는 종이
    for (const [mx, mz, n, k, pd] of [[-10.3, -9.4, 7, 1.35, 0.55], [-6.2, -9.6, 7, 1.35, -0.55]]) {   // 돌계단 어귀 양옆에 하나씩, 장대는 길 쪽으로
      for (let i = 0; i < n; i++) B.add(HG.rockGeo(3650 + i + n * 7, (0.24 - i * 0.022) * k, 0.07 * k, (0.2 - i * 0.018) * k), M.rock, mx, (0.05 + i * 0.115) * k, mz, 0, i * 1.3, 0);
      cc(mx, mz, 0.3 * k);
      B.add(HG.cyl(0.035, 0.05, 2.9, 7, 1), M.woodPale, mx + pd, 1.45, mz + 0.1, 0.03, 0, -0.04); cc(mx + pd, mz + 0.1, 0.08);
      for (let i = 0; i < 5; i++) { const m = new THREE.Mesh(HG.clothGeo(0.13, 0.7 + (i % 3) * 0.2, 3, 8, 880 + i + n, 0.03), wmark); m.position.set(mx + pd, 2.85 - i * 0.03, mz + 0.1); m.rotation.y = i * 1.3; m.castShadow = true; scene.add(m); }
    }
    // 너럭바위 가장자리의 낮은 턱 (발은 막되, 등불을 벽에 붙은 것으로 여겨 어둡히지는 않는다)
    for (let z = -17.1; z < -11.0; z += 0.62) { const s = 0.17 + rnd() * 0.06; B.add(HG.rockGeo(3700 + Math.round(z * 10), s, s * 0.6, s * 1.5), M.rock, -1.98, 2.39, z, 0, (rnd() - 0.5) * 0.5, 0); cc(-2.05, z, 0.33).low = true; }
    for (let x = -6.0; x < -2.2; x += 0.62) { const s = 0.2 + rnd() * 0.08; B.add(HG.rockGeo(3800 + Math.round(x * 10), s * 1.5, s * 0.7, s), M.rock, x, 2.4, -17.25, 0, (rnd() - 0.5) * 0.5, 0); cc(x, -17.25, 0.33).low = true; }
    // 빈터의 경계 (바위와 숲)
    cb(-16, -15, -11, 21); cb(15, 16, -11, 21); cb(-16, 16, 20.2, 21.2);
    for (let i = 0; i < 46; i++) {
      const t = i / 46, s = 0.9 + rnd() * 1.4; let x, z;
      if (t < 0.36) { x = -15.9 - rnd() * 1.5; z = -10 + (t / 0.36) * 31; } else if (t < 0.72) { x = 15.9 + rnd() * 1.5; z = -10 + ((t - 0.36) / 0.36) * 31; } else { x = -15 + ((t - 0.72) / 0.28) * 30; z = 21.3 + rnd() * 1.4; if (Math.abs(x) < 2.2) continue; }
      B.add(HG.rockGeo(4000 + i, s * 1.3, s * (0.7 + rnd() * 0.6), s), M.rock, x, s * 0.3, z, rnd() * 0.4, rnd() * 6, 0);
    }
    // 고개 너머: 내리막은 눈안개에 묻혀 있다
    {
      // 고개 너머: 골짜기로 내려가는 비탈, 겹겹이 선 먼 산등성이, 아랫마을의 불빛 몇 점
      for (const [zz, base, amp, col, seed] of [[-150, -14, 30, 0x090e17, 3], [-195, -12, 46, 0x0c131e, 7], [-250, -10, 66, 0x0f1826, 11]]) {
        const pos = [], uv = [], idx = [];
        for (let i = 0; i <= 90; i++) {
          const x = -270 + i * 6, notch = 0.5 + 0.5 * Math.min(1, Math.abs(x + 2) / 70);
          const y = base + amp * notch * (0.5 + 0.26 * Math.sin(x * 0.021 + seed) + 0.15 * Math.sin(x * 0.047 + seed * 2.1) + 0.09 * Math.sin(x * 0.11 + seed * 3.3));
          pos.push(x, y, zz, x, -60, zz); uv.push(0, 0, 0, 0);
          if (i) { const p = i * 2; idx.push(p - 2, p - 1, p, p - 1, p + 1, p); }
        }
        const m = new THREE.Mesh(HG.makeGeo(pos, uv, idx), new THREE.MeshBasicMaterial({ color: col, fog: false, side: THREE.DoubleSide })); m.frustumCulled = false; scene.add(m);
      }
      const ft = HG.drawPuff();
      for (let i = 0; i < 13; i++) {
        const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: ft, color: i % 4 ? 0xffb264 : 0xffd9a0, transparent: true, opacity: 0.55 + rnd() * 0.4, depthWrite: false, fog: false }));
        s.position.set(-9 + rnd() * 15, -2.5 + rnd() * 3.4, -124 - rnd() * 14); s.scale.setScalar(0.5 + rnd() * 0.5); scene.add(s);
      }
      { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: ft, color: 0x6a4a2c, transparent: true, opacity: 0.35, depthWrite: false, fog: false })); s.position.set(-2, -0.5, -131); s.scale.set(26, 9, 1); scene.add(s); }
      // 비탈의 바위
      for (let i = 0; i < 26; i++) { const x = -15 + rnd() * 26, z = -63 - rnd() * 26; if (Math.abs(x + 2) < 2.4) continue; const s = 0.3 + rnd() * 0.9; B.add(HG.rockGeo(4600 + i, s * 1.3, s * 0.8, s), M.rock, x, W.hAt(x, z) + s * 0.15, z, rnd() * 0.3, rnd() * 6, 0); }
    }
    // 올라온 길을 막은 쓰러진 나무와 눈안개
    {
      for (const [tx, tz, rz, ry, sc, seed] of [[5.2, 19.9, Math.PI / 2 - 0.06, 0.1, 1.25, 4150], [-5.0, 20.9, -Math.PI / 2 + 0.08, -0.25, 1.0, 4151]]) {
        const tg = HG.treeGeo(seed, { trunk: 3.2 * sc, radius: 0.36 * sc, depth: 5, spread: 0.55, taper: 0.76, firstSplit: 3, leader: 3, upBias: 0.2, droop: 0.15 });
        const m = new THREE.Mesh(tg, M.bark); m.position.set(tx, 0.42 * sc, tz); m.rotation.set(0, ry, rz); m.castShadow = true; m.receiveShadow = true; scene.add(m);
      }
      B.add(HG.rockGeo(4100, 1.1, 0.8, 0.9), M.rock, -4.4, 0.3, 19.6, 0, 1, 0); B.add(HG.rockGeo(4101, 0.9, 0.7, 0.8), M.rock, 5.6, 0.3, 19.4, 0, 2, 0);
      // 그 너머는 눈안개에 묻혀 보이지 않는다
      const ft = HG.drawPuff();
      for (let i = 0; i < 16; i++) {
        const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: ft, color: 0x232c3c, transparent: true, opacity: 0.5, depthWrite: false }));
        s.position.set(-13 + (i % 8) * 3.7 + rnd() * 1.5, 1.2 + Math.floor(i / 8) * 2.2 + rnd() * 0.6, 22.2 + Math.floor(i / 8) * 1.6 + rnd()); s.scale.set(8.5, 4.6, 1); s.renderOrder = 3; scene.add(s);
      }
      proxy('back', 0, 0.9, 19.5, 6, 1.6, 0.8);
    }

    // ================= 장승 =================
    {
      const face = (txt, female) => canvasTex(512, 1024, (x, w, h) => {
        const r = HG.rng(female ? 77 : 66);
        x.fillStyle = '#4a3a2a'; x.fillRect(0, 0, w, h);
        for (let i = 0; i < 900; i++) { x.strokeStyle = `rgba(${r() < 0.5 ? '20,14,8' : '110,92,66'},${0.08 + r() * 0.16})`; x.lineWidth = 1 + r() * 2; const px = r() * w, py = r() * h; x.beginPath(); x.moveTo(px, py); x.lineTo(px + (r() - 0.5) * 8, py + 40 + r() * 160); x.stroke(); }
        const cx = w / 2;
        // 깎아 낸 얼굴: 퉁방울눈, 주먹코, 드러난 이
        x.fillStyle = 'rgba(15,10,6,0.55)'; x.beginPath(); x.ellipse(cx, 190, 118, 150, 0, 0, 7); x.fill();
        x.fillStyle = '#6b5740'; x.beginPath(); x.ellipse(cx, 186, 108, 140, 0, 0, 7); x.fill();
        for (const s of [-1, 1]) {
          x.fillStyle = '#1a120a'; x.beginPath(); x.ellipse(cx + s * 46, 150, 34, 30, s * 0.25, 0, 7); x.fill();
          x.fillStyle = '#8a7c60'; x.beginPath(); x.ellipse(cx + s * 46, 150, 25, 21, s * 0.25, 0, 7); x.fill();
          x.fillStyle = '#0c0805'; x.beginPath(); x.arc(cx + s * 44, 152, 9, 0, 7); x.fill();
          x.strokeStyle = '#1a120a'; x.lineWidth = 9; x.beginPath(); x.moveTo(cx + s * 16, 108); x.quadraticCurveTo(cx + s * 50, 84, cx + s * 88, 112); x.stroke();
        }
        x.fillStyle = '#58452f'; x.beginPath(); x.ellipse(cx, 205, 26, 34, 0, 0, 7); x.fill();
        x.fillStyle = '#140d07'; x.beginPath(); x.ellipse(cx, 268, 62, 22, 0, 0, 7); x.fill();
        x.fillStyle = '#93866a'; for (let i = -3; i <= 3; i++) x.fillRect(cx + i * 16 - 6, 254 + Math.abs(i) * 2, 12, 24 - Math.abs(i) * 3);
        if (!female) { x.strokeStyle = '#1a120a'; x.lineWidth = 5; for (let i = -4; i <= 4; i++) { x.beginPath(); x.moveTo(cx + i * 13, 296); x.lineTo(cx + i * 17, 350 + (4 - Math.abs(i)) * 9); x.stroke(); } }
        else { x.fillStyle = 'rgba(140,40,28,0.7)'; x.beginPath(); x.arc(cx - 78, 212, 15, 0, 7); x.fill(); x.beginPath(); x.arc(cx + 78, 212, 15, 0, 7); x.fill(); }
        // 먹으로 쓴 이름
        x.fillStyle = '#0d0906'; x.font = 'bold 84px "Batang","Gungsuh","Malgun Gothic",serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
        txt.split('').forEach((ch, i) => x.fillText(ch, cx, 440 + i * 112));
      });
      [[-1.9, '天下大將軍', false], [1.9, '地下女將軍', true]].forEach(([jx, txt, fem], i) => {
        const mat = new THREE.MeshStandardMaterial({ map: face(txt, fem), roughness: 0.95 });
        const g = new THREE.CylinderGeometry(0.2, 0.25, 2.5, 22, 1, true); g.rotateY(Math.PI + (i ? -0.25 : 0.25));
        const m = new THREE.Mesh(g, mat); m.position.set(jx, 1.25, 13.3); m.rotation.z = i ? -0.05 : 0.04; m.castShadow = true; m.receiveShadow = true; scene.add(m);
        B.add(new THREE.SphereGeometry(0.2, 16, 8, 0, 6.3, 0, 1.57), M.wood, jx + (i ? 0.06 : -0.05), 2.5, 13.3);
        B.add(HG.box(0.62, 0.07, 0.5, 1, 'x'), M.wood, jx + (i ? 0.07 : -0.05), 2.66, 13.3, 0, 0, i ? -0.05 : 0.04);   // 벙거지
        B.add(new THREE.TorusGeometry(0.235, 0.022, 6, 24), M.rope, jx, 0.95, 13.3, Math.PI / 2, 0, 0);
        for (let k = 0; k < 5; k++) B.add(HG.rockGeo(4200 + i * 9 + k, 0.2, 0.14, 0.18), M.rock, jx + Math.cos(k * 1.3) * 0.36, 0.08, 13.3 + Math.sin(k * 1.3) * 0.36, 0, k, 0);
        cc(jx, 13.3, 0.42);
      });
      proxy('jangseung', -1.9, 1.5, 13.4, 0.7, 2.4, 0.7); proxy('jangseung', 1.9, 1.5, 13.4, 0.7, 2.4, 0.7);
    }

    // ================= 서낭나무 · 누석단 =================
    W.clothMat = [];
    {
      const tx = W.TREE.x, tz = W.TREE.z;
      const tg = HG.treeGeo(11, { trunk: 2.5, radius: 0.78, depth: 6, spread: 0.74, taper: 0.8, firstSplit: 4, leader: 2, upBias: 0.22, droop: 0.32, roots: 8, straight: true });
      const tree = new THREE.Mesh(tg, M.bark); tree.position.set(tx, 0, tz); tree.castShadow = true; tree.receiveShadow = true; scene.add(tree);
      cc(tx, tz, 1.0);
      B.add(new THREE.TorusGeometry(0.7, 0.04, 7, 36), M.rope, tx, 1.3, tz, Math.PI / 2, 0, 0);
      B.add(new THREE.TorusGeometry(0.695, 0.035, 7, 36), M.rope, tx, 1.39, tz, Math.PI / 2 + 0.05, 0, 0.03);
      const cms = M.cloth.map((m) => { const c = HG.windify(m.clone(), 0.16); W.clothMat.push(c); return c; });
      const wm = HG.windify(M.hanji.clone(), 0.05, false, 0); W.clothMat.push(wm);
      const strips = new THREE.Group(); scene.add(strips); let stripN = 0;
      const strip = (x, y, z, w, h, mat, ry) => { const m = new THREE.Mesh(HG.clothGeo(w, h, 3, 10, 300 + stripN++, w * 0.25), mat); m.position.set(x, y, z); m.rotation.y = ry; m.castShadow = true; strips.add(m); };
      for (let i = 0; i < 14; i++) { const a = (i / 14) * Math.PI * 2 + rnd() * 0.3; strip(tx + Math.cos(a) * 0.74, 1.28, tz + Math.sin(a) * 0.74, 0.035 + rnd() * 0.02, 0.14 + rnd() * 0.26, wm, -a + Math.PI / 2 + (rnd() - 0.5) * 0.6); }
      const tips = tg.userData.tips.filter((p) => p.y > 2.4 && p.y < 5.4);
      for (let i = 0; i < 26; i++) {
        const p = tips.length ? tips[(rnd() * tips.length) | 0] : null, a = rnd() * 6.28, r = 0.9 + rnd() * 1.6;
        strip(p ? tx + p.x : tx + Math.cos(a) * r, p ? p.y : 2.8 + rnd(), p ? tz + p.z : tz + Math.sin(a) * r, 0.1 + rnd() * 0.06, 0.9 + rnd() * 1.0, cms[i % 5], rnd() * 6);
      }
      proxy('tree', tx, 1.3, tz, 1.9, 2.2, 1.9);
      // 누석단: 길손들이 하나씩 얹고 간 돌
      const px = 1.4, pz = 4.9; W.CAIRN = { x: px, z: pz };
      for (let i = 0; i < 110; i++) {
        const a = rnd() * 6.28, rr = Math.pow(rnd(), 0.7) * 1.15, hh = (1 - rr / 1.15) * 1.3, s = 0.08 + rnd() * 0.12;
        B.add(HG.rockGeo(500 + i, s * (1 + rnd() * 0.5), s * 0.7, s), M.rock, px + Math.cos(a) * rr, hh * rnd() + 0.04, pz + Math.sin(a) * rr, rnd(), rnd() * 6, rnd());
      }
      B.add(HG.rockGeo(999, 0.15, 0.2, 0.13), M.rock, px, 1.34, pz);
      cc(px, pz, 1.1); proxy('cairn', px, 0.8, pz, 2.3, 1.6, 2.3);
      W.stone = new THREE.Mesh(HG.rockGeo(1001, 0.09, 0.06, 0.08), M.rock); W.stone.position.set(px + 0.1, 1.5, pz - 0.05); W.stone.visible = false; W.stone.castShadow = true; scene.add(W.stone);
    }

    // 초가 지붕 (겉이엉 + 속겹 + 처마 밑면)
    function thatchRoof(cx, cz, hx, hz, h, y, wx, wz, seed) {
      B.add(HG.thatchGeo(hx, hz, h, seed), M.thatch, cx, y, cz);
      const pos = [], uv = [], idx = [], na = 96, e = 0.8, ox0 = hx * 0.975, oz0 = hz * 0.975;   // 처마 끝까지 덮어, 밑에서는 매끈한 밑면만 보인다
      for (let i = 0; i <= na; i++) {
        const a = (i / na) * Math.PI * 2, c = Math.cos(a), s = Math.sin(a);
        const ox = ox0 * Math.sign(c) * Math.pow(Math.abs(c), e), oz = oz0 * Math.sign(s) * Math.pow(Math.abs(s), e);
        const k = Math.min(wx / Math.max(1e-6, Math.abs(ox)), wz / Math.max(1e-6, Math.abs(oz)), 1);
        pos.push(ox * k, y - 0.02, oz * k, ox, y - 0.33, oz); uv.push(ox * k * 0.9, oz * k * 0.9, ox * 0.9, oz * 0.9);   // 짚결을 평면으로 입혀, 모서리에서 무늬가 꺾이지 않게
        if (i < na) { const p = i * 2; idx.push(p, p + 1, p + 2, p + 1, p + 3, p + 2); }
      }
      const sofMat = M.thatch.clone(); sofMat.side = THREE.DoubleSide; sofMat.color.multiplyScalar(0.5); W.noRecv.push(sofMat);
      B.add(HG.makeGeo(pos, uv, idx), sofMat, cx, 0, cz);
      // 이엉을 눌러 맨 새끼줄
      const n = 2.5, yD = (x, z) => { const f = Math.pow(Math.pow(Math.abs(x) / hx, n) + Math.pow(Math.abs(z) / hz, n), 1 / n); if (f >= 1) return -0.1; const b = Math.asin(Math.min(1, Math.pow(f, 1 / 0.85))); return h * Math.pow(Math.cos(b), 1.25); };
      const rope = (pts) => B.add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 40, 0.02, 5, false), M.rope, cx, y, cz);
      for (let q = -2; q <= 2; q++) {
        const x = q * hx * 0.3, zl = hz * Math.pow(Math.max(0, 1 - Math.pow(Math.abs(x) / hx, n)), 1 / n), p = [new THREE.Vector3(x, -0.36, -zl * 0.97)];
        for (let i = 0; i <= 24; i++) { const z = -zl * 0.94 + (zl * 1.88 * i) / 24; p.push(new THREE.Vector3(x, yD(x, z) + 0.035, z)); }
        p.push(new THREE.Vector3(x, -0.36, zl * 0.97)); rope(p);
        const z = q * hz * 0.3, xl = hx * Math.pow(Math.max(0, 1 - Math.pow(Math.abs(z) / hz, n)), 1 / n), p2 = [new THREE.Vector3(-xl * 0.97, -0.36, z)];
        for (let i = 0; i <= 24; i++) { const x2 = -xl * 0.94 + (xl * 1.88 * i) / 24; p2.push(new THREE.Vector3(x2, yD(x2, z) + 0.04, z)); }
        p2.push(new THREE.Vector3(xl * 0.97, -0.36, z)); rope(p2);
      }
    }
    const ceilMat = M.thatch.clone(), rafMat = M.bark.clone(); W.noRecv.push(ceilMat, rafMat);
    const bowlP = [[0, 0], [0.03, 0], [0.035, 0.01], [0.055, 0.045], [0.06, 0.07], [0.052, 0.07], [0.03, 0.02], [0, 0.02]].map((p) => new THREE.Vector2(p[0], p[1]));
    const smallMat = new THREE.MeshStandardMaterial({ color: 0x8d897e, roughness: 0.62 }); W.noCast.push(smallMat);
    function addJar(x, z, r, h, y0) {
      const p = [[0, 0], [0.5, 0], [0.92, 0.3], [1, 0.55], [0.84, 0.84], [0.56, 0.95], [0.62, 1.0], [0.52, 1.0]].map((q) => new THREE.Vector2(q[0] * r, q[1] * h));
      B.add(new THREE.LatheGeometry(p, 20), M.onggi, x, y0 || 0, z, 0, rnd() * 6, 0);
      const l = [[0.7, 1.0], [0.66, 1.035], [0.3, 1.09], [0.14, 1.1], [0.12, 1.14], [0, 1.14]].map((q) => new THREE.Vector2(q[0] * r, q[1] * h));
      B.add(new THREE.LatheGeometry(l, 20), M.onggi, x, y0 || 0, z);
    }

    // ================= 서낭당 =================
    {
      const F = 0.3, FI = 0.34, H = 2.5;
      bx(M.stoneWall, -11.45, -7.55, 0, F, -4.95, -1.05, 1.4);
      zones.push({ x0: -11.45, x1: -7.55, z0: -4.95, z1: -1.05, h: F, surf: 'stone' });
      bx(M.stone, -7.55, -7.15, 0, 0.15, -3.62, -2.38, 1.2); zones.push({ x0: -7.55, x1: -7.15, z0: -3.62, z1: -2.38, h: 0.15, surf: 'stone' });
      bx(M.woodFloor, -10.94, -8.06, F, FI, -4.44, -1.56, 1.4, 'x'); zones.push({ x0: -10.94, x1: -8.0, z0: -4.44, z1: -1.56, h: FI, surf: 'wood' });
      // 벽
      bx(M.plaster, -11.06, -10.94, F, H, -4.44, -1.56, 2.2);
      bx(M.plaster, -11.06, -7.94, F, H + 0.004, -4.56, -4.44, 2.2); bx(M.plaster, -11.06, -7.94, F, H + 0.004, -1.56, -1.44, 2.2);
      bx(M.plaster, -8.06, -7.94, F, H, -4.44, -3.58, 2.2); bx(M.plaster, -8.06, -7.94, F, H, -2.42, -1.56, 2.2); bx(M.plaster, -8.06, -7.94, 2.12, H, -3.58, -2.42, 2.2);
      bx(M.wood, -8.09, -7.91, F, 2.0, -3.58, -3.5, 1.2, 'y'); bx(M.wood, -8.09, -7.91, F, 2.0, -2.5, -2.42, 1.2, 'y'); bx(M.wood, -8.1, -7.9, 2.0, 2.12, -3.6, -2.4, 1.2, 'z');
      for (const [px, pz] of [[-11, -4.5], [-8, -4.5], [-11, -1.5], [-8, -1.5]]) bx(M.wood, px - 0.1, px + 0.1, F, H + 0.06, pz - 0.1, pz + 0.1, 1.2, 'y');
      // 띠장 (안팎)
      for (const z of [-4.565, -1.435]) bx(M.wood, -10.9, -8.1, 1.3, 1.38, z - 0.012, z + 0.012, 1.2, 'x');
      bx(M.wood, -11.072, -11.048, 1.3, 1.38, -4.4, -1.6, 1.2, 'z');
      bx(M.wood, -10.94, -10.92, 0.36, 0.44, -4.38, -1.62, 1.2, 'z'); bx(M.wood, -10.9, -8.1, 0.36, 0.44, -4.44, -4.42, 1.2, 'x'); bx(M.wood, -10.9, -8.1, 0.36, 0.44, -1.58, -1.56, 1.2, 'x');
      cb(-11.1, -10.9, -4.5, -1.5); cb(-11.1, -7.9, -4.6, -4.4); cb(-11.1, -7.9, -1.6, -1.4); cb(-8.1, -7.9, -4.5, -3.5); cb(-8.1, -7.9, -2.5, -1.5);
      // 지붕 (기와, 맞배)
      const r = HG.roofGeo({ L: 4.3, D: 2.25, H: 1.05, lift: 0.14, ridgeLift: 0.08, sp: 0.24, tubeR: 0.058, nt: 9, thick: 0.07, rafterSp: 0.3 });
      for (const k of ['top', 'tubes', 'ridge']) B.add(r[k], M.tile, -9.5, H + 0.06, -3.0, 0, Math.PI / 2, 0);
      B.add(r.under, M.plaster2, -9.5, H + 0.06, -3.0, 0, Math.PI / 2, 0); B.add(r.rafters, M.wood, -9.5, H + 0.06, -3.0, 0, Math.PI / 2, 0);
      for (const z of [-4.62, -1.5]) { const tri = new THREE.Shape(); tri.moveTo(-1.62, 0); tri.lineTo(1.62, 0); tri.lineTo(0, 0.98); tri.closePath(); const g = new THREE.ExtrudeGeometry(tri, { depth: 0.12, bevelEnabled: false }); HG.scaleUV(g, 1 / 2.2); B.add(g, M.plaster, -9.5, H, z); }
      bx(M.wood, -10.94, -8.06, 2.36, H - 0.004, -3.07, -2.93, 1.2, 'x');
      // 현판
      const hp = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 0.34), new THREE.MeshStandardMaterial({ roughness: 0.7, map: canvasTex(512, 160, (x) => { x.fillStyle = '#15100b'; x.fillRect(0, 0, 512, 160); x.strokeStyle = '#5a4526'; x.lineWidth = 6; x.strokeRect(6, 6, 500, 148); x.fillStyle = '#c9b88a'; x.font = 'bold 100px "Batang","Gungsuh","Malgun Gothic",serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; ['城', '隍', '堂'].forEach((ch, i) => x.fillText(ch, 400 - i * 144, 84)); }) }));
      hp.rotation.y = Math.PI / 2; hp.position.set(-7.925, 2.31, -3.0); scene.add(hp);
      // 제단
      bx(M.wood, -10.9, -10.28, 0.94, 1.0, -3.95, -2.05, 1.2, 'z');
      for (const z of [-3.88, -2.16]) for (const x of [-10.84, -10.38]) bx(M.wood, x, x + 0.06, FI, 0.94, z, z + 0.06, 1.2, 'y');
      B.add(HG.clothGeo(1.86, 0.56, 16, 6, 71, 0.03), M.quiltRed, -10.265, 0.99, -3.0, 0, Math.PI / 2, 0);
      // 무신도 (서낭신과 범)
      // 무신도: 서낭신과 두 시녀. 민화풍 — 정면 좌상, 무늬 놓은 흰 도포, 깃털 부채, 발아래 구름. 신은 눈을 내리깔고 있다
      const mt = canvasTex(640, 800, (x, w, h) => {
        const r = HG.rng(5), INK = '#1c150d', ln = (wd) => { x.strokeStyle = INK; x.lineWidth = wd; x.lineJoin = 'round'; x.lineCap = 'round'; };
        x.fillStyle = '#b89a5c'; x.fillRect(0, 0, w, h);
        { const g = x.createRadialGradient(320, 360, 80, 320, 400, 560); g.addColorStop(0, 'rgba(214,190,130,0.55)'); g.addColorStop(1, 'rgba(70,48,20,0.6)'); x.fillStyle = g; x.fillRect(0, 0, w, h); }
        const robe = (pts, fill) => { x.fillStyle = fill; x.beginPath(); x.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) { const p = pts[i]; if (p.length === 2) x.lineTo(p[0], p[1]); else x.quadraticCurveTo(p[0], p[1], p[2], p[3]); } x.closePath(); x.fill(); ln(3); x.stroke(); };
        // 눈을 내리깐 얼굴: 윗눈꺼풀이 처지고, 눈동자는 아래로 내려가 반쯤 가렸다
        const face = (cx, cy, k, beard) => {
          x.fillStyle = '#dcc79c'; x.beginPath(); x.ellipse(cx, cy, 44 * k, 56 * k, 0, 0, 7); x.fill(); ln(2); x.stroke();
          // 붓으로 바림한 음영: 눈두덩 · 콧방울 · 볼 · 턱 밑 (선만 있는 얼굴이 되지 않게)
          x.save(); x.beginPath(); x.ellipse(cx, cy, 43 * k, 55 * k, 0, 0, 7); x.clip();
          { const g2 = x.createRadialGradient(cx - 6 * k, cy - 8 * k, 8 * k, cx, cy, 60 * k); g2.addColorStop(0, 'rgba(240,226,190,0.55)'); g2.addColorStop(0.6, 'rgba(200,170,120,0)'); g2.addColorStop(1, 'rgba(120,80,40,0.5)'); x.fillStyle = g2; x.fillRect(cx - 60 * k, cy - 70 * k, 120 * k, 140 * k); }
          x.fillStyle = 'rgba(128,84,44,0.22)'; for (const s of [-1, 1]) { x.beginPath(); x.ellipse(cx + s * 21 * k, cy - 12 * k, 17 * k, 8 * k, 0, 0, 7); x.fill(); x.beginPath(); x.ellipse(cx + s * 27 * k, cy + 22 * k, 10 * k, 16 * k, s * 0.3, 0, 7); x.fill(); }
          x.beginPath(); x.ellipse(cx, cy + 50 * k, 30 * k, 10 * k, 0, 0, 7); x.fill(); x.restore();
          ln(1.2 * k); for (const s of [-1, 1]) { x.beginPath(); x.moveTo(cx + s * 9 * k, cy + 14 * k); x.quadraticCurveTo(cx + s * 17 * k, cy + 24 * k, cx + s * 15 * k, cy + 36 * k); x.stroke(); }   // 팔자 주름
          for (const s of [-1, 1]) {
            ln(4 * k); x.beginPath(); x.moveTo(cx + s * 8 * k, cy - 24 * k); x.quadraticCurveTo(cx + s * 22 * k, cy - 32 * k, cx + s * 36 * k, cy - 22 * k); x.stroke();          // 눈썹
            { const ex = cx + s * 21 * k, ey = cy - 3 * k;   // 반쯤 내리감은 눈: 흰자위 아래쪽에 눈동자가 걸리고, 윗눈꺼풀이 절반을 덮는다
              x.fillStyle = '#f2ead6'; x.beginPath(); x.ellipse(ex, ey, 14 * k, 7 * k, 0, 0, 7); x.fill();
              x.fillStyle = INK; x.beginPath(); x.arc(ex, ey + 3.2 * k, 4.6 * k, 0, 7); x.fill();
              x.fillStyle = '#e2cfa6'; x.fillRect(ex - 16 * k, ey - 9 * k, 32 * k, 9.5 * k);
              ln(1.3 * k); x.beginPath(); x.moveTo(ex - 14 * k, ey); x.quadraticCurveTo(ex, ey + 9.5 * k, ex + 14 * k, ey); x.stroke();
              ln(3.4 * k); x.beginPath(); x.moveTo(ex - 15.5 * k, ey - 0.5 * k); x.quadraticCurveTo(ex, ey + 2.2 * k, ex + 15.5 * k, ey - 0.5 * k); x.stroke();
              ln(1.1 * k); x.beginPath(); x.moveTo(ex - 13 * k, ey - 6.5 * k); x.quadraticCurveTo(ex, ey - 10 * k, ex + 13 * k, ey - 6.5 * k); x.stroke(); }
            if (0) x.fill();                                             // 아래로 내려간 눈동자 (윗부분은 눈꺼풀에 가림)
           // 처진 윗눈꺼풀
         // 아랫눈꺼풀
          }
          ln(2 * k); x.beginPath(); x.moveTo(cx - 3 * k, cy - 6 * k); x.lineTo(cx - 6 * k, cy + 16 * k); x.lineTo(cx + 5 * k, cy + 17 * k); x.stroke();
          if (beard) {
            // 가늘게 늘어진 수염과 다문 입 (만화 같은 팔자수염이 되지 않게)
            x.fillStyle = '#8e2a1e'; x.beginPath(); x.ellipse(cx, cy + 31 * k, 8 * k, 3.2 * k, 0, 0, 7); x.fill();
            for (const s of [-1, 1]) { ln(2.6 * k); x.beginPath(); x.moveTo(cx + s * 3 * k, cy + 23 * k); x.quadraticCurveTo(cx + s * 16 * k, cy + 24 * k, cx + s * 24 * k, cy + 46 * k); x.stroke(); ln(1.2 * k); for (let j = 0; j < 3; j++) { x.beginPath(); x.moveTo(cx + s * (10 + j * 4) * k, cy + 27 * k); x.quadraticCurveTo(cx + s * (18 + j * 3) * k, cy + 34 * k, cx + s * (22 + j * 2) * k, cy + (52 + j * 4) * k); x.stroke(); } }
            x.fillStyle = INK;
            x.beginPath(); x.moveTo(cx - 12 * k, cy + 38 * k); x.quadraticCurveTo(cx, cy + 34 * k, cx + 12 * k, cy + 38 * k); x.quadraticCurveTo(cx + 8 * k, cy + 84 * k, cx, cy + 98 * k); x.quadraticCurveTo(cx - 8 * k, cy + 84 * k, cx - 12 * k, cy + 38 * k); x.fill();
          } else { x.fillStyle = '#7a2a20'; x.beginPath(); x.moveTo(cx - 8 * k, cy + 30 * k); x.quadraticCurveTo(cx, cy + 26 * k, cx + 8 * k, cy + 30 * k); x.quadraticCurveTo(cx, cy + 35 * k, cx - 8 * k, cy + 30 * k); x.fill(); ln(1 * k); x.beginPath(); x.moveTo(cx - 9 * k, cy + 30 * k); x.lineTo(cx + 9 * k, cy + 30 * k); x.stroke(); }
        };
        // 시녀 둘과 긴 자루 부채
        for (const s of [-1, 1]) {
          const cx = 320 + s * 236;
          robe([[cx - 78, 800], [cx - 86, 430, cx - 50, 290], [cx + 50, 290], [cx + 86, 430, cx + 78, 800]], s < 0 ? '#3f6a5e' : '#3f6a5e');
          robe([[cx - 52, 520], [cx - 70, 380, cx - 40, 300], [cx + 40, 300], [cx + 70, 380, cx + 52, 520]], '#8e2a1e');
          robe([[cx - 30, 430], [cx - 34, 340, cx, 300], [cx + 34, 340, cx + 30, 430]], '#2c3f63');
          x.fillStyle = INK; x.beginPath(); x.ellipse(cx, 172, 46, 40, 0, 3.14, 6.28); x.fill(); x.beginPath(); x.arc(cx, 130, 20, 0, 7); x.fill();
          x.fillStyle = '#b08a2c'; x.fillRect(cx - 18, 142, 36, 7); x.fillStyle = '#8e2a1e'; x.beginPath(); x.arc(cx, 118, 6, 0, 7); x.fill();
          face(cx, 200, 0.78, false);
          const fx = 320 + s * 150; ln(5); x.strokeStyle = '#3b2512'; x.beginPath(); x.moveTo(cx - s * 30, 400); x.lineTo(fx, 150); x.stroke();
          x.fillStyle = '#9a7a44'; x.beginPath(); x.ellipse(fx - 14, 96, 22, 46, -0.15, 0, 7); x.ellipse(fx + 14, 96, 22, 46, 0.15, 0, 7); x.fill(); ln(2.5); x.stroke();
          x.fillStyle = 'rgba(40,26,12,0.55)'; for (let i = 0; i < 26; i++) { x.beginPath(); x.arc(fx - 30 + r() * 60, 58 + r() * 76, 1.8, 0, 7); x.fill(); }
          x.fillStyle = '#e2cfa6'; x.beginPath(); x.ellipse(cx - s * 30, 404, 16, 12, 0, 0, 7); x.fill(); ln(2); x.stroke();
        }
        // 서낭신: 넓은 흰 도포
        robe([[92, 800], [80, 560, 150, 392], [236, 330], [404, 330], [490, 392], [560, 560, 548, 800]], '#e6dfcd');
        // 도포의 둥근 꽃무늬
        const roundel = (cx, cy, rr) => { x.strokeStyle = 'rgba(70,74,82,0.75)'; x.lineWidth = 2; x.beginPath(); x.arc(cx, cy, rr, 0, 7); x.stroke(); x.beginPath(); x.arc(cx, cy, rr * 0.45, 0, 7); x.stroke(); for (let i = 0; i < 8; i++) { const a = (i / 8) * 6.283; x.beginPath(); x.ellipse(cx + Math.cos(a) * rr * 0.72, cy + Math.sin(a) * rr * 0.72, rr * 0.26, rr * 0.14, a, 0, 7); x.stroke(); } };
        [[160, 470, 26], [150, 600, 30], [230, 700, 30], [320, 610, 32], [410, 700, 30], [492, 600, 30], [480, 470, 26], [250, 520, 22], [395, 520, 22], [320, 745, 26], [205, 400, 20], [436, 400, 20]].forEach((q) => roundel(q[0], q[1], q[2]));
        for (let i = 0; i < 60; i++) { x.fillStyle = 'rgba(176,138,44,0.5)'; x.beginPath(); x.arc(110 + r() * 420, 380 + r() * 400, 2.2, 0, 7); x.fill(); }
        // 깃과 소맷부리의 검푸른 띠 (금빛 번개무늬)
        const band = (pts) => { x.strokeStyle = '#1f2a3c'; x.lineWidth = 26; x.lineJoin = 'round'; x.beginPath(); x.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) x.lineTo(pts[i][0], pts[i][1]); x.stroke(); x.strokeStyle = '#b08a2c'; x.lineWidth = 2.5; x.setLineDash([9, 7]); x.beginPath(); x.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) x.lineTo(pts[i][0], pts[i][1]); x.stroke(); x.setLineDash([]); };
        band([[262, 336], [318, 440], [372, 336]]); band([[372, 470], [400, 640], [384, 790]]);
        // 손과 홀, 깃털 부채
        x.fillStyle = '#e2cfa6'; x.beginPath(); x.ellipse(128, 610, 34, 20, -0.5, 0, 7); x.fill(); ln(2.5); x.stroke();
        x.fillStyle = '#5a2418'; x.fillRect(236, 420, 112, 62); ln(3); x.strokeRect(236, 420, 112, 62); x.fillStyle = '#b08a2c'; x.fillRect(246, 430, 92, 14); x.fillRect(262, 452, 60, 18);
        for (let i = 0; i < 9; i++) { const a = -2.5 + i * 0.33; x.fillStyle = '#f1ece0'; x.beginPath(); x.ellipse(392 + Math.cos(a) * 54, 420 + Math.sin(a) * 54, 46, 13, a, 0, 7); x.fill(); ln(1.6); x.stroke(); }
        x.fillStyle = '#e2cfa6'; x.beginPath(); x.ellipse(372, 446, 26, 18, 0.4, 0, 7); x.fill(); ln(2.5); x.stroke();
        // 얼굴과 관
        x.fillStyle = INK; x.beginPath(); x.moveTo(250, 196); x.quadraticCurveTo(250, 108, 320, 96); x.quadraticCurveTo(390, 108, 390, 196); x.closePath(); x.fill();
        x.fillStyle = '#b08a2c'; x.fillRect(254, 176, 132, 12); for (let i = 0; i < 7; i++) { x.fillStyle = i % 2 ? '#8e2a1e' : '#3f6a5e'; x.beginPath(); x.arc(266 + i * 18, 150 - Math.sin((i / 6) * 3.14) * 22, 6, 0, 7); x.fill(); }
        x.fillStyle = INK; x.fillRect(214, 190, 40, 9); x.fillRect(386, 190, 40, 9);
        face(320, 250, 1.12, true);
        x.fillStyle = '#e2cfa6'; for (const s of [-1, 1]) { x.beginPath(); x.ellipse(320 + s * 52, 252, 8, 18, 0, 0, 7); x.fill(); ln(2); x.stroke(); }
        // 발아래 구름
        // (물결처럼 줄지어 늘어서지 않게, 뭉게뭉게 말린 구름 덩이를 흩어 놓는다)
        x.fillStyle = 'rgba(86,96,80,0.55)'; x.fillRect(0, 716, w, 84);
        for (let i = 0; i < 9; i++) {
          const cx = 40 + i * 72 + (r() - 0.5) * 24, cy = 716 + (i % 3) * 22 + r() * 10, sc = 0.85 + r() * 0.5;
          x.fillStyle = i % 2 ? '#c9c2ae' : '#b3b6a8';
          x.beginPath(); for (const [ox, oy, rr] of [[-34, 8, 22], [-12, -8, 26], [16, -4, 24], [38, 10, 18], [0, 14, 30]]) { x.moveTo(cx + ox * sc + rr * sc, cy + oy * sc); x.arc(cx + ox * sc, cy + oy * sc, rr * sc, 0, 7); } x.fill();
          ln(2);
          for (const [ox, oy, rr] of [[-34, 8, 22], [-12, -8, 26], [16, -4, 24], [38, 10, 18]]) { x.beginPath(); x.arc(cx + ox * sc, cy + oy * sc, rr * sc, 3.3, 6.1); x.stroke(); }
          for (const [ox, oy] of [[-12, -4], [18, 0]]) { x.beginPath(); for (let q = 0; q < 26; q++) { const a = q * 0.42, rr = (2 + q * 0.5) * sc; const px = cx + ox * sc + Math.cos(a) * rr, py = cy + oy * sc + Math.sin(a) * rr; if (q) x.lineTo(px, py); else x.moveTo(px, py); } x.stroke(); }   // 소용돌이
          ln(1.6); x.beginPath(); x.moveTo(cx + 50 * sc, cy + 16 * sc); x.quadraticCurveTo(cx + 76 * sc, cy + 10 * sc, cx + 92 * sc, cy + 22 * sc); x.stroke();   // 꼬리
        }
        // 세월: 얼룩, 꺾인 자국, 벗겨진 안료
        for (let i = 0; i < 4200; i++) { x.fillStyle = `rgba(${r() < 0.55 ? '36,24,10' : '214,196,150'},${r() * 0.13})`; x.fillRect(r() * w, r() * h, 1 + r() * 4, 1 + r() * 4); }
        for (let i = 0; i < 5; i++) { x.strokeStyle = 'rgba(40,26,10,0.22)'; x.lineWidth = 1.5; x.beginPath(); const px = 60 + r() * 520; x.moveTo(px, 0); x.lineTo(px + (r() - 0.5) * 30, h); x.stroke(); }
        { const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, 'rgba(30,20,8,0.35)'); g.addColorStop(0.2, 'rgba(30,20,8,0)'); g.addColorStop(0.85, 'rgba(30,20,8,0)'); g.addColorStop(1, 'rgba(30,20,8,0.4)'); x.fillStyle = g; x.fillRect(0, 0, w, h); }
        x.strokeStyle = '#3b2512'; x.lineWidth = 16; x.strokeRect(8, 8, w - 16, h - 16);
      });
      const mu = new THREE.Mesh(new THREE.PlaneGeometry(1.08, 1.35), new THREE.MeshStandardMaterial({ map: mt, roughness: 0.95, color: 0xa8a49c })); mu.rotation.y = Math.PI / 2; mu.position.set(-10.93, 1.7, -3.0); scene.add(mu);
      bx(M.wood, -10.935, -10.915, 2.375, 2.415, -3.58, -2.42, 1.2, 'z'); bx(M.wood, -10.935, -10.915, 1.005, 1.035, -3.58, -2.42, 1.2, 'z');
      proxy('musindo', -10.85, 1.7, -3.0, 0.2, 1.35, 1.1);
      // 제물과 촛대
      W.candle = { x: -10.6, y: 1.235, z: -3.62 };
      for (const z of [-3.62, -2.38]) { B.add(HG.cyl(0.012, 0.034, 0.2, 8, 1), M.brass, -10.6, 1.1, z); B.add(HG.cyl(0.011, 0.012, 0.07, 8, 1), M.wax, -10.6, 1.2 + 0.035, z); }
      [[-10.5, -3.3], [-10.5, -3.0], [-10.5, -2.7], [-10.72, -3.15], [-10.72, -2.85]].forEach((p, i) => { B.add(new THREE.LatheGeometry(bowlP, 16), i % 2 ? M.brass : smallMat, p[0], 1.0, p[1]); if (i < 3) B.add(new THREE.SphereGeometry(0.05, 10, 7, 0, 6.3, 0, 1.5), smallMat, p[0], 1.05, p[1]); });
      { const g = new THREE.PlaneGeometry(0.2, 0.3); g.rotateX(-Math.PI / 2); B.add(g, M.letter2, -10.46, 1.004, -2.2, 0, 0.3, 0); }
      proxy('note2', -10.45, 1.08, -2.2, 0.4, 0.25, 0.45);
      proxy('key', -10.2, 0.62, -3.0, 0.25, 0.6, 1.7);
      cb(-10.94, -10.24, -3.98, -2.02);
      // 들보에 건 오색 천
      for (let i = 0; i < 5; i++) { const m = new THREE.Mesh(HG.clothGeo(0.1, 0.3 + (i % 3) * 0.07, 3, 8, 800 + i, 0.02), M.cloth[i]); m.position.set(-10.3 + i * 0.42, 2.44, i % 2 ? -4.34 : -1.66); m.castShadow = false; scene.add(m); }   // 눈높이 위에서 짧게 드리운다
      // 문
      const g = new THREE.Group(), b = new HG.Builder();
      b.add(HG.box(1.0, 1.68, 0.045, 1.3, 'y'), M.woodPlank, 0.5, 0.84, 0);
      b.add(HG.box(0.96, 0.08, 0.03, 1.2, 'x'), M.wood, 0.5, 0.36, 0.036); b.add(HG.box(0.96, 0.08, 0.03, 1.2, 'x'), M.wood, 0.5, 1.34, 0.036);
      b.add(new THREE.TorusGeometry(0.04, 0.008, 5, 12), M.iron, 0.86, 0.9, 0.04);
      b.build(g); g.position.set(-7.86, FI - 0.02, -3.5); g.rotation.y = -Math.PI / 2; scene.add(g);
      W.doors.shrine = { group: g, closed: -Math.PI / 2, open: -Math.PI / 2 + 1.75, t: 0, target: 0, col: cb(-8.1, -7.9, -3.5, -2.5), key: 'doorShrine' };
      proxy('doorShrine', -7.9, 1.15, -3.0, 0.3, 1.7, 1.0);
      // 금줄
      B.add(HG.cyl(0.012, 0.012, 1.5, 5, 0.3), M.rope, -7.84, 2.14, -3.0, Math.PI / 2, 0, 0);
      for (let i = 0; i < 6; i++) { const m = new THREE.Mesh(HG.clothGeo(0.035, 0.16 + rnd() * 0.12, 2, 6, 820 + i, 0.01), M.hanji); m.position.set(-7.835, 2.13, -3.6 + i * 0.24); m.rotation.y = Math.PI / 2; scene.add(m); }
    }

    // ================= 당지기 움막 · 화톳불 =================
    {
      const H = 2.05;
      bx(M.mud, 7.9, 8.1, 0, H, 5.5, 6.5, 2); bx(M.mud, 7.9, 8.1, 0, H, 7.5, 8.5, 2); bx(M.mud, 7.9, 8.1, 1.74, H, 6.5, 7.5, 2);
      bx(M.mud, 11.1, 11.3, 0, H, 5.5, 8.5, 2); bx(M.mud, 7.9, 11.3, 0, H + 0.004, 5.3, 5.5, 2); bx(M.mud, 7.9, 11.3, 0, H + 0.004, 8.5, 8.7, 2);
      bx(M.wood, 7.88, 8.12, 1.66, 1.74, 6.44, 7.56, 1.2, 'z');
      for (const z of [6.5, 7.44]) bx(M.wood, 7.885, 8.115, 0, 1.66, z, z + 0.06, 1.2, 'y');
      for (const [px, pz] of [[8, 5.4], [11.2, 5.4], [8, 8.6], [11.2, 8.6]]) B.add(HG.cyl(0.085, 0.1, H + 0.06, 8, 1.2), M.bark, px, (H + 0.06) / 2, pz);
      cb(7.9, 8.1, 5.4, 6.5); cb(7.9, 8.1, 7.5, 8.6); cb(11.1, 11.3, 5.4, 8.6); cb(7.9, 11.3, 5.3, 5.5); cb(7.9, 11.3, 8.5, 8.7);
      bx(M.mud, 8.1, 11.1, -0.05, 0.012, 5.5, 8.5, 2.6);
      thatchRoof(9.6, 7.0, 2.55, 2.55, 1.4, H + 0.02, 1.72, 1.72, 21);
      bx(ceilMat, 7.95, 11.25, H + 0.1, H + 0.18, 5.35, 8.65, 0.7);
      for (let i = 0; i < 7; i++) B.add(HG.cyl(0.04, 0.045, 3.3, 7, 1.2), rafMat, 8.3 + i * 0.44, H + 0.07, 7.0 + (i % 2 ? 0.04 : -0.04), Math.PI / 2, 0, 0);
      for (const z of [5.52, 8.48]) bx(M.mud, 8.12, 11.08, H, H + 0.1, z - 0.02, z + 0.02, 3);
      bx(M.mud, 8.1, 8.14, H + 0.004, H + 0.1, 5.545, 8.455, 3); bx(M.mud, 11.06, 11.1, H + 0.004, H + 0.1, 5.545, 8.455, 3);
      // 말아 올린 거적문
      B.add(HG.cyl(0.07, 0.07, 1.05, 10, 0.6), M.thatch, 7.84, 1.6, 7.0, Math.PI / 2, 0, 0);
      // 안: 짚자리 · 궤 · 등잔 · 물동이
      bx(M.thatch, 9.3, 11.0, 0.012, 0.09, 7.5, 8.4, 0.8); B.add(HG.clothGeo(1.5, 0.8, 10, 6, 61, 0.032), M.hemp, 10.15, 0.15, 7.55, -Math.PI / 2, 0, 0);
      { const g = new THREE.SphereGeometry(1, 12, 8); g.scale(0.2, 0.07, 0.11); B.add(g, M.hemp, 10.75, 0.15, 8.2); }
      bx(M.wood, 10.3, 11.0, 0, 0.42, 5.6, 6.1, 1.2, 'x'); bx(M.iron, 10.62, 10.68, 0.24, 0.34, 6.1, 6.108);
      { const g = new THREE.PlaneGeometry(0.22, 0.3); g.rotateX(-Math.PI / 2); B.add(g, M.letter, 10.55, 0.424, 5.85, 0, 0.25, 0); }
      proxy('note1', 10.55, 0.52, 5.85, 0.5, 0.3, 0.5); cb(10.3, 11.0, 5.5, 6.1);
      B.add(HG.cyl(0.05, 0.07, 0.03, 10, 1), M.onggi, 10.9, 0.435, 5.75); B.add(HG.cyl(0.006, 0.006, 0.05, 5, 1), M.black, 10.9, 0.47, 5.75);
      addJar(8.5, 8.1, 0.26, 0.6, 0); cc(8.5, 8.1, 0.3);
      for (const s of [-0.06, 0.06]) { const g = new THREE.SphereGeometry(1, 10, 6); g.scale(0.045, 0.02, 0.12); B.add(g, M.thatch, 8.45 + s, 0.03, 6.2, 0, 1.2, 0); }
      B.add(HG.cyl(0.016, 0.02, 1.5, 6, 1), M.woodPale, 8.25, 0.75, 5.75, 0.1, 0, 0.08);
      proxy('bed', 10.15, 0.25, 7.95, 1.6, 0.4, 0.8);
      // 살림살이: 시렁의 그릇과 단지, 벽에 건 도롱이 · 약초 · 새끼 타래, 화로와 소반, 구석의 망태와 호미
      bx(M.woodPale, 8.3, 10.2, 1.3, 1.33, 5.52, 5.82, 1.2, 'x'); for (const x of [8.5, 9.25, 10.0]) bx(M.wood, x - 0.02, x + 0.02, 1.14, 1.3, 5.52, 5.8, 1, 'z');
      addJar(8.55, 5.68, 0.11, 0.24, 1.33); addJar(8.9, 5.67, 0.14, 0.3, 1.33); addJar(9.9, 5.68, 0.1, 0.2, 1.33);
      for (let i = 0; i < 4; i++) B.add(new THREE.LatheGeometry(bowlP, 16), i % 2 ? smallMat : M.onggi, 9.22 + i * 0.15, 1.33, 5.67, i % 2 ? Math.PI : 0, 0, 0);
      { const g = new THREE.CylinderGeometry(0.1, 0.42, 0.95, 14, 6, true); const p = g.attributes.position; for (let i = 0; i < p.count; i++) { const a = Math.atan2(p.getZ(i), p.getX(i)); p.setY(i, p.getY(i) + Math.sin(a * 9) * 0.02); } g.scale(1, 1, 0.3); B.add(g, M.thatch, 11.02, 1.2, 7.1, 0, Math.PI / 2, 0); B.add(HG.cyl(0.012, 0.012, 0.3, 5, 1), M.wood, 11.07, 1.72, 7.1, 0, 0, Math.PI / 2); }   // 도롱이
      for (let i = 0; i < 5; i++) { B.add(HG.cyl(0.035, 0.012, 0.34 + (i % 2) * 0.08, 7, 0.5), i % 2 ? M.thatch : M.hemp, 9.0 + i * 0.3, 1.72 - (i % 2) * 0.04, 8.43, 0.1, 0, (i - 2) * 0.05); }   // 말린 약초 다발
      B.add(new THREE.TorusGeometry(0.15, 0.032, 6, 14), M.rope, 10.55, 1.45, 8.46); B.add(new THREE.TorusGeometry(0.12, 0.028, 6, 14), M.rope, 10.57, 1.4, 8.44, 0.2, 0, 0.5);
      { const hp = [[0, 0], [0.13, 0], [0.16, 0.06], [0.17, 0.16], [0.15, 0.2], [0.12, 0.2], [0.12, 0.06], [0, 0.05]].map((q) => new THREE.Vector2(q[0], q[1])); B.add(new THREE.LatheGeometry(hp, 16), M.iron, 9.1, 0, 6.3); B.add(new THREE.CircleGeometry(0.115, 14), M.black, 9.1, 0.17, 6.3, -Math.PI / 2, 0, 0); cc(9.1, 6.3, 0.2); }   // 식은 화로
      B.add(new THREE.CylinderGeometry(0.2, 0.2, 0.02, 12), M.wood, 9.75, 0.22, 6.35); for (let i = 0; i < 3; i++) B.add(HG.box(0.022, 0.21, 0.022, 1, 'y'), M.wood, 9.75 + Math.cos(i * 2.1) * 0.14, 0.105, 6.35 + Math.sin(i * 2.1) * 0.14);
      B.add(new THREE.LatheGeometry(bowlP, 16), smallMat, 9.72, 0.23, 6.38); B.add(HG.cyl(0.004, 0.004, 0.2, 4, 1), M.woodPale, 9.83, 0.238, 6.3, 0, 0.4, Math.PI / 2);
      { const g = new THREE.SphereGeometry(0.2, 12, 8, 0, 6.3, 1.2, 1.94); g.scale(1, 1.1, 0.75); B.add(g, M.thatch, 10.9, 0.24, 6.75); B.add(new THREE.TorusGeometry(0.1, 0.012, 5, 12, 3.2), M.rope, 10.9, 0.3, 6.75, 0, Math.PI / 2, 0); }   // 망태
      B.add(HG.cyl(0.013, 0.015, 0.42, 6, 1), M.wood, 8.22, 0.22, 8.25, 0.35, 0, 0.1); B.add(HG.box(0.09, 0.012, 0.13, 1), M.iron, 8.2, 0.44, 8.34, 0.9, 0, 0);   // 호미
      bx(M.thatch, 8.15, 9.1, 0.012, 0.03, 6.55, 7.45, 0.8);   // 문간 멍석
      // 밖: 지게 · 장작
      for (const s of [-0.22, 0.22]) B.add(HG.cyl(0.03, 0.04, 1.5, 7, 1), M.woodPale, 7.62, 0.72, 5.9 + s, 0, 0, -0.32);
      for (const y of [0.5, 0.95]) B.add(HG.cyl(0.02, 0.02, 0.5, 6, 1), M.woodPale, 7.55 + (y - 0.5) * 0.3, y, 5.9, Math.PI / 2, 0, 0);
      for (let i = 0; i < 9; i++) B.add(HG.cyl(0.04, 0.05, 0.55, 7, 0.6), M.bark, 7.55, 0.05 + Math.floor(i / 3) * 0.09, 7.95 + (i % 3) * 0.11, 0, 0, Math.PI / 2);
      cb(7.3, 7.9, 7.8, 8.4);
      // 화톳불
      const fx = 5.4, fz = 7.0; W.FIRE = { x: fx, z: fz };
      for (let i = 0; i < 10; i++) { const a = (i / 10) * 6.28 + rnd() * 0.2; B.add(HG.rockGeo(1500 + i, 0.11 + rnd() * 0.04, 0.08, 0.09), M.rock, fx + Math.cos(a) * 0.43, 0.05, fz + Math.sin(a) * 0.43, 0, -a, 0); }
      const char = new THREE.MeshStandardMaterial({ map: HG.T.bark.map, normalMap: HG.T.bark.normalMap, color: 0x2a2624, roughness: 1 });
      for (let i = 0; i < 7; i++) { const a = (i / 7) * 3.14 + rnd(); B.add(HG.cyl(0.035, 0.045, 0.6 + rnd() * 0.2, 7, 0.6), char, fx + Math.cos(a) * 0.05, 0.08 + i * 0.012, fz + Math.sin(a) * 0.05, Math.PI / 2 - 0.25 + rnd() * 0.2, a, 0); }
      for (let i = 0; i < 9; i++) {
        const a = (i / 9) * 6.28 + rnd() * 0.3, l = 0.62 + rnd() * 0.18, q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(-Math.cos(a) * 0.62, 0.78, -Math.sin(a) * 0.62).normalize()), e = new THREE.Euler().setFromQuaternion(q);
        B.add(HG.cyl(0.03, 0.045, l, 7, 0.6), i % 3 ? char : M.bark, fx + Math.cos(a) * 0.17, 0.27, fz + Math.sin(a) * 0.17, e.x, e.y, e.z);
      }
      const et = canvasTex(256, 256, (ex) => {
        ex.fillStyle = '#0a0706'; ex.fillRect(0, 0, 256, 256);
        for (let i = 0; i < 420; i++) { const a = rnd() * 6.28, r = Math.pow(rnd(), 0.7) * 118, px = 128 + Math.cos(a) * r, py = 128 + Math.sin(a) * r, s = 3 + rnd() * 9, hot = 1 - r / 130; const g = ex.createRadialGradient(px, py, 0, px, py, s); g.addColorStop(0, `rgba(255,${(120 + 110 * hot * rnd()) | 0},${(20 + 60 * hot * rnd()) | 0},${0.35 + 0.6 * hot})`); g.addColorStop(1, 'rgba(120,20,0,0)'); ex.fillStyle = g; ex.fillRect(px - s, py - s, s * 2, s * 2); }
      });
      const em = new THREE.MeshStandardMaterial({ map: et, emissiveMap: et, emissive: 0xffffff, emissiveIntensity: 1.6, roughness: 1 });
      const bed = new THREE.Mesh(new THREE.CircleGeometry(0.36, 20), em); bed.rotation.x = -Math.PI / 2; bed.position.set(fx, 0.045, fz); scene.add(bed);
      const mound = new THREE.Mesh(new THREE.SphereGeometry(0.2, 14, 8, 0, 6.3, 0, 1.3), em); mound.scale.set(1, 0.45, 1); mound.position.set(fx, 0.03, fz); scene.add(mound);
      W.fireMat = em; cc(fx, fz, 0.55); proxy('fire', fx, 0.45, fz, 1.3, 1.0, 1.3);
      // 불가의 통나무 걸상
      B.add(HG.cyl(0.2, 0.22, 0.36, 12, 1), M.bark, fx - 1.1, 0.18, fz + 0.5); cc(fx - 1.1, fz + 0.5, 0.26);
    }

    // ================= 곳집 (상엿집) =================
    {
      const H = 2.2, cx = 10.6, cz = -4.8;
      for (const [z0, z1] of [[-7.13, -5.46], [-4.14, -2.47]]) bx(M.woodPlank, 8.13, 8.27, 0, H, z0, z1, 1.4, 'y');
      bx(M.woodPlank, 8.13, 8.27, 1.92, H, -5.46, -4.14, 1.4, 'y');
      bx(M.woodPlank, 12.93, 13.07, 0, H, -7.13, -2.47, 1.4, 'y'); bx(M.woodPlank, 8.13, 13.07, 0, H + 0.004, -7.27, -7.13, 1.4, 'y'); bx(M.woodPlank, 8.13, 13.07, 0, H + 0.004, -2.47, -2.33, 1.4, 'y');
      bx(M.wood, 8.11, 8.29, 0, 1.84, -5.46, -5.4, 1.2, 'y'); bx(M.wood, 8.11, 8.29, 0, 1.84, -4.2, -4.14, 1.2, 'y'); bx(M.wood, 8.1, 8.3, 1.84, 1.92, -5.48, -4.12, 1.2, 'z');
      for (const [px, pz] of [[8.2, -7.2], [13, -7.2], [8.2, -2.4], [13, -2.4]]) bx(M.wood, px - 0.11, px + 0.11, 0.2, H + 0.05, pz - 0.11, pz + 0.11, 1.2, 'y');
      bx(M.stoneWall, 8.02, 13.18, 0, 0.2, -7.38, -7.02, 1.4); bx(M.stoneWall, 8.02, 13.18, 0, 0.2, -2.58, -2.22, 1.4);
      bx(M.stoneWall, 12.84, 13.16, 0, 0.196, -7.02, -2.58, 1.4); bx(M.stoneWall, 8.04, 8.36, 0, 0.196, -7.02, -5.46, 1.4); bx(M.stoneWall, 8.04, 8.36, 0, 0.196, -4.14, -2.58, 1.4);
      cb(8.1, 8.3, -7.2, -5.4); cb(8.1, 8.3, -4.2, -2.4); cb(12.9, 13.1, -7.2, -2.4); cb(8.1, 13.1, -7.3, -7.1); cb(8.1, 13.1, -2.5, -2.3);
      bx(M.mud, 8.27, 12.93, -0.05, 0.012, -7.13, -2.47, 2.6);
      thatchRoof(cx, cz, 3.4, 3.4, 1.55, H + 0.02, 2.56, 2.56, 9);
      bx(ceilMat, 8.1, 13.1, H + 0.1, H + 0.18, -7.3, -2.3, 0.7);
      for (let i = 0; i < 10; i++) B.add(HG.cyl(0.045, 0.05, 5.0, 7, 1.2), rafMat, 8.5 + i * 0.47, H + 0.07, cz + (i % 2 ? 0.05 : -0.05), Math.PI / 2, 0, 0);
      for (const z of [-7.11, -2.49]) bx(M.mud, 8.32, 12.88, H, H + 0.1, z - 0.014, z + 0.014, 3);
      bx(M.mud, 8.275, 8.315, H + 0.004, H + 0.1, -7.08, -2.52, 3); bx(M.mud, 12.885, 12.925, H + 0.004, H + 0.1, -7.08, -2.52, 3);
      for (const z of [-6.0, -3.6]) bx(M.wood, 8.3, 12.9, 1.98, H - 0.004, z - 0.07, z + 0.07, 1.2, 'x');
      // ---- 상여 ----
      const sx = 11.0, sz = -4.8;
      for (const s of [-0.45, 0.45]) B.add(HG.cyl(0.045, 0.045, 4.1, 8, 1.2), M.woodPale, sx + s, 0.56, sz, Math.PI / 2, 0, 0);   // 긴 채
      for (const z of [-1.7, -0.6, 0.6, 1.7]) B.add(HG.cyl(0.035, 0.035, 1.5, 7, 1), M.woodPale, sx, 0.5, sz + z, 0, 0, Math.PI / 2);   // 가로대
      for (const z of [-1.3, 1.3]) for (const s of [-0.4, 0.4]) bx(M.wood, sx + s - 0.06, sx + s + 0.06, 0, 0.5, sz + z - 0.06, sz + z + 0.06, 1, 'y');   // 받침
      bx(M.wood, sx - 0.43, sx + 0.43, 0.61, 0.7, sz - 1.15, sz + 1.15, 1.2, 'z');
      // 단청을 올린 몸체와 지붕 (연꽃 · 구름 · 빗살 무늬)
      const rep = (t) => { t.wrapS = t.wrapT = THREE.RepeatWrapping; return t; };
      const bodyMat = new THREE.MeshStandardMaterial({ roughness: 0.85, map: rep(canvasTex(512, 512, (x, w, h) => {
        const r = HG.rng(41); x.fillStyle = '#1c2f4e'; x.fillRect(0, 0, w, h);
        x.fillStyle = '#7d1d15'; x.fillRect(0, 0, w, 46); x.fillRect(0, h - 46, w, 46); x.fillStyle = '#b08a2c'; x.fillRect(0, 46, w, 10); x.fillRect(0, h - 56, w, 10);
        for (let i = 0; i < 4; i++) { const cx = 64 + i * 128, cy = 256;
          for (let k = 0; k < 8; k++) { const a = (k / 8) * 6.28; x.fillStyle = k % 2 ? '#b9492f' : '#c9b48a'; x.beginPath(); x.ellipse(cx + Math.cos(a) * 30, cy + Math.sin(a) * 30, 26, 13, a, 0, 7); x.fill(); }
          x.fillStyle = '#b08a2c'; x.beginPath(); x.arc(cx, cy, 14, 0, 7); x.fill();
          x.strokeStyle = '#8fa3a8'; x.lineWidth = 6; for (const yy of [120, 392]) { x.beginPath(); x.arc(cx - 20, yy, 18, 3.4, 6.2); x.arc(cx + 14, yy - 4, 22, 3.3, 6.2); x.stroke(); } }
        for (let i = 0; i < 2600; i++) { x.fillStyle = `rgba(${r() < 0.6 ? '10,8,6' : '160,150,130'},${r() * 0.18})`; x.fillRect(r() * w, r() * h, 1 + r() * 4, 1 + r() * 4); }
      })) });
      const roofMat = new THREE.MeshStandardMaterial({ roughness: 0.85, map: rep(canvasTex(512, 512, (x, w, h) => {
        const r = HG.rng(42); x.fillStyle = '#6d1a13'; x.fillRect(0, 0, w, h);
        x.strokeStyle = '#a8842a'; x.lineWidth = 7; for (let i = -8; i < 16; i++) { x.beginPath(); x.moveTo(i * 64, 0); x.lineTo(i * 64 + 512, 512); x.stroke(); x.beginPath(); x.moveTo(i * 64 + 512, 0); x.lineTo(i * 64, 512); x.stroke(); }
        x.fillStyle = '#23462f'; for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) { x.beginPath(); x.arc(i * 64 + 32, j * 64 + 32, 8, 0, 7); x.fill(); }
        for (let i = 0; i < 2600; i++) { x.fillStyle = `rgba(${r() < 0.6 ? '10,8,6' : '170,150,120'},${r() * 0.18})`; x.fillRect(r() * w, r() * h, 1 + r() * 4, 1 + r() * 4); }
      })) });
      bx(bodyMat, sx - 0.4, sx + 0.4, 0.7, 1.22, sz - 1.1, sz + 1.1, 0.52);
      for (const z of [-1.1, 1.1]) for (const s of [-0.4, 0.4]) bx(M.wood, sx + s - 0.03, sx + s + 0.03, 0.7, 1.3, sz + z - 0.03, sz + z + 0.03, 1, 'y');
      for (const s of [-1, 1]) { // 난간과 붉은 띠
        bx(M.quiltRed, sx + s * 0.405 - 0.006, sx + s * 0.405 + 0.006, 0.86, 1.06, sz - 1.04, sz + 1.04, 0.8);
        bx(M.wood, sx + s * 0.47 - 0.02, sx + s * 0.47 + 0.02, 0.8, 0.84, sz - 1.2, sz + 1.2, 1, 'z');
        for (let i = 0; i < 9; i++) bx(M.wood, sx + s * 0.47 - 0.012, sx + s * 0.47 + 0.012, 0.7, 0.8, sz - 1.16 + i * 0.29 - 0.012, sz - 1.16 + i * 0.29 + 0.012, 1, 'y');
      }
      { const g = HG.cyl(0.47, 0.47, 2.5, 24, 0.5); g.scale(1, 0.5, 1); B.add(g, roofMat, sx, 1.26, sz, Math.PI / 2, 0, 0); }   // 둥근 지붕
      { const g = HG.cyl(0.495, 0.495, 0.07, 24, 1); g.scale(1, 0.52, 1); for (const z of [-1.22, -0.6, 0, 0.6, 1.22]) B.add(g, M.brass, sx, 1.26, sz + z, Math.PI / 2, 0, 0); }
      for (let i = 0; i < 22; i++) for (const s of [-1, 1]) B.add(HG.cyl(0.004, 0.011, 0.1 + (i % 3) * 0.02, 5, 1), M.cloth[i % 5], sx + s * 0.475, 1.2, sz - 1.2 + i * 0.114);   // 처마 술
      for (const z of [-1.3, 1.3]) { B.add(new THREE.SphereGeometry(0.09, 10, 8), M.cloth[3], sx, 1.56, sz + z); B.add(HG.cyl(0.02, 0.05, 0.22, 7, 1), M.cloth[3], sx, 1.47, sz + z * 0.985, z > 0 ? 0.5 : -0.5, 0, 0); }   // 용마루 끝
      // 꼭두: 망자의 길동무로 상여에 꽂는 나무 인형
      const doll = (bld, x, y, z, k, c1, c2) => { bld.add(HG.cyl(0.022 * k, 0.032 * k, 0.13 * k, 8, 1), c1, x, y + 0.065 * k, z); bld.add(new THREE.SphereGeometry(0.026 * k, 10, 8), M.woodPale, x, y + 0.155 * k, z); bld.add(HG.cyl(0.03 * k, 0.03 * k, 0.012 * k, 8, 1), c2, x, y + 0.183 * k, z); };
      for (let i = 0; i < 6; i++) for (const s of [-1, 1]) doll(B, sx + s * 0.47, 0.84, sz - 1.0 + i * 0.4, 1, M.cloth[(i + (s > 0 ? 2 : 0)) % 5], M.black);
      for (let i = 0; i < 14; i++) B.add(HG.cyl(0.004, 0.012, 0.13, 5, 1), M.cloth[i % 5], sx + (i % 2 ? 0.41 : -0.41), 1.16, sz - 1.0 + Math.floor(i / 2) * 0.33);   // 술
      // 요령: 상여 앞에서 흔드는 놋쇠 손종. 걸대에 걸어 두었다
      {
        const bxp = 9.9, bzp = -2.78;
        bx(M.wood, bxp - 0.03, bxp + 0.03, 0, 1.3, bzp - 0.03, bzp + 0.03, 1, 'y'); bx(M.wood, bxp + 0.03, bxp + 0.25, 1.24, 1.29, bzp - 0.025, bzp + 0.025, 1, 'x'); bx(M.stone, bxp - 0.12, bxp + 0.12, 0, 0.06, bzp - 0.12, bzp + 0.12, 1);
        const bp = [[0, 0.17], [0.02, 0.17], [0.03, 0.15], [0.045, 0.09], [0.07, 0.02], [0.082, 0], [0.074, 0], [0.06, 0.02], [0.036, 0.085], [0.02, 0.14], [0, 0.145]].map((q) => new THREE.Vector2(q[0], q[1]));
        const bm = new THREE.MeshStandardMaterial({ color: 0xc09a45, metalness: 0.85, roughness: 0.32 });
        B.add(new THREE.LatheGeometry(bp, 22), bm, bxp + 0.19, 0.99, bzp); B.add(HG.cyl(0.012, 0.012, 0.075, 8, 1), M.wood, bxp + 0.19, 1.2, bzp); B.add(new THREE.SphereGeometry(0.016, 8, 6), bm, bxp + 0.19, 1.0, bzp);
        cc(bxp, bzp, 0.16); proxy('bell', bxp + 0.15, 1.08, bzp, 0.4, 0.5, 0.3); W.BELL = { x: bxp + 0.19, y: 1.08, z: bzp };
      }
      proxy('sangyeo', sx, 0.95, sz, 1.0, 1.0, 2.2);
      cb(sx - 0.6, sx + 0.6, sz - 2.1, sz + 2.1);
      // 궤 위의 계집아이 꼭두와 쪽지
      bx(M.wood, 8.5, 9.3, 0, 0.46, -3.3, -2.75, 1.2, 'x'); cb(8.4, 9.3, -3.3, -2.6);
      { const g = new THREE.PlaneGeometry(0.2, 0.28); g.rotateX(-Math.PI / 2); B.add(g, M.letter, 8.72, 0.464, -3.02, 0, -0.3, 0); }
      proxy('note3', 8.72, 0.56, -3.02, 0.36, 0.3, 0.44);
      { const kg = new THREE.Group(), kb = new HG.Builder(); doll(kb, 0, 0, 0, 1.5, M.cloth[0], M.cloth[2]); kb.build(kg); kg.position.set(9.08, 0.46, -3.0); scene.add(kg); W.kkokdu = kg; }
      proxy('kkokdu', 9.08, 0.62, -3.0, 0.3, 0.4, 0.3);
      // 벽에 건 낫과 새끼줄, 구석의 만장
      { // 조선낫: 자루에 거의 직각으로 꺾여 나간 짧고 넓적한 무쇠 날. 등은 두껍고 검으며, 벼린 날만 희게 빛난다. 슴베를 자루에 박고 쇠고리로 죄었다
        const sg = new THREE.Group();
        const mk = (pts) => { const s = new THREE.Shape(); pts.forEach((p, i) => (i ? s.lineTo(p[0], p[1]) : s.moveTo(p[0], p[1]))); return s; };
        const spine = [[-0.022, -0.075], [-0.024, 0.006], [-0.012, 0.03], [0.04, 0.04], [0.12, 0.041], [0.19, 0.032], [0.228, 0.01]];   // 등은 거의 곧고, 끝만 살짝 숙는다
        const edge = [[0.2, 0.0], [0.15, -0.006], [0.1, -0.008], [0.05, -0.007], [0.02, -0.012], [0.008, -0.022], [0.006, -0.075]];
        const iron = new THREE.MeshStandardMaterial({ color: 0x38424e, metalness: 0.15, roughness: 0.8, emissive: 0x161d26, emissiveIntensity: 1 }), honed = new THREE.MeshStandardMaterial({ color: 0x8fa3b8, metalness: 0.2, roughness: 0.55, emissive: 0x2a3644, emissiveIntensity: 1 });   // 어두운 판자벽 앞에서도 날 몸통이 쇳빛으로 읽히게
        const blade = new THREE.Mesh(new THREE.ExtrudeGeometry(mk(spine.concat(edge)), { depth: 0.006, bevelEnabled: false }), iron); blade.castShadow = true; sg.add(blade);
        // 벼린 날: 날 쪽 가장자리를 따라 좁은 띠
        const inner = edge.slice(0, 5).map((p) => [p[0] - 0.003, p[1] + 0.008]).reverse();
        const hone = new THREE.Mesh(new THREE.ShapeGeometry(mk(edge.slice(0, 5).concat(inner))), honed); hone.position.z = 0.0065; sg.add(hone);
        const hb = new HG.Builder();
        hb.add(new THREE.CylinderGeometry(0.021, 0.021, 0.04, 12), iron, -0.008, -0.09, 0.003);          // 쇠고리
        hb.add(new THREE.CylinderGeometry(0.018, 0.022, 0.44, 10), M.woodPale, -0.008, -0.33, 0.003);        // 자루
        hb.add(new THREE.SphereGeometry(0.022, 10, 6), M.woodPale, -0.008, -0.55, 0.003);
        hb.build(sg);
        sg.position.set(9.5, 1.56, -7.086); sg.rotation.z = 0.06; sg.scale.set(1.3, 1.3, 1); scene.add(sg); W.sickle = sg;
        B.add(HG.cyl(0.012, 0.014, 0.1, 6, 1), M.wood, 9.6, 1.55, -7.07, Math.PI / 2, 0, 0);
      }
      proxy('sickle', 9.6, 1.4, -7.02, 0.5, 0.6, 0.25);
      B.add(new THREE.TorusGeometry(0.16, 0.035, 6, 14), M.rope, 10.3, 1.5, -7.09);
      for (let i = 0; i < 3; i++) { B.add(HG.cyl(0.016, 0.02, 2.05, 6, 1), M.woodPale, 12.55 - i * 0.16, 1.02, -2.72 - i * 0.05, 0.12, 0, 0.05 * (i - 1)); const m = new THREE.Mesh(HG.clothGeo(0.3, 1.3, 6, 12, 870 + i, 0.05), i === 1 ? M.fabric : M.hemp); m.position.set(12.55 - i * 0.16, 1.95, -2.85 - i * 0.05); m.rotation.y = 0.4 * (i - 1); m.castShadow = true; scene.add(m); }
      cb(12.2, 12.9, -3.0, -2.5);
      // 문
      const g = new THREE.Group(), b = new HG.Builder();
      b.add(HG.box(1.2, 1.82, 0.045, 1.3, 'y'), M.woodPlank, 0.6, 0.92, 0);
      b.add(HG.box(1.16, 0.08, 0.03, 1.2, 'x'), M.wood, 0.6, 0.4, -0.036); b.add(HG.box(1.16, 0.08, 0.03, 1.2, 'x'), M.wood, 0.6, 1.45, -0.036);
      b.add(HG.box(0.09, 0.07, 0.035, 1), M.iron, 1.08, 0.95, -0.04); b.add(new THREE.TorusGeometry(0.035, 0.008, 5, 12), M.iron, 1.08, 0.88, -0.05);
      b.build(g); g.position.set(8.1, 0.01, -5.4); g.rotation.y = -Math.PI / 2; scene.add(g);
      W.doors.got = { group: g, closed: -Math.PI / 2, open: -Math.PI / 2 - 1.75, t: 0, target: 0, col: cb(8.1, 8.3, -5.4, -4.2), key: 'doorGot' };
      proxy('doorGot', 8.15, 0.95, -4.8, 0.3, 1.8, 1.2);
    }

    // ================= 옹달샘 =================
    {
      const wx = -11.6, wz = 10.2;
      for (let i = 0; i < 13; i++) { const a = (i / 13) * 6.28, s = 0.2 + rnd() * 0.14; B.add(HG.rockGeo(4300 + i, s * 1.2, s * 0.8, s), M.rock, wx + Math.cos(a) * 0.82, 0.08, wz + Math.sin(a) * 0.82, 0, rnd() * 6, 0); }
      const wm = new THREE.Mesh(new THREE.CircleGeometry(0.74, 28), M.water); wm.rotation.x = -Math.PI / 2; wm.position.set(wx, 0.05, wz); scene.add(wm);
      B.add(new THREE.SphereGeometry(0.11, 14, 8, 0, 6.3, 1.57, 1.57), M.woodPale, wx + 0.95, 0.2, wz + 0.5, 0.3, 0, 0.2);
      B.add(HG.rockGeo(4320, 1.3, 1.0, 0.9), M.rock, wx - 1.2, 0.4, wz - 0.6, 0, 1, 0);
      cc(wx, wz, 0.95); proxy('spring', wx, 0.3, wz, 1.9, 0.8, 1.9); W.SPRING = { x: wx, y: 0.1, z: wz };
    }

    // ================= 고갯길을 막은 목책 =================
    {
      const g = new THREE.Group(), b = new HG.Builder();
      for (const x of [-1.05, 0, 1.05]) for (const s of [-1, 1]) b.add(HG.cyl(0.05, 0.06, 2.1, 8, 1), M.bark, x, 0.9, 0, s * 0.42, 0, s * 0.3);
      b.add(HG.cyl(0.05, 0.055, 3.5, 8, 1.2), M.bark, 0, 1.02, 0.03, 0, 0, Math.PI / 2);
      b.add(HG.cyl(0.045, 0.05, 3.4, 8, 1.2), M.bark, 0, 0.5, -0.03, 0, 0.02, Math.PI / 2 + 0.03);
      for (const x of [-1.05, 0, 1.05]) { b.add(new THREE.TorusGeometry(0.1, 0.022, 6, 14), M.rope, x, 1.02, 0.03, 0, Math.PI / 2, 0); b.add(new THREE.TorusGeometry(0.09, 0.02, 6, 14), M.rope, x + 0.04, 1.0, 0.03, 0.3, Math.PI / 2, 0); }
      for (let i = 0; i < 5; i++) b.add(HG.clothGeo(0.04, 0.2 + rnd() * 0.12, 2, 6, 840 + i, 0.01), M.hanji, -1.2 + i * 0.6, 0.98, 0.1);
      b.build(g); g.position.set(0, 0, -10.9); scene.add(g); W.bar = g;
      W.barBlock = cb(-1.75, 1.75, -11.15, -10.65);
      proxy('barricade', 0, 1.0, -10.8, 3.3, 1.7, 0.5);
    }

    // 고갯길 바닥에 쌓인 눈 (새까만 것이 또렷이 보이도록, 굽이마다 깐다)
    {
      // 비탈을 따라 오르는 땅 한 장: 눈은 격자 띠가 아니라, 밟히고 녹은 자리마다 흙이 드러난 얼룩으로 덮인다
      const snow = new THREE.MeshStandardMaterial({ color: 0xffffff, vertexColors: true, roughness: 0.93, emissive: 0x1c2331, emissiveIntensity: 0.3, map: HG.T.ground.map, normalMap: HG.T.ground.normalMap });
      const pos = [], uv = [], idx = [], colr = [], st = 0.5, X0 = -18, Z0 = -92, NX = 64, NZ = 163, vid = new Map(), ss = HG.noise.ss, PL = LANES.slice(3);
      const area = (x, z) => (z < -61 ? x > -17.6 && x < 13.6 : PL.some((l) => x > l[0] - 1.4 && x < l[1] + 1.4 && z > l[2] - 1.4 && z < l[3] + 1.4));
      const lineD = (x, z) => { if (z < -60) return Math.abs(x + 2); const a = W.PATH; let best = 1e9; for (let i = 0; i < a.length - 1; i++) { const dx = a[i + 1][0] - a[i][0], dz = a[i + 1][1] - a[i][1], L2 = dx * dx + dz * dz, t = Math.min(1, Math.max(0, ((x - a[i][0]) * dx + (z - a[i][1]) * dz) / L2)); best = Math.min(best, Math.hypot(x - a[i][0] - dx * t, z - a[i][1] - dz * t)); } return best; };
      const vert = (i, j) => {
        const key = i * 1000 + j; let v = vid.get(key); if (v != null) return v;
        const x = X0 + i * st, z = Z0 + j * st, n1 = HG.noise.fbm((x + 64) / 128, (z + 128) / 128, 44, 44, 3), n2 = z < -61 ? 0.5 : HG.noise.fbm((x + 64) / 128, (z + 128) / 128, 60, 60, 2), dc = lineD(x, z);
        const bump = (n1 - 0.5) * 0.09 * Math.min(1, Math.max(0, (-11.4 - z) / 2));
        // 길 한가운데는 밟혀 다져지고, 가장자리와 응달에 눈이 남는다
        const sn = ss(0.4, 0.62, n1 + (n2 - 0.5) * 0.35 + (z < -61 ? -0.04 : 0.06) - (1 - ss(0.1, 0.75, dc)) * 0.16) * Math.min(1, Math.max(0, (-10.6 - z) / 2.5));
        v = pos.length / 3; pos.push(x, W.hAt(x, z) + 0.014 + bump, z); uv.push(x / 3, z / 3);
        colr.push(0.8 + (1.7 - 0.8) * sn, 0.78 + (1.85 - 0.78) * sn, 0.76 + (2.2 - 0.76) * sn); vid.set(key, v); return v;
      };
      for (let i = 0; i < NX; i++) for (let j = 0; j < NZ; j++) {
        if (!area(X0 + (i + 0.5) * st, Z0 + (j + 0.5) * st)) continue;
        const a = vert(i, j), b = vert(i + 1, j), c = vert(i, j + 1), d = vert(i + 1, j + 1); idx.push(a, c, b, b, c, d);
      }
      const fg = HG.makeGeo(pos, uv, idx); fg.setAttribute('color', new THREE.Float32BufferAttribute(colr, 3));
      const m = new THREE.Mesh(fg, snow); m.receiveShadow = true; m.frustumCulled = false; scene.add(m);
      // 길가에 드문드문 박힌 돌
      for (let i = 0; i < 26; i++) { const t = i / 26, a = W.PATH; let acc = t * 66, k = 0; while (k < a.length - 2 && acc > Math.hypot(a[k + 1][0] - a[k][0], a[k + 1][1] - a[k][1])) { acc -= Math.hypot(a[k + 1][0] - a[k][0], a[k + 1][1] - a[k][1]); k++; } const L = Math.hypot(a[k + 1][0] - a[k][0], a[k + 1][1] - a[k][1]), u = Math.min(1, acc / L), s = 0.1 + rnd() * 0.16, side = (i % 2 ? 1 : -1) * (0.95 + rnd() * 0.25);
        const dx = (a[k + 1][0] - a[k][0]) / L, dz = (a[k + 1][1] - a[k][1]) / L, qx = a[k][0] + dx * L * u - dz * side, qz = a[k][1] + dz * L * u + dx * side; B.add(HG.rockGeo(4500 + i, s * 1.3, s * 0.6, s), M.rock, qx, W.hAt(qx, qz) + s * 0.2, qz, 0, rnd() * 6, 0); }
    }

    // ================= 주변 숲 · 바위 =================
    {
      const TB = new HG.Builder();
      let n = 0, guard = 0;
      while (n < 86 && guard++ < 3000) {
        const x = -44 + rnd() * 88, z = -70 + rnd() * 108;
        const inside = x > -17.5 && x < 17.5 && z > -11 && z < 22.5;
        if (inside || LANES.some((l) => x > l[0] - 1.3 && x < l[1] + 1.3 && z > l[2] - 1.3 && z < l[3] + 1.3) || Math.hypot(x, (z + 16) * 0.75) > 48) continue;
        const sc = 0.8 + rnd() * 1.0;
        // 벼랑 위에 선 나무는 벼랑 높이에 맞춘다
        let top = z < -62.5 && Math.abs(x + 2) < 15.5 ? (Math.abs(x + 2) < 2.6 ? -50 : W.hAt(x, z) - 0.1) : 0; for (const c of CL) if (x > c[0] + 0.8 && x < c[1] - 0.8 && z > c[2] + 0.8 && z < c[3] - 0.8) top = W.hAt(x, z) + c[4] - 0.3;
        TB.add(HG.treeGeo(2000 + n, { trunk: 2.2 * sc, radius: 0.2 * sc, depth: 4, spread: 0.6, taper: 0.75, firstSplit: 3, leader: 3, upBias: 0.25, droop: 0.1 }), M.bark, x, top, z, 0, rnd() * 6, 0); n++;
      }
      // 빈터 안의 나무 몇 그루
      [[-12.6, 14.6, 1.1], [12.8, 13.4, 1.3], [5.2, 13.8, 0.9], [-7.0, 12.2, 1.0], [-13.2, 3.4, 1.2], [13.4, 1.2, 1.0], [3.6, -8.4, 0.9], [-4.6, -7.6, 1.1], [-13.4, -7.8, 1.0], [12.9, -9.4, 0.9]].forEach((t, i) => {
        TB.add(HG.treeGeo(2200 + i, { trunk: 2.3 * t[2], radius: 0.22 * t[2], depth: 4, spread: 0.6, taper: 0.75, firstSplit: 3, leader: 3, upBias: 0.25, droop: 0.12 }), M.bark, t[0], 0, t[1], 0, rnd() * 6, 0); cc(t[0], t[1], 0.3 * t[2]);
      });
      // 고개 너머 비탈의 나무
      for (let i = 0; i < 18; i++) { const x = -16 + rnd() * 28, z = -64 - rnd() * 24, sc = 0.8 + rnd() * 0.9; if (Math.abs(x + 2) < 3) continue; TB.add(HG.treeGeo(2300 + i, { trunk: 2.2 * sc, radius: 0.2 * sc, depth: 4, spread: 0.6, taper: 0.75, firstSplit: 3, leader: 3, upBias: 0.25, droop: 0.1 }), M.bark, x, W.hAt(x, z) - 0.1, z, 0, rnd() * 6, 0); }
      TB.build(scene);
      for (let i = 0; i < 16; i++) { const x = -13.5 + rnd() * 27, z = -9 + rnd() * 27; if (W.indoor(x, z) || Math.abs(x) < 1.4 || Math.hypot(x - 5.4, z - 7) < 2.5) continue; const s = 0.1 + rnd() * 0.22; B.add(HG.rockGeo(800 + i, s * 1.2, s * 0.6, s), M.rock, x, s * 0.2, z, 0, rnd() * 6, 0); }
      [[-13.6, 17.6, 1.5], [13.2, 17.2, 1.7], [-13.8, -3.2, 1.3], [14.0, 9.8, 1.4], [6.4, 17.8, 1.0]].forEach((t, i) => { B.add(HG.rockGeo(4400 + i, t[2] * 1.2, t[2] * 0.85, t[2]), M.rock, t[0], t[2] * 0.3, t[1], 0, rnd() * 6, 0); cc(t[0], t[1], t[2] * 0.9); });
    }

    // ================= 마른 풀 =================
    {
      const blade = new THREE.PlaneGeometry(0.016, 0.5, 1, 4); blade.translate(0, 0.25, 0);
      const p = blade.attributes.position, nrm = blade.attributes.normal;
      for (let i = 0; i < p.count; i++) { const y = p.getY(i) / 0.5; p.setX(i, p.getX(i) * (1 - y * 0.9)); p.setZ(i, y * y * 0.12); nrm.setXYZ(i, 0, 1, 0.2); }
      const gm = HG.windify(new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 1, side: THREE.DoubleSide }), 0.09, true);
      const N = 34000, im = new THREE.InstancedMesh(blade, gm, N), d = new THREE.Object3D(), c = new THREE.Color();
      const inR = (x, z, x0, x1, z0, z1) => x > x0 && x < x1 && z > z0 && z < z1;
      let k = 0, guard = 0, cx0 = 0, cz0 = 0, cl = 0;
      while (k < N && guard++ < 400000) {
        let x, z;
        if (cl > 0) { cl--; x = cx0 + (rnd() - 0.5) * 0.24; z = cz0 + (rnd() - 0.5) * 0.24; }
        else {
          x = -20 + rnd() * 40; z = -24 + rnd() * 48;
          if (inR(x, z, -11.6, -7.0, -5.1, -0.9) || inR(x, z, 7.7, 11.5, 5.1, 8.9) || inR(x, z, 7.9, 13.3, -7.5, -2.1)) continue;
          if (inR(x, z, 1.5, 17, -25, -10.4) || inR(x, z, -17.2, -1.5, -25, -10.4) && !inR(x, z, -10.8, -6.5, -15.3, -10.7)) continue;
          if (inR(x, z, -8.9, -6.3, -15.1, -11.3)) continue;
          if (Math.abs(x) < 0.9 && z < 19 || Math.hypot(x - 5.4, z - 7) < 1.3 || Math.hypot(x + 11.6, z - 10.2) < 1.0 || Math.hypot(x - 1.4, z - 4.9) < 1.1) continue;
          const nn = HG.noise.fbm((x + 40) / 64, (z + 40) / 64, 8, 8, 3);
          const edge = Math.min(15 - Math.abs(x), 20 - z, z + 10.4) < 2.2 || Math.hypot(x + 2.6, z - 3.2) < 2.6;
          if (!(edge || nn > 0.52)) continue;
          cx0 = x; cz0 = z; cl = 5 + ((rnd() * 9) | 0);
        }
        const s = 0.35 + rnd() * 0.8;
        d.position.set(x, W.hAt(x, z), z); d.rotation.set((rnd() - 0.5) * 0.7, rnd() * 6.28, (rnd() - 0.5) * 0.7); d.scale.set(0.8 + rnd() * 0.8, s, 1); d.updateMatrix();
        im.setMatrixAt(k, d.matrix); const t = rnd(); c.setRGB(0.24 + t * 0.2, 0.2 + t * 0.15, 0.1 + t * 0.07); im.setColorAt(k, c); k++;
      }
      im.count = k; im.receiveShadow = true; im.castShadow = false; im.frustumCulled = false; scene.add(im);
    }

    const meshes = B.build(scene, { noCast: W.noCast });
    meshes.forEach((m) => { if (W.noRecv.includes(m.material)) m.receiveShadow = false; });
    meshes.forEach((m) => { if (m.material === M.plaster || m.material === M.mud || m.material === M.woodPlank || m.material === M.rock) W.occluders.push(m); });
    return W;
  };
})();
