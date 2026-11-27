// ===== Frostfang Hollow Link — sound engine =====
// Everything is synthesized with the Web Audio API, so it needs no files.
// To use real recordings later, ship them beside the page as audio/<name>.mp3 and list them in
// audio/manifest.json, e.g. {"sfx":["orb","winBig"],"music":["music_base"],"voice":["shiny","mine_mine"]}.
// Anything listed replaces the built-in sound; nothing is fetched unless the manifest lists it.
const SOUND = (() => {
  const FILES = {
    sfx: ['click','spinStart','reelStop','tease','orb','moon','diamond','gem','throw','impact','lock','plus',
          'coin','winSmall','winMed','winBig','feature','jackpot','grow','full','grand','glide'],
    music: ['music_base','music_hold','music_moon'],
    voice: 'voice/<line>.mp3, e.g. voice/shiny.mp3 for "Shiny!"'
  };
  const prefs = { on: false, music: 0.55, sfx: 0.8, voice: true };
  try { Object.assign(prefs, JSON.parse(localStorage.getItem('ffh-sound') || '{}')); } catch (e) {}
  const savePrefs = () => { try { localStorage.setItem('ffh-sound', JSON.stringify(prefs)); } catch (e) {} };

  let ctx = null, master, musicBus, sfxBus, voiceBus, verbIn, noiseBuf;
  const files = {};          // name -> AudioBuffer (from optional audio/ files)
  const voiceCache = {};     // slug -> AudioBuffer | null
  let manifest = { sfx: [], music: [], voice: [], alias: {} };
  const voiceFile = slug => (manifest.alias || {})[slug] || ((manifest.voice || []).includes(slug) ? slug : null);
  let voiceNow = null;
  async function loadVoice(file) {
    if (file in voiceCache) return voiceCache[file];
    voiceCache[file] = null;
    try { const r = await fetch('audio/voice/' + file + '.mp3'); if (r.ok) voiceCache[file] = await ctx.decodeAudioData(await r.arrayBuffer()); } catch (e) {}
    return voiceCache[file];
  }

  // ---------- setup ----------
  function init() {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return true; }
    try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return false; }
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -14; comp.ratio.value = 4;
    master = ctx.createGain(); master.gain.value = 0.9;
    master.connect(comp).connect(ctx.destination);
    musicBus = ctx.createGain(); sfxBus = ctx.createGain(); voiceBus = ctx.createGain();
    [musicBus, sfxBus, voiceBus].forEach(b => b.connect(master));
    // a big, spooky room: generated reverb tail
    const verb = ctx.createConvolver(), len = ctx.sampleRate * 2.6, ir = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) { const d = ir.getChannelData(ch);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3.2); }
    verb.buffer = ir; verbIn = ctx.createGain(); verbIn.gain.value = 0.32;
    verbIn.connect(verb).connect(master);
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const nd = noiseBuf.getChannelData(0); for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
    applyVolumes(); loadFiles();
    return true;
  }
  function applyVolumes() {
    if (!ctx) return;
    const t = ctx.currentTime, on = prefs.on ? 1 : 0;
    musicBus.gain.setTargetAtTime(on * prefs.music * 0.55, t, 0.05);
    sfxBus.gain.setTargetAtTime(on * prefs.sfx, t, 0.05);
    voiceBus.gain.setTargetAtTime(on * (prefs.voice ? prefs.sfx : 0), t, 0.05);
  }
  async function loadFiles() {
    try { const r = await fetch('audio/manifest.json'); if (!r.ok) return; Object.assign(manifest, await r.json()); } catch (e) { return; }
    // preload every recorded voice line so the first time each plays there's no delay
    const vf = new Set([...(manifest.voice || []), ...Object.values(manifest.alias || {})]);
    for (const f of vf) loadVoice(f);
    for (const n of [...(manifest.sfx || []), ...(manifest.music || [])]) {
      try { const r = await fetch('audio/' + n + '.mp3'); if (!r.ok) continue;
        files[n] = await ctx.decodeAudioData(await r.arrayBuffer()); } catch (e) {}
      // the recorded track for the music already playing has arrived: switch to it
      if (n === 'music_' + mode && !fileSrc) { const m = mode; mode = null; music(m); }
    }
  }
  const ready = () => ctx && prefs.on;

  // ---------- building blocks ----------
  function env(g, t, a, peak, d, sustain = 0.0001) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(Math.max(peak, 0.0002), t + a);
    g.gain.exponentialRampToValueAtTime(Math.max(sustain, 0.0001), t + a + d);
  }
  function osc(type, f, t, dur, { gain = 0.2, a = 0.005, dest = sfxBus, glide, detune = 0, verb = 0 } = {}) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t); o.detune.value = detune;
    if (glide) o.frequency.exponentialRampToValueAtTime(glide, t + dur);
    env(g, t, a, gain, dur);
    o.connect(g).connect(dest); if (verb) { const s = ctx.createGain(); s.gain.value = verb; g.connect(s).connect(verbIn); }
    o.start(t); o.stop(t + a + dur + 0.05);
  }
  function noise(t, dur, { type = 'bandpass', f = 1000, to, q = 1, gain = 0.2, a = 0.005, dest = sfxBus, verb = 0 } = {}) {
    const s = ctx.createBufferSource(), fl = ctx.createBiquadFilter(), g = ctx.createGain();
    s.buffer = noiseBuf; s.loop = true; fl.type = type; fl.Q.value = q;
    fl.frequency.setValueAtTime(f, t); if (to) fl.frequency.exponentialRampToValueAtTime(to, t + dur);
    env(g, t, a, gain, dur);
    s.connect(fl).connect(g).connect(dest); if (verb) { const v = ctx.createGain(); v.gain.value = verb; g.connect(v).connect(verbIn); }
    s.start(t); s.stop(t + a + dur + 0.05);
  }
  // glassy bell: inharmonic partials with a long ring
  function bell(f, t, { gain = 0.12, dur = 1.2, dest = sfxBus, verb = 0.5 } = {}) {
    [[1, 1], [2.76, 0.45], [5.4, 0.22], [8.93, 0.1]].forEach(([m, amp], i) =>
      osc('sine', f * m, t, dur / (1 + i * 0.6), { gain: gain * amp, a: 0.002, dest, verb }));
  }
  function pluck(f, t, { gain = 0.12, dur = 0.35, dest = musicBus, verb = 0.25 } = {}) {
    osc('triangle', f, t, dur, { gain, a: 0.003, dest, verb });
    osc('sine', f * 2, t, dur * 0.5, { gain: gain * 0.3, a: 0.003, dest, verb });
  }
  function pad(freqs, t, dur, { gain = 0.035, dest = musicBus, cutoff = 900 } = {}) {
    const fl = ctx.createBiquadFilter(); fl.type = 'lowpass'; fl.frequency.value = cutoff; fl.Q.value = 0.7;
    const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(gain, t + dur * 0.3); g.gain.linearRampToValueAtTime(0.0001, t + dur);
    fl.connect(g).connect(dest); const v = ctx.createGain(); v.gain.value = 0.6; g.connect(v).connect(verbIn);
    freqs.forEach(f => [-7, 7].forEach(dt => { const o = ctx.createOscillator(); o.type = 'sawtooth';
      o.frequency.value = f; o.detune.value = dt; o.connect(fl); o.start(t); o.stop(t + dur + 0.05); }));
  }
  function kick(t, { gain = 0.5, dest = musicBus } = {}) { osc('sine', 120, t, 0.22, { gain, a: 0.002, dest, glide: 42 }); }
  function hat(t, { gain = 0.05, dest = musicBus } = {}) { noise(t, 0.05, { type: 'highpass', f: 7000, gain, dest }); }
  function playFile(name, dest = sfxBus, { loop = false, rate = 1 } = {}) {
    const s = ctx.createBufferSource(); s.buffer = files[name]; s.loop = loop; s.playbackRate.value = rate;
    s.connect(dest); s.start(); return s;
  }
  const N = n => 440 * Math.pow(2, (n - 69) / 12);   // MIDI note -> Hz
  const PENTA = [0, 3, 5, 7, 10, 12, 15, 17, 19, 22, 24];

  // ---------- sound effects ----------
  let lastCoin = 0;
  const FX = {
    click: t => osc('triangle', 1400, t, 0.03, { gain: 0.06 }),
    spinStart: t => { noise(t, 0.28, { f: 300, to: 2600, q: 0.8, gain: 0.12 }); osc('sine', 90, t, 0.15, { gain: 0.25, glide: 55 }); },
    reelStop: (t, { i = 0 } = {}) => { osc('sine', 150 - i * 8, t, 0.14, { gain: 0.45, a: 0.002, glide: 55 });
      noise(t, 0.04, { type: 'bandpass', f: 2200 + i * 150, q: 2, gain: 0.18 }); },
    tease: t => { const o = ctx.createOscillator(), g = ctx.createGain(), lfo = ctx.createOscillator(), lg = ctx.createGain();
      o.type = 'sine'; o.frequency.setValueAtTime(520, t); o.frequency.exponentialRampToValueAtTime(1300, t + 1.1);
      lfo.frequency.value = 14; lg.gain.value = 0.05; lfo.connect(lg).connect(g.gain);
      env(g, t, 0.15, 0.09, 1.0); o.connect(g).connect(sfxBus); const v = ctx.createGain(); v.gain.value = 0.5; g.connect(v).connect(verbIn);
      o.start(t); lfo.start(t); o.stop(t + 1.3); lfo.stop(t + 1.3); },
    orb: (t, { n = 0 } = {}) => bell(N(81 + PENTA[Math.min(n, PENTA.length - 1)]), t, { gain: 0.11, dur: 1.4 }),
    moon: t => { bell(N(43), t, { gain: 0.22, dur: 2.6, verb: 0.8 }); bell(N(55), t + 0.03, { gain: 0.08, dur: 2 }); },
    diamond: t => { for (let k = 0; k < 5; k++) bell(2000 + Math.random() * 2500, t + k * 0.045, { gain: 0.04, dur: 0.5 }); },
    gem: t => { noise(t, 0.2, { f: 800, to: 4000, gain: 0.07 }); bell(N(88), t + 0.12, { gain: 0.1, dur: 0.9 }); },
    throw: t => noise(t, 0.35, { f: 400, to: 1800, q: 0.6, gain: 0.12 }),
    impact: t => { osc('sine', 110, t, 0.15, { gain: 0.35, glide: 50 }); noise(t, 0.18, { type: 'lowpass', f: 2500, to: 600, gain: 0.22 }); },
    lock: (t, { n = 0 } = {}) => { osc('sine', 80, t, 0.1, { gain: 0.3, glide: 45 }); bell(N(76 + PENTA[n % PENTA.length]), t, { gain: 0.1, dur: 1 }); },
    plus: t => { bell(N(84), t, { gain: 0.1 }); bell(N(91), t + 0.1, { gain: 0.1 }); bell(N(96), t + 0.2, { gain: 0.12, dur: 1.6 }); },
    coin: t => { if (t - lastCoin < 0.045) return; lastCoin = t; osc('square', 2400 + Math.random() * 900, t, 0.035, { gain: 0.025 }); },
    winSmall: t => [0, 4, 7].forEach((s, i) => bell(N(79 + s), t + i * 0.08, { gain: 0.08, dur: 0.8 })),
    winMed: t => [0, 4, 7, 12, 16].forEach((s, i) => bell(N(76 + s), t + i * 0.09, { gain: 0.09, dur: 1 })),
    winBig: t => { [0, 4, 7, 12].forEach((s, i) => { pad([N(60 + s)], t + i * 0.12, 0.9, { gain: 0.05, dest: sfxBus, cutoff: 2200 });
      bell(N(72 + s), t + i * 0.12, { gain: 0.1 }); }); bell(N(84), t + 0.55, { gain: 0.14, dur: 2.2 }); },
    feature: t => { noise(t, 1.0, { f: 200, to: 5000, q: 0.5, gain: 0.08, verb: 0.4 });
      [0, 3, 7, 10, 12, 15].forEach((s, i) => bell(N(69 + s), t + 0.2 + i * 0.09, { gain: 0.09, dur: 1.2 })); },
    jackpot: (t, { level = 'MINI' } = {}) => { const k = { MINI: 1, MINOR: 2, MAJOR: 3, GRAND: 4 }[level] || 1;
      for (let r = 0; r < k; r++) [0, 4, 7, 12].forEach((s, i) => bell(N(72 + s + r * 5), t + r * 0.45 + i * 0.07, { gain: 0.1, dur: 1.2 }));
      pad([N(48), N(55), N(64)], t, 1.2 + k * 0.4, { gain: 0.05, dest: sfxBus, cutoff: 2500 }); },
    grow: t => { for (let k = 0; k < 10; k++) bell(N(72 + k * 2), t + k * 0.05, { gain: 0.06, dur: 0.7 });
      noise(t, 0.7, { f: 500, to: 6000, gain: 0.06, verb: 0.5 }); },
    full: t => { pad([N(57), N(64), N(69), N(73)], t, 2.2, { gain: 0.07, dest: sfxBus, cutoff: 2600 });
      [0, 4, 7, 12, 16, 19, 24].forEach((s, i) => bell(N(69 + s), t + i * 0.08, { gain: 0.09, dur: 1.4 })); },
    grand: t => { noise(t, 2.4, { type: 'highpass', f: 3000, gain: 0.08, a: 0.01, verb: 0.6 });
      for (let r = 0; r < 4; r++) { pad([N(48 + r * 2), N(55 + r * 2), N(64 + r * 2)], t + r * 0.5, 0.6, { gain: 0.07, dest: sfxBus, cutoff: 3000 });
        [0, 4, 7, 12].forEach((s, i) => bell(N(72 + r * 2 + s), t + r * 0.5 + i * 0.06, { gain: 0.1, dur: 1.4 })); } },
    glide: (t, { n = 0 } = {}) => osc('triangle', 500 + n * 25, t, 0.05, { gain: 0.05 })
  };
  // Recorded effects: some sounds rise in pitch through a sequence (orbs landing, the grid gliding), so the
  // file is sped up by the same musical step the built-in sound used; jackpots have one file per level.
  const STEP = { orb: o => PENTA[Math.min(o.n || 0, 6)], lock: o => PENTA[(o.n || 0) % 7], glide: o => Math.min(o.n || 0, 14) / 2,
                 reelStop: o => -(o.i || 0) * 0.4 };
  function play(name, opt) {
    if (!ready()) return;
    opt = opt || {};
    if (name === 'jackpot' && opt.level && files['jackpot_' + opt.level]) name = 'jackpot_' + opt.level;
    if (files[name]) {
      if (name === 'coin') { const t = ctx.currentTime; if (t - lastCoin < 0.05) return; lastCoin = t; }
      playFile(name, sfxBus, { rate: STEP[name] ? Math.pow(2, STEP[name](opt) / 12) : 1 }); return; }
    const f = FX[name]; if (f) try { f(ctx.currentTime + 0.01, opt || {}); } catch (e) {}
  }

  // ---------- reel spin rattle ----------
  let spinTimer = null, spinRate = 60;
  function spin(on, rateMs = 60) {
    clearInterval(spinTimer); spinTimer = null; spinRate = rateMs;
    if (!on || !ready()) return;
    spinTimer = setInterval(() => { if (!ready()) return; const t = ctx.currentTime;
      noise(t, 0.025, { type: 'bandpass', f: 1600 + Math.random() * 600, q: 3, gain: 0.05 }); }, spinRate);
  }

  // ---------- music: a small step sequencer ----------
  // base: slow, spooky music box. hold: tense ostinato. moon: bright, magical bells.
  const SONGS = {
    base: { bpm: 84, chords: [[57, 60, 64], [53, 57, 60], [48, 52, 55], [52, 56, 59]], step(s, t, ch, dur) {
        const bar = s % 16;
        if (bar === 0) { pad(ch.map(N), t, dur * 16, { gain: 0.03 }); osc('sine', N(ch[0] - 12), t, dur * 7, { gain: 0.12, dest: musicBus }); }
        if (bar === 8) osc('sine', N(ch[0] - 12), t, dur * 7, { gain: 0.1, dest: musicBus });
        if (bar % 2 === 0 && Math.random() < 0.85) { const pool = [...ch.map(n => n + 12), ch[0] + 24, ch[1] + 24];
          bell(N(pool[Math.floor(Math.random() * pool.length)]), t, { gain: 0.035, dur: 1.4, dest: musicBus, verb: 0.7 }); }
      } },
    hold: { bpm: 122, chords: [[62, 65, 69], [58, 62, 65], [55, 58, 62], [57, 61, 64]], step(s, t, ch, dur) {
        const bar = s % 16;
        if (bar % 4 === 0) kick(t, { gain: 0.35 });
        if (bar % 4 === 2) hat(t);
        pluck(N(ch[[0, 1, 2, 1][bar % 4]] + (bar >= 8 ? 12 : 0)), t, { gain: 0.06 });
        if (bar === 0) { pad(ch.map(n => N(n - 12)), t, dur * 16, { gain: 0.025, cutoff: 700 }); osc('triangle', N(ch[0] - 24), t, dur * 14, { gain: 0.12, dest: musicBus }); }
      } },
    moon: { bpm: 108, chords: [[64, 67, 71], [60, 64, 67], [55, 59, 62], [62, 66, 69]], step(s, t, ch, dur) {
        const bar = s % 16;
        if (bar % 2 === 1) hat(t, { gain: 0.035 });
        if (bar % 4 === 0) osc('triangle', N(ch[0] - 24), t, dur * 3, { gain: 0.14, dest: musicBus });
        if (bar % 2 === 0) bell(N(ch[(bar / 2) % 3] + 12 + (bar >= 8 ? 12 : 0)), t, { gain: 0.04, dur: 1, dest: musicBus, verb: 0.6 });
        if (bar === 0) pad(ch.map(N), t, dur * 16, { gain: 0.03, cutoff: 1400 });
      } }
  };
  let mode = null, timer = null, nextT = 0, step = 0, fileSrc = null, fileGain = null;
  function tick() {
    if (!ctx || !mode) return;
    const song = SONGS[mode], dur = 60 / song.bpm / 4;
    while (nextT < ctx.currentTime + 0.15) {
      const ch = song.chords[Math.floor(step / 16) % song.chords.length];
      if (prefs.on && prefs.music > 0) try { song.step(step, nextT, ch, dur); } catch (e) {}
      nextT += dur; step++;
    }
  }
  function music(m) {
    if (m === mode) return;
    mode = m; clearInterval(timer); timer = null;
    if (fileSrc) { try { fileGain.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.12); fileSrc.stop(ctx.currentTime + 0.7); } catch (e) {} fileSrc = null; }
    if (!ctx || !m) return;
    if (files['music_' + m]) {
      // loop exactly the composed length (skipping any MP3 encoder padding) so the seam is seamless
      const buf = files['music_' + m], len = (manifest.loops || {})['music_' + m] || buf.duration;
      const off = Math.max(0, Math.min(buf.duration - len, 1105 / buf.sampleRate));
      const src = ctx.createBufferSource(); src.buffer = buf; src.loop = true;
      src.loopStart = off; src.loopEnd = Math.min(buf.duration, off + len);
      const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, ctx.currentTime); g.gain.exponentialRampToValueAtTime(1, ctx.currentTime + 0.8);
      src.connect(g).connect(musicBus); src.start(ctx.currentTime + 0.02, off); fileSrc = src; fileGain = g; return; }
    step = 0; nextT = ctx.currentTime + 0.1; timer = setInterval(tick, 30);
  }

  // ---------- Frostfang's chatter (made-up monster language) ----------
  const VOWELS = [[700, 1150], [400, 2000], [300, 870], [550, 1700], [650, 1050]];
  async function say(text) {
    if (!ready() || !prefs.voice) return;
    const slug = text.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
    const file = voiceFile(slug);
    if (file) { const buf = await loadVoice(file);
      if (buf) { if (voiceNow) { try { voiceNow.stop(); } catch (e) {} }
        const s = ctx.createBufferSource(); s.buffer = buf; s.connect(voiceBus); s.start(); voiceNow = s; s.onended = () => { if (voiceNow === s) voiceNow = null; }; return; } }
    const excited = (text.match(/!/g) || []).length, syl = Math.max(2, Math.min(12, Math.round(text.replace(/[^a-z]/gi, '').length / 2.6)));
    let t = ctx.currentTime + 0.02; const base = 190 + excited * 25;
    for (let k = 0; k < syl; k++) {
      const d = 0.07 + Math.random() * 0.05, [f1, f2] = VOWELS[Math.floor(Math.random() * VOWELS.length)];
      const o = ctx.createOscillator(), g = ctx.createGain(), b1 = ctx.createBiquadFilter(), b2 = ctx.createBiquadFilter(), mix = ctx.createGain();
      o.type = 'sawtooth'; const p = base * (0.85 + Math.random() * 0.4) * (k === syl - 1 && excited ? 1.25 : 1);
      o.frequency.setValueAtTime(p, t); o.frequency.linearRampToValueAtTime(p * (Math.random() < 0.5 ? 1.12 : 0.9), t + d);
      b1.type = b2.type = 'bandpass'; b1.frequency.value = f1; b2.frequency.value = f2; b1.Q.value = 6; b2.Q.value = 8;
      env(g, t, 0.012, 0.5, d); mix.gain.value = 1;
      o.connect(g); g.connect(b1).connect(mix); g.connect(b2).connect(mix); mix.connect(voiceBus);
      o.start(t); o.stop(t + d + 0.05);
      t += d + 0.025;
    }
  }

  // ---------- public ----------
  return {
    FILES, prefs, init, play, spin, music, say,
    get mode() { return mode; },
    set(k, v) { prefs[k] = v; savePrefs(); if (k === 'on' && v) init(); applyVolumes();
      if (k === 'on' && v && mode) { const m = mode; mode = null; music(m); } },
    debug: () => ({ state: ctx && ctx.state, mode, files: Object.keys(files), voices: Object.keys(voiceCache).filter(k => voiceCache[k]).length, manifest }),
    voiceFor: text => voiceFile(text.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '')),
    selfTest() { init(); const errs = [], t = ctx.currentTime + 0.05;
      for (const k in FX) { try { FX[k](t, { i: 2, n: 3, level: 'MAJOR' }); } catch (e) { errs.push(k + ': ' + e.message); } }
      for (const m in SONGS) { const sg = SONGS[m]; for (let st = 0; st < 32; st++) { try { sg.step(st, t + st * 0.01, sg.chords[Math.floor(st / 16) % 4], 0.1); } catch (e) { errs.push(m + ' step ' + st + ': ' + e.message); break; } } }
      return errs; }
  };
})();
