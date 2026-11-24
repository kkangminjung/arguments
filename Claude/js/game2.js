// 인시(寅時) · 제2장 고갯마루 — 게임 본체 (엔진 부분은 1장 game.js 와 같다)
(function () {
  'use strict';
  const HG = (window.HG = window.HG || {});
  const $ = (id) => document.getElementById(id);
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const lerp = (a, b, t) => a + (b - a) * t;
  const ease = (t) => t * t * (3 - 2 * t);


  const NOTES = {
    1: { title: '당지기의 치부책', text: ['섣달 초이레. 또 한 사람이 고개를 넘지 못하였다.', '', '고갯길 한가운데 어둑서니가 선다.', '처음에는 아이만 하던 것이,', '사람들이 놀라 올려다볼수록 자라', '이제는 소나무 키를 넘는다.', '', '올려다보지 마라. 올려다볼수록 커진다.', '눈을 내리깔고, 발끝만 보고 지나가야 한다.', '가까이서 올려다보면, 그 자리에서 덮친다.', '등불도 가려라. 불빛이 그림자를 키운다.', '', '더는 사람이 상하지 않게', '고갯길을 목책으로 막고 새끼줄로 동였다.', '끊으려면 낫이 있어야 하는데, 낫은 곳집에 걸어 두었다.', '곳집 열쇠는 서낭당 제단 밑에 감추었다.', '', '나는 오늘 밤, 그것을 달래러 간다.', '돌아오지 못하거든, 이 글을 보는 이가 대신하여 주기를.'] },
    2: { title: '서낭님 전에 올리는 글', text: ['서낭님 전에 아뢰나이다.', '', '을사년 흉년에, 고개 아랫마을 아낙이', '다섯 살 난 계집아이를 이 당 앞에 두고 갔나이다.', '곧 데리러 오마 하였으나, 오지 않았나이다.', '', '아이는 사흘 밤낮을 고갯길에 서서', '올라오는 사람마다 올려다보았나이다.', '어미인가 하여.', '', '소인은 그 아이를 보고도 문을 닫아걸었나이다.', '제 먹을 것도 없던 해였나이다.', '나흘째 아침, 아이는 고갯길 한가운데 얼어 있었나이다.', '', '고갯길의 저것은 그 아이옵니다.', '올려다보는 이가 어미가 아님을 알 때마다', '저것은 자라나이다.'] },
    3: { title: '꼭두에 매어 둔 쪽지', text: ['상여의 꼭두 하나를 따로 깎았다.', '계집아이 꼭두다. 길동무 하라고.', '', '그 아이는 상여도 타지 못하고 갔다.', '', '어둑서니는 올려다보면 커지고,', '내려다보면 작아진다 하였다.', '당집 북쪽, 벼랑 밑 돌계단으로 너럭바위에 오르면', '고갯길이 발아래다.', '거기서 내려다보면, 저것도 본디 크기로 돌아오리라.', '', '아이만 하게 줄거든,', '내려가 이 꼭두를 쥐여 주려 한다.', '', '그런데 다리가 떨려,', '바위에 오르기도 전에', '나는 번번이 저것을 올려다보고 만다.'] },
  };
  const INTRO = ['윤 진사 댁을 뒤로하고, 당신은 고갯길로 들어섰다.', '날이 밝기 전에 고개를 넘어야 관아에 닿는다.<br>고갯마루에는 서낭당이 있고, 당지기 노인이 산다 하였다.', '그러나 올라와 보니 움막의 불은 사위어 가고,<br>사람의 기척은 어디에도 없다.', '인시(寅時).<br>범과, 이름 없는 것들이 다니는 시각이다.'];
  const ENDS = {
    pass: { title: '넘다', lines: ['당신은 발끝만 보며 고개를 넘었다.', '등 뒤에서 무언가 오래도록 내려다보고 있었으나,<br>끝내 돌아보지 않았다.', '관아에는 이렇게 적어 올렸다.<br>「고갯마루 당지기, 행방 알 수 없음. 밤길은 금함이 좋겠음.」', '그 뒤로도 고개를 넘다 돌아오지 못한 이가 더러 있었다.', '사람들은 그것이, 해마다 조금씩 더 커진다고 하였다.'] },
    release: { title: '길동무', lines: ['동이 틀 무렵, 당신은 고개를 넘었다.', '고갯길 한가운데에는 작은 꼭두 하나가<br>눈 위에 반듯이 놓여 있었다.', '이듬해 봄, 마을 사람들은 그 자리에 작은 돌무덤을 쌓고<br>해마다 섣달이면 밥 한 그릇을 올렸다.', '당지기 노인은 끝내 찾지 못하였다.', '그 뒤로 그 고개에서, 올려다보아 커지는 것을<br>보았다는 이는 없다.'] },
  };

  HG.start = async function (addons) {
    HG.addons = addons;
    const debug = /[?&]debug/.test(location.search);
    const A = HG.audio;

    // ================= 렌더러 =================
    const canvas = $('c');
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' });
    renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.25;
    renderer.localClippingEnabled = true;
    const scene = new THREE.Scene();
    const FOG = new THREE.Color(0x101826);
    scene.fog = new THREE.FogExp2(FOG, 0.023);
    scene.background = FOG.clone();
    const camera = new THREE.PerspectiveCamera(68, 1, 0.05, 700);
    camera.rotation.order = 'YXZ'; scene.add(camera);
    HG._fwd = new THREE.Vector3(0, 0, -1);

    const setLoad = (p, txt) => { $('loadbar').style.width = Math.round(p * 100) + '%'; if (txt) $('loadtxt').textContent = txt; };
    setLoad(0.03, '먹을 갈고 있습니다…');
    await new Promise((r) => setTimeout(r, 30));
    await HG.buildMaterials((p) => setLoad(0.05 + p * 0.6, '재질을 빚는 중…'));
    setLoad(0.7, '고갯마루에 오르는 중…'); await new Promise((r) => setTimeout(r, 30));
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
    const hemi = new THREE.HemisphereLight(0x8ea4d4, 0x141820, 0.38); scene.add(hemi);
    const moon = new THREE.DirectionalLight(0xa3b8ea, 1.25);
    moon.position.copy(moonDir).multiplyScalar(80).add(new THREE.Vector3(0, 0, -20)); moon.target.position.set(0, 0, -20); scene.add(moon, moon.target);
    moon.castShadow = true; moon.shadow.mapSize.set(2048, 2048);
    moon.shadow.mapSize.set(4096, 4096);
    Object.assign(moon.shadow.camera, { left: -28, right: 28, top: 46, bottom: -46, near: 5, far: 170 });
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
      for (const c of HG.col.circles) if (c.on && !c.low && Math.hypot(x - c.x, z - c.z) < c.r + pad) return true;
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
        s.scale.set(w, w * (0.28 + r() * 0.15), 1); s.position.set(-30 + r() * 60, 0.5 + r() * 1.3, -62 + r() * 84);
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
            ${W.rects.map((r) => `if (p.x > ${r[0].toFixed(2)} && p.x < ${r[1].toFixed(2)} && p.z > ${r[2].toFixed(2)} && p.z < ${r[3].toFixed(2)} && p.y < ${r[4].toFixed(2)}) vA = 0.0;`).join('\n            ')} }`,
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

    // ================= 어둑서니 =================
    const shade = new HG.Shade(scene); shade.cam = camera.position;
    const shadeCol = { x: W.GAP.x, z: W.GAP.z, r: 0.55, on: false }; HG.col.circles.push(shadeCol);
    { const m = new THREE.Mesh(new THREE.BoxGeometry(1.0, 1.4, 1.0), new THREE.MeshBasicMaterial({ visible: false })); m.position.set(W.GAP.x, 0.7, W.GAP.z); m.userData.key = 'small'; scene.add(m); W.proxies.push(m); W.smallProxy = m; }
    const FOG0 = FOG.clone(), DAWN = new THREE.Color(0x2c3442);

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
          col *= mix(0.36, 1.0, v);
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
      // 고갯길은 비탈을 따라 높아진다. 빈터는 마른 풀, 고갯길은 눈을 밟는다
      let h = W.hAt(x, z), surf = W.indoor(x, z) ? 'dirt' : z < -10.9 ? 'snow' : 'grass';
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
        if (k === 'shrine') candle.shadow.needsUpdate = true;
      }
    }

    // ---------- 상호작용 ----------
    const posOf = (o) => ({ x: o.x, y: o.y == null ? 1.2 : o.y, z: o.z });
    const fearUp = (v) => { S.fearT = Math.max(S.fearT, v); };
    Object.assign(S, { note1: false, note2: false, note3: false, key: false, sickle: false, kkokdu: false, barCut: false, met: false, released: false, stones: 0, gotOpened: false, shrineLocked: false, wanderT: 1e9, sh: { mode: 'off', s: 1, away: 0, base: 1, gi: 0, near: 0 } });
    const sh = S.sh;
    const setItems = () => { const it = []; if (S.key) it.push('열쇠'); if (S.sickle) it.push('낫'); if (S.kkokdu) it.push('꼭두'); $('tal').innerHTML = it.map((c) => '<span>' + c + '</span>').join(''); };
    const objNow = () => {
      if (!S.met) return '고개를 넘어라';
      if (S.released) return '고개를 넘어라';
      if (sh.mode === 'chase') return '그것이 따라온다 — 쳐다보지 말고, <b>너럭바위</b>에 올라 내려다보라';
      if (sh.mode === 'small') return S.kkokdu ? '작아진 그림자에게 <b>꼭두</b>를 쥐여 주어라' : '<b>곳집</b>의 상여에서 꼭두를 가져오라';
      if (!S.note1) return '<b>당지기의 움막</b>을 살펴라';
      if (!S.key) return '<b>서낭당</b> 제단 밑에서 곳집 열쇠를 찾아라';
      if (!S.sickle) return '<b>곳집</b>에서 낫을 찾아라';
      if (!S.barCut) return '고갯길의 <b>목책</b>을 끊어라';
      return S.note3 && sh.gi === 0 ? '<b>눈을 내리깔고</b> 고개를 넘거나, <b>너럭바위</b>에 올라 내려다보라' : '<b>눈을 내리깔고</b> 고개를 넘어라';
    };
    const setObjNow = () => setObj(objNow());
    const H = {
      note1: { label: '치부책을 읽는다', use() { openNote(1, () => { if (!S.note1) { S.note1 = true; setObjNow(); sub('올려다보지 마라. 등불을 가려라.<br>곳집 열쇠는, 서낭당 제단 밑.', 6); eventHut(); } }); } },
      note2: { label: '제단의 글을 읽는다', use() { openNote(2, () => { if (!S.note2) { S.note2 = true; fearUp(0.4); sub('…고갯길의 저것은, 어미를 기다리던 아이다.', 6); } }); } },
      note3: { label: '쪽지를 읽는다', use() { openNote(3, () => { if (!S.note3) { S.note3 = true; sub('내려다보면, 작아진다.<br>당집 북쪽 벼랑 밑, 돌탑 옆 돌계단. 너럭바위.', 6); setObjNow(); } }); } },
      key: { label: '제단 밑을 더듬는다', can: () => !S.key, use() { S.key = true; A.pickup(); setItems(); sub('녹슨 열쇠가 손에 잡혔다. 곳집 열쇠다.'); setObjNow(); eventShrine(); } },
      doorShrine: { label: () => (W.doors.shrine.target ? '문을 닫는다' : '문을 연다'), use() { if (S.shrineLocked) { A.knock(null, 2, 0.4); sub('열리지 않는다.'); return; } toggleDoor(W.doors.shrine); A.creak(0.9, 0.12); } },
      doorGot: { label: () => (W.doors.got.target ? '문을 닫는다' : !S.key ? '잠긴 문을 살핀다' : !S.gotOpened ? '자물쇠를 연다' : '문을 연다'), use() {
        if (!S.key) { A.knock(null, 2, 0.3); sub(S.note1 ? '자물쇠가 채워져 있다.<br>열쇠는 서낭당 제단 밑에 감추었다 하였다.' : '자물쇠가 채워져 있다. 판자 틈으로, 상여의 붉은 천이 보인다.'); return; }
        if (!S.gotOpened) { S.gotOpened = true; A.scrape(0.3); }
        toggleDoor(W.doors.got); A.creak(1.1, 0.16);
      } },
      sickle: { label: '낫을 벗겨 든다', can: () => !S.sickle, use() { S.sickle = true; W.sickle.visible = false; A.pickup(); setItems(); sub('날이 아직 서 있다.'); setObjNow(); } },
      kkokdu: { label: () => (S.note3 ? '꼭두를 집어 든다' : '꼭두를 살핀다'), can: () => !S.kkokdu && !S.released, use() {
        if (!S.note3) { sub('나무로 깎은 계집아이 인형이다. 상여의 것들과 달리, 따로 놓여 있다.<br>곁에 쪽지가 매여 있다.', 6); return; }
        S.kkokdu = true; W.kkokdu.visible = false; A.pickup(); setItems(); setObjNow(); if (!S.bierDone) { S.bierDone = true; eventBier(); } } },
      bell: { label: '요령을 흔들어 본다', use() { A.gong(0.16); sub('상여 앞에서 흔드는 놋쇠 요령이다.<br>저승길을 여는 소리라 하였다.'); } },
      sangyeo: { label: '상여를 살핀다', use() { sub('마을 상여다. 난간마다 꼭두가 줄지어 꽂혀 있다.<br>먼지가 앉지 않았다. 요 며칠 사이에도, 나간 적이 있다.', 6); } },
      musindo: { label: '무신도를 올려다본다', use() { sub('서낭신과 두 시녀다.<br>고개를 지킨다는 신은, 눈을 내리깔고 있다.', 6); } },
      tree: { label: '서낭나무를 살핀다', use() { sub('오색 천이 가지마다 매여 있다.<br>빌고 간 사람은 많은데, 돌아와 푼 사람은 없다.', 6); } },
      cairn: { label: '돌을 하나 얹는다', use() { S.stones++; W.stone.visible = true; A.knock({ x: W.CAIRN.x, y: 1.3, z: W.CAIRN.z }, 1, 0.3); sub(S.stones === 1 ? '길손은 돌 하나를 얹고 고개를 넘는 법이다.<br>무사히 넘게 해 달라고.' : '돌무더기는 사람 키만 하다.<br>이만큼의 사람이, 이 고개를 무서워하였다.', 6); } },
      jangseung: { label: '장승을 살핀다', use() { sub('천하대장군, 지하여장군.<br>부릅뜬 눈이 고갯길 쪽을 보고 있다. 마을 쪽이 아니라.', 6); } },
      spring: { label: '샘물을 들여다본다', use() { A.drip(posOf(W.SPRING)); sub('살얼음 밑으로 물이 흐른다.<br>수면에 비친 제 얼굴 뒤로, 무언가 더 높이 서 있는 듯하다.', 6); fearUp(0.35); } },
      fire: { label: '불을 살핀다', use() { sub('불이 사위어 간다. 장작은 넉넉히 쌓여 있는데.<br>지피던 사람이, 며칠째 돌아오지 않은 것이다.', 6); } },
      bed: { label: '짚자리를 살핀다', use() { sub('이부자리가 차다. 문간에 낡은 짚신 한 켤레.<br>신도 신지 않고, 어디로 갔는가.', 6); } },
      back: { label: '올라온 길을 살핀다', use() { sub('올라온 길은 쓰러진 나무와 눈안개에 묻혔다.<br>고개를 넘는 수밖에 없다.'); } },
      barricade: {
        label: () => (S.sickle ? '새끼줄을 끊는다' : '목책을 살핀다'), can: () => !S.barCut && S.phase === 'explore',
        use() { if (S.sickle) return cutBar(); sub(S.note1 ? '통나무를 새끼줄로 겹겹이 동였다.<br>낫이 있어야 끊는다. 낫은 곳집에 걸어 두었다 하였다.' : '누군가 고갯길을 통나무로 막아 놓았다.<br>맨손으로는 풀 수 없다.', 6); },
      },
      small: {
        label: () => (S.kkokdu ? '꼭두를 쥐여 준다' : '작아진 그림자를 살핀다'), can: () => sh.mode === 'small' && S.phase === 'explore',
        use() { if (S.kkokdu) return doRelease(); sub('아이만 하다. 고개를 숙이고, 떨고 있다.<br>…쥐여 줄 것이 없다. 곳집 상여 곁에 꼭두가 있었다.', 6); setObjNow(); },
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
    const aimYaw = (x, z, y0) => { let y1 = Math.atan2(-(x - P.x), -(z - P.z)); while (y1 - y0 > Math.PI) y1 -= Math.PI * 2; while (y1 - y0 < -Math.PI) y1 += Math.PI * 2; return y1; };
    function setCandle(on) { candleOn = on; flame.visible = on; candle.intensity = on ? 1.7 : 0; }
    function shadeAt(x, z, s, mode) { sh.mode = mode; sh.s = s; sh.base = s; sh.near = 0; shadeCol.x = x; shadeCol.z = z; shadeCol.r = 0.2 + 0.22 * s; sh.away = 0; shade.size = s; shade.eye = 0; shade.place(x, groundAt(x, z).h, z); shade.faceTo(P.x, P.z); shade.setOpacity(1); shade.show(true); shadeCol.on = mode === 'gap'; }
    // 눈에서 (tx,ty,tz) 까지의 시선이 벼랑 · 건물에 가리지 않는가
    function sightTo(tx, ty, tz) {
      const ex = P.x, ey = P.y + P.eye, ez = P.z, dx = tx - ex, dy = ty - ey, dz = tz - ez;
      for (const b of W.los) {
        let t0 = 0, t1 = 1;
        if (Math.abs(dx) < 1e-6) { if (ex < b[0] || ex > b[1]) continue; } else { const a = (b[0] - ex) / dx, c = (b[1] - ex) / dx; t0 = Math.max(t0, Math.min(a, c)); t1 = Math.min(t1, Math.max(a, c)); }
        if (Math.abs(dz) < 1e-6) { if (ez < b[2] || ez > b[3]) continue; } else { const a = (b[2] - ez) / dz, c = (b[3] - ez) / dz; t0 = Math.max(t0, Math.min(a, c)); t1 = Math.min(t1, Math.max(a, c)); }
        if (t0 >= t1) continue;
        if (Math.min(ey + dy * t0, ey + dy * t1) < b[4]) return false;
      }
      return true;
    }
    // 고갯길을 따라 얼마나 나아갔는가
    function prog(x, z) { const a = W.PATH; let best = 1e9, res = 0, acc = 0; for (let i = 0; i < a.length - 1; i++) { const dx = a[i + 1][0] - a[i][0], dz = a[i + 1][1] - a[i][1], L = Math.hypot(dx, dz), t = clamp(((x - a[i][0]) * dx + (z - a[i][1]) * dz) / (L * L), 0, 1), d = Math.hypot(x - a[i][0] - dx * t, z - a[i][1] - dz * t); if (d < best) { best = d; res = acc + t * L; } acc += L; } return res; }
    const gapProg = W.GAPS.map((q) => prog(q.x, q.z));
    function shadeOff() { sh.mode = 'off'; shade.show(false); shadeCol.on = false; }
    // 지금 선 자리보다 앞에 있는 가장 가까운 길목으로 옮겨 세운다 (앞에 남은 길목이 없으면 false)
    function toAhead() { const pp = prog(P.x, P.z), i = gapProg.findIndex((q) => q > pp + 6); if (i < 0) return false; sh.gi = i; shadeToGap(); S.checkpoint = { x: P.x, z: P.z, yaw: P.yaw }; return true; }
    // 그것이 지금 화면 밖(등 뒤 · 옆)에 있는가 — 눈앞에 보이는 채로 자리를 옮기지 않는다
    function unseen() { const g = shade.group.position, ax = g.x - P.x, az = g.z - P.z, ad = Math.hypot(ax, az) || 1; return (ax * -Math.sin(P.yaw) + az * -Math.cos(P.yaw)) / ad < 0.35; }
    function shadeToGap() { const q = W.GAPS[sh.gi]; shadeAt(q.x, q.z, [0.7, 0.85, 1.0, 1.2, 1.45][sh.gi], 'gap'); }   // 처음에는 아이만 하다. 굽이를 넘을수록 커져 있다

    // 처음 마주침: 올려다보고, 자라는 것을 보고, 쓰러진다
    function firstEncounter() {
      S.met = true; S.busy = true; S.control = false; S.phase = 'cut'; setPrompt(null);
      shadeAt(W.GAP.x, W.GAP.z, 0.7, 'event'); S.windT = 0.15;
      const y0 = P.yaw, y1 = aimYaw(W.GAP.x, W.GAP.z, y0), p0 = P.pitch;
      sub('고갯길 한가운데, 누가 서 있다.', 3.2); fearUp(0.5);
      tween(1.6, (k) => { P.yaw = lerp(y0, y1, ease(k)); P.pitch = lerp(p0, 0.04, ease(k)); });
      after(2.6, () => {
        A.buk(0.5); sub('…사람이 아니다. 커진다.', 3.4);
        tween(4.6, (k) => {
          sh.s = lerp(0.7, 4.5, k * k); shade.size = sh.s; shade.eye = k * 2.2; fearUp(0.5 + k * 0.5);
          const d = Math.hypot(W.GAP.x - P.x, W.GAP.z - P.z); P.pitch = lerp(P.pitch, Math.min(1.1, Math.atan2(shade.height * 0.93 - P.eye, d)), 0.08);
        }, () => { A.buk(1.3); A.whoosh(0.8); S.shake = 0.8; FU.uFade.value = 1; });
      });
      after(9.2, () => {
        P.x = -0.6; P.z = 6.4; P.y = 0; P.yaw = 0; P.pitch = -0.55; P.vx = P.vz = 0; shadeToGap(); S.windT = 1; S.fear = 0.5; S.fearT = 0.5;
        tween(3.5, (k) => { FU.uFade.value = 1 - ease(k); P.pitch = lerp(-0.55, -0.05, ease(k)); });
        sub('…정신을 차리니, 서낭나무 아래다.<br>고갯길의 그것은, 아직 거기 서 있다.', 6);
        S.phase = 'explore'; S.control = true; S.busy = false; S.checkpoint = { x: -0.6, z: 6.4, yaw: 0 }; setObjNow(); S.wanderT = 45;
      });
      after(16.5, () => { if (!S.note1) sub('움막 쪽에 불빛이 남아 있다.<br>당지기라면, 저것이 무엇인지 알 것이다.', 6); });
    }
    // 움막: 치부책을 읽고 나면, 문밖을 처마보다 큰 것이 지나간다
    function eventHut() {
      S.busy = true;
      after(1.0, () => { tween(1.5, (k) => { fireBoost = lerp(1, 0.22, k); }); A.whoosh(0.4); S.windT = 0.2; fearUp(0.5); });
      after(2.8, () => {
        sub('…불이 잦아든다.', 2.4);
        sh.mode = 'event'; sh.s = 1.8; shade.size = 1.8; shade.eye = 0; shade.setOpacity(1); shade.show(true); shadeCol.on = false;
        tween(7.5, (k) => { shade.place(6.7, 0, lerp(1.6, 12.4, k)); shade.group.rotation.y = 0; }, () => shade.show(false));
        for (let i = 0; i < 7; i++) after(i * 1.05, () => A.knock({ x: 6.7, y: 0.1, z: lerp(2, 12, i / 7) }, 1, 0.16));
      });
      after(5.4, () => { sub('문밖을, 무언가 지나간다.<br>처마보다 큰 것이.', 4.5); fearUp(0.85); });
      after(11.2, () => { tween(3, (k) => { fireBoost = lerp(0.22, 1, k); }); S.windT = 1; shadeToGap(); S.busy = false; S.wanderT = 30; });
    }
    // 서낭당: 열쇠를 집으면 촛불이 꺼지고 문이 닫힌다. 문을, 처마 높이에서 두드린다
    function eventShrine() {
      S.busy = true; S.shrineLocked = true; const dp = { x: -7.9, y: 1.2, z: -3 };
      after(0.6, () => { setCandle(false); A.blowOut(posOf(W.candle)); toggleDoor(W.doors.shrine, false, true); A.slam(dp, 0.9); S.shake = 0.4; S.lanT = 0.05; fearUp(0.8); });
      after(1.7, () => sub('촛불이… 문이.', 2.2));
      for (let i = 0; i < 4; i++) after(3.2 + i * 0.9, () => { A.knock({ x: -7.9, y: 2.5, z: -3 }, 1, 0.5); S.shake = 0.12; });
      after(4.4, () => { sub('문을 두드린다.<br>문고리가 아니라 — 처마 높이에서.', 4.5); fearUp(1); });
      after(7.6, () => { S.lanT = 1; });
      after(8.8, () => { S.shrineLocked = false; toggleDoor(W.doors.shrine, true); A.creak(1.6, 0.18, dp); });
      after(10.6, () => { sub('…문밖에는 아무것도 없다.<br>처마 끝에 쌓였던 눈만, 털려 있다.', 6); shadeToGap(); S.busy = false; S.wanderT = 24; });
    }
    // 곳집: 꼭두를 집으면 요령이 저 혼자 운다
    function eventBier() {
      S.busy = true;
      // 걸대의 요령 쪽으로 눈이 간다
      const y0 = P.yaw, y1 = aimYaw(W.BELL.x, W.BELL.z, y0), p0 = P.pitch, p1 = Math.atan2(W.BELL.y - (P.y + P.eye), Math.hypot(W.BELL.x - P.x, W.BELL.z - P.z));
      after(0.9, () => { A.gong(0.14); S.blink = 0.25; fearUp(0.5); tween(1.1, (k) => { P.yaw = lerp(y0, y1, ease(k)); P.pitch = lerp(p0, p1, ease(k)); }); });
      after(2.2, () => { A.gong(0.2); sub('…걸대의 요령이, 저 혼자 울었다.', 3.4); S.shake = 0.1; });
      after(4.6, () => { A.kidSob({ x: 11.7, y: 0.6, z: -6.5 }, 0.2); fearUp(0.8); });
      after(6.2, () => sub('상여 뒤에서, 아이 우는 소리가 난다.<br>돌아가 보아도, 아무도 없을 것이다.', 5.5));
      after(12, () => { sub('계집아이 꼭두다. 길동무 하라고 깎은 것이다.', 5); S.busy = false; S.wanderT = 26; });
    }
    function cutBar() {
      S.barCut = true; S.busy = true; A.scrape(0.7); sub('낫으로 새끼줄을 끊었다.', 2.5);
      const g = W.bar;
      tween(1.7, (k) => { const e = k * k; g.rotation.x = -e * 1.47; g.position.z = -10.9 - e * 0.95; g.position.y = e * 0.06; }, () => { A.knock({ x: 0, y: 0.2, z: -11.8 }, 2, 0.6); S.shake = 0.22; W.barBlock.on = false; S.busy = false; });
      S.checkpoint = { x: 0, z: -8.2, yaw: 0 }; setObjNow();
      after(3.0, () => sub('고갯길이 열렸다. 그것은, 길 한가운데 그대로 서 있다.<br>— 올려다보지 마라.', 6));
    }
    function becomeSmall() {
      sh.mode = 'small'; sh.s = 0.5; shade.size = 0.5; shade.eye = 0; shadeCol.on = false; S.windT = 0.25; $('relight').classList.remove('on');
      const sp = shade.group.position; W.smallProxy.position.set(sp.x, sp.y + 0.7, sp.z); sh.d0 = Math.hypot(sp.x - P.x, sp.z - P.z);   // 작아진 그 자리에서 꼭두를 쥐여 줄 수 있다
      A.kidSob({ x: sp.x, y: sp.y + 0.5, z: sp.z }, 0.2); S.voiceT = 3;
      sub('작아졌다. 아이만 하게.<br>고개를 숙이고, 그 자리에 서 있다.', 6); setObjNow();
    }
    function doRelease() {
      S.busy = true; S.control = false; S.phase = 'cut'; S.kkokdu = false; setItems(); setPrompt(null);
      const gp = shade.group.position, d = Math.hypot(P.x - gp.x, P.z - gp.z) || 1;
      W.kkokdu.visible = true; W.kkokdu.position.set(gp.x + ((P.x - gp.x) / d) * 0.42, 0.01, gp.z + ((P.z - gp.z) / d) * 0.42);
      const y0 = P.yaw, y1 = aimYaw(gp.x, gp.z, y0), p0 = P.pitch; tween(1.5, (k) => { P.yaw = lerp(y0, y1, ease(k)); P.pitch = lerp(p0, -0.5, ease(k)); });
      A.pickup(); sub('꼭두를, 그림자 앞에 내려놓았다.', 3.2); setObj('지켜보라');
      after(3.6, () => { sub('…어미는 아니다만, 길동무는 되어 줄 게다.<br>이제, 그만 기다려도 된다.', 5.5); shade.twitch = 0.3; });
      after(8.6, () => { A.kidSob({ x: gp.x, y: 0.5, z: gp.z }, 0.12); tween(6, (k) => { shade.setOpacity(1 - ease(k)); shade.size = lerp(0.5, 0.4, k); }, shadeOff); });
      after(10.8, () => sub('그림자가 꼭두 쪽으로 손을 뻗었다.<br>그리고, 눈 녹듯 스러졌다.', 6));
      after(16, () => {
        S.released = true; S.phase = 'explore'; S.control = true; S.busy = false; S.windT = 0.5; setObjNow();
        tween(16, (k) => { hemi.intensity = lerp(0.38, 0.62, k); FOG.copy(FOG0).lerp(DAWN, k * 0.7); scene.fog.color.copy(FOG); scene.background.copy(FOG); });
        after(3, () => sub('고개 너머 하늘이, 희부옇게 튼다.', 5));
      });
    }
    // 등불을 옷자락으로 가리거나, 다시 밝힌다
    function relight() {
      if (!S.control) return;
      S.lanOut = !S.lanOut; S.lanT = S.lanOut ? 0 : 1;
      A.swish();   // 가릴 때도 걷을 때도 같은 '휙' 소리
      if (S.lanOut) { sub('등불을 옷자락으로 가렸다.', 1.6); } else { S.lanMul = 0.45; sub('등불을 다시 밝혔다.', 1.6); }
    }
    // 나무 사이에 내려와 서는 것: 쳐다보면 자라며 다가오고, 쳐다보지 않으면 사라진다
    function spawnWander() {
      const fx = -Math.sin(P.yaw), fz = -Math.cos(P.yaw);
      for (let tries = 0; tries < 14; tries++) {
        const a = (Math.random() < 0.5 ? -1 : 1) * (0.5 + Math.random() * 0.5), d = 10 + Math.random() * 4;
        const dx = fx * Math.cos(a) - fz * Math.sin(a), dz = fx * Math.sin(a) + fz * Math.cos(a), x = P.x + dx * d, z = P.z + dz * d;
        if (x < -14 || x > 14 || z < -9.5 || z > 19 || W.indoor(x, z) || blockedAt(x, z, 0.7) || groundAt(x, z).h > 0.05) continue;
        shadeAt(x, z, 0.7, 'wander'); A.whisper(1.6, { x, y: 1.5, z }, 0.12); fearUp(0.45);
        if (!S.wanderHint) { S.wanderHint = true; after(1.4, () => sub('…나무 사이에, 서 있다.<br>쳐다보지 않으면, 사라진다 하였다.', 5)); }
        return true;
      }
      return false;
    }
    function die() {
      if (S.dead) return; S.dead = true; S.control = false; S.phase = 'dead'; setPrompt(null); $('sub').classList.remove('on'); subTimer = 0; $('relight').classList.remove('on');
      const fx = -Math.sin(P.yaw), fz = -Math.cos(P.yaw);
      // 하늘을 가릴 만큼 자란 것이, 머리 위에서 덮쳐 내려온다
      // (서 있던 자리에서 순간이동하지 않고, 그 자리에서부터 이쪽으로 덮쳐 온다 — 크기와 위치가 한 프레임에 튀지 않게)
      const gp0 = shade.group.position, wasOn = shade.group.visible, tx = P.x + fx * 2.7, tz = P.z + fz * 2.7, x0 = wasOn ? gp0.x : tx, y0 = wasOn ? gp0.y : P.y, z0 = wasOn ? gp0.z : tz;
      sh.mode = 'dead'; shade.place(x0, y0, z0); shade.faceTo(P.x, P.z); shade.setOpacity(1); shade.show(true); shadeCol.on = false;
      const s0 = wasOn ? sh.s : Math.max(sh.s, 3.4), p0 = P.pitch;
      tween(0.95, (k) => { const kk = ease(Math.min(1, k * 2.4)); shade.place(lerp(x0, tx, kk), lerp(y0, P.y, kk), lerp(z0, tz, kk)); shade.faceTo(P.x, P.z); sh.s = lerp(s0, 5.2, k); shade.size = sh.s; shade.eye = 1.3; P.pitch = lerp(p0, 1.22, ease(Math.min(1, k * 1.7))); camera.fov = lerp(68, 86, ease(k)); camera.updateProjectionMatrix(); });
      A.buk(1.3); after(0.18, () => A.buk(0.9)); A.whoosh(0.9); S.shake = 0.8; S.lanDead = 1; S.blink = 0; fearUp(1); S.fear = 1;
      after(1.2, () => { FU.uFade.value = 1; shade.show(false); S.lanDead = 0; $('dead').classList.add('on'); $('hud').classList.remove('on'); S.playing = false; });
    }
    function retry() {
      $('dead').classList.remove('on'); $('hud').classList.add('on'); const c = S.checkpoint || { x: -0.6, z: 6.4, yaw: 0 };
      P.x = c.x; P.z = c.z; P.y = groundAt(c.x, c.z).h; P.yaw = c.yaw; P.pitch = -0.45; P.vx = P.vz = 0; camera.fov = 68; camera.updateProjectionMatrix();
      S.dead = false; S.phase = 'explore'; S.control = true; S.playing = true; S.busy = false; S.fear = 0.4; S.fearT = 0.5; S.lanOut = false; S.lanT = 1; S.lanMul = 1;
      shadeToGap(); S.wanderT = 45; tween(1.5, (k) => { FU.uFade.value = 1 - k; });
      sub('올려다보지 마라.', 3.5);
    }
    function endGame(kind) {
      if (S.ending) return; S.ending = kind; S.control = false; S.phase = 'end'; $('hud').classList.remove('on');
      tween(3.5, (k) => { FU.uFade.value = k; }, () => {
        shadeOff(); S.playing = false; if (document.pointerLockElement) document.exitPointerLock();
        const e = ENDS[kind]; $('endTitle').textContent = e.title; const box = $('endLines'); box.innerHTML = '';
        $('end').classList.add('on'); A.gong(0.45);
        e.lines.forEach((l, i) => setTimeout(() => { const p = document.createElement('p'); p.innerHTML = l; box.appendChild(p); requestAnimationFrame(() => p.classList.add('on')); }, 1200 + i * 3400));
        setTimeout(() => $('endBtn').classList.add('on'), 1200 + e.lines.length * 3400);
      });
    }
    function ambient() {
      const r = Math.random();
      if (r < 0.28) A.creak(0.9, 0.08, { x: 10.6, y: 1.5, z: -4.8 });
      else if (r < 0.52) A.whisper(1.6, { x: P.x + Math.sin(P.yaw) * 2, y: 1.5, z: P.z + Math.cos(P.yaw) * 2 }, 0.09);
      else if (r < 0.72) A.knock({ x: W.TREE.x, y: 3, z: W.TREE.z }, 1, 0.12);
      else if (r < 0.88) { S.blink = 0.16; fearUp(0.3); }
      else A.drip(posOf(W.SPRING));
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
      // 너럭바위의 빈터 쪽 끝으로 걸어 나가면, 그대로 빈터로 뛰어내린다 (고갯길 쪽으로는 내려갈 수 없다)
      for (const b of W.dropBlocks) b.on = P.y < 2.0;
      if (S.hop) {
        const hp = S.hop; hp.t = Math.min(1, hp.t + dt / 0.55); P.x = hp.x; P.z = lerp(hp.z, -9.5, hp.t); P.y = 2.4 * (1 - hp.t * hp.t); P.vx = P.vz = 0;
        if (hp.t >= 1) { S.hop = null; S.shake = Math.max(S.shake, 0.3); A.step('grass', true); A.knock(null, 1, 0.3); }
      } else if (S.control && P.y > 2.0 && P.z > -11.2 && P.x > -6.4 && P.x < -1.75) S.hop = { t: 0, x: clamp(P.x, -5.2, -2.4), z: P.z };
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
      const indoors = W.indoor(P.x, P.z);
      for (const s of puffs) {
        s.position.x += s.userData.sp * dt * (0.2 + S.wind); if (s.position.x > 30) s.position.x = -30;
        const d2 = (s.position.x - lanW.x) ** 2 + (s.position.z - lanW.z) ** 2, k = (lk * 0.55) / (1 + d2 * 0.035);
        s.material.color.setRGB(0.045 + k * 0.5, 0.06 + k * 0.27, 0.095 + k * 0.1);
        // 안개 판은 건물 안으로 절대 걸치지 않게 한다 (실내에 떠 있는 '한 장짜리 막'처럼 보이는 문제)
        const px = s.position.x, pz = s.position.z, hw = s.scale.x * 0.5 + 0.3;
        const hit = (x0, x1, z0, z1) => Math.hypot(Math.max(x0 - px, 0, px - x1), Math.max(z0 - pz, 0, pz - z1)) < hw;
        const inside = indoors || W.rects.some((r) => hit(r[0], r[1], r[2], r[3])) || hit(1.75, 16.5, -25, -10.6) || hit(-17, -1.75, -25, -10.8);
        const near = Math.hypot(px - P.x, pz - P.z);
        s.material.opacity = lerp(s.material.opacity, inside ? 0 : s.userData.op * (0.75 + 0.25 * Math.sin(time * 0.2 + s.userData.ph)) * clamp((near - 1.5) / 4, 0, 1), 1 - Math.exp(-dt * (inside ? 6 : 1.5)));
      }
      for (const e of embers) if (e.visible) {
        const u = e.userData; u.life -= dt; if (u.life <= 0) { e.visible = false; continue; }
        e.position.addScaledVector(u.v, dt); u.v.x += (Math.random() - 0.5) * dt * 2; const k = u.life / u.max; e.scale.set(u.s * k, u.s * 1.6 * k, 1); e.material.opacity = k;
      }

      updateDoors(dt);

      // ---- 어둑서니 ----
      shade.update(dt, time);
      if ((sh.mode === 'gap' || sh.mode === 'wander' || sh.mode === 'chase') && !S.dead && S.phase === 'explore') {
        const gp = shade.group.position, dx = gp.x - P.x, dz = gp.z - P.z, d = Math.hypot(dx, dz) || 1e-3;
        // (above: 너럭바위처럼 그것보다 한참 높은 데 올라서 있는가 — 키가 아니라 딛고 선 자리의 높이로 가린다)
        const eyeY = P.y + P.eye, headY = gp.y + shade.height, above = P.y > gp.y + 1.5 && P.y - W.hAt(P.x, P.z) > 1.5;   // (비탈 위쪽에 서 있는 것은 치지 않는다 — 너럭바위처럼 땅에서 솟은 자리여야 한다)
        // 눈길이 그것의 몸에 실제로 닿아 있어야 한다: 좌우로는 몸 너비 언저리, 위로는 머리 조금 위까지. 허공이나 딴 데를 보는 것은 치지 않는다
        const yawOff = Math.acos(clamp((dx * fx + dz * fz) / d, -1, 1)), halfW = Math.atan2(0.4 * sh.s, d);
        const facing = yawOff < 0.24 + halfW && d < 34 && !W.indoor(P.x, P.z) && (sightTo(gp.x, headY - 0.15 * sh.s, gp.z) || sightTo(gp.x, gp.y + shade.height * 0.55, gp.z));
        const pKnee = Math.atan2(gp.y + Math.min(0.75, 0.35 * shade.height) - eyeY, d), pHead = Math.atan2(headY - eyeY, d), pFoot = Math.atan2(gp.y - eyeY, d);
        // 올려다보면(무릎 위로 눈길을 주면) 자란다. 그것보다 높은 데서 내려다보면 줄어든다.
        const gaze = facing && (above ? P.pitch < pHead + 0.2 && P.pitch > pFoot - 0.2 : P.pitch > pKnee - 0.03 && P.pitch < pHead + 0.2);
        // 따라오는 것: 눈길과 상관없이, 두어 걸음 뒤까지 다가와 선다. 건물 안과 높은 바위 위로는 오지 못한다
        if (sh.mode === 'chase') {
          if (d > 2.2) {
            const sp = Math.min(1.5, (d - 2.2) * 3) * dt, nx = gp.x - (dx / d) * sp, nz = gp.z - (dz / d) * sp;
            const free = (x, z) => !blockedAt(x, z, 0.35) && !W.indoor(x, z) && Math.abs(groundAt(x, z).h - gp.y) < 0.45 && (z < -10.9 || groundAt(x, z).h < 0.2);
            // 나무 · 바위에 막히면 한쪽으로 돌아 나온다 (한 번 정한 쪽을 유지해, 제자리에서 떨지 않는다)
            const ux = -dx / d, uz = -dz / d, step = Math.max(sp, 1.1 * dt); sh.side = sh.side || 1;
            if (free(nx, nz)) { gp.x = nx; gp.z = nz; } else for (const a of [sh.side * 0.8, sh.side * 1.4, -sh.side * 0.8, -sh.side * 1.4]) { const c = Math.cos(a), s2 = Math.sin(a), vx = ux * c - uz * s2, vz = ux * s2 + uz * c; if (free(gp.x + vx * step, gp.z + vz * step)) { gp.x += vx * step; gp.z += vz * step; sh.side = Math.sign(a); break; } }
            gp.y = groundAt(gp.x, gp.z).h;
          }
          if (S.barCut && P.z < -11.6 && (gp.z > -10.6 || prog(P.x, P.z) > prog(gp.x, gp.z) + 2.8) && unseen() && toAhead()) { A.whoosh(0.5); fearUp(0.7); sub('등 뒤에서 따라오던 것이, 어느새 앞길에 서 있다.', 5); S.passHint = true; }   // 고갯길로 들어서면, 어느새 앞에 서 있다
        }
        if (gaze && above && sh.mode !== 'wander') {
          if (d < 11) { sh.s -= dt * 0.12 * Math.max(1, sh.s / 0.7); fearUp(0.3); }   // (너무 멀면 줄지도 자라지도 않는다 — 보이지도 않는 데서 줄어들지 않게)
          if (!S.downHint && d < 11) { S.downHint = true; sub('…내려다보니, 줄어든다.', 3.5); }
          if (sh.gi === 0 || sh.mode === 'chase') { if (sh.s <= 0.52) becomeSmall(); } else if (sh.s < 0.55) sh.s = 0.55;
        } else if (gaze) {
          sh.s += dt * (S.lanOut ? 0.5 : 0.9); sh.away = 0; if (d < 3.0) { sh.near += dt; if (sh.near > 0.3) sh.s = Math.max(sh.s, 4.3); } shade.twitch = Math.max(shade.twitch, 0.05);
          if (sh.mode === 'wander') { const sp = 0.6 + sh.s * 0.5; gp.x -= (dx / d) * sp * dt; gp.z -= (dz / d) * sp * dt; }
          if (sh.s > sh.base + 0.5 && !S.growHint) { S.growHint = true; sub('커진다. 올려다볼수록, 커진다.', 3.5); }
        } else {
          sh.s = sh.s > sh.base ? Math.max(sh.base, sh.s - dt * 0.4) : Math.min(sh.base, sh.s + dt * 0.08); sh.near = 0;   // 눈을 떼면 곧 도로 줄어든다
          if (sh.mode === 'wander') { sh.away += dt; if (sh.away > 5.5) { sh.mode = 'fade'; tween(1.6, (k) => shade.setOpacity(1 - k), () => { if (sh.mode === 'fade') { shadeToGap(); S.wanderT = 38 + Math.random() * 30; } }); } }
        }
        if (sh.mode === 'gap' || sh.mode === 'wander' || sh.mode === 'chase') {
          shade.size = sh.s; shade.eye = (sh.s - sh.base) / 0.35; shade.faceTo(P.x, P.z);
          $('relight').classList.toggle('on', gaze && !above && !S.lanOut && sh.s > sh.base + 0.25);
          fearUp(clamp((sh.s - sh.base) / 3.2, 0, 1) * 0.9 + (d < 5 ? 0.3 : 0));
          if (!above && (sh.s >= 4.2 || (d < 0.95 && sh.mode === 'wander'))) die();
          // 가까이 가면, 아이가 웃는다
          S.voiceT = (S.voiceT || 0) - dt;
          if (S.voiceT <= 0) { if (d < 8 && !S.dead) { A.giggle({ x: gp.x, y: gp.y + shade.height * 0.85, z: gp.z }, 0.12 + 0.16 * (1 - d / 8)); S.voiceT = 2.6 + Math.random() * 1.6; } else S.voiceT = 0.4; }
        }
      } else if (sh.mode === 'small') {
        shade.faceTo(P.x, P.z);
        // 작은 아이가 되면, 웃음이 울음으로 바뀐다
        const gp = shade.group.position, d = Math.hypot(gp.x - P.x, gp.z - P.z); S.voiceT = (S.voiceT || 0) - dt;
        // 꼭두를 쥐여 주지 않고 멀리 가 버리면, 울음을 그치고 도로 자라 따라온다
        // 꼭두를 쥐여 주지 않고 그냥 지나쳐 고갯길을 오르면, 도로 자라 앞길에 먼저 와 선다 (줄이지 않고 지나쳤을 때와 같다)
        if (S.phase === 'explore' && !S.busy && !S.dead && S.barCut && P.z < -11.6 && (gp.z > -10.6 ? P.z < -12.5 : prog(P.x, P.z) > prog(gp.x, gp.z) + 2.8) && unseen() && toAhead()) {
          S.voiceT = 2; S.windT = 1; A.whoosh(0.5); fearUp(0.7); setObjNow();
          sub('…울음소리가 그쳤다.<br>두고 온 것이, 도로 자라 앞길에 서 있다.', 5); S.passHint = true;
        } else
        if (S.phase === 'explore' && !S.busy && !S.dead && d > Math.max(12, (sh.d0 || 0) + 3)) {   // (줄어들던 때보다 더 멀어져야 한다 — 줄자마자 도로 자라지 않게)
          if (gp.z < -10.6 && !S.barCut) shadeToGap(); else { sh.mode = 'chase'; sh.base = 0.7; sh.near = 0; sh.away = 0; }
          S.voiceT = 2; S.windT = 1; A.whoosh(0.5); fearUp(0.7); setObjNow();
          sub('…울음소리가 그쳤다.<br>두고 온 것이, 도로 자라 따라온다.', 5);
        } else
        if (S.voiceT <= 0) { if (d < 11 && S.phase === 'explore') { A.kidSob({ x: gp.x, y: gp.y + 0.9, z: gp.z }, 0.1 + 0.12 * (1 - d / 11)); S.voiceT = 3.4 + Math.random() * 1.6; } else S.voiceT = 0.4; }
      }
      else if (sh.mode !== 'dead') $('relight').classList.remove('on');

      // ---- 이야기 진행 ----
      if (S.phase === 'explore' && !S.met && P.z < -4.5 && Math.abs(P.x) < 5) firstEncounter();
      if (S.phase === 'explore' && S.met && !S.busy && !S.barCut && sh.mode === 'gap' && S.control && !S.reading) {
        S.wanderT -= dt;
        if (S.wanderT <= 0) { if (!W.indoor(P.x, P.z) && P.z > -6 && spawnWander()) S.wanderT = 1e9; else S.wanderT = 5; }
      }
      if (S.phase === 'explore' && !S.ledgeHint && P.y > 2.1) { S.ledgeHint = true; sub('너럭바위다. 고갯길이, 발아래로 내려다보인다.', 5); }
      if (S.phase === 'explore' && S.barCut && !S.released && !S.passHint && sh.mode === 'gap' && P.z < -17.2) { S.passHint = true; sub('등 뒤에서, 내려다보고 있다.<br>돌아보지 마라.', 5); }
      if (S.phase === 'explore' && S.barCut && !S.released && sh.mode === 'gap' && sh.gi < W.GAPS.length - 1 && prog(P.x, P.z) > gapProg[sh.gi] + 2.8 && unseen()) {
        // 지나쳐 온 것이, 다음 굽이에 먼저 와 서 있다
        sh.gi++; shadeToGap(); A.whoosh(0.5); fearUp(0.7); S.checkpoint = { x: P.x, z: P.z, yaw: P.yaw };
        if (!S.aheadHint) { S.aheadHint = true; sub('등 뒤에 있던 것이, 어느새 앞에 서 있다.<br>고개는, 아직 멀다.', 5.5); }
      }
      if (S.phase === 'explore' && S.barCut && P.z < W.EXITZ) endGame(S.released ? 'release' : 'pass');
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
        camera.position.set(Math.sin(t * 0.05) * 1.0, 1.9 + Math.sin(t * 0.11) * 0.1, 18.4); camera.rotation.set(0.07, Math.sin(t * 0.07) * 0.06, 0);
        sky.position.copy(camera.position); lanLight.getWorldPosition(lanW); snowU.uLan.value.copy(lanW); snowU.uCam.value.copy(camera.position);
        lanLight.intensity = LAN_I * (0.9 + 0.08 * Math.sin(t * 9)); FU.uTime.value = t;
        if (candleOn) candle.intensity = 1.7 * (0.9 + 0.08 * Math.sin(t * 9.1));
        for (const s of puffs) { s.material.opacity = lerp(s.material.opacity, s.userData.op, 0.01); s.position.x += s.userData.sp * dt; if (s.position.x > 30) s.position.x = -30; s.material.color.setRGB(0.05, 0.065, 0.1); }
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
      if (S.choosing) return;
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
    $('retry').addEventListener('click', retry);
    $('endBtn').addEventListener('click', () => location.reload());

    // ================= 시작 흐름 =================
    function begin() {
      $('intro').classList.remove('on'); $('hud').classList.add('on');
      S.phase = 'explore'; S.playing = true; S.control = true; S.time = 0;
      P.x = W.START.x; P.z = W.START.z; P.yaw = 0; P.pitch = 0.02;
      if (!debug) canvas.requestPointerLock();
      tween(4, (k) => { FU.uFade.value = 1 - ease(k); });
      after(2.6, () => sub('고갯마루다. 장승 둘이, 길 양옆에 서 있다.'));
      after(8.5, () => { setObj('고개를 넘어라'); sub('움막에 불빛이 있으나, 인기척은 없다.<br>고갯길은 서낭나무를 지나, 북쪽이다.', 6); });
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

    // 디버그 훅 (화면 검수용)
    const resetAll = () => {
      timers.length = 0; tweens.length = 0; sh.gi = 0; shadeOff(); lanShow(true); fireBoost = 1; S.boost = 1; S.lanOut = false; $('relight').classList.remove('on');
      $('note').classList.remove('on'); $('dead').classList.remove('on'); $('hud').classList.add('on'); S.reading = 0; S.choosing = false; $('sub').classList.remove('on'); subTimer = 0;
      S.busy = false; S.phase = 'explore'; S.control = true; S.playing = true; S.dead = false; S.fear = S.fearT = 0; S.lanT = S.lanMul = 1; S.blink = 0; S.shake = 0; S.lanDead = 0; S.windT = 1; S.wanderT = 1e9; FU.uFade.value = 0;
      S.shrineLocked = false; setCandle(true); hemi.intensity = 0.38; FOG.copy(FOG0); scene.fog.color.copy(FOG); scene.background.copy(FOG);
      camera.fov = 68; camera.updateProjectionMatrix();
    };
    const setBar = (cut) => { S.barCut = cut; W.barBlock.on = !cut; W.bar.rotation.x = cut ? -1.47 : 0; W.bar.position.set(0, cut ? 0.06 : 0, cut ? -11.85 : -10.9); };
    HG.dbg = {
      lights: { hemi, moon },
      rt() { const t = performance.now(); composer.render(); renderer.getContext().finish(); return performance.now() - t; },
      S, P, W, H, shade, camera, renderer, scene,
      go() { A.init(); $('title').classList.remove('on'); begin(); FU.uFade.value = 0; tweens.length = 0; },
      walk(sec) { keys.KeyW = true; for (let i = 0; i < Math.round((sec || 1) / 0.033); i++) update(0.033); keys.KeyW = false; composer.render(); return 'pos ' + P.x.toFixed(2) + ', ' + P.z.toFixed(2) + ' height ' + P.y.toFixed(2) + ' | shade size ' + shade.size.toFixed(2); },
      tp(x, z, yaw, pitch) { P.x = x; P.z = z; P.y = groundAt(x, z).h; if (yaw != null) P.yaw = yaw; if (pitch != null) P.pitch = pitch; },
      use(k) { H[k].use(); }, die, endGame, cutBar,
      scale(v) { HG.lockScale = true; renderScale = v; resize(); }, ema: () => ema,
      views: {
        start: [0, 17.2, 0, 0.02], jangseung: [0, 15.8, 0, 0.12], clearing: [0, 10.5, 0, 0.03], tree: [0.8, 7.8, 0.5, 0.2], tree_up: [-1.2, 5.6, 0.6, 0.9], cairn: [3.4, 7.4, 0.55, -0.15],
        hut_out: [4.6, 4.6, -1.05, 0.02], hut_door: [6.6, 7.0, -1.57, 0], hut_in: [9.0, 7.0, -1.57, -0.1], hut_in_w: [10.6, 7.3, 1.57, 0], hut_in_n: [9.6, 8.0, 0, -0.2], hut_up: [9.6, 7.0, 1.0, 0.9],
        shrine_out: [-4.6, -3.0, 1.57, 0.08], shrine_side: [-5.6, 1.6, 1.0, 0.1], shrine_in: [-8.5, -3.0, 1.57, 0.02], shrine_in_e: [-9.9, -3.0, -1.57, 0], shrine_in_s: [-9.2, -3.9, 3.14, -0.1], shrine_up: [-9.4, -3.0, 1.57, 0.8],
        got_out: [5.4, -4.8, -1.57, 0.03], got_side: [6.4, -0.6, -1.0, 0.1], got_in: [8.9, -4.8, -1.57, -0.05], got_in_n: [9.5, -3.6, 0.2, -0.1], got_in_s: [9.5, -6.2, -2.7, -0.1], got_in_e: [12.3, -4.8, 1.57, -0.1], got_up: [9.5, -4.8, -1.57, 0.85],
        spring: [-9.6, 11.8, 1.0, -0.35], barricade: [0, -7.6, 0, 0], gap_far: [0, -4.0, 0, 0.05], cliff_e: [-0.6, -9.6, -0.9, 0.25], cliff_w: [0.6, -9.6, 0.9, 0.2],
        steps: [-7.9, -8.6, 0, 0.05], steps_side: [-9.8, -11.2, -0.9, 0.05], steps_up: [-7.7, -12.3, 0, 0.3], steps_top: [-7.6, -14.6, -1.57, -0.1], drop_edge: [-4.2, -11.6, 0, -0.5], ledge: [-3.0, -14.2, -1.16, -0.72], ledge_s: [-4.0, -11.6, 3.14, -0.15], ledge_n: [-4.5, -12.5, 0, -0.1],
        kid: [0.1, -13.3, 0, -0.12], pass3_up: [8, -33, 0, 0.1], pass4_up: [5, -43.6, 1.57, 0.1], crest: [-2, -55.5, 0, -0.15], crest_far: [-2, -49, 0, 0.05],
        pass_in: [0, -12.6, 0, 0.0], pass_n: [0, -19.5, 3.14, 0.05], pass2: [0.2, -27.6, -1.57, 0.05], pass3: [8, -30.4, 0, 0.05], pass4: [7.8, -43.6, 1.57, 0.05], pass5: [-2, -46.6, 0, 0.05], pass_exit: [-2, -54.5, 0, 0.03], pass_back: [-2, -52, 3.14, 0.05], edge_w: [-10, 5.5, 1.57, 0.05], edge_e: [10.5, 0.5, -1.57, 0.05], edge_s: [0, 15, 3.14, 0.0], back: [0, 17.6, 3.14, -0.05], wide_n: [0, 14, 0, 0.08], wide_w: [6, 2, 1.3, 0.05], wide_e: [-6, 4, -1.3, 0.05],
        use_note1: [9.9, 6.5, 0, -0.5], use_note2: [-9.6, -2.5, 0, -0.3], use_note3: [9.4, -3.7, 0, -0.5], use_key: [-9.3, -3.0, 0, -0.4], use_sickle: [9.6, -6.1, 0, 0], use_kkokdu: [9.6, -3.8, 0, -0.4], use_bell: [10.0, -4.0, 0, 0], use_sangyeo: [9.5, -4.8, 0, 0],
        use_musindo: [-9.2, -3.0, 0, 0.2], use_cairn: [2.8, 6.8, 0, -0.2], use_tree: [-1.0, 5.4, 0, 0], use_jangseung: [-1.0, 14.8, 0, 0], use_spring: [-10.2, 11.4, 0, -0.4], use_fire: [4.5, 8.4, 0, -0.4], use_doorShrine: [-6.5, -3.0, 0, 0], use_doorGot: [6.8, -4.8, 0, 0], use_barricade: [0, -9.2, 0, -0.1], use_bed: [9.4, 6.9, 0, -0.5], use_back: [0, 18.0, 0, -0.1],
      },
      view(name) {
        const v0 = this.views[name]; if (!v0) return 'unknown view. available: ' + Object.keys(this.views).join(', ');
        const v = v0.slice();
        HG.frozen = true; $('sub').classList.remove('on'); subTimer = 0; timers.length = 0; tweens.length = 0;
        if (S.dead || S.lanDead || sh.mode === 'dead') { S.dead = false; S.lanDead = 0; S.playing = true; sh.mode = 'off'; camera.fov = 68; camera.updateProjectionMatrix(); $('dead').classList.remove('on'); $('hud').classList.add('on'); lanShow(true); }   // 사망 연출 뒤의 화면 효과를 걷어 낸다
        S.met = true; if (sh.mode !== 'gap' && sh.mode !== 'small') shadeToGap();
        // 서낭당 문은 열어 두고, 곳집은 열쇠를 얻기 전에는 잠긴 채 둔다
        for (const k in W.doors) { const open = k !== 'got' || S.key; W.doors[k].target = open ? 1 : 0; W.doors[k].t = open ? 0.99 : 0.01; }
        if (name.indexOf('use_') === 0) { const pr = W.proxies.find((q) => q.userData.key === name.slice(4)); if (pr) { const ey = groundAt(v[0], v[1]).h + P.eye - 0.03, dx = pr.position.x - v[0], dz = pr.position.z - v[1]; v[2] = Math.atan2(-dx, -dz); v[3] = Math.atan2(pr.position.y - ey, Math.hypot(dx, dz)); } }
        S.fear = S.fearT = 0; S.lanT = S.lanMul = 1; S.lanOut = false; S.blink = 0; S.shake = 0; S.wanderT = 1e9; S.phase = 'explore'; S.control = true; S.busy = false; FU.uFade.value = 0;
        P.x = v[0]; P.z = v[1]; P.y = groundAt(v[0], v[1]).h; P.yaw = v[2]; P.pitch = v[3]; P.vx = P.vz = 0;
        const sm = sh.mode; sh.mode = sm === 'gap' ? 'hold' : sm;   // 시점을 잡는 동안에는 자라지 않게
        for (let i = 0; i < 12; i++) update(0.033); S.fear = S.fearT = 0; update(0.001); sh.mode = sm; composer.render();
        return 'view ' + name + ' | prompt: ' + (promptTxt || '(none)');
      },
      look(yawDeg, pitchDeg) { P.yaw = (yawDeg * Math.PI) / 180; P.pitch = ((pitchDeg || 0) * Math.PI) / 180; const sm = sh.mode; sh.mode = sm === 'gap' ? 'hold' : sm; update(0.001); sh.mode = sm; composer.render(); return 'ok'; },
      freeze(v) { HG.frozen = v !== false; return 'frozen=' + HG.frozen; },
      fit(k) { k = k == null ? 0.6667 : k; document.body.style.transformOrigin = '0 0'; document.body.style.transform = k === 1 ? '' : 'scale(' + k + ')'; return 'fit ' + k; },
      // 연출 장면을 그 순간에서 멈춰 보여 준다
      scene(name) {
        HG.frozen = true; resetAll();
        for (const k in W.doors) { W.doors[k].target = 1; W.doors[k].t = 0.99; }
        const at = (x, z, tx, tz, pitch) => { P.x = x; P.z = z; P.y = groundAt(x, z).h; P.yaw = Math.atan2(-(tx - x), -(tz - z)); P.pitch = pitch || 0; P.vx = P.vz = 0; };
        const run = (sec) => { for (let i = 0; i < Math.round(sec / 0.033); i++) update(0.033); };
        const lookShade = (frac) => { const g = shade.group.position, d = Math.hypot(g.x - P.x, g.z - P.z); P.yaw = Math.atan2(-(g.x - P.x), -(g.z - P.z)); P.pitch = Math.atan2(g.y + shade.height * (frac == null ? 0.8 : frac) - (P.y + P.eye), d); };
        const known = () => { S.met = true; S.note1 = S.note2 = S.note3 = true; S.key = true; S.sickle = true; W.sickle.visible = false; setItems(); };
        if (name === 'first_meet') { S.met = false; setBar(false); at(0, -4.7, 0, -15.5, 0); run(6.4); }
        else if (name === 'first_meet_big') { S.met = false; setBar(false); at(0, -4.7, 0, -15.5, 0); run(6.9); }
        else if (name === 'first_wake') { S.met = false; setBar(false); at(0, -4.7, 0, -15.5, 0); run(13.5); }
        else if (name === 'hut_event') { S.met = true; at(10.4, 7.0, 6.7, 7.0, 0.08); run(0.2); eventHut(); run(6.3); }
        else if (name === 'hut_event2') { S.met = true; at(10.4, 7.0, 6.7, 7.0, 0.08); run(0.2); eventHut(); run(7.6); }
        else if (name === 'shrine_event') { S.met = true; at(-9.4, -3.0, -7.9, -3.0, 0.3); run(0.2); eventShrine(); run(4.8); }
        else if (name === 'shrine_after') { S.met = true; at(-9.4, -3.0, -7.9, -3.0, 0.1); run(0.2); eventShrine(); run(11.2); }
        else if (name === 'bier_event') { S.met = true; S.key = true; at(9.3, -4.2, 9.08, -3.0, -0.4); run(0.2); eventBier(); run(2.8); }
        else if (name === 'wander') { S.met = true; setBar(false); at(0.5, 10, -4.5, 2.5, 0); shadeAt(-6.2, 0.6, 0.7, 'wander'); P.pitch = -0.5; run(0.4); lookShade(0.8); sh.mode = 'hold'; update(0.001); sh.mode = 'wander'; }
        else if (name === 'wander_grow') { S.met = true; setBar(false); at(0.5, 10, -4.5, 2.5, 0); shadeAt(-6.2, 0.6, 0.7, 'wander'); for (let i = 0; i < 100; i++) { lookShade(0.8); update(0.033); } lookShade(0.85); }
        else if (name === 'bar_cut1' || name === 'bar_cut2' || name === 'bar_cut3') { known(); setBar(false); shadeToGap(); at(0.4, -8.4, 0, -10.9, -0.12); run(0.2); cutBar(); run(name === 'bar_cut1' ? 0.7 : name === 'bar_cut2' ? 1.3 : 3.6); }
        else if (name === 'gap') { known(); setBar(true); shadeToGap(); at(0, -9.6, 0, -15.5, -0.5); run(0.3); }
        else if (name === 'gap_grow') { known(); setBar(true); shadeToGap(); at(0, -9.6, 0, -15.5, 0); for (let i = 0; i < 90; i++) { lookShade(0.85); update(0.033); } lookShade(0.9); P.pitch += 0.06; }
        else if (name === 'gap_hooded') { known(); setBar(true); shadeToGap(); at(0, -9.6, 0, -15.5, -0.5); run(0.2); relight(); run(1.2); }
        else if (/^pass_g[2-5]$/.test(name)) { known(); setBar(true); sh.gi = +name.slice(6) - 1; shadeToGap(); const q = W.GAPS[sh.gi], b = [[1.2, -27.6], [8, -30.5], [7.6, -43.6], [-2, -46.8]][sh.gi - 1]; at(b[0], b[1], q.x, q.z, 0); lookShade(0.75); sh.mode = 'hold'; run(0.4); sh.mode = 'gap'; }
        else if (name === 'gap_pass') { known(); setBar(true); shadeToGap(); at(1.0, -14.2, 1.0, -20, -0.95); run(0.4); }
        else if (name === 'ledge_down') { known(); setBar(true); shadeToGap(); at(-2.7, -14.6, 0, -15.5, -0.6); run(0.2); for (let i = 0; i < 30; i++) { lookShade(0.5); update(0.033); } }
        else if (name === 'small') { known(); setBar(true); shadeToGap(); at(-2.7, -14.6, 0, -15.5, -0.6); for (let i = 0; i < 80; i++) { lookShade(0.5); update(0.033); } lookShade(0.5); }
        else if (name === 'chase_far') { known(); setBar(true); shadeAt(-1.2, -7.5, 0.7, 'chase'); at(-3.2, 2.5, -1.2, -7.5, -0.2); setObjNow(); run(1.2); }
        else if (name === 'chase_near') { known(); setBar(true); shadeAt(-3, -1.5, 0.7, 'chase'); at(-3, 2.4, -3, -1.5, -0.5); setObjNow(); run(2.5); }
        else if (name === 'chase_side') { known(); setBar(true); shadeAt(-0.4, 1.2, 0.7, 'chase'); at(-3, 2.4, -0.4, 1.2, -0.5); setObjNow(); run(1.5); P.yaw += 0.35; }
        else if (name === 'chase_small') { known(); setBar(true); shadeAt(-3.6, -7.2, 0.7, 'chase'); at(-3.6, -11.6, -3.6, -7.2, -0.6); for (let i = 0; i < 110; i++) { lookShade(0.5); update(0.033); } lookShade(0.5); }
        else if (name === 'small_near') { known(); setBar(true); shadeToGap(); becomeSmall(); at(0.2, -13.5, 0, -15.5, -0.38); run(0.4); }
        else if (name === 'release' || name === 'release_fade' || name === 'release_end') { known(); S.kkokdu = true; W.kkokdu.visible = false; setItems(); setBar(true); shadeToGap(); becomeSmall(); at(0.2, -13.6, 0, -15.5, -0.38); run(0.3); doRelease(); run(name === 'release' ? 4.5 : name === 'release_fade' ? 11.5 : 26); }
        else if (name === 'die') { known(); setBar(true); shadeToGap(); at(0, -12.5, 0, -15.5, 0.3); S.checkpoint = { x: 0, z: -8.2, yaw: 0 }; sh.s = 4.2; die(); run(0.7); S.shake = 0; }
        else if (name === 'note1') { at(9.9, 6.5, 10.55, 5.85, -0.5); run(0.3); openNote(1); }
        else if (name === 'note2') { at(-9.6, -2.5, -10.45, -2.2, -0.3); run(0.3); openNote(2); }
        else if (name === 'note3') { S.key = true; at(9.4, -3.7, 8.72, -3.02, -0.5); run(0.3); openNote(3); }
        else return 'unknown scene. available: first_meet, first_meet_big, first_wake, hut_event, hut_event2, shrine_event, shrine_after, bier_event, wander, wander_grow, bar_cut1, bar_cut2, bar_cut3, gap, gap_grow, gap_hooded, gap_pass, ledge_down, small, small_near, release, release_fade, release_end, die, note1, note2, note3';
        const sm = sh.mode; sh.mode = sm === 'gap' || sm === 'wander' ? 'hold' : sm; update(0.001); sh.mode = sm; composer.render();
        return 'scene ' + name + ' | objective: ' + $('obj').textContent + ' | subtitle: ' + ($('sub').classList.contains('on') ? $('sub').textContent : '(none)') + ' | prompt: ' + (promptTxt || '(none)') + ' | size: ' + sh.s.toFixed(2) + ' ' + sh.mode;
      },
      // 어둑서니 진열: kind = far | near | close | side | back | big | huge | small
      shadeShow(kind) {
        HG.frozen = true; resetAll(); S.met = true;
        const dist = { far: 9, near: 4, close: 2, side: 3, back: 3, big: 7, huge: 6, small: 2.2 }[kind] || 4, s = { big: 2.6, huge: 4.3, small: 0.5 }[kind] || 1;
        P.x = 3; P.z = 12; P.y = 0; P.yaw = 0; shadeAt(3, 12 - dist, s, 'hold'); shade.size = s; shade.eye = (s - 0.7) / 0.35;
        if (kind === 'side') shade.group.rotation.y += 1.4; if (kind === 'back') shade.group.rotation.y += Math.PI;
        P.pitch = Math.atan2(shade.height * (s > 2 ? 0.7 : 0.55) - P.eye, dist);
        for (let i = 0; i < 10; i++) update(0.033); S.fear = S.fearT = 0; update(0.001); composer.render(); return 'shade ' + kind;
      },
      step(n, dt) { for (let i = 0; i < (n || 1); i++) update(dt || 0.033); composer.render(); },
    };
    if (debug) HG.dbg.go();
  };
})();
