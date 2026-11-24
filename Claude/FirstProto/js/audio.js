// 절차적 사운드 (WebAudio 합성 — 음원 파일 없음)
(function () {
  'use strict';
  const HG = (window.HG = window.HG || {});
  const A = (HG.audio = { ready: false });
  let ctx, master, dry, rev, noiseBuf, brownBuf;
  let windGain, windBP, howlGain, howlBP, droneGain, tinGain, windLevel = 1, fear = 0;

  A.init = function () {
    if (A.ready) { if (ctx.state === 'suspended') ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    master = ctx.createGain(); master.gain.value = 0.9;
    const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -14; comp.ratio.value = 5;
    master.connect(comp); comp.connect(ctx.destination);
    dry = ctx.createGain(); dry.connect(master);
    // 잔향
    const len = ctx.sampleRate * 3.2, ir = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let c = 0; c < 2; c++) { const d = ir.getChannelData(c); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6) * (i < 400 ? i / 400 : 1); }
    const conv = ctx.createConvolver(); conv.buffer = ir;
    rev = ctx.createGain(); rev.gain.value = 0.5; rev.connect(conv); conv.connect(master);
    // 노이즈
    const nl = ctx.sampleRate * 3;
    noiseBuf = ctx.createBuffer(1, nl, ctx.sampleRate); brownBuf = ctx.createBuffer(1, nl, ctx.sampleRate);
    const n = noiseBuf.getChannelData(0), b = brownBuf.getChannelData(0); let last = 0;
    for (let i = 0; i < nl; i++) { const w = Math.random() * 2 - 1; n[i] = w; last = (last + 0.02 * w) / 1.02; b[i] = last * 3.5; }
    // 바람
    const ws = loopNoise(brownBuf); windBP = ctx.createBiquadFilter(); windBP.type = 'bandpass'; windBP.frequency.value = 380; windBP.Q.value = 0.6;
    windGain = ctx.createGain(); windGain.gain.value = 0.0; ws.connect(windBP); windBP.connect(windGain); windGain.connect(dry);
    const hs = loopNoise(noiseBuf); howlBP = ctx.createBiquadFilter(); howlBP.type = 'bandpass'; howlBP.frequency.value = 620; howlBP.Q.value = 18;
    howlGain = ctx.createGain(); howlGain.gain.value = 0.0; hs.connect(howlBP); howlBP.connect(howlGain); howlGain.connect(dry); howlGain.connect(rev);
    // 저음 드론
    droneGain = ctx.createGain(); droneGain.gain.value = 0.0;
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 160; lp.connect(droneGain); droneGain.connect(dry);
    [41.2, 41.7, 61.9].forEach((f) => { const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = f; o.connect(lp); o.start(); });
    tinGain = ctx.createGain(); tinGain.gain.value = 0; tinGain.connect(dry);
    [1187, 1259, 2731].forEach((f) => { const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = f; o.connect(tinGain); o.start(); });
    A.ready = true; A.ctx = ctx;
  };
  function loopNoise(buf) { const s = ctx.createBufferSource(); s.buffer = buf; s.loop = true; s.start(0, Math.random() * 2); return s; }

  // 출력 버스 (공간음 또는 직결)
  function bus(pos, wet) {
    const g = ctx.createGain();
    if (pos) {
      const p = ctx.createPanner(); p.panningModel = 'HRTF'; p.distanceModel = 'inverse'; p.refDistance = pos.ref || 2.5; p.rolloffFactor = pos.roll || 1.2;
      if (p.positionX) { p.positionX.value = pos.x; p.positionY.value = pos.y == null ? 1.2 : pos.y; p.positionZ.value = pos.z; } else p.setPosition(pos.x, pos.y == null ? 1.2 : pos.y, pos.z);
      g.connect(p); p.connect(dry); const w = ctx.createGain(); w.gain.value = wet == null ? 0.5 : wet; p.connect(w); w.connect(rev);
    } else { g.connect(dry); const w = ctx.createGain(); w.gain.value = wet == null ? 0.25 : wet; g.connect(w); w.connect(rev); }
    return g;
  }
  function env(g, t, a, peak, d, hold) {
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(peak, t + a);
    if (hold) g.gain.setValueAtTime(peak, t + a + hold);
    g.gain.exponentialRampToValueAtTime(0.0001, t + a + (hold || 0) + d);
  }
  function nz(dest, t, o) {
    const s = ctx.createBufferSource(); s.buffer = o.brown ? brownBuf : noiseBuf;
    const f = ctx.createBiquadFilter(); f.type = o.type || 'bandpass'; f.frequency.setValueAtTime(o.f, t); if (o.f2) f.frequency.exponentialRampToValueAtTime(o.f2, t + (o.a || 0.005) + (o.hold || 0) + o.d); f.Q.value = o.q || 1;
    const g = ctx.createGain(); env(g, t, o.a || 0.005, o.g, o.d, o.hold);
    s.connect(f); f.connect(g); g.connect(dest); s.start(t, Math.random() * 2); s.stop(t + (o.a || 0.005) + (o.hold || 0) + o.d + 0.05);
  }
  function tn(dest, t, o) {
    const s = ctx.createOscillator(); s.type = o.type || 'sine'; s.frequency.setValueAtTime(o.f, t); if (o.f2) s.frequency.exponentialRampToValueAtTime(o.f2, t + (o.a || 0.005) + (o.hold || 0) + o.d);
    const g = ctx.createGain(); env(g, t, o.a || 0.005, o.g, o.d, o.hold);
    s.connect(g); g.connect(dest); s.start(t); s.stop(t + (o.a || 0.005) + (o.hold || 0) + o.d + 0.05);
    return s;
  }
  const now = () => ctx.currentTime + 0.01;
  const ok = () => A.ready && ctx.state === 'running';

  // ---------- 발소리 ----------
  A.step = function (surf, run) {
    if (!ok()) return; const t = now(), d = bus(null, 0.12), v = (run ? 1.25 : 1) * (0.85 + Math.random() * 0.3);
    if (surf === 'wood') {
      tn(d, t, { f: 95 + Math.random() * 30, f2: 60, g: 0.3 * v, d: 0.11 }); nz(d, t, { type: 'lowpass', f: 700, g: 0.12 * v, d: 0.07 });
      if (Math.random() < 0.3) A.creak(0.25 + Math.random() * 0.3, 0.05);
    } else if (surf === 'paper') {
      tn(d, t, { f: 80, f2: 55, g: 0.2 * v, d: 0.09 }); nz(d, t, { type: 'lowpass', f: 500, g: 0.06 * v, d: 0.06 });
    } else if (surf === 'stone') {
      nz(d, t, { f: 1700, q: 1.2, g: 0.09 * v, d: 0.05 }); tn(d, t, { f: 140, f2: 90, g: 0.1 * v, d: 0.05 });
    } else {
      nz(d, t, { f: 1100 + Math.random() * 500, f2: 500, q: 0.7, g: 0.16 * v, d: 0.13 });
      nz(d, t + 0.035, { type: 'highpass', f: 2600, g: 0.07 * v, d: 0.09 });
      tn(d, t, { f: 75, f2: 50, g: 0.1 * v, d: 0.06 });
    }
  };

  // ---------- 효과음 ----------
  A.creak = function (dur, gain, pos) {
    if (!ok()) return; const t = now(), d = bus(pos, 0.4);
    const o = ctx.createOscillator(); o.type = 'sawtooth'; const f0 = 70 + Math.random() * 50;
    o.frequency.setValueAtTime(f0, t);
    for (let i = 1; i <= 8; i++) o.frequency.linearRampToValueAtTime(f0 * (0.8 + Math.random() * 0.7), t + (dur * i) / 8);
    const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 1100 + Math.random() * 700; f.Q.value = 7;
    const g = ctx.createGain(); env(g, t, dur * 0.2, gain == null ? 0.12 : gain, dur * 0.8);
    o.connect(f); f.connect(g); g.connect(d); o.start(t); o.stop(t + dur + 0.1);
  };
  A.slam = function (pos, g) {
    if (!ok()) return; const t = now(), d = bus(pos, 0.7); g = g || 1;
    tn(d, t, { f: 120, f2: 38, g: 0.9 * g, d: 0.5 }); nz(d, t, { type: 'lowpass', f: 1800, f2: 200, g: 0.7 * g, d: 0.3 });
    nz(d, t + 0.02, { f: 600, q: 3, g: 0.3 * g, d: 0.5 });
  };
  A.knock = function (pos, n, g) {
    if (!ok()) return; const t = now(), d = bus(pos, 0.5);
    for (let i = 0; i < (n || 3); i++) { const tt = t + i * 0.34 + Math.random() * 0.03; tn(d, tt, { f: 180, f2: 90, g: (g || 0.5), d: 0.12 }); nz(d, tt, { f: 900, q: 2, g: (g || 0.5) * 0.4, d: 0.05 }); }
  };
  A.paper = function () { if (!ok()) return; const t = now(), d = bus(null, 0.1); for (let i = 0; i < 4; i++) nz(d, t + i * 0.07 + Math.random() * 0.03, { type: 'highpass', f: 3000 + Math.random() * 2000, g: 0.05, d: 0.06 }); };
  A.pickup = function () { if (!ok()) return; const t = now(), d = bus(null, 0.3); nz(d, t, { type: 'highpass', f: 2500, g: 0.08, d: 0.15 }); tn(d, t + 0.05, { f: 52, g: 0.35, a: 0.3, d: 1.6 }); };
  A.blowOut = function (pos) { if (!ok()) return; const t = now(), d = bus(pos, 0.3); nz(d, t, { f: 900, f2: 250, q: 0.8, g: 0.35, a: 0.04, d: 0.45 }); };
  A.whoosh = function (g) { if (!ok()) return; const t = now(), d = bus(null, 0.5); nz(d, t, { brown: true, type: 'bandpass', f: 200, f2: 900, q: 0.8, g: (g || 0.6), a: 0.5, d: 1.1 }); };
  A.splash = function (pos) {
    if (!ok()) return; const t = now(), d = bus(pos, 0.9);
    nz(d, t, { type: 'lowpass', f: 2500, f2: 400, g: 0.7, a: 0.01, d: 0.7 }); tn(d, t, { f: 180, f2: 60, g: 0.5, d: 0.35 });
    for (let i = 0; i < 6; i++) tn(d, t + 0.3 + i * 0.13 + Math.random() * 0.08, { f: 700 + Math.random() * 900, f2: 1600 + Math.random() * 600, g: 0.07, d: 0.07 });
  };
  A.drip = function (pos) { if (!ok()) return; const t = now(), d = bus(pos, 1.2); tn(d, t, { f: 900 + Math.random() * 500, f2: 1900, g: 0.12, d: 0.09 }); };
  A.whisper = function (dur, pos, gain) {
    if (!ok()) return; const t = now(), d = bus(pos, 0.6);
    const s = ctx.createBufferSource(); s.buffer = noiseBuf; s.loop = true;
    const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = 3.5; const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t);
    let tt = t; const pk = gain || 0.22;
    while (tt < t + dur) {
      const l = 0.07 + Math.random() * 0.16;
      f.frequency.setValueAtTime(1300 + Math.random() * 2600, tt);
      g.gain.linearRampToValueAtTime(pk * (0.4 + Math.random() * 0.6), tt + l * 0.3); g.gain.linearRampToValueAtTime(0.0001, tt + l);
      tt += l + Math.random() * 0.09;
    }
    s.connect(f); f.connect(g); g.connect(d); s.start(t); s.stop(tt + 0.1);
  };
  // 여인의 흐느낌
  A.sob = function (pos, gain, long) {
    if (!ok()) return; const t = now(), d = bus(pos, 1.0), n = long ? 7 : 4;
    let tt = t;
    for (let i = 0; i < n; i++) {
      const l = 0.35 + Math.random() * (long ? 0.9 : 0.45), f0 = 430 + Math.random() * 160;
      const o = ctx.createOscillator(); o.type = 'triangle';
      o.frequency.setValueAtTime(f0 * 1.12, tt); o.frequency.exponentialRampToValueAtTime(f0, tt + l * 0.4); o.frequency.exponentialRampToValueAtTime(f0 * 0.82, tt + l);
      const vib = ctx.createOscillator(); vib.frequency.value = 5.5 + Math.random() * 2; const vg = ctx.createGain(); vg.gain.value = 9; vib.connect(vg); vg.connect(o.frequency);
      const f1 = ctx.createBiquadFilter(); f1.type = 'bandpass'; f1.frequency.value = 820; f1.Q.value = 5;
      const f2 = ctx.createBiquadFilter(); f2.type = 'bandpass'; f2.frequency.value = 1250; f2.Q.value = 6;
      const g = ctx.createGain(); env(g, tt, l * 0.25, (gain || 0.16) * (0.6 + Math.random() * 0.4), l * 0.75);
      o.connect(f1); o.connect(f2); f1.connect(g); f2.connect(g); g.connect(d);
      o.start(tt); vib.start(tt); o.stop(tt + l + 0.1); vib.stop(tt + l + 0.1);
      nz(d, tt, { f: 2400, q: 2, g: 0.02, a: 0.05, d: l * 0.5 });
      tt += l + 0.12 + Math.random() * 0.3;
    }
  };
  A.sting = function (g) {
    if (!ok()) return; const t = now(), d = bus(null, 0.8); g = g || 1;
    [233, 247, 311, 466, 494, 659].forEach((f) => { const o = tn(d, t, { type: 'sawtooth', f: f, f2: f * 1.04, g: 0.07 * g, a: 0.02, d: 2.2 }); o.detune.value = Math.random() * 40 - 20; });
    tn(d, t, { f: 60, f2: 30, g: 0.8 * g, d: 1.2 }); nz(d, t, { type: 'lowpass', f: 3000, f2: 300, g: 0.35 * g, d: 0.6 });
  };
  A.scream = function () {
    if (!ok()) return; const t = now(), d = bus(null, 0.9);
    const sh = ctx.createWaveShaper(), c = new Float32Array(256); for (let i = 0; i < 256; i++) { const x = i / 128 - 1; c[i] = Math.tanh(x * 4); } sh.curve = c; sh.connect(d);
    [610, 643, 921, 1217, 1833].forEach((f, i) => {
      const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.setValueAtTime(f * 0.7, t); o.frequency.exponentialRampToValueAtTime(f * 1.5, t + 0.25); o.frequency.exponentialRampToValueAtTime(f * (0.9 + i * 0.05), t + 1.3);
      const v = ctx.createOscillator(); v.frequency.value = 23 + i * 7; const vg = ctx.createGain(); vg.gain.value = 40; v.connect(vg); vg.connect(o.frequency);
      const g = ctx.createGain(); env(g, t, 0.02, 0.2, 1.2, 0.25); o.connect(g); g.connect(sh); o.start(t); v.start(t); o.stop(t + 1.7); v.stop(t + 1.7);
    });
    nz(d, t, { type: 'highpass', f: 1500, g: 0.5, a: 0.01, d: 1.0, hold: 0.2 }); tn(d, t, { f: 55, f2: 28, g: 1.0, d: 1.4 });
  };
  // 징
  A.gong = function (g) {
    if (!ok()) return; const t = now(), d = bus(null, 1.0); g = g || 0.5;
    [[1, 1, 7], [1.48, 0.55, 5.5], [2.02, 0.4, 4.5], [2.74, 0.25, 3.2], [3.3, 0.18, 2.4], [4.13, 0.1, 1.6]].forEach((p) => {
      const o = ctx.createOscillator(); o.frequency.setValueAtTime(98 * p[0] * 1.03, t); o.frequency.exponentialRampToValueAtTime(98 * p[0] * 0.985, t + 0.5); o.frequency.exponentialRampToValueAtTime(98 * p[0], t + 2);
      const gg = ctx.createGain(); env(gg, t, 0.012, g * p[1], p[2]); o.connect(gg); gg.connect(d); o.start(t); o.stop(t + p[2] + 0.2);
    });
    nz(d, t, { f: 2200, q: 0.6, g: g * 0.25, d: 0.25 });
  };
  A.heart = function (g) { if (!ok()) return; const t = now(); [0, 0.17].forEach((o, i) => tn(dry, t + o, { f: 62, f2: 40, g: (g || 0.5) * (i ? 0.7 : 1), a: 0.01, d: 0.13 })); };
  A.fire = function (pos) {
    if (!ok()) return; const t = now(), d = bus(pos, 0.3);
    nz(d, t, { brown: true, type: 'bandpass', f: 500, f2: 1400, q: 0.6, g: 0.5, a: 0.3, d: 2.4, hold: 0.8 });
    for (let i = 0; i < 30; i++) nz(d, t + Math.random() * 3, { type: 'highpass', f: 3500, g: 0.08 * Math.random(), d: 0.03 });
  };
  A.scrape = function (dur) {
    if (!ok()) return; const t = now(), d = bus(null, 0.3);
    nz(d, t, { f: 420, f2: 610, q: 4, g: 0.16, a: 0.05, d: dur, brown: false });
  };
  A.water = function (pos, dur) {
    if (!ok()) return; const t = now(), d = bus(pos, 1.1);
    nz(d, t, { type: 'lowpass', f: 900, f2: 2400, g: 0.5, a: 0.4, d: dur, hold: dur * 0.3 });
    for (let i = 0; i < 24; i++) tn(d, t + Math.random() * dur * 1.2, { f: 400 + Math.random() * 1200, f2: 1500 + Math.random() * 900, g: 0.06, d: 0.08 });
  };

  // 다듬이 소리
  let dadTimer = null, dadPos = null, dadNext = 0, dadGain = 0.34;
  A.dadeumi = function (on, pos, gain) {
    if (!A.ready) return;
    if (!on) { if (dadTimer) clearInterval(dadTimer); dadTimer = null; return; }
    if (dadTimer) return;
    dadPos = pos; dadGain = gain || 0.34; dadNext = ctx.currentTime + 0.2; let beat = 0;
    const pat = [0.21, 0.21, 0.42, 0.21, 0.21, 0.21, 0.63];
    dadTimer = setInterval(() => {
      if (ctx.state !== 'running') return;
      while (dadNext < ctx.currentTime + 0.3) {
        const d = bus(dadPos, 0.7), t = dadNext, hi = beat % 2;
        nz(d, t, { f: hi ? 2100 : 1700, q: 9, g: dadGain, d: 0.045 }); tn(d, t, { f: hi ? 880 : 760, f2: 600, g: dadGain * 0.5, d: 0.04 });
        dadNext += pat[beat % pat.length] * (0.97 + Math.random() * 0.06); beat++;
      }
    }, 100);
  };

  // ---------- 연속 제어 ----------
  A.setWind = function (v) { windLevel = v; };
  A.setFear = function (v) { fear = v; };
  A.update = function (dt, time, cam) {
    if (!ok()) return;
    const t = ctx.currentTime, gust = 0.55 + 0.45 * Math.sin(time * 0.23) * Math.sin(time * 0.071 + 1.3);
    windGain.gain.setTargetAtTime(0.5 * windLevel * (0.5 + gust * 0.6), t, 0.4);
    windBP.frequency.setTargetAtTime(300 + gust * 320, t, 0.5);
    howlGain.gain.setTargetAtTime(0.02 * windLevel * Math.max(0, gust - 0.2), t, 0.6);
    howlBP.frequency.setTargetAtTime(520 + 260 * Math.sin(time * 0.31) + 90 * Math.sin(time * 1.3), t, 0.3);
    droneGain.gain.setTargetAtTime(0.05 + fear * 0.28, t, 0.5);
    tinGain.gain.setTargetAtTime(Math.max(0, fear - 0.45) * 0.012, t, 0.8);
    if (cam) {
      const l = ctx.listener, p = cam.position, f = HG._fwd, u = cam.up;
      if (l.positionX) {
        l.positionX.value = p.x; l.positionY.value = p.y; l.positionZ.value = p.z;
        l.forwardX.value = f.x; l.forwardY.value = f.y; l.forwardZ.value = f.z; l.upX.value = u.x; l.upY.value = u.y; l.upZ.value = u.z;
      } else { l.setPosition(p.x, p.y, p.z); l.setOrientation(f.x, f.y, f.z, u.x, u.y, u.z); }
    }
  };
  A.suspend = function (s) { if (!A.ready) return; if (s) ctx.suspend(); else ctx.resume(); };
})();
