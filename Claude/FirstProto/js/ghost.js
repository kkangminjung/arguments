// 귀신 — 소복 입은 여인
(function () {
  'use strict';
  const HG = (window.HG = window.HG || {});

  HG.Ghost = class {
    constructor(scene) {
      const M = HG.M, g = (this.group = new THREE.Group());
      this.mats = [];
      const mk = (m) => { this.mats.push(m); return m; };
      const cloth = mk(new THREE.MeshStandardMaterial({ map: HG.T.fabric.map, normalMap: HG.T.fabric.normalMap, color: 0xd9dcd8, roughness: 0.95, side: THREE.DoubleSide, emissive: 0x6f8296, emissiveIntensity: 0.05 }));
      const hair = mk(new THREE.MeshStandardMaterial({ color: 0x0b0b0d, roughness: 0.34, side: THREE.DoubleSide }));
      const skin = mk(new THREE.MeshStandardMaterial({ map: HG.drawFace(), roughness: 0.55, emissive: 0x5a6670, emissiveIntensity: 0.06 }));
      const skin2 = mk(new THREE.MeshStandardMaterial({ color: 0xa3adb0, roughness: 0.6 }));
      const add = (geo, mat, x, y, z, parent) => { const m = new THREE.Mesh(geo, mat); m.position.set(x || 0, y || 0, z || 0); m.castShadow = true; (parent || g).add(m); return m; };

      // 치마 (주름)
      const sp = [[0.02, 1.14], [0.16, 1.12], [0.19, 0.98], [0.25, 0.62], [0.32, 0.28], [0.37, 0.05], [0.36, 0.0]].map((p) => new THREE.Vector2(p[0], p[1]));
      const skirt = new THREE.LatheGeometry(sp, 48), pp = skirt.attributes.position;
      for (let i = 0; i < pp.count; i++) {
        const x = pp.getX(i), y = pp.getY(i), z = pp.getZ(i), a = Math.atan2(z, x), k = 1 - y / 1.14;
        const f = 1 + (0.07 * Math.sin(a * 11) + 0.04 * Math.sin(a * 23 + 1.3)) * k;
        pp.setXYZ(i, x * f, y - (y < 0.06 ? 0.03 * Math.sin(a * 7) : 0), z * f * 0.85);
      }
      skirt.computeVertexNormals();
      add(skirt, cloth);
      // 저고리
      const torso = new THREE.CylinderGeometry(0.125, 0.165, 0.42, 20); torso.scale(1, 1, 0.66); add(torso, cloth, 0, 1.29, 0);
      const sh = new THREE.SphereGeometry(1, 16, 10); sh.scale(0.185, 0.07, 0.1); add(sh, cloth, 0, 1.455, 0);
      // 고름
      add(new THREE.BoxGeometry(0.025, 0.42, 0.006), cloth, 0.03, 1.2, 0.108).rotation.z = 0.06;
      add(new THREE.BoxGeometry(0.025, 0.5, 0.006), cloth, 0.065, 1.16, 0.106).rotation.z = -0.05;
      // 팔
      this.arms = [];
      for (const s of [-1, 1]) {
        const piv = new THREE.Group(); piv.position.set(s * 0.165, 1.455, 0); g.add(piv);
        const sl = new THREE.CylinderGeometry(0.04, 0.07, 0.62, 12); sl.translate(0, -0.31, 0); sl.scale(1, 1, 0.8); add(sl, cloth, 0, 0, 0, piv);
        const hd = new THREE.SphereGeometry(1, 10, 8); hd.scale(0.03, 0.07, 0.018); add(hd, skin2, 0, -0.67, 0, piv);
        for (let f = 0; f < 4; f++) { const fg = new THREE.CylinderGeometry(0.004, 0.006, 0.07, 5); add(fg, skin2, (f - 1.5) * 0.012, -0.75, 0, piv); }
        piv.rotation.z = s * 0.07; this.arms.push(piv);
      }
      // 머리
      const head = (this.head = new THREE.Group()); head.position.set(0, 1.5, 0); g.add(head);
      add(new THREE.CylinderGeometry(0.038, 0.045, 0.1, 10), skin2, 0, 0.02, 0, head);
      const hg = new THREE.SphereGeometry(0.1, 28, 20); hg.scale(0.9, 1.14, 0.98); add(hg, skin, 0, 0.15, 0, head);
      const cap = new THREE.SphereGeometry(0.108, 24, 14, 0, Math.PI * 2, 0, Math.PI * 0.55); cap.rotateX(-0.62); cap.scale(0.93, 1.14, 1.02); add(cap, hair, 0, 0.152, -0.006, head);
      // 뒤 · 옆 머리카락 장막
      const hp = [[0.1, 0.2], [0.112, 0.12], [0.118, 0.0], [0.125, -0.2], [0.12, -0.42], [0.09, -0.6], [0.04, -0.7]].map((p) => new THREE.Vector2(p[0], p[1]));
      const back = new THREE.LatheGeometry(hp, 28, 0.62, Math.PI * 2 - 1.24), bp = back.attributes.position;
      for (let i = 0; i < bp.count; i++) { const x = bp.getX(i), y = bp.getY(i), z = bp.getZ(i), a = Math.atan2(z, x); const f = 1 + 0.05 * Math.sin(a * 17 + y * 9); bp.setXYZ(i, x * f, y, z * f); }
      back.computeVertexNormals(); add(back, hair, 0, 1.5, -0.012);
      // 앞머리 (얼굴을 가림)
      this.strands = [];
      for (let i = 0; i < 13; i++) {
        const piv = new THREE.Group(), u = (i - 6) / 6;
        piv.position.set(u * 0.092, 0.25, 0.07 - Math.abs(u) * 0.035); head.add(piv);
        const len = 0.6 + Math.sin(i * 2.3) * 0.12;
        const sg = new THREE.PlaneGeometry(0.03, len, 2, 8); sg.translate(0, -len / 2, 0);
        const spv = sg.attributes.position;
        for (let k = 0; k < spv.count; k++) {
          const y = spv.getY(k), x = spv.getX(k), d = -y; // d: 가르마에서 내려온 거리
          const bulge = 0.047 * Math.min(1, d / 0.08) + 0.01 * Math.sin(Math.min(1, d / 0.25) * Math.PI);
          spv.setZ(k, bulge + Math.abs(x) * -0.2 + 0.004 * Math.sin(i * 5.1 + d * 14)); spv.setX(k, x * (1 - d * 0.5) + 0.006 * Math.sin(i * 3.3 + d * 9));
        }
        sg.computeVertexNormals(); add(sg, hair, 0, 0, 0, piv);
        piv.userData.u = u; piv.userData.ph = i * 1.7; piv.userData.bx = piv.position.x; piv.userData.bz = piv.position.z;
        piv.userData.side = u === 0 ? 1 : Math.sign(u); this.strands.push(piv);
      }
      g.visible = false; scene.add(g);
      this.reveal = 0; this.opacity = 1; this.twitch = 0; this.t = 0;
    }
    place(x, y, z) { this.group.position.set(x, y, z); }
    faceTo(x, z) { this.group.rotation.y = Math.atan2(x - this.group.position.x, z - this.group.position.z); }
    show(v) { this.group.visible = v; }
    setOpacity(o) {
      this.opacity = o;
      for (const m of this.mats) { m.transparent = o < 1; m.opacity = o; m.depthWrite = o > 0.5; }
    }
    update(dt, time) {
      if (!this.group.visible) return;
      this.t += dt;
      const g = this.group;
      const hz = (0.16 + Math.sin(time * 0.6) * 0.04) * (1 - this.reveal) + (this.twitch > 0 ? Math.sin(time * 70) * 0.14 : 0) + this.reveal * Math.sin(time * 53) * 0.05;
      const hx = 0.16 - this.reveal * 0.42 + Math.sin(time * 0.43) * 0.025;
      this.head.rotation.z = hz; this.head.rotation.x = hx;
      this.twitch = Math.max(0, this.twitch - dt);
      for (const s of this.strands) { // 머리카락은 고개 기울기와 무관하게 아래로 늘어진다
        const u = s.userData.u;
        s.rotation.x = -hx + 0.03 + Math.sin(time * 1.1 + s.userData.ph) * 0.02;
        s.rotation.z = -hz + Math.sin(time * 0.9 + s.userData.ph) * 0.03 - s.userData.side * this.reveal * 0.1;
        // 드러날 때: 가운데 가르마로 갈라져 얼굴 옆으로 붙는다
        const open = this.reveal * (1 - Math.abs(u) * 0.75);
        s.position.x = s.userData.bx + s.userData.side * open * 0.085;
        s.position.z = s.userData.bz - open * 0.05;
      }
      this.arms[0].rotation.x = Math.sin(time * 0.7) * 0.03 - this.reveal * 0.62;
      this.arms[1].rotation.x = Math.sin(time * 0.7 + 1) * 0.03 - this.reveal * 0.5;
      g.position.y += Math.sin(time * 0.8) * 0.0008;
    }
  };
})();
