// 축시(丑時) — 게임 본체: 렌더링 · 조명 · 후처리 · 조작 · 이야기
(function () {
  'use strict';
  const HG = (window.HG = window.HG || {});
  const $ = (id) => document.getElementById(id);
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const lerp = (a, b, t) => a + (b - a) * t;
  const ease = (t) => t * t * (3 - 2 * t);

  const NOTES = {
    1: { title: '윤 진사의 일기', text: ['경술년 섣달 열이레.', '', '며늘아기가 우물에 든 지 오늘로 이레다.', '밤마다 축시가 되면 물 긷는 소리가 난다.', '두레박이 저 혼자 오르내린다.', '', '만신이 마당에 굿판을 차리고 이르기를,', '부적 석 장을 우물 전에 붙이면 다시는 나오지 못한다 하였다.', '굿이 끝날 때까지 마당의 불은 꺼뜨리지 말라 하였다.', '', '한 장은 안채 안방 반닫이 위에,', '한 장은 헛간 기둥에,', '한 장은 당산나무 금줄에 매어 두었다.', '헛간은 잠가 두었고, 열쇠는 부엌 걸이대에 걸었다.', '', '오늘 밤에는 기어이 붙여야 한다.', '그런데 아까부터 다듬이 소리가 그치지 않는다.', '이 집에 다듬이질할 사람은, 이제 없다.'] },
    2: { title: '부치지 못한 언문 편지', text: ['친정 어머니 전 상서.', '', '시집온 지 세 해, 돌림병에 마을 초상이 잇따르니', '만신이 이르기를, 이 집 며느리에게', '손각시가 씌었다 하였답니다.', '', '시아버님과 서방님이 그 말을 믿으시고', '오늘 밤 저를 우물에 넣으려 하심을', '문밖에서 다 들었나이다.', '', '저는 아무 죄가 없사옵니다.', '부적으로 우물을 막으면', '저는 저 찬물 속에서 영영 나오지 못하옵니다.', '', '누구라도 이 글을 보시거든', '부디 그 부적을 마당 굿판의 불에 살라 주소서.', '저는 이 집이 싫사옵니다.', '다만 고개 너머, 어머니 계신 집에 가고 싶을 뿐이옵니다.'] },
  };
  NOTES[3] = { title: '쓰다 만 글 — 작은사랑', text: ['아내를 우물에 넣은 지 사흘째 밤.', '', '우물가에서 아내가 부른다.', '어머님이 먼저 듣고 맨발로 나가셨다.', '불러도 돌아보지 않으셨다.', '', '이튿날 밤에는 아이 셋이,', '그 이튿날에는 아우가 나갔다.', '아버님은 부적만 붙이면 된다 하시나', '붙이러 가신 아버님도 돌아오지 않으신다.', '', '이제 이 집에는 나 하나다.', '아까부터 다듬이 소리가 난다.', '아내의 다듬이 소리다.', '나도, 가 보아야겠다.'] };
  NOTES[4] = { title: '삐뚤빼뚤한 아이의 글씨', text: ['엄마가 우물에서 부른다.', '', '할머니도 갔다.', '형아도 갔다.', '', '나도 간다.'] };
  const INTRO = ['정조 14년(1790), 섣달.', '강원도 깊은 산골.<br>윤 진사 댁 식구 일곱이 하룻밤 새 자취를 감추었다.', '관아의 명을 받은 당신은,<br>해가 지고 첫눈이 내릴 무렵에야 그 집 대문 앞에 닿았다.', '축시(丑時).<br>귀신이 드나든다는 시각이다.'];
  const ENDS = {
    seal: { title: '봉인', lines: ['동이 틀 무렵, 당신은 산을 내려왔다.', '관아에는 이렇게 적어 올렸다.', '「윤 진사 댁, 인기척 없음. 우물은 메우는 것이 좋겠음.」', '우물은 이듬해 봄에 메워졌다.', '그러나 그 마을 사람들은 지금도,<br>축시가 되면 땅 밑에서 물 긷는 소리가 난다고 한다.'] },
    release: { title: '해원(解寃)', lines: ['이튿날, 우물에서 여인의 시신을 건져<br>고개 너머 친정 마을 양지바른 언덕에 묻었다.', '윤 진사 댁 식구들은 끝내 찾지 못하였다.', '그 뒤로 그 집 우물에서는 물 긷는 소리가 나지 않았다.', '다만 첫눈 오는 밤이면, 고갯길을 넘어가는<br>흰 옷 입은 여인을 보았다는 이가 더러 있다.', '마을 사람들은 말없이 길을 비켜 주었다고 한다.'] },
  };

  HG.start = async function (addons) {
    HG.addons = addons;
    const debug = /[?&]debug/.test(location.search);
    const A = HG.audio;

    // ================= 렌더러 =================
    const canvas = $('c');
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' });
    renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
    renderer.localClippingEnabled = true;
    const scene = new THREE.Scene();
    const FOG = new THREE.Color(0x0b1019);
    scene.fog = new THREE.FogExp2(FOG, 0.03);
    scene.background = FOG.clone();
    const camera = new THREE.PerspectiveCamera(68, 1, 0.05, 700);
    camera.rotation.order = 'YXZ'; scene.add(camera);
    HG._fwd = new THREE.Vector3(0, 0, -1);

    const setLoad = (p, txt) => { $('loadbar').style.width = Math.round(p * 100) + '%'; if (txt) $('loadtxt').textContent = txt; };
    setLoad(0.03, '먹을 갈고 있습니다…');
    await new Promise((r) => setTimeout(r, 30));
    await HG.buildMaterials((p) => setLoad(0.05 + p * 0.6, '재질을 빚는 중…'));
    setLoad(0.7, '집을 짓는 중…'); await new Promise((r) => setTimeout(r, 30));
    const W = HG.buildWorld(scene);
    setLoad(0.9, '등불을 밝히는 중…'); await new Promise((r) => setTimeout(r, 30));

    // ================= 하늘 =================
    const moonDir = new THREE.Vector3(-0.45, 0.5, -0.72).normalize();
    const skyMat = new THREE.ShaderMaterial({
      side: THREE.BackSide, depthWrite: false, fog: false,
      uniforms: { uMoon: { value: moonDir }, uTime: HG.uTime, uFog: { value: FOG } },
      vertexShader: 'varying vec3 vDir; void main(){ vDir = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
      fragmentShader: `
        uniform vec3 uMoon; uniform float uTime; uniform vec3 uFog; varying vec3 vDir;
        float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }
        float noise(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f); return mix(mix(hash(i),hash(i+vec2(1,0)),f.x), mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x), f.y); }
        float fbm(vec2 p){ float s=0.0, a=0.5; for(int i=0;i<5;i++){ s+=a*noise(p); p=p*2.03+vec2(17.0,9.0); a*=0.5; } return s; }
        void main(){
          vec3 d = normalize(vDir); float h = d.y;
          vec3 col = mix(vec3(0.05,0.066,0.105), vec3(0.012,0.02,0.046), pow(clamp(h,0.0,1.0), 0.45));
          float md = max(dot(d, uMoon), 0.0);
          vec2 sp = d.xz / (abs(d.y) + 0.35) * 95.0; float sh = hash(floor(sp)); vec2 sf = fract(sp) - 0.5;
          float star = step(0.986, sh) * smoothstep(0.14, 0.0, length(sf)) * (0.55 + 0.45 * sin(uTime * 2.0 + sh * 100.0));
          vec2 cp = d.xz / (d.y + 0.25) * 1.4 + vec2(uTime * 0.012, uTime * 0.004);
          float c = smoothstep(0.4, 0.78, fbm(cp * 1.6)); float thin = fbm(cp * 3.1 + 4.0);
          col += star * vec3(0.7,0.8,1.0) * (1.0 - c) * smoothstep(0.05, 0.3, h) * 1.3;
          float disc = smoothstep(0.99950, 0.99972, md);
          col += vec3(1.0,0.97,0.88) * 6.0 * disc * (0.7 + 0.3 * noise(d.xy * 240.0)) * (1.0 - c * 0.8);
          col += vec3(0.5,0.62,0.9) * (pow(md, 900.0) * 0.9 + pow(md, 60.0) * 0.17 + pow(md, 8.0) * 0.05);
          vec3 cc = mix(vec3(0.02,0.027,0.045), vec3(0.24,0.29,0.4), pow(md, 5.0) * (0.35 + 0.65 * thin));
          col = mix(col, cc, c * 0.9);
          vec2 an = normalize(d.xz + 1e-5);
          float ridge = 0.045 + 0.085 * fbm(an * 2.3 + 3.0) + 0.012 * noise(an * 19.0);
          float ridge2 = 0.015 + 0.06 * fbm(an * 3.4 + 11.0) + 0.01 * noise(an * 37.0);
          col = mix(col, uFog * 0.42, smoothstep(ridge + 0.004, ridge, h));
          col = mix(col, uFog * 0.75, smoothstep(ridge2 + 0.004, ridge2, h));
          col = mix(col, uFog, smoothstep(0.035, -0.02, h));
          gl_FragColor = vec4(col, 1.0);
        }`,
    });
    const sky = new THREE.Mesh(new THREE.SphereGeometry(500, 32, 16), skyMat); sky.frustumCulled = false; sky.renderOrder = -10; scene.add(sky);

    // ================= 조명 =================
    const hemi = new THREE.HemisphereLight(0x8ea4d4, 0x0a0c10, 0.2); scene.add(hemi);
    const moon = new THREE.DirectionalLight(0xa3b8ea, 0.95);
    moon.position.copy(moonDir).multiplyScalar(80).add(new THREE.Vector3(10, 0, -1)); moon.target.position.set(10, 0, -1); scene.add(moon, moon.target);
    moon.castShadow = true; moon.shadow.mapSize.set(2048, 2048);
    moon.shadow.mapSize.set(4096, 4096);
    Object.assign(moon.shadow.camera, { left: -34, right: 34, top: 30, bottom: -30, near: 5, far: 170 });
    moon.shadow.bias = -0.0004; moon.shadow.normalBias = 0.018;   // 벽 밑으로 달빛이 새어 들지 않게

    // 손에 든 초롱
    const lan = new THREE.Group(); camera.add(lan); lan.position.set(0.34, -0.3, -0.7); lan.scale.setScalar(0.85);
    const frameMat = new THREE.MeshBasicMaterial({ color: 0x120b06 });
    const lanPend = new THREE.Group(); lanPend.position.set(0, 0.17, 0); lan.add(lanPend);
    const lanPaper = new THREE.MeshStandardMaterial({ map: HG.T.hanji.map, emissive: 0xff7a26, emissiveMap: HG.T.hanji.map, emissiveIntensity: 2.3, roughness: 0.9, side: THREE.DoubleSide });
    {
      const M = HG.M, nc = (m) => { m.castShadow = false; m.receiveShadow = false; return m; };
      const stick = nc(new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.009, 0.9, 6), frameMat));
      stick.position.set(0.09, -0.075, 0.36); stick.rotation.set(-0.98, 0, 0.24); lan.add(stick);
      lanPend.add(nc(new THREE.Mesh(new THREE.CylinderGeometry(0.0015, 0.0015, 0.05, 4), M.black)).translateY(-0.025));
      const body = nc(new THREE.Mesh(new THREE.CylinderGeometry(0.052, 0.052, 0.15, 6, 1, true), lanPaper)); body.position.y = -0.135; lanPend.add(body);
      for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2 + Math.PI / 6; const r = nc(new THREE.Mesh(new THREE.BoxGeometry(0.006, 0.15, 0.006), frameMat)); r.position.set(Math.sin(a) * 0.052, -0.135, Math.cos(a) * 0.052); lanPend.add(r); }
      for (const y of [-0.055, -0.215]) { const c = nc(new THREE.Mesh(new THREE.CylinderGeometry(0.058, 0.058, 0.012, 6), frameMat)); c.position.y = y; lanPend.add(c); }
      const tas = nc(new THREE.Mesh(new THREE.ConeGeometry(0.012, 0.09, 6), new THREE.MeshStandardMaterial({ color: 0x7a1010, roughness: 0.9 }))); tas.position.y = -0.27; tas.rotation.x = Math.PI; lanPend.add(tas);
    }
    const LAN_I = 10;
    const lanLight = new THREE.PointLight(0xffa55a, LAN_I, 28, 1.35); lanLight.position.set(0, -0.135, 0); lanPend.add(lanLight);
    lanLight.castShadow = true; lanLight.shadow.mapSize.set(2048, 2048); lanLight.shadow.camera.near = 0.09; lanLight.shadow.camera.far = 22; lanLight.shadow.bias = -0.003; lanLight.shadow.normalBias = 0.018;   // 얇은 선반 · 문틀의 그림자가 떨어져 보이거나 빛이 새지 않게
    const LAN_COL = new THREE.Color(0xffa55a), LAN_DEAD = new THREE.Color(0x9fb6ff);
    const scareLight = new THREE.PointLight(0xa8b8ff, 0, 3.5, 2); scareLight.position.set(-0.16, -0.14, -0.05); camera.add(scareLight);
    // 등불의 은은한 채움빛: 그림자가 새까만 덩어리로 떨어지지 않게 한다 (그림자 없음, 짧은 거리)
    const lanFill = new THREE.PointLight(0xffa55a, 0, 6.5, 1.35); lanFill.position.set(0.06, -0.12, 0.02); camera.add(lanFill);   // 눈 가까이에 둔다 — 열린 문짝이 초롱과 눈 사이에 끼어도 새까맣게 보이지 않는다
    // 벽에 바짝 붙으면 초롱을 몸 쪽으로 당긴다 — 광원이 벽 속으로 들어가 벽이 새까매지는 일을 막는다
    // 초롱을 감출 때는 그물(mesh)만 숨긴다 — 광원까지 숨기면 광원 수가 바뀌어 모든 재질이 다시 컴파일되고, 그동안 화면이 멎는다
    const lanShow = (v) => { lan.traverse((o) => { if (o.isMesh) o.visible = v; }); };
    let lanRetract = 0, lanNear = 1, lanNearT = 1, lanNearTick = 0, lanDoorClose = false;
    const nearRay = new THREE.Raycaster(), nearDir = new THREE.Vector3(), doorGroups = Object.values(W.doors).map((d) => d.group).filter(Boolean);
    const blockedAt = (x, z, pad) => {
      for (const b of HG.col.boxes) if (b.on && x > b.x0 - pad && x < b.x1 + pad && z > b.z0 - pad && z < b.z1 + pad) return true;
      for (const c of HG.col.circles) if (c.on && Math.hypot(x - c.x, z - c.z) < c.r + pad) return true;
      return false;
    };

    // 안방 촛불
    const candle = new THREE.PointLight(0xffa24e, 1.7, 9, 2); candle.position.set(W.candle.x, W.candle.y + 0.04, W.candle.z); scene.add(candle);
    candle.castShadow = true; candle.shadow.mapSize.set(512, 512); candle.shadow.camera.near = 0.05; candle.shadow.camera.far = 9; candle.shadow.bias = -0.006; candle.shadow.autoUpdate = false; candle.shadow.needsUpdate = true;
    const flameTex = HG.drawFlame();
    const flame = new THREE.Sprite(new THREE.SpriteMaterial({ map: flameTex, blending: THREE.AdditiveBlending, depthWrite: false, fog: false, color: 0xffffff }));
    flame.scale.set(0.045, 0.09, 1); flame.position.set(W.candle.x, W.candle.y + 0.035, W.candle.z); scene.add(flame);
    let candleOn = true;
    // 굿판 모닥불
    const FIRE_I = 7;
    const fireLight = new THREE.PointLight(0xff7a34, FIRE_I, 20, 1.4); fireLight.position.set(W.FIRE.x, 0.7, W.FIRE.z); scene.add(fireLight);
    // 일렁이는 불꽃 텍스처 (여러 갈래의 불혀)
    const tongueTex = (seed) => {
      const c = document.createElement('canvas'); c.width = 128; c.height = 256; const x = c.getContext('2d'), r = HG.rng(seed);
      x.filter = 'blur(9px)';
      for (let i = 0; i < 6; i++) {
        const bx = 64 + (r() - 0.5) * 44, top = 24 + r() * 120, w = 9 + r() * 15, lean = (r() - 0.5) * 56;
        const g = x.createLinearGradient(0, 236, 0, top);
        g.addColorStop(0, 'rgba(255,200,120,0)'); g.addColorStop(0.16, 'rgba(255,214,150,0.6)'); g.addColorStop(0.42, 'rgba(255,150,50,0.6)'); g.addColorStop(0.78, 'rgba(255,84,18,0.34)'); g.addColorStop(1, 'rgba(200,40,0,0)');
        x.fillStyle = g; x.beginPath(); x.moveTo(bx - w * 0.6, 232); x.bezierCurveTo(bx - w * 1.5, 180, bx + lean * 0.4 - w * 0.5, top + 60, bx + lean, top); x.bezierCurveTo(bx + lean * 0.4 + w * 0.6, top + 70, bx + w * 1.5, 180, bx + w * 0.6, 232); x.fill();
      }
      const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
    };
    const tongues = [tongueTex(1), tongueTex(2), tongueTex(3)];
    const fireFlames = [];
    for (let i = 0; i < 10; i++) {
      const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tongues[i % 3], blending: THREE.AdditiveBlending, depthWrite: false, fog: false, color: 0xffc890, opacity: 0.6 }));
      s.userData = { ox: (Math.random() - 0.5) * 0.42, oz: (Math.random() - 0.5) * 0.42, ph: Math.random() * 6, h: 0.75 + Math.random() * 0.6, sp: 5 + Math.random() * 6 };
      s.scale.set(0.3, 0.6, 1); s.position.set(W.FIRE.x + s.userData.ox, 0.4, W.FIRE.z + s.userData.oz);
      scene.add(s); fireFlames.push(s);
    }
    const smokes = [], smokeTex = HG.drawPuff();
    for (let i = 0; i < 12; i++) {
      const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: smokeTex, transparent: true, depthWrite: false, color: 0x4a4038, opacity: 0 }));
      s.userData = { t: i / 12 }; s.renderOrder = 3; scene.add(s); smokes.push(s);
    }
    let fireBoost = 1, fireCrackT = 0;

    // ================= 안개 · 눈 · 불티 =================
    const puffTex = HG.drawPuff(), puffs = [];
    {
      const r = HG.rng(31);
      for (let i = 0; i < 64; i++) {
        const m = new THREE.SpriteMaterial({ map: puffTex, transparent: true, opacity: 0.0, depthWrite: false, color: 0x1a2233 });
        const s = new THREE.Sprite(m); const w = 4 + r() * 4.5;
        s.scale.set(w, w * (0.28 + r() * 0.15), 1); s.position.set(-24 + r() * 68, 0.5 + r() * 1.3, (r() - 0.5) * 50);
        s.userData = { sp: 0.12 + r() * 0.25, op: 0.16 + r() * 0.16, ph: r() * 6 }; s.renderOrder = 3; scene.add(s); puffs.push(s);
      }
    }
    const SN = 4200, snowU = { uT: { value: 0 }, uCam: { value: new THREE.Vector3() }, uLan: { value: new THREE.Vector3() }, uLanI: { value: 1 }, uScale: { value: 600 } };
    {
      const g = new THREE.BufferGeometry(), pos = new Float32Array(SN * 3), sd = new Float32Array(SN), r = HG.rng(8);
      for (let i = 0; i < SN; i++) { pos[i * 3] = r() * 26; pos[i * 3 + 1] = r() * 14; pos[i * 3 + 2] = r() * 26; sd[i] = r(); }
      g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('aSeed', new THREE.BufferAttribute(sd, 1));
      const m = new THREE.ShaderMaterial({
        uniforms: snowU, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false,
        vertexShader: `uniform float uT; uniform vec3 uCam; uniform vec3 uLan; uniform float uLanI; uniform float uScale; attribute float aSeed; varying float vA; varying vec3 vCol;
          void main(){ vec3 box = vec3(26.0,14.0,26.0); vec3 p = position;
            p.y -= uT * (0.55 + aSeed * 0.5); p.x += uT * 0.35 + sin(uT * 0.8 + aSeed * 40.0) * 0.3; p.z += cos(uT * 0.6 + aSeed * 30.0) * 0.3;
            p = mod(p - uCam + box * 0.5, box) - box * 0.5 + uCam;
            vec4 mv = viewMatrix * vec4(p, 1.0); gl_Position = projectionMatrix * mv; float d = -mv.z;
            gl_PointSize = clamp(uScale * (0.016 + aSeed * 0.02) / max(d, 0.1), 1.0, uScale * 0.011);
            float dl = distance(p, uLan);
            vCol = vec3(0.13,0.17,0.26) + vec3(1.0,0.55,0.24) * uLanI * 1.5 / (1.0 + dl * dl * 1.1);
            vA = smoothstep(13.0, 8.0, d) * smoothstep(0.15, 0.6, d);
            if (p.x > -11.4 && p.x < 11.4 && p.z > -11.7 && p.z < -4.0 && p.y < 5.2) vA = 0.0;
            if (p.x > -12.4 && p.x < -6.7 && p.z > -2.4 && p.z < 4.4 && p.y < 3.4) vA = 0.0;
            if (abs(p.x - 23.0) < 2.3 && p.z > 10.4 && p.z < 12.6 && p.y < 2.9) vA = 0.0;
            if (p.x > 15.6 && p.x < 30.4 && p.z > -11.7 && p.z < -4.0 && p.y < 5.2) vA = 0.0;
            if (abs(p.x - 13.0) < 1.0 && p.z > 2.2 && p.z < 5.8 && p.y < 2.7) vA = 0.0; }`,
        fragmentShader: 'varying float vA; varying vec3 vCol; void main(){ float a = smoothstep(0.5, 0.12, length(gl_PointCoord - 0.5)); gl_FragColor = vec4(vCol * a * vA, 1.0); }',
      });
      const pts = new THREE.Points(g, m); pts.frustumCulled = false; pts.renderOrder = 4; scene.add(pts);
    }
    const embers = [];
    for (let i = 0; i < 36; i++) {
      const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: flameTex, blending: THREE.AdditiveBlending, depthWrite: false, fog: false, color: 0xffb060 }));
      s.visible = false; s.userData = { life: 0, v: new THREE.Vector3() }; scene.add(s); embers.push(s);
    }
    const emitEmber = (p, big) => {
      const s = embers.find((e) => !e.visible); if (!s) return;
      s.visible = true; s.position.copy(p).add(new THREE.Vector3((Math.random() - 0.5) * 0.12, (Math.random() - 0.5) * 0.08, (Math.random() - 0.5) * 0.12));
      s.userData.life = 0.8 + Math.random() * 1.2; s.userData.max = s.userData.life; s.userData.s = big ? 0.035 + Math.random() * 0.03 : 0.01 + Math.random() * 0.012;
      s.userData.v.set((Math.random() - 0.5) * 0.4, 0.5 + Math.random() * 0.9, (Math.random() - 0.5) * 0.4);
    };

    // ================= 귀신 =================
    const ghost = new HG.Ghost(scene);

    // ================= 후처리 =================
    const rt = new THREE.WebGLRenderTarget(4, 4, { type: THREE.HalfFloatType, samples: 4 });
    const composer = new addons.EffectComposer(renderer, rt);
    composer.addPass(new addons.RenderPass(scene, camera));
    const bloom = new addons.UnrealBloomPass(new THREE.Vector2(256, 256), 0.5, 0.75, 0.92); composer.addPass(bloom);
    composer.addPass(new addons.OutputPass());
    const fin = new addons.ShaderPass({
      uniforms: { tDiffuse: { value: null }, uTime: { value: 0 }, uFear: { value: 0 }, uFade: { value: 1 }, uDesat: { value: 0.12 }, uCA: { value: 0 }, uFlash: { value: 0 } },
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
      fragmentShader: `uniform sampler2D tDiffuse; uniform float uTime, uFear, uFade, uDesat, uCA, uFlash; varying vec2 vUv;
        float hsh(vec2 p){ vec3 q = fract(vec3(p.xyx) * 0.1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }
        void main(){
          vec2 c = vUv - 0.5; float r2 = dot(c, c);
          vec2 uv = 0.5 + c * (1.0 + 0.045 * r2) * 0.985;
          float ca = (0.0009 + uCA * 0.007) * (0.25 + r2 * 4.5); vec2 dir = normalize(c + 1e-5);
          vec3 col = vec3(texture2D(tDiffuse, uv + dir * ca).r, texture2D(tDiffuse, uv).g, texture2D(tDiffuse, uv - dir * ca).b);
          float l = dot(col, vec3(0.299, 0.587, 0.114));
          col = mix(col, vec3(l), uDesat);
          col *= mix(vec3(0.9, 1.0, 1.1), vec3(1.0), smoothstep(0.0, 0.4, l));
          col = pow(max(col, 0.0), vec3(1.06));
          float v = smoothstep(0.92, 0.22, length(c * vec2(1.0, 0.92)) * (1.0 + uFear * 0.38));
          col *= mix(0.18, 1.0, v);
          float g = hsh(gl_FragCoord.xy + fract(uTime * 7.31) * vec2(913.0, 517.0)) - 0.5;
          col += g * (0.05 + 0.035 * uFear) * (1.15 - l);
          col = mix(col, vec3(0.0), uFade) + uFlash;
          gl_FragColor = vec4(col, 1.0);
        }`,
    });
    composer.addPass(fin);
    const FU = fin.uniforms;

    let renderScale = 1, lastW = 0, lastH = 0;
    function resize() {
      const w = Math.max(2, window.innerWidth), h = Math.max(2, window.innerHeight); lastW = window.innerWidth; lastH = window.innerHeight;
      const pr = Math.min(window.devicePixelRatio || 1, 1.25) * renderScale;
      renderer.setPixelRatio(pr); renderer.setSize(w, h, false);
      composer.setPixelRatio(pr); composer.setSize(w, h);
      camera.aspect = w / h; camera.updateProjectionMatrix();
      snowU.uScale.value = (h * pr) / (2 * Math.tan((camera.fov * Math.PI) / 360));
    }
    window.addEventListener('resize', resize); resize();

    // ================= 상태 =================
    const P = { x: 0, z: 9.3, y: 0, yaw: 0, pitch: 0, vx: 0, vz: 0, bob: 0, eye: 1.62, surf: 'dirt', moving: 0 };
    const S = {
      phase: 'title', playing: false, paused: false, control: false, time: 0,
      note1: false, note2: false, got: {}, tal: 0, enteredMaru: false,
      fear: 0, fearT: 0, lanMul: 1, lanT: 1, blink: 0, boost: 1, wind: 1, windT: 1, shake: 0,
      busy: false, reading: 0, choosing: false, apparition: null, appT: 0, bar: 0, dead: false, ending: null,
      shedLocked: false, lanOut: false, gustT: 9, ambT: 30, heartT: 0, huntBlinkT: 4, checkpoint: null, lanDead: 0, sawNote2Hint: false,
    };
    const keys = {};
    const timers = [], tweens = [];
    const after = (s, fn) => timers.push({ t: S.time + s, fn });
    const tween = (dur, fn, done) => tweens.push({ t: 0, dur, fn, done });

    // ---------- UI ----------
    let subTimer = 0;
    const sub = (txt, dur) => { const e = $('sub'); e.innerHTML = txt; e.classList.add('on'); subTimer = dur || 4.2; };
    const setObj = (txt) => { const e = $('obj'); e.classList.remove('on'); void e.offsetWidth; e.innerHTML = txt; e.classList.add('on'); };
    const setTalUI = () => { $('tal').innerHTML = S.tal ? '符'.repeat(S.tal).split('').map((c) => '<span>' + c + '</span>').join('') : ''; };
    let promptTxt = null;
    const setPrompt = (txt) => { if (txt === promptTxt) return; promptTxt = txt; const e = $('prompt'); if (txt) { e.innerHTML = txt; e.classList.add('on'); } else e.classList.remove('on'); };

    function openNote(n, cb) {
      S.reading = n; S.control = false; S.noteCb = cb; A.paper(); setPrompt(null); target = null; $('sub').classList.remove('on'); subTimer = 0;
      $('noteTitle').textContent = NOTES[n].title;
      $('noteBody').innerHTML = NOTES[n].text.map((l) => (l ? '<p>' + l + '</p>' : '<p class="gap"></p>')).join('');
      $('note').classList.add('on'); S.noteAt = performance.now();
    }
    function closeNote() {
      if (!S.reading || performance.now() - S.noteAt < 500) return;
      $('note').classList.remove('on'); S.reading = 0; S.control = true; A.paper();
      if (S.noteCb) { const cb = S.noteCb; S.noteCb = null; cb(); }
    }
    function openChoice() {
      S.choosing = true; S.control = false; setPrompt(null); target = null; $('sub').classList.remove('on'); subTimer = 0;
      $('chHint').style.display = S.note2 ? '' : 'none';
      $('choice').classList.add('on');
    }
    function closeChoice() { S.choosing = false; S.control = true; $('choice').classList.remove('on'); }

    // ---------- 충돌 ----------
    function groundAt(x, z) {
      let h = 0, surf = 'dirt';
      for (const q of HG.zones) if (x > q.x0 && x < q.x1 && z > q.z0 && z < q.z1 && q.h >= h) { h = q.h; surf = q.surf; }
      return { h, surf };
    }
    function resolve(p) {
      const r = 0.3;
      for (let it = 0; it < 3; it++) {
        for (const b of HG.col.boxes) {
          if (!b.on) continue;
          const cx = clamp(p.x, b.x0, b.x1), cz = clamp(p.z, b.z0, b.z1), dx = p.x - cx, dz = p.z - cz, d2 = dx * dx + dz * dz;
          if (d2 >= r * r) continue;
          if (d2 > 1e-9) { const d = Math.sqrt(d2); p.x = cx + (dx / d) * r; p.z = cz + (dz / d) * r; }
          else { const l = p.x - b.x0, rr = b.x1 - p.x, t = p.z - b.z0, bb = b.z1 - p.z, m = Math.min(l, rr, t, bb); if (m === l) p.x = b.x0 - r; else if (m === rr) p.x = b.x1 + r; else if (m === t) p.z = b.z0 - r; else p.z = b.z1 + r; }
        }
        for (const c of HG.col.circles) {
          if (!c.on) continue;
          const dx = p.x - c.x, dz = p.z - c.z, d = Math.hypot(dx, dz), R = c.r + r;
          if (d < R) { if (d < 1e-5) { p.x += R; } else { p.x = c.x + (dx / d) * R; p.z = c.z + (dz / d) * R; } }
        }
      }
    }

    // ---------- 문 ----------
    function toggleDoor(d, open, fast) { d.target = open == null ? (d.target ? 0 : 1) : open ? 1 : 0; d.speed = fast ? 6 : 1.5; }
    function updateDoors(dt) {
      for (const k in W.doors) {
        const d = W.doors[k]; if (d.t === d.target) continue;
        const dir = Math.sign(d.target - d.t); d.t = clamp(d.t + dir * dt * (d.speed || 1.5), 0, 1);
        if ((dir > 0 && d.t >= 1) || (dir < 0 && d.t <= 0)) d.t = d.target;
        d.group.rotation.y = lerp(d.closed, d.open, ease(d.t)); d.col.on = d.t < 0.2;
        if (k === 'doorW') candle.shadow.needsUpdate = true;
      }
    }

    // ---------- 상호작용 ----------
    const posOf = (o) => ({ x: o.x, y: o.y == null ? 1.2 : o.y, z: o.z });
    const WELLP = { x: W.WELL.x, y: 0.2, z: W.WELL.z, ref: 3 };
    const fearUp = (v) => { S.fearT = Math.max(S.fearT, v); };
    const OBJ_BOTH = '부적을 <b>우물</b>에 붙이거나, <b>굿판의 불</b>에 살라라';
    const talHint = () => sub('누런 종이에 붉은 글씨. 부적이다.<br>까닭도 모르고 손댈 물건이 아니다.');
    const H = {
      note1: { label: '일기를 읽는다', use() { openNote(1, () => { if (!S.note1) { S.note1 = true; setObj('부적 석 장을 찾아라 <b>(' + S.tal + '/3)</b>'); sub('부적 석 장. 안방, 헛간, 당산나무…'); } }); } },
      note2: { label: '편지를 읽는다', use() { openNote(2, () => { if (!S.note2) { S.note2 = true; fearUp(0.4); sub('…가두려던 것이었다. 달래려던 것이 아니라.<br>마당 굿판의 불은, 아직 살아 있었다.', 6); if (S.tal === 3) setObj(OBJ_BOTH); } }); } },
      note3: { label: '쓰다 만 글을 읽는다', use() { openNote(3, () => { if (!S.note3) { S.note3 = true; fearUp(0.5); sub('식구들은 사라진 것이 아니다.<br>하나씩, 제 발로 우물에 간 것이다.', 6); } }); } },
      note4: { label: '종이를 집어 든다', use() { openNote(4, () => { if (!S.note4) { S.note4 = true; fearUp(0.5); sub('작은 이불이 셋. 하나같이 개켜지지 않은 채다.'); } }); } },
      key: { label: '열쇠를 집는다', can: () => !S.key, use() { S.key = true; W.keyMesh.visible = false; A.pickup(); sub('헛간 열쇠다.'); } },
      sot: { label: '솥뚜껑을 열어 본다', use() { A.scrape(0.4); sub('식은 밥이 그대로 굳어 있다. 일곱 그릇은 될 양이다.<br>아무도, 이 밥을 먹으러 오지 않았다.', 6); } },
      doorS: { label: () => (W.doors.doorS.target ? '문을 닫는다' : '문을 연다'), use() { toggleDoor(W.doors.doorS); A.creak(0.7, 0.1); } },
      doorSa: { label: () => (W.doors.doorSa.target ? '문을 닫는다' : '문을 연다'), use() { toggleDoor(W.doors.doorSa); A.creak(0.8, 0.1); } },
      doorSb: { label: () => (W.doors.doorSb.target ? '문을 닫는다' : '문을 연다'), use() { toggleDoor(W.doors.doorSb); A.creak(0.7, 0.1); } },
      hyeonpan: { label: '현판을 올려다본다', use() { sub('수졸재(守拙齋). 어리석음을 지킨다는 뜻이다.<br>이 집 주인은, 무엇을 지키려 했던가.', 6); } },
      baduk: { label: '바둑판을 살핀다', use() { sub('두다 만 판이다. 흑이 둘 차례.<br>맞은편 방석은, 식은 지 오래다.'); } },
      shoes: { label: '댓돌의 신을 살핀다', use() { sub('가죽신과 짚신이 가지런하다.<br>신을 벗어 두고, 맨발로 나간 것이다.', 6); } },
      trough: { label: '말구유를 살핀다', use() { sub('여물이 그대로다. 고삐는 끊겨 있다.<br>짐승이 먼저 알고 달아난 게다.', 6); } },
      bowls: { label: '살강을 살핀다', use() { sub('밥그릇이 일곱. 하나같이 엎어져 있다.<br>일곱 식구가, 한 끼를 다 먹고 치운 것이다.'); } },
      fire: {
        label: () => (S.tal === 3 && S.note2 && !S.busy ? '부적을 불에 사른다' : '불을 살핀다'), can: () => S.phase === 'explore',
        use() {
          if (S.tal === 3 && S.note2 && !S.busy) return doBurn();
          if (S.tal === 3) sub('굿판의 불씨가 아직 살아 있다.<br>…부적을 태워 버릴 까닭은, 아직 모른다.');
          else if (S.note2) sub('편지는 부적을 이 불에 살라 달라 하였다.<br>부적 석 장을 모두 찾아야 한다.');
          else sub('굿을 하다 만 자리. 불씨가 아직 살아 있다.<br>누가, 언제까지 지키고 있었을까.');
        },
      },
      tal1: { label: '부적을 집는다', can: () => !S.got[1], use() { if (!S.note1) return talHint(); takeTal(1); } },
      tal2: { label: '부적을 뗀다', can: () => !S.got[2], use() { if (!S.note1) return talHint(); takeTal(2); } },
      tal3: { label: '부적을 푼다', can: () => !S.got[3], use() { if (!S.note1) return talHint(); takeTal(3); } },
      doorW: { label: () => (W.doors.doorW.target ? '문을 닫는다' : '문을 연다'), use() { toggleDoor(W.doors.doorW); A.creak(0.7, 0.1); } },
      doorE: { label: () => (W.doors.doorE.target ? '문을 닫는다' : '문을 연다'), use() { toggleDoor(W.doors.doorE); A.creak(0.8, 0.1); } },
      doorShed: { label: () => (W.doors.shed.target ? '문을 닫는다' : !S.key ? '잠긴 문을 살핀다' : !S.shedOpened ? '자물쇠를 연다' : '문을 연다'), use() {
        if (S.shedLocked) { A.knock(null, 2, 0.4); sub('열리지 않는다.'); return; }
        if (!S.key) { A.knock(null, 2, 0.3); sub(S.note1 ? '자물쇠가 채워져 있다.<br>열쇠는 부엌 걸이대에 걸었다 하였다.' : '자물쇠가 채워져 있다. 열쇠가 있어야 한다.'); return; }
        if (!S.shedOpened) { S.shedOpened = true; A.scrape(0.3); }
        toggleDoor(W.doors.shed); A.creak(1.1, 0.16);
      } },
      well: {
        label: () => (S.tal === 3 && !S.busy ? '우물 앞에 선다' : '우물을 들여다본다'), can: () => S.phase === 'explore',
        use() { if (S.tal === 3 && !S.busy) openChoice(); else { A.drip(WELLP); sub('깊다. 바닥이 보이지 않는다.<br>물 냄새에 섞여, 다른 냄새가 난다.'); fearUp(0.35); } },
      },
      gate: {
        label: () => (S.phase === 'hunt' ? '빗장을 벗긴다 <i>(누르고 있기)</i>' : '대문을 살핀다'), can: () => S.phase === 'explore' || S.phase === 'hunt', hold: () => S.phase === 'hunt',
        use() { A.knock(null, 2, 0.35); sub('빗장이 꿈쩍도 하지 않는다.<br>안에서 걸린 문이, 어찌 밖에서 잠긴 듯 굳었는가.'); },
      },
    };
    const ray = new THREE.Raycaster(); ray.far = 2.3;
    const pickList = W.proxies.concat(W.occluders);
    let target = null, pickT = 0;
    function pick() {
      ray.setFromCamera({ x: 0, y: 0 }, camera);
      const hits = ray.intersectObjects(pickList, false);
      for (const h of hits) {
        const k = h.object.userData.key;
        if (!k) return null;
        const hd = H[k]; if (!hd || (hd.can && !hd.can())) continue;
        return hd;
      }
      return null;
    }
    function useTarget() {
      if (!target || !S.control) return;
      if (target.hold && target.hold()) return;
      target.use();
    }

    // ---------- 이야기 ----------
    function takeTal(n) {
      S.got[n] = true; S.tal++; W['tal' + n].visible = false; A.pickup(); setTalUI();
      if (S.tal === 3) setObj(S.note2 ? OBJ_BOTH : '부적을 가지고 <b>우물</b>로 가라'); else setObj('부적 석 장을 찾아라 <b>(' + S.tal + '/3)</b>');
      if (n === 1) eventAnbang(); else if (n === 2) eventShed(); else eventTree();
    }
    function setCandle(on) {
      candleOn = on; flame.visible = on; candle.intensity = on ? 1.7 : 0;
      W.hanjiLit.emissiveIntensity = on ? 0.9 : 0.0; W.insideLit.emissiveIntensity = on ? 0.0 : 0.34;
    }
    function eventAnbang() {
      S.busy = true;
      after(0.7, () => { setCandle(false); A.blowOut(posOf(W.candle)); W.bulge.visible = false; W.bulgeHair.visible = false; fearUp(0.6); });
      after(2.2, () => {
        const s = W.sil; s.visible = true; s.position.x = -5.7;
        tween(6.5, (k) => { s.position.x = lerp(-5.7, -2.3, k); s.position.y = 0.6 + 0.95 + Math.abs(Math.sin(k * 16)) * 0.012; s.material.opacity = Math.min(1, Math.sin(k * Math.PI) * 4) * 0.9; }, () => { s.visible = false; S.busy = false; });
        for (let i = 0; i < 7; i++) after(i * 0.9, () => A.knock({ x: lerp(-5.5, -2.5, i / 7), y: 0.7, z: -5.9 }, 1, 0.22));
        A.sob({ x: -4, y: 1.5, z: -5.6 }, 0.12);
      });
      after(4.0, () => { sub('…밖에, 누가 있다.'); fearUp(0.85); });
      after(10, () => sub('마루에는 아무도 없다. 발자국조차.'));
    }
    function eventShed() {
      S.busy = true; S.shedLocked = true;
      const dp = { x: -7.5, y: 1, z: 1 };
      after(0.5, () => { toggleDoor(W.doors.shed, false, true); A.slam(dp, 0.9); S.shake = 0.5; S.lanT = 0.02; fearUp(0.8); });
      after(1.1, () => { sub('등불이…'); A.whisper(2.6, { x: P.x + 0.4, y: 1.5, z: P.z + 0.5 }, 0.3); });
      // 등불이 돌아오면, 문 옆 구석에 웅크린 채 이쪽을 올려다보고 있다
      after(3.6, () => { ghost.setFace('grin'); ghost.pose = 1; ghost.place(-8.08, 0, -0.98); ghost.faceTo(P.x, P.z); ghost.reveal = 0.45; ghost.setOpacity(1); ghost.show(true); S.lanT = 1; S.lanMul = 1; S.boost = 1.6; A.buk(0.9); fearUp(1); S.shake = 0.25; });
      after(5.4, () => { S.blink = 0.4; S.boost = 1; after(0.12, () => { ghost.show(false); ghost.pose = 0; ghost.reveal = 0; }); });
      after(5.8, () => { S.shedLocked = false; toggleDoor(W.doors.shed, true); A.creak(1.6, 0.18, dp); });
      after(7.2, () => { sub('…헛것이다. 헛것을 본 게다.'); S.busy = false; });
    }
    function eventTree() {
      S.busy = true;
      after(0.8, () => { S.windT = 0; });
      after(3.2, () => { sub('…바람이 멎었다.'); fearUp(0.5); });
      after(6.0, () => { A.splash(WELLP); fearUp(0.7); });
      after(7.4, () => {
        ghost.setFace('grin'); ghost.pose = 0; ghost.place(W.WELL.x - 1.5, 0, W.WELL.z - 0.5); ghost.faceTo(P.x, P.z); ghost.reveal = 0.1; ghost.setOpacity(1); ghost.show(true);
        S.apparition = 'well'; S.appT = 0; sub('우물가에… 누가 서 있다.');
      });
    }
    function endApparition() {
      S.apparition = null; S.blink = 0.45; A.whoosh(0.5); after(0.15, () => ghost.show(false));
      after(1.5, () => { S.windT = 0.7; S.busy = false; }); fearUp(0.9);
    }

    function doSeal() {
      closeChoice(); S.control = false; S.busy = true; S.sealed = true; S.phase = 'cut';
      W.wellTals.forEach((t, i) => after(0.3 + i * 0.7, () => { t.visible = true; A.knock(WELLP, 1, 0.5); A.paper(); }));
      after(1.2, () => { A.water(WELLP, 3.2); fearUp(1); S.shake = 0.2; });
      after(2.8, () => { A.sob(WELLP, 0.34, true); sub('우물 밑에서, 무언가 벽을 긁으며 올라오다 — 떨어졌다.'); });
      after(6.2, () => { S.lanT = 0; S.windT = 0; });
      after(8.4, () => {
        ghost.setFace('grin'); ghost.pose = 0; ghost.place(0, 0.6, -5.6); ghost.reveal = 0; ghost.setOpacity(1); ghost.show(true); ghost.faceTo(P.x, P.z);
        S.lanT = 1; S.lanMul = 1; S.lanOut = false; S.gustT = 9 + Math.random() * 3; A.buk(1); S.shake = 0.3; S.windT = 1;
        S.phase = 'hunt'; S.control = true; S.busy = false; S.bar = 0;
        S.checkpoint = { x: P.x, z: P.z, yaw: P.yaw };
        setObj('<b>대문의 빗장을 벗기고 달아나라</b>'); sub('마루 끝에, 서 있다.<br>— 등을 보이거나 등불이 꺼지면 다가온다.', 7);
      });
    }
    function doBurn() {
      closeChoice(); S.control = false; S.busy = true; S.burned = true; S.phase = 'cut'; S.tal = 0; setTalUI();
      const fp = new THREE.Vector3(W.FIRE.x, 0.3, W.FIRE.z), FP = { x: W.FIRE.x, y: 0.3, z: W.FIRE.z };
      // 부적을 굿판의 불에 던져 넣는다
      setObj('부적이 타는 것을 지켜보라'); sub('부적 석 장을, 굿판의 불 속에 던져 넣었다.', 3.6);
      A.paper(); A.fire(FP);
      // 부적이 손에서 날아가 불 위에서 오그라들며 탄다
      const hp = new THREE.Vector3(); lanLight.getWorldPosition(hp); hp.y += 0.1;
      for (let i = 0; i < 3; i++) {
        const mat = HG.M.talisman.clone(); mat.emissive = new THREE.Color(0xff5a10); mat.emissiveIntensity = 0;
        const t = new THREE.Mesh(new THREE.PlaneGeometry(0.11, 0.25), mat); scene.add(t);
        const tx = W.FIRE.x + (i - 1) * 0.14, tz = W.FIRE.z + (i % 2) * 0.1 - 0.05, r0 = Math.random() * 6;
        after(i * 0.35, () => tween(0.9, (k) => { t.position.set(lerp(hp.x, tx, k), lerp(hp.y, 0.42, k) + Math.sin(k * Math.PI) * 0.45, lerp(hp.z, tz, k)); t.rotation.set(k * 5 + r0, k * 3, k * 4); },
          () => tween(2.6, (k) => { mat.emissiveIntensity = Math.sin(Math.min(1, k * 2.5) * Math.PI / 2) * 2.5; mat.color.setScalar(1 - k * 0.95); t.scale.set(1 - k * 0.7, 1 - k * 0.85, 1); t.rotation.x += 0.03; t.position.y = 0.42 + k * 0.25; emitEmber(t.position, Math.random() < 0.3); }, () => scene.remove(t))));
      }
      tween(1.2, (k) => { fireBoost = lerp(1, 3.0, ease(k)); }, () => tween(5, (k) => { fireBoost = lerp(3.0, 1, ease(k)); if (Math.random() < 0.7) emitEmber(fp, Math.random() < 0.3); }));
      after(4.2, () => { sub('부적 석 장이 재가 되어 눈발에 흩어졌다.'); S.windT = 0.5; });
      // 우물에서 올라온다 — 시선을 우물 쪽으로
      after(6.5, () => {
        A.water(WELLP, 2.4); sub('…우물에서, 물소리가 난다.');
        const y0 = P.yaw; let y1 = Math.atan2(-(W.WELL.x - P.x), -(W.WELL.z - P.z)); while (y1 - y0 > Math.PI) y1 -= Math.PI * 2; while (y1 - y0 < -Math.PI) y1 += Math.PI * 2;
        const p0 = P.pitch; tween(2.2, (k) => { P.yaw = lerp(y0, y1, ease(k)); P.pitch = lerp(p0, 0, ease(k)); });
        setObj('우물을 보라'); ghost.setFace('calm'); ghost.pose = 0; ghost.reveal = 0.95;
        ghost.place(W.WELL.x, -1.7, W.WELL.z); ghost.faceTo(P.x, P.z); ghost.setOpacity(0.0); ghost.show(true);
        tween(5, (k) => { ghost.group.position.y = lerp(-1.7, 0.6, ease(k)); ghost.setOpacity(Math.min(1, k * 2)); ghost.faceTo(P.x, P.z); });
        fearUp(0.6);
      });
      after(10.2, () => sub('젖은 수의 차림의 여인이, 우물 위에 떠올랐다.<br>감은 눈으로, 이쪽을 보고 있다.', 4.5));
      after(13, () => { sub('…가시오.<br>이제, 어머니 계신 집으로 가도 되오.', 5.5); S.control = true; });
      // 이 집이 아니라, 대문 밖 고갯길로 떠난다
      after(16, openGate);
      after(17.5, () => {
        setObj('그녀를 배웅하고, 이 집을 떠나라'); S.phase = 'leave'; S.busy = false;
        after(3, () => { if (S.phase === 'leave') sub('그녀는 안채 쪽을 돌아보지 않았다.<br>대문 밖, 고개 너머 친정으로 가는 길이다.', 7); });
        const GXp = W.GATE.x, pts = [[W.WELL.x, 0.6, W.WELL.z], [9.0, 0.0, 3.4], [12.2, 0.0, 4.0], [15, 0.0, 4.1], [GXp - 1.5, 0.0, 8.6], [GXp, 0.0, 10.6], [GXp, 0.0, 13.5], [GXp + 0.6, 0.0, 24]];
        const lens = []; let tot = 0; for (let i = 0; i < pts.length - 1; i++) { const l = Math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][2] - pts[i][2]); lens.push(l); tot += l; }
        tween(34, (k) => {
          if (S.phase === 'end') return;
          let dd = k * tot, i = 0; while (i < lens.length - 1 && dd > lens[i]) { dd -= lens[i]; i++; }
          const u = Math.min(1, dd / lens[i]), a = pts[i], b = pts[i + 1];
          ghost.place(lerp(a[0], b[0], u), lerp(a[1], b[1], Math.min(1, u * 3)), lerp(a[2], b[2], u));
          ghost.faceTo(b[0], b[2]); ghost.reveal = Math.max(0, 0.95 - k * 6);
          ghost.setOpacity(k > 0.72 ? Math.max(0, 1 - (k - 0.72) / 0.28) : 1);
        }, () => { ghost.show(false); if (S.phase === 'leave') sub('눈발 속으로, 흰 옷자락이 고갯길을 넘어갔다.', 6); });
      });
    }
    function openGate() {
      const gp = { x: W.GATE.x, y: 1.3, z: 11.4 };
      // 빗장이 걸이에서 빠져 바닥에 떨어진다 (문짝과 함께 돌지 않고, 허공에 남지도 않는다)
      A.scrape(0.8); tween(0.9, (k) => { W.gateBar.position.x = W.GATE.x - k * 0.5; W.gateBar.position.z = 11.37 - k * 0.45; W.gateBar.rotation.z = -k * 0.12; W.gateBar.rotation.y = k * 0.5; W.gateBar.position.y = lerp(1.22, 0.06, k * k); }, () => A.knock({ x: W.GATE.x, y: 0.1, z: 11 }, 1, 0.3));
      after(0.7, () => {
        A.creak(2.2, 0.2, gp); W.gateBlock.on = false;
        tween(2.6, (k) => { const e = ease(k); W.gateL.rotation.y = -e * 1.35; W.gateR.rotation.y = Math.PI + e * 1.35; });
      });
    }
    // 꺼진 등불을 직접 다시 켠다
    function relight() {
      if (!S.lanOut || !S.control) return;
      S.lanOut = false; S.lanT = 1; S.lanMul = 0.45; S.gustT = 8 + Math.random() * 5; A.flint(); $('relight').classList.remove('on'); sub('부싯돌을 쳐, 등불을 다시 붙였다.', 1.6);
      const lp = new THREE.Vector3(); lanLight.getWorldPosition(lp); for (let i = 0; i < 5; i++) emitEmber(lp, false);
    }
    function die() {
      if (S.dead) return; S.dead = true; S.control = false; S.phase = 'dead';
      const fx = -Math.sin(P.yaw), fz = -Math.cos(P.yaw);
      ghost.setFace('grin'); ghost.pose = 0;
      // 드러난 한쪽 눈이 화면 가운데에 오도록 살짝 비껴 세운다
      const gy = P.y + P.eye - 0.03 - 1.63;
      ghost.place(P.x + fx * 0.5, gy, P.z + fz * 0.5); ghost.faceTo(P.x, P.z); ghost.show(true); ghost.setOpacity(1);
      $('sub').classList.remove('on'); subTimer = 0; setPrompt(null); lanShow(false);
      // 드러난 한쪽 눈을 화면 한가운데에 둔다
      const th = ghost.group.rotation.y, hx0 = ghost.group.position.x + Math.sin(th) * 0.09, hz0 = ghost.group.position.z + Math.cos(th) * 0.09;
      const exw = hx0 + Math.cos(th) * 0.026, ezw = hz0 - Math.sin(th) * 0.026, eyw = gy + 1.604 + 0.004;
      P.yaw = Math.atan2(-(exw - P.x), -(ezw - P.z)); P.pitch = Math.atan2(eyw - (P.y + P.eye - 0.03), Math.hypot(exw - P.x, ezw - P.z));
      const r0 = ghost.reveal;
      tween(0.2, (k) => { ghost.reveal = lerp(r0, 0.85, k); camera.fov = lerp(68, 30, ease(k)); camera.updateProjectionMatrix(); });
      A.buk(1.3); after(0.16, () => A.buk(0.9)); A.whoosh(0.9); $('relight').classList.remove('on'); S.shake = 0.9; S.lanDead = 1; S.blink = 0; S.lanMul = 1; fearUp(1); S.fear = 1;
      after(1.25, () => { FU.uFade.value = 1; ghost.show(false); S.lanDead = 0; $('dead').classList.add('on'); $('hud').classList.remove('on'); $('sub').classList.remove('on'); S.playing = false; });
    }
    function retry() {
      $('dead').classList.remove('on'); $('hud').classList.add('on'); const c = S.checkpoint;
      P.x = c.x; P.z = c.z; P.yaw = c.yaw; P.pitch = 0; P.vx = P.vz = 0; camera.fov = 68; camera.updateProjectionMatrix(); lanShow(true);
      ghost.reveal = 0; ghost.place(0, 0.6, -5.9); ghost.show(true); S.bar = 0; S.dead = false; S.phase = 'hunt'; S.control = true; S.playing = true; S.fear = 0.5; S.fearT = 0.6; S.gustT = 9; S.lanOut = false; S.lanT = 1; S.lanMul = 1; $('relight').classList.remove('on');
      tween(1.5, (k) => { FU.uFade.value = 1 - k; });
    }
    function endGame(kind) {
      if (S.ending) return; S.ending = kind; S.control = false; S.phase = 'end'; ghost.show(false); $('hud').classList.remove('on');
      A.dadeumi(false);
      tween(3.5, (k) => { FU.uFade.value = k; }, () => {
        S.playing = false; if (document.pointerLockElement) document.exitPointerLock();
        const e = ENDS[kind]; $('endTitle').textContent = e.title; const box = $('endLines'); box.innerHTML = '';
        $('end').classList.add('on'); A.gong(0.45);
        e.lines.forEach((l, i) => setTimeout(() => { const p = document.createElement('p'); p.innerHTML = l; box.appendChild(p); requestAnimationFrame(() => p.classList.add('on')); }, 1200 + i * 3400));
        setTimeout(() => $('endBtn').classList.add('on'), 1200 + e.lines.length * 3400);
      });
    }

    function ambient() {
      const r = Math.random();
      if (r < 0.2) A.creak(0.9, 0.09, posOf(W.dwiju));
      else if (r < 0.38) A.sob({ x: -3 + Math.random() * 6, y: 1.5, z: -13 }, 0.07);
      else if (r < 0.54) A.knock({ x: -4, y: 1.6, z: -6.5 }, 2, 0.14);
      else if (r < 0.7) A.whisper(1.6, { x: P.x + Math.sin(P.yaw) * 2, y: 1.5, z: P.z + Math.cos(P.yaw) * 2 }, 0.1);
      else if (r < 0.86) { S.blink = 0.18; fearUp(0.3); }
      else A.drip(WELLP);
    }

    // ================= 갱신 =================
    const v3 = new THREE.Vector3(), lanW = new THREE.Vector3();
    function update(dt) {
      S.time += dt; const time = S.time;
      HG.uTime.value = time;
      for (let i = timers.length - 1; i >= 0; i--) if (timers[i].t <= time) { const f = timers[i].fn; timers.splice(i, 1); f(); }
      for (let i = tweens.length - 1; i >= 0; i--) { const tw = tweens[i]; tw.t += dt; const k = Math.min(1, tw.t / tw.dur); tw.fn(k); if (k >= 1) { tweens.splice(i, 1); if (tw.done) tw.done(); } }

      // ---- 이동 ----
      let mx = 0, mz = 0;
      if (S.control) { if (keys.KeyW || keys.ArrowUp) mz += 1; if (keys.KeyS || keys.ArrowDown) mz -= 1; if (keys.KeyD || keys.ArrowRight) mx += 1; if (keys.KeyA || keys.ArrowLeft) mx -= 1; }
      const run = S.control && (keys.ShiftLeft || keys.ShiftRight) && mz > 0;
      const len = Math.hypot(mx, mz) || 1, sp = run ? 3.7 : 1.85;
      const fx = -Math.sin(P.yaw), fz = -Math.cos(P.yaw), rx = Math.cos(P.yaw), rz = -Math.sin(P.yaw);
      const tx = ((fx * mz + rx * mx) / len) * sp, tz = ((fz * mz + rz * mx) / len) * sp;
      const acc = 1 - Math.exp(-dt * 9);
      P.vx = lerp(P.vx, tx, acc); P.vz = lerp(P.vz, tz, acc);
      const old = { x: P.x, z: P.z }, np = { x: P.x + P.vx * dt, z: P.z + P.vz * dt };
      resolve(np);
      let g = groundAt(np.x, np.z);
      if (g.h - P.y > 0.42) {
        const a = { x: np.x, z: old.z }, b = { x: old.x, z: np.z };
        if (groundAt(a.x, a.z).h - P.y <= 0.42) { np.x = a.x; np.z = a.z; } else if (groundAt(b.x, b.z).h - P.y <= 0.42) { np.x = b.x; np.z = b.z; } else { np.x = old.x; np.z = old.z; }
        g = groundAt(np.x, np.z);
      }
      P.x = np.x; P.z = np.z; P.surf = g.surf;
      P.y = lerp(P.y, g.h, 1 - Math.exp(-dt * 11));
      const spd = Math.hypot(P.x - old.x, P.z - old.z) / Math.max(dt, 1e-4);
      P.moving = lerp(P.moving, clamp(spd / 1.85, 0, 2), 1 - Math.exp(-dt * 8));
      const pb = P.bob; P.bob += spd * dt * (run ? 1.45 : 1.75);
      if (Math.floor(P.bob / Math.PI) !== Math.floor(pb / Math.PI) && spd > 0.5) A.step(P.surf, run);

      // ---- 카메라 ----
      const bobY = Math.abs(Math.sin(P.bob)) * 0.045 * Math.min(1, P.moving) * (run ? 1.5 : 1), bobX = Math.cos(P.bob) * 0.012 * Math.min(1, P.moving);
      const breath = Math.sin(time * 1.25) * 0.004 * (1 + S.fear * 2.5);
      let sy = 0, spv = 0, sr = 0;
      if (S.shake > 0.001) { sy = (Math.random() - 0.5) * 0.05 * S.shake; spv = (Math.random() - 0.5) * 0.05 * S.shake; sr = (Math.random() - 0.5) * 0.04 * S.shake; S.shake *= Math.exp(-dt * 3.2); }
      camera.position.set(P.x + rx * bobX, P.y + P.eye + bobY - 0.03, P.z + rz * bobX);
      camera.rotation.set(P.pitch + breath + spv, P.yaw + sy, sr + bobX * 0.5);
      camera.updateMatrixWorld();
      camera.getWorldDirection(HG._fwd);
      sky.position.copy(camera.position);

      // ---- 초롱 ----
      S.lanMul = lerp(S.lanMul, S.lanT, 1 - Math.exp(-dt * (S.lanT < S.lanMul ? 9 : 2.2)));
      S.blink = Math.max(0, S.blink - dt);
      const fl = 0.88 + 0.07 * Math.sin(time * 11.3) * Math.sin(time * 7.1) + 0.05 * Math.sin(time * 23.7 + Math.sin(time * 3.1) * 2) + (Math.random() - 0.5) * 0.04;
      const chase = S.phase === 'hunt' || S.phase === 'escape';   // 추격 중에는 등불이 저절로 흔들려 어두워지지 않는다
      const fearFl = S.fear > 0.6 && !chase ? 1 - (S.fear - 0.6) * 0.8 * (0.5 + 0.5 * Math.sin(time * 31) * Math.sin(time * 17.3)) : 1;
      const lk = fl * fearFl * S.lanMul * (S.blink > 0 ? 0.015 : 1) * S.boost;
      lanLight.intensity = LAN_I * lk; lanPaper.emissiveIntensity = 1.25 * lk + (S.lanOut ? 0 : 0.02); lanPaper.color.setScalar(S.lanOut ? 0.18 : 1);
      if (S.lanDead > 0) {
        const fk = 0.6 + 0.4 * Math.sin(time * 47) * Math.sin(time * 29);
        lanLight.color.copy(LAN_DEAD); lanLight.intensity = LAN_I * 0.05 * fk; lanPaper.emissiveIntensity = 0.15; scareLight.intensity = 1.5 * fk;
      } else { lanLight.color.copy(LAN_COL); scareLight.intensity = 0; }
      lanPend.rotation.z = lerp(lanPend.rotation.z, -(P.vx * rx + P.vz * rz) * 0.07 + Math.sin(time * 2.3) * 0.02 + Math.sin(P.bob) * 0.05 * Math.min(1, P.moving), 1 - Math.exp(-dt * 5));
      lanPend.rotation.x = lerp(lanPend.rotation.x, (P.vx * fx + P.vz * fz) * 0.06 + Math.sin(time * 1.9 + 1) * 0.02 + Math.cos(P.bob * 2) * 0.03 * Math.min(1, P.moving), 1 - Math.exp(-dt * 5));
      {
        let need = 0;
        for (const r of [0, 0.25, 0.5, 0.75, 1]) { const oz = lerp(0.7, 0.2, r), ox = lerp(0.34, 0.16, r); need = r; if (!blockedAt(P.x + fx * oz + rx * ox, P.z + fz * oz + rz * ox, 0.09)) break; }
        if (lanDoorClose) need = 1;   // 열린 문짝에 초롱이 박히지 않게
        lanRetract = lerp(lanRetract, need, 1 - Math.exp(-dt * (need > lanRetract ? 18 : 5)));
        lan.position.z = lerp(-0.7, -0.2, lanRetract); lan.position.x = lerp(0.34, 0.16, lanRetract) + bobX * 0.5;
      }
      {
        // 초롱이 벽 · 문짝에 바짝 붙으면 그 면이 하얗게 날아가므로, 가까운 면까지의 거리에 맞춰 빛을 줄인다
        if ((lanNearTick++ & 1) === 0) {
          let dn = 0.6; lanDoorClose = false;
          for (const pd of [0.14, 0.22, 0.32, 0.44]) if (blockedAt(lanW.x, lanW.z, pd)) { dn = pd; break; }
          for (let i = 0; i < 8; i++) {
            nearRay.set(lanW, nearDir.set(Math.cos(i * Math.PI / 4), 0, Math.sin(i * Math.PI / 4))); nearRay.far = dn;
            const hit = nearRay.intersectObjects(doorGroups, true)[0]; if (hit) { dn = Math.max(0.1, hit.distance); if (hit.distance < 0.4) lanDoorClose = true; }
          }
          lanNearT = Math.min(1, Math.pow(dn / 0.6, 1.2));
        }
        lanNear = lerp(lanNear, lanNearT, 1 - Math.exp(-dt * 8));
        lanLight.intensity *= lanNear;
      }
      lanFill.intensity = LAN_I * 0.27 * lk;
      lan.position.y = -0.3 - bobY * 0.4 + Math.sin(time * 1.25) * 0.003;
      lanLight.getWorldPosition(lanW);
      snowU.uLan.value.copy(lanW); snowU.uLanI.value = lk; snowU.uCam.value.copy(camera.position);

      // ---- 촛불 ----
      if (candleOn) { const cf = 0.9 + 0.08 * Math.sin(time * 9.1) + 0.05 * Math.sin(time * 17.7); candle.intensity = 1.7 * cf; flame.scale.set(0.045, 0.09 * (0.92 + 0.1 * Math.sin(time * 13)), 1); }

      // ---- 모닥불 ----
      {
        const ff = 0.82 + 0.12 * Math.sin(time * 7.3) * Math.sin(time * 4.1) + 0.08 * Math.sin(time * 19.1) + (Math.random() - 0.5) * 0.05;
        fireLight.intensity = FIRE_I * ff * Math.min(2.2, fireBoost); W.fireMat.emissiveIntensity = (1.6 + 0.6 * ff) * Math.min(2, fireBoost);
        const fb = 0.75 + 0.25 * fireBoost;
        for (const s of fireFlames) {
          const u = s.userData, k = 0.7 + 0.4 * Math.sin(time * u.sp + u.ph) * Math.sin(time * u.sp * 0.57 + u.ph * 2) + 0.12 * Math.sin(time * 23 + u.ph), hh = u.h * k * fb;
          s.scale.set(hh * (0.5 + 0.1 * Math.sin(time * 7 + u.ph)) * (Math.sin(time * 2.1 + u.ph) > 0 ? 1 : -1), hh, 1);
          s.position.set(W.FIRE.x + u.ox + Math.sin(time * 3 + u.ph) * 0.03, 0.02 + hh * 0.44, W.FIRE.z + u.oz);
        }
        for (const s of smokes) {
          const u = s.userData; u.t += dt * 0.11; if (u.t > 1) u.t -= 1;
          const t = u.t, sc = 0.5 + t * 2.6;
          s.position.set(W.FIRE.x + t * t * 2.2 * (0.3 + S.wind) + Math.sin(t * 9 + u.t) * 0.1, 0.9 + t * 5.2, W.FIRE.z + Math.sin(t * 5) * 0.2);
          s.scale.set(sc, sc * 0.9, 1); s.material.opacity = Math.sin(Math.min(1, t * 4) * Math.PI / 2) * (1 - t) * 0.32;
          const hot = Math.max(0, 1 - t * 3.5); s.material.color.setRGB(0.2 + hot * 0.7, 0.17 + hot * 0.3, 0.15 + hot * 0.08);
        }
        fireCrackT -= dt; if (fireCrackT <= 0) { fireCrackT = 0.1 + Math.random() * 0.5; A.crackle({ x: W.FIRE.x, y: 0.3, z: W.FIRE.z, ref: 2.2, roll: 1.4 }); emitEmber(v3.set(W.FIRE.x, 0.5, W.FIRE.z), false); }
      }

      // ---- 바람 · 눈 · 안개 ----
      S.wind = lerp(S.wind, S.windT, 1 - Math.exp(-dt * 0.9)); HG.uWind.value = S.wind; A.setWind(S.wind);
      snowU.uT.value += dt * (0.35 + 0.65 * S.wind);
      const indoors = (P.z > -10.5 && P.z < -6.5 && ((P.x > -10 && P.x < -2) || (P.x > 2 && P.x < 10) || (P.x > 17 && P.x < 21) || (P.x > 25 && P.x < 29))) || (P.x > -11.5 && P.x < -7.5 && P.z > -1.5 && P.z < 3.5);
      for (const s of puffs) {
        s.position.x += s.userData.sp * dt * (0.2 + S.wind); if (s.position.x > 46) s.position.x = -26;
        const d2 = (s.position.x - lanW.x) ** 2 + (s.position.z - lanW.z) ** 2, k = (lk * 0.55) / (1 + d2 * 0.035);
        s.material.color.setRGB(0.045 + k * 0.5, 0.06 + k * 0.27, 0.095 + k * 0.1);
        // 안개 판은 건물 안으로 절대 걸치지 않게 한다 (실내에 떠 있는 '한 장짜리 막'처럼 보이는 문제)
        const px = s.position.x, pz = s.position.z, hw = s.scale.x * 0.5 + 0.3;
        const hit = (x0, x1, z0, z1) => Math.hypot(Math.max(x0 - px, 0, px - x1), Math.max(z0 - pz, 0, pz - z1)) < hw;
        const inside = hit(-11.3, 11.3, -11.7, -4.2) || hit(-12.3, -6.8, -2.3, 4.3) || hit(20.7, 25.3, 10.6, 12.4) || indoors || hit(15.7, 30.3, -11.7, -4.2)
          || hit(-13.3, 33.3, 11.2, 11.8) || hit(-13.3, 33.3, -14.3, -13.7) || hit(-13.3, -12.7, -14, 11.5) || hit(12.7, 13.3, -14, 11.5) || hit(32.7, 33.3, -14, 11.5) || hit(9, 12.6, -3.9, -0.5);
        const near = Math.hypot(px - P.x, pz - P.z);
        s.material.opacity = lerp(s.material.opacity, inside ? 0 : s.userData.op * (0.75 + 0.25 * Math.sin(time * 0.2 + s.userData.ph)) * clamp((near - 1.5) / 4, 0, 1), 1 - Math.exp(-dt * (inside ? 6 : 1.5)));
      }
      for (const e of embers) if (e.visible) {
        const u = e.userData; u.life -= dt; if (u.life <= 0) { e.visible = false; continue; }
        e.position.addScaledVector(u.v, dt); u.v.x += (Math.random() - 0.5) * dt * 2; const k = u.life / u.max; e.scale.set(u.s * k, u.s * 1.6 * k, 1); e.material.opacity = k;
      }

      updateDoors(dt);
      ghost.camDist = Math.hypot(ghost.group.position.x - P.x, ghost.group.position.z - P.z);
      ghost.update(dt, time);

      // ---- 이야기 진행 ----
      if (S.phase === 'explore' && !S.enteredMaru && P.z < -5.3 && P.x > -6.1 && P.x < 10.1) {
        S.enteredMaru = true; A.dadeumi(false); fearUp(0.45);
        after(1.4, () => sub('…다듬이 소리가, 멎었다.'));
      }
      if (S.apparition === 'well') {
        S.appT += dt; const d = Math.hypot(P.x - ghost.group.position.x, P.z - ghost.group.position.z);
        fearUp(clamp(1 - d / 14, 0.4, 0.9));
        if (d < 4.3 || S.appT > 18) endApparition();
      }
      if (S.phase === 'hunt') {
        const gp = ghost.group.position, dx = P.x - gp.x, dz = P.z - gp.z, d = Math.hypot(dx, dz);
        v3.set(gp.x - camera.position.x, gp.y + 1.2 - camera.position.y, gp.z - camera.position.z).normalize();
        // 규칙은 둘뿐: 등불을 켠 채 바라보면 꼼짝 못 한다. 등을 보이거나 등불이 꺼져 있으면 다가온다.
        const lit = !S.lanOut && S.lanMul > 0.3, seen = lit && v3.dot(HG._fwd) > 0.6 && d < 34;
        // 등불은 제멋대로 깜박이지 않는다. 이따금 바람에 꺼지고, 꺼지면 F 로 직접 다시 켠다.
        if (!S.lanOut) { S.gustT -= dt; if (S.gustT <= 0) { S.lanOut = true; S.lanT = 0; A.blowOut(null); A.whoosh(0.45); $('relight').classList.add('on'); sub('바람에 등불이 꺼졌다.', 2.5); } }
        const gs = seen ? 0 : lit ? 1.9 : 2.5;
        if (seen && Math.random() < dt * 0.7) ghost.twitch = 0.18;   // 제자리에서 움찔거릴 뿐, 다가오지는 않는다
        if (d > 0.01) { gp.x += (dx / d) * gs * dt; gp.z += (dz / d) * gs * dt; }
        gp.y = lerp(gp.y, groundAt(gp.x, gp.z).h, 1 - Math.exp(-dt * 6));
        ghost.faceTo(P.x, P.z); ghost.reveal = clamp(1 - (d - 2) / 5, 0, 0.6);
        fearUp(clamp(1.1 - d / 16, 0.35, 1));
        if (d < 0.85) die();
        // 빗장
        const holding = target === H.gate && (keys.KeyE || keys.Mouse0);
        if (holding && S.control) {
          S.bar += dt; if (Math.floor(S.bar / 0.55) !== Math.floor((S.bar - dt) / 0.55)) A.scrape(0.4);
          W.gateBar.position.x = W.GATE.x - (S.bar / 2.4) * 0.25 + (Math.random() - 0.5) * 0.006;
          if (S.bar >= 2.4) { S.phase = 'escape'; openGate(); setObj('<b>달아나라</b>'); }
        }
        const ring = $('ring'); ring.style.opacity = S.bar > 0 && S.phase === 'hunt' ? 1 : 0; ring.style.setProperty('--p', Math.min(1, S.bar / 2.4));
      } else if (S.phase === 'escape') {
        $('ring').style.opacity = 0;
        const gp = ghost.group.position, dx = P.x - gp.x, dz = P.z - gp.z, d = Math.hypot(dx, dz);
        v3.set(gp.x - camera.position.x, 0, gp.z - camera.position.z).normalize();
        const seen = v3.dot(HG._fwd) > 0.6 && !S.lanOut;
        const gs = seen ? 0 : 2.0; gp.x += (dx / d) * gs * dt; gp.z += (dz / d) * gs * dt; ghost.faceTo(P.x, P.z);
        gp.y = lerp(gp.y, groundAt(gp.x, gp.z).h, 1 - Math.exp(-dt * 6));
        if (d < 0.85) die();
        if (P.z > 12.5) endGame('seal');
      } else if (S.phase === 'leave') {
        if (P.z > 12.5) endGame('release');
      }
      if (S.phase === 'explore' && !S.busy) { S.ambT -= dt; if (S.ambT <= 0) { S.ambT = 20 + Math.random() * 26; ambient(); } }

      // ---- 공포 · 후처리 ----
      S.fearT = Math.max(0, S.fearT - dt * 0.06); S.fear = lerp(S.fear, S.fearT, 1 - Math.exp(-dt * (S.fearT > S.fear ? 3 : 0.5)));
      A.setFear(S.fear);
      if (S.fear > 0.3) { S.heartT -= dt; if (S.heartT <= 0) { S.heartT = lerp(1.05, 0.42, S.fear); A.heart(0.25 + S.fear * 0.5); } }
      FU.uTime.value = time; FU.uFear.value = S.fear; FU.uCA.value = S.fear * 0.5 + (S.lanDead ? 1.5 : 0); FU.uDesat.value = 0.1 + S.fear * 0.22;
      A.update(dt, time, camera);

      // ---- 상호작용 대상 ----
      pickT -= dt;
      if (pickT <= 0) { pickT = 0.07; target = S.control ? pick() : null; setPrompt(target ? '<kbd>E</kbd> ' + (typeof target.label === 'function' ? target.label() : target.label) : null); }
      if (subTimer > 0) { subTimer -= dt; if (subTimer <= 0) $('sub').classList.remove('on'); }
    }

    // ================= 루프 =================
    const clock = new THREE.Clock(); let ema = 16, perfT = 0;
    function frame() {
      requestAnimationFrame(frame);
      if (window.innerWidth !== lastW || window.innerHeight !== lastH) resize();
      const raw = clock.getDelta(), dt = Math.min(raw, 0.05);
      if (S.playing && !S.paused && !HG.frozen) {
        update(dt);
        if (raw < 0.15) { ema = lerp(ema, raw * 1000, 0.05); perfT += raw; } // 0.15초 이상은 탭 스로틀링으로 보고 무시
        // 해상도는 느릴 때만, 드물게 한 단계씩 낮춘다 (다시 올리지 않는다 — 버퍼를 새로 잡을 때마다 화면이 툭 끊긴다)
        if (perfT > 4 && !HG.lockScale) { perfT = 0; if (ema > 30 && renderScale > 0.55) { renderScale = Math.max(0.55, renderScale * 0.8); resize(); ema = 20; } }
      } else if (S.phase === 'title') {
        HG.uTime.value += dt; snowU.uT.value += dt; const t = HG.uTime.value;
        camera.position.set(Math.sin(t * 0.05) * 1.2, 1.9 + Math.sin(t * 0.11) * 0.1, 10.2); camera.rotation.set(0.06, Math.sin(t * 0.07) * 0.06, 0);
        sky.position.copy(camera.position); lanLight.getWorldPosition(lanW); snowU.uLan.value.copy(lanW); snowU.uCam.value.copy(camera.position);
        lanLight.intensity = LAN_I * (0.9 + 0.08 * Math.sin(t * 9)); FU.uTime.value = t;
        if (candleOn) candle.intensity = 1.7 * (0.9 + 0.08 * Math.sin(t * 9.1));
        for (const s of puffs) { s.material.opacity = lerp(s.material.opacity, s.userData.op, 0.01); s.position.x += s.userData.sp * dt; if (s.position.x > 46) s.position.x = -26; s.material.color.setRGB(0.05, 0.065, 0.1); }
      }
      composer.render();
    }

    // ================= 입력 =================
    window.addEventListener('keydown', (e) => {
      if (e.code === 'Tab') e.preventDefault();
      if (e.repeat) return;
      keys[e.code] = true;
      if (!S.playing && S.phase === 'dead' && (e.code === 'KeyR' || e.code === 'Enter')) return retry();
      if (!S.playing || S.paused) return;
      if (S.reading) { if (e.code === 'KeyE' || e.code === 'Space' || e.code === 'Enter') closeNote(); return; }
      if (S.choosing) { if (e.code === 'Digit1') doSeal(); else if (e.code === 'Digit2' || e.code === 'KeyQ') closeChoice(); return; }
      if (e.code === 'KeyE') useTarget();
      if (e.code === 'KeyF') relight();
    });
    window.addEventListener('keyup', (e) => { keys[e.code] = false; });
    window.addEventListener('blur', () => { for (const k in keys) keys[k] = false; });
    document.addEventListener('mousemove', (e) => {
      if (document.pointerLockElement !== canvas || !S.playing || S.paused) return;
      if (!S.control && !S.reading && S.phase !== 'cut') return;
      if (S.reading || S.choosing) return;
      const mx = clamp(e.movementX, -120, 120), my = clamp(e.movementY, -120, 120);
      P.yaw -= mx * 0.0021; P.pitch = clamp(P.pitch - my * 0.0021, -1.45, 1.45);
    });
    canvas.addEventListener('mousedown', (e) => {
      if (e.button !== 0) return; keys.Mouse0 = true;
      if (!S.playing && S.phase === 'dead' && $('dead').classList.contains('on')) return retry();
      if (!S.playing) return;
      if (document.pointerLockElement !== canvas && !debug) { canvas.requestPointerLock(); return; }
      if (S.reading) return closeNote();
      if (!S.choosing) useTarget();
    });
    window.addEventListener('mouseup', () => { keys.Mouse0 = false; });
    document.addEventListener('pointerlockchange', () => {
      const locked = document.pointerLockElement === canvas;
      if (!S.playing || debug) return;
      S.paused = !locked; $('pause').classList.toggle('on', S.paused); A.suspend(S.paused);
      if (!S.paused) clock.getDelta();
    });
    $('pause').addEventListener('click', () => canvas.requestPointerLock());
    $('note').addEventListener('click', closeNote);
    $('ch1').addEventListener('click', doSeal); $('ch2').addEventListener('click', closeChoice);
    $('retry').addEventListener('click', retry);
    $('endBtn').addEventListener('click', () => location.reload());

    // ================= 시작 흐름 =================
    function begin() {
      $('intro').classList.remove('on'); $('hud').classList.add('on');
      S.phase = 'explore'; S.playing = true; S.control = true; S.time = 0;
      P.x = W.GATE.x; P.z = 9.4; P.yaw = 0; P.pitch = 0.03;
      if (!debug) canvas.requestPointerLock();
      tween(4, (k) => { FU.uFade.value = 1 - ease(k); });
      A.dadeumi(true, posOf(W.dadeumi), 0.36);
      after(2.6, () => { A.slam({ x: W.GATE.x, y: 1.2, z: 11.5 }, 1); S.shake = 0.35; fearUp(0.5); });
      after(4.2, () => sub('…대문이 닫혔다. 바람인가.'));
      after(8.5, () => { setObj('사랑채부터 살펴라'); sub('담 너머 안채 쪽에서 다듬이 소리가 난다.<br>빈집이라 하지 않았던가.'); });
    }
    function intro() {
      A.init(); A.gong(0.5);
      $('title').classList.remove('on'); $('intro').classList.add('on');
      let i = 0, busy = false; const el = $('introTxt');
      const fadeScene = (to) => { const from = FU.uFade.value, t0 = performance.now(); const st = () => { const k = Math.min(1, (performance.now() - t0) / 1500); FU.uFade.value = lerp(from, to, k); if (k < 1) requestAnimationFrame(st); }; st(); };
      fadeScene(1);
      const show = () => {
        if (i >= INTRO.length) { begin(); return; }
        busy = true; el.classList.remove('on');
        setTimeout(() => { el.innerHTML = INTRO[i++]; el.classList.add('on'); $('introHint').textContent = i >= INTRO.length ? '눌러서 대문 안으로 들어간다' : '눌러서 계속'; setTimeout(() => (busy = false), 700); }, 700);
      };
      $('intro').onclick = () => { if (!busy) show(); };
      show();
    }
    $('title').addEventListener('click', intro);

    // 걷다가 새 구역이 처음 보일 때 화면이 툭 끊기지 않도록, 모든 재질의 셰이더와 텍스처를 시작 전에 미리 올려 둔다
    try {
      const hidden = []; scene.traverse((o) => { if (!o.visible && !o.isLight) { hidden.push(o); o.visible = true; } });
      const seenTex = new Set(), warmTex = (m) => { if (!m) return; for (const k in m) { const t = m[k]; if (t && t.isTexture && !seenTex.has(t)) { seenTex.add(t); renderer.initTexture(t); } } };
      scene.traverse((o) => { if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach(warmTex); });
      if (ghost.warm) ghost.warm(renderer);
      renderer.compile(scene, camera);
      // 화면 밖 물체까지 한 번 그려, 그림자 패스와 버퍼도 미리 만든다
      const fc = []; scene.traverse((o) => { if (o.frustumCulled) { fc.push(o); o.frustumCulled = false; } });
      composer.render();
      fc.forEach((o) => (o.frustumCulled = true)); hidden.forEach((o) => (o.visible = false));
    } catch (e) { console.warn('prewarm', e); }
    document.addEventListener('visibilitychange', () => { A.suspend(document.hidden || S.paused); });
    if (debug) A.mute(true);   // 검수용 창에서는 소리를 내지 않는다
    setLoad(1, ''); $('loading').classList.remove('on'); $('title').classList.add('on');
    FU.uFade.value = 0.25;
    HG.started = true;
    frame();

    // 디버그 훅
    HG.dbg = {
      lights: { hemi, moon },
      rt() { const t = performance.now(); composer.render(); renderer.getContext().finish(); return performance.now() - t; },   // 한 프레임을 그리는 데 걸린 시간(ms)
      S, P, W, H, ghost, camera, renderer, scene, lanLight, moon, hemi, bloom, FU,
      go() { A.init(); $('title').classList.remove('on'); begin(); FU.uFade.value = 0; tweens.length = 0; },
      tp(x, z, yaw, pitch) { P.x = x; P.z = z; P.y = groundAt(x, z).h; if (yaw != null) P.yaw = yaw; if (pitch != null) P.pitch = pitch; },
      use(k) { H[k].use(); }, seal: doSeal, burn: doBurn, die, endGame, takeTal, openGate, setCandle,
      scale(v) { HG.lockScale = true; renderScale = v; resize(); }, ema: () => ema,
      // 화면 검수용: 이름 붙은 시점으로 이동 (코드 지식 없이 화면만 보고 평가할 수 있도록)
      views: {
        start: [23, 9.4, 0, 0.03], sarang_yard: [27, 6, 0.5, 0.05], sarang_maru: [23, -4.0, 0, 0.1], sarang_hall: [23, -7.2, 0, -0.1], sarangbang: [20.3, -8.0, 0.9, -0.2], sarangbang_s: [18.5, -9.2, 3.14, 0], jageunsarang: [25.7, -7.6, -0.9, -0.2], jageunsarang_n: [27.5, -7.4, 0.3, -0.1],
        jungmun_e: [16.5, 4.0, 1.57, 0.05], jungmun_w: [9.8, 4.0, -1.57, 0.05], inner_wall: [15, 8, 0.6, 0], east_wall: [30.5, 0, -1.2, 0], smallroom: [6.7, -8.2, -1.2, -0.25], smallroom_n: [8, -7.2, 0, -0.3], eastroom_door: [4.4, -8.2, -1.57, 0], gate_in: [23, 7.5, 3.14, 0],
        // 상호작용 지점 (화면 가운데 아래에 프롬프트가 뜨는지 확인용)
        use_diary: [19.3, -8.4, 0.24, -0.6], use_husband_note: [26.6, -7.7, 0.5, -0.6], use_child_note: [7.2, -8.3, -2.58, -0.9], use_letter: [4.2, -8.4, 3.6, -0.7], use_key: [-7.2, -7.6, -1.83, -0.18], use_sot: [-8.5, -8.6, 0, -0.6], use_bowls: [-8.6, -8.2, 1.57, -0.15], use_shed_door: [-6.4, 1, 1.57, -0.1], use_well: [5.9, 2.4, -2.1, -0.35], use_fire: [4.6, 5.9, 0.6, -0.5], use_gate: [23, 9.6, 3.14, -0.05], use_shoes: [23, -3.6, 0, -0.6], use_baduk: [22.6, -7.4, 0.4, -0.6], use_trough: [29.6, -1.0, -1.57, -0.4], use_hyeonpan: [23, -7.6, 0, 0.3],
        yard: [0, 3, 0, 0.05], yard_east: [1, 6.5, -1.2, 0], yard_west: [1, 5, 1.3, 0], maru: [-1.5, -3.2, 0.5, 0.05], daecheong: [0.2, -7.6, -0.25, -0.3], daecheong_up: [0, -8.4, 1.57, 0.5],
        anbang: [-2.75, -8.9, 1.35, -0.15], anbang_doors: [-3.9, -8.8, 3.14, 0], anbang_wall: [-4.5, -7.6, 0.3, 0.1], eastroom: [3.0, -8.0, -1.2, -0.1], eastroom_floor: [4.2, -8.4, 3.6, -0.7],
        shed_out: [-5.2, 1, 1.57, 0], shed_w: [-8.4, 1, 1.57, 0], shed_n: [-9.5, 1.6, 0, 0.1], shed_s: [-9.5, 0.4, 3.14, -0.05], shed_e: [-10.6, 1, -1.57, 0], shed_up: [-9.5, 1, 1.0, 0.9],
        well: [5.3, 2.7, -2.05, -0.3], ritual: [4.9, 7.4, 0.3, -0.25], ritual_close: [4.6, 5.9, 0.6, -0.5], tree: [5.6, 4.6, -2.27, 0.1], jangdok: [8.4, 2.9, -0.55, -0.25], kitchen_out: [-8, -4.9, 0, 0.02], kitchen: [-7.3, -7.4, 0.75, -0.05], kitchen_e: [-8.6, -7.6, -1.2, -0.1], house_west: [-5, 2, 0.5, 0.08], house_east: [5, 2, -0.5, 0.08], wall_n: [-10.5, 5.5, 1.2, -0.1], wall_corner: [10.8, 9.2, -2.2, -0.05], wall_close: [-11.4, 8, 1.57, -0.05], clothes: [-3.6, 8.6, 0.25, 0], gate: [23, 7.5, 3.14, 0],
      },
      view(name) {
        const v = this.views[name]; if (!v) return 'unknown view. available: ' + Object.keys(this.views).join(', ');
        HG.frozen = true; ghost.show(false); $('sub').classList.remove('on'); subTimer = 0; timers.length = 0; tweens.length = 0;
        // 방문은 열어 두되, 헛간은 열쇠를 얻기 전에는 실제 플레이처럼 잠긴 채 둔다
        for (const k in W.doors) { const open = k !== 'shed' || S.key; W.doors[k].target = open ? 1 : 0; W.doors[k].t = open ? 0.99 : 0.01; }
        // use_* 뷰는 대상을 정확히 조준한다
        const AIM = { use_diary: 'note1', use_husband_note: 'note3', use_child_note: 'note4', use_letter: 'note2', use_key: 'key', use_sot: 'sot', use_bowls: 'bowls', use_shed_door: 'doorShed', use_well: 'well', use_fire: 'fire', use_gate: 'gate', use_shoes: 'shoes', use_baduk: 'baduk', use_trough: 'trough', use_hyeonpan: 'hyeonpan' };
        if (AIM[name]) { const pr = W.proxies.find((q) => q.userData.key === AIM[name]); if (pr) { const ey = groundAt(v[0], v[1]).h + P.eye - 0.03, dx = pr.position.x - v[0], dz = pr.position.z - v[1]; v[2] = Math.atan2(-dx, -dz); v[3] = Math.atan2(pr.position.y - ey, Math.hypot(dx, dz)); } }
        S.fear = S.fearT = 0; S.lanT = S.lanMul = 1; S.blink = 0; S.shake = 0; P.x = v[0]; P.z = v[1]; P.y = groundAt(v[0], v[1]).h; P.yaw = v[2]; P.pitch = v[3]; P.vx = P.vz = 0;
        for (let i = 0; i < 12; i++) update(0.033); S.fear = S.fearT = 0; update(0.001); composer.render(); return 'view ' + name;
      },
      look(yawDeg, pitchDeg) { P.yaw = (yawDeg * Math.PI) / 180; P.pitch = ((pitchDeg || 0) * Math.PI) / 180; update(0.001); composer.render(); return 'ok'; },
      // 귀신 진열: kind = far | near | close | side | back | crouch | calm | scare
      freeze(v) { HG.frozen = v !== false; return 'frozen=' + HG.frozen; },
      // 미리보기 창이 화면 일부만 캡처할 때: 게임 화면 전체를 왼쪽 위로 축소해 넣는다 (k=1 이면 원래대로)
      fit(k) { k = k == null ? 0.6667 : k; document.body.style.transformOrigin = '0 0'; document.body.style.transform = k === 1 ? '' : 'scale(' + k + ')'; return 'fit ' + k; },
      // 연출 장면을 그 순간에서 멈춰 보여 준다
      scene(name) {
        HG.frozen = true; timers.length = 0; tweens.length = 0; ghost.show(false); ghost.pose = 0; ghost.reveal = 0; W.sil.visible = false; lanShow(true);
        W.wellTals.forEach((t) => (t.visible = false)); fireBoost = 1; S.boost = 1; S.lanOut = false; S.gustT = 9; $('relight').classList.remove('on');
        $('note').classList.remove('on'); $('choice').classList.remove('on'); $('dead').classList.remove('on'); S.reading = 0; S.choosing = false;
        S.busy = false; S.phase = 'explore'; S.control = true; S.playing = true; S.dead = false; S.apparition = null; S.fear = S.fearT = 0; S.lanT = S.lanMul = 1; S.blink = 0; S.shake = 0; S.lanDead = 0; S.windT = 1; FU.uFade.value = 0;
        camera.fov = 68; camera.updateProjectionMatrix();
        for (const k in W.doors) { W.doors[k].target = 1; W.doors[k].t = 0.99; }
        const at = (x, z, tx, tz, pitch) => { P.x = x; P.z = z; P.y = groundAt(x, z).h; P.yaw = Math.atan2(-(tx - x), -(tz - z)); P.pitch = pitch || 0; P.vx = P.vz = 0; };
        const run = (sec) => { for (let i = 0; i < Math.round(sec / 0.033); i++) update(0.033); };
        const lookGhost = (pitch) => { const g = ghost.group.position; P.yaw = Math.atan2(-(g.x - P.x), -(g.z - P.z)); if (pitch != null) P.pitch = pitch; };
        const haveAll = (n2) => { S.note1 = true; S.note2 = !!n2; [1, 2, 3].forEach((n) => { S.got[n] = true; W['tal' + n].visible = false; }); S.tal = 3; setTalUI(); setObj(n2 ? OBJ_BOTH : '부적을 가지고 <b>우물</b>로 가라'); $('sub').classList.remove('on'); subTimer = 0; };
        if (name === 'anbang_shadow') { S.note1 = true; at(-3.9, -8.7, -3.9, -6.5, 0.05); run(0.3); eventAnbang(); run(5.6); }
        else if (name === 'shed_event') { at(-10.7, 1.2, -8.1, -0.75, -0.2); run(0.3); eventShed(); run(4.3); }
        else if (name === 'well_apparition') { at(8.0, 6.7, 6.05, 0.5, 0); run(0.3); eventTree(); run(8.2); lookGhost(0); }
        else if (name === 'hunt') { haveAll(); at(5.6, 3.0, 0, -5.9, 0.02); run(0.3); doSeal(); run(9.0); lookGhost(0.03); }
        else if (name === 'gate_open1' || name === 'gate_open2' || name === 'gate_open3') { // 대문이 열리는 중간 프레임 (빗장 · 문짝 · 빗장걸이가 함께 움직이는지)
          W.gateL.rotation.y = 0; W.gateR.rotation.y = Math.PI; W.gateBar.position.set(W.GATE.x, 1.22, 11.37); W.gateBar.rotation.set(0, 0, 0); W.gateBlock.on = true;
          at(W.GATE.x + 0.4, 8.6, W.GATE.x, 11.5, -0.08); run(0.3); openGate(); run(name === 'gate_open1' ? 0.6 : name === 'gate_open2' ? 2.0 : 3.8);
        }
        else if (name === 'hunt_dark') { haveAll(); at(5.6, 3.0, 0, -5.9, 0.02); run(0.3); doSeal(); run(9.0); lookGhost(0.03); S.gustT = 0; run(1.2); lookGhost(0.03); }
        else if (name === 'hunt_relit') { haveAll(); at(5.6, 3.0, 0, -5.9, 0.02); run(0.3); doSeal(); run(9.0); lookGhost(0.03); S.gustT = 0; run(1.2); relight(); run(1.5); lookGhost(0.03); }
        else if (name === 'hunt_close') { haveAll(); at(5.6, 3.0, 0, -5.9, 0.02); run(0.3); doSeal(); run(9.0); P.yaw += Math.PI; run(3.2); lookGhost(0); S.blink = 0; S.gustT = 9; run(0.4); lookGhost(0); }
        else if (name === 'burn') { haveAll(true); at(4.9, 6.0, W.FIRE.x, W.FIRE.z, -0.45); run(0.3); doBurn(); run(1.6); }
        else if (name === 'release_rise') { haveAll(true); at(4.9, 6.0, W.FIRE.x, W.FIRE.z, -0.45); run(0.3); doBurn(); run(12.2); lookGhost(0.02); }
        else if (name === 'release_walk') { haveAll(true); at(4.9, 6.0, W.FIRE.x, W.FIRE.z, -0.45); run(0.3); doBurn(); run(24); at(10.2, 5.6, 13, 4, 0); lookGhost(0); }
        else if (name === 'note1') { at(0.2, -7.6, 0.6, -9.5, -0.3); run(0.3); openNote(1); }
        else if (name === 'note2') { at(4.2, -8.4, 4.3, -7.75, -0.7); run(0.3); openNote(2); }
        else if (name === 'choice') { haveAll(true); at(5.3, 2.7, W.WELL.x, W.WELL.z, -0.3); run(0.3); openChoice(); }
        else return 'unknown scene. available: gate_open1, gate_open2, gate_open3, anbang_shadow, shed_event, well_apparition, hunt, hunt_dark, hunt_relit, hunt_close, burn, release_rise, release_walk, note1, note2, choice';
        update(0.001); composer.render(); return 'scene ' + name + ' | objective: ' + $('obj').textContent + ' | subtitle: ' + ($('sub').classList.contains('on') ? $('sub').textContent : '(none)') + ' | prompt: ' + (promptTxt || '(none)');
      },
      ghostShow(kind) {
        HG.frozen = true; timers.length = 0; tweens.length = 0; $('dead').classList.remove('on'); FU.uFade.value = 0; S.playing = true; S.dead = false; lanShow(true); $('sub').classList.remove('on'); subTimer = 0;
        S.fear = S.fearT = 0; S.lanT = S.lanMul = 1; S.blink = 0; S.shake = 0; S.lanDead = 0; camera.fov = 68; camera.updateProjectionMatrix();
        ghost.setFace(kind === 'calm' ? 'calm' : 'grin'); ghost.pose = kind === 'crouch' ? 1 : 0; ghost.reveal = kind === 'calm' ? 0.95 : kind === 'crouch' ? 0.45 : 0; ghost.setOpacity(1); ghost.show(true);
        const dist = { far: 6, near: 2.4, close: 1.3, side: 2.2, back: 2.4, crouch: 2.2, calm: 2.0, scare: 0 }[kind] || 3;
        P.x = 0; P.z = 7.6; P.y = 0; P.yaw = 0; P.pitch = kind === 'crouch' ? -0.28 : kind === 'close' ? 0.05 : -0.05;
        ghost.place(0, 0, 7.6 - dist); ghost.faceTo(0, 7.6);
        if (kind === 'side') ghost.group.rotation.y += 1.4; if (kind === 'back') ghost.group.rotation.y += Math.PI;
        if (kind === 'scare') { S.dead = false; S.phase = 'hunt'; S.checkpoint = { x: 0, z: 7.6, yaw: 0 }; die(); for (let i = 0; i < 12; i++) update(0.033); S.shake = 0; update(0.001); composer.render(); return 'scare frame'; }
        for (let i = 0; i < 10; i++) update(0.033); S.fear = S.fearT = 0; update(0.001); composer.render(); return 'ghost ' + kind;
      },
      step(n, dt) { for (let i = 0; i < (n || 1); i++) update(dt || 0.033); composer.render(); },
    };
    if (debug) HG.dbg.go();
  };
})();
