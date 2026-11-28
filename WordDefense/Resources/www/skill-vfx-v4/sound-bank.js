// Approved custom.js, routed to the native SFX volume bus.
window.WDApprovedSFXFactory=function(oac,destination){
// custom one-shots built from the same primitives the game uses (filtered noise + enveloped oscillators), for cues the game has no sound for yet
const out = oac.createDynamicsCompressor(); out.threshold.value = -14; out.ratio.value = 6; out.connect(destination);
let nb = null; const NB = () => { if (!nb) { nb = oac.createBuffer(1, oac.sampleRate, oac.sampleRate); const d = nb.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; } return nb; };
const env = (g, t, v, a, d) => { g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(v, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + a + d); };
const noise = (t, d, o) => { const s = oac.createBufferSource(), f = oac.createBiquadFilter(), g = oac.createGain(); s.buffer = NB(); f.type = o.type || 'bandpass'; f.frequency.setValueAtTime(o.f, t); if (o.f2) f.frequency.exponentialRampToValueAtTime(o.f2, t + (o.a || 0.005) + d); f.Q.value = o.q || 1; env(g, t, o.v, o.a || 0.005, d); s.connect(f); f.connect(g); g.connect(out); s.start(t, Math.random() * 0.4); s.stop(t + d + 0.1); };
const tone = (t, f, d, o) => { const s = oac.createOscillator(), g = oac.createGain(); s.type = o.type || 'sine'; s.frequency.setValueAtTime(f, t); if (o.to) s.frequency.exponentialRampToValueAtTime(o.to, t + d); env(g, t, o.v, o.a || 0.004, d); s.connect(g); g.connect(out); s.start(t); s.stop(t + d + 0.1); };
const syn = (t, f, d, o) => { const s = oac.createOscillator(), fl = oac.createBiquadFilter(), g = oac.createGain(); s.type = o.type || 'sawtooth'; s.frequency.setValueAtTime(f, t); if (o.to) s.frequency.exponentialRampToValueAtTime(o.to, t + (o.tt || d)); fl.type = o.ft || 'lowpass'; fl.frequency.setValueAtTime(o.lp || 2000, t); if (o.lp2) fl.frequency.exponentialRampToValueAtTime(o.lp2, t + d); fl.Q.value = o.q || 0.8;
  if (o.sw) { g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(o.v, t + d); g.gain.exponentialRampToValueAtTime(0.0001, t + d + (o.rel || 0.03)); } else env(g, t, o.v, o.a || 0.003, d); s.connect(fl); fl.connect(g); g.connect(out); s.start(t); s.stop(t + d + (o.rel || 0.03) + 0.1); };
const swell = (t, d, o) => { const s = oac.createBufferSource(), f = oac.createBiquadFilter(), g = oac.createGain(); s.buffer = NB(); s.loop = true; f.type = o.type || 'bandpass'; f.frequency.setValueAtTime(o.f, t); f.frequency.exponentialRampToValueAtTime(o.f2 || o.f, t + d); f.Q.value = o.q || 1; g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(o.v, t + d); g.gain.exponentialRampToValueAtTime(0.0001, t + d + (o.rel || 0.02)); s.connect(f); f.connect(g); g.connect(out); s.start(t); s.stop(t + d + 0.1); };
const R = (a, b) => a + Math.random() * (b - a);
const X = {
  // 챡: crisp sheath release - metallic click + short bright scrape
  sheath: (t, k) => { noise(t, 0.012, { type: 'highpass', f: 3500, v: 0.22 * k, a: 0.001 }); tone(t, 2650, 0.07, { type: 'triangle', v: 0.05 * k, a: 0.001 }); tone(t, 3980, 0.05, { v: 0.03 * k, a: 0.001 }); noise(t + 0.008, 0.07, { type: 'bandpass', f: 5200, f2: 2600, q: 2.2, v: 0.12 * k, a: 0.003 }); },
  // 샥: sharp blade swoosh
  swoosh: (t, k) => { noise(t, 0.16, { type: 'bandpass', f: 900, f2: 5200, q: 1.6, v: 0.2 * k, a: 0.035 }); noise(t + 0.03, 0.12, { type: 'highpass', f: 3000, v: 0.05 * k, a: 0.02 }); },
  // soft airy wing whoosh (unfold)
  wing: (t, k) => { noise(t, 0.38, { type: 'bandpass', f: 380, f2: 1700, q: 0.9, v: 0.14 * k, a: 0.12 }); noise(t + 0.05, 0.35, { type: 'highpass', f: 2600, v: 0.03 * k, a: 0.15 }); tone(t + 0.12, 1319, 0.5, { v: 0.02 * k, a: 0.08 }); tone(t + 0.16, 1976, 0.45, { v: 0.012 * k, a: 0.08 }); },
  // airy shimmer (wings dissolve)
  shimmer: (t, k) => { for (let i = 0; i < 4; i++) tone(t + i * 0.05, [2093, 2637, 3136, 3520][i], 0.25, { type: 'triangle', v: 0.012 * k, a: 0.01 }); noise(t, 0.35, { type: 'highpass', f: 5000, v: 0.02 * k, a: 0.1 }); },
  // energy gather (charge)
  charge: (t, k, d = 1.0) => { noise(t, d, { type: 'bandpass', f: 300, f2: 2200, q: 1.4, v: 0.06 * k, a: d * 0.8 }); tone(t, 220, d, { to: 660, type: 'sine', v: 0.03 * k, a: d * 0.8 }); },
  // light blade hit
  cut: (t, k) => { noise(t, 0.05, { type: 'bandpass', f: 2600, f2: 1200, q: 1.2, v: 0.12 * k, a: 0.002 }); tone(t, 180, 0.06, { to: 90, v: 0.06 * k, a: 0.003 }); },
  // layered blast: deep sub thump + noisy body + bright crack
  blast: (t, k) => { tone(t, 95, 0.45, { to: 38, type: 'sine', v: 0.3 * k, a: 0.003 }); noise(t, 0.5, { type: 'lowpass', f: 2200, f2: 180, q: 0.7, v: 0.32 * k, a: 0.002 }); noise(t, 0.05, { type: 'highpass', f: 3000, v: 0.18 * k, a: 0.001 }); noise(t + 0.04, 0.6, { type: 'bandpass', f: 500, f2: 160, q: 0.8, v: 0.08 * k, a: 0.05 }); },
  // heavy crunchy ground smash (no tonal chime): sub thud + gritty rock crunch bursts
  crunch: (t, k) => { tone(t, 120, 0.22, { to: 42, type: 'sine', v: 0.32 * k, a: 0.002 }); noise(t, 0.18, { type: 'lowpass', f: 1600, f2: 200, v: 0.3 * k, a: 0.002 }); for (let i = 0; i < 6; i++) noise(t + 0.01 + i * 0.017 + Math.random() * 0.006, 0.02, { type: 'bandpass', f: 900 + Math.random() * 1400, q: 2.2, v: 0.12 * k, a: 0.001 }); },
  // rising charge (pitch + noise swell)
  rise: (t, k, d = 0.55) => { noise(t, d, { type: 'bandpass', f: 250, f2: 2400, q: 1.6, v: 0.12 * k, a: d * 0.9 }); tone(t, 140, d, { to: 560, type: 'triangle', v: 0.06 * k, a: d * 0.9 }); tone(t, 280, d, { to: 1120, type: 'sine', v: 0.03 * k, a: d * 0.9 }); },
  // exact copy of the game's gunR recipe, without the game's voice limiter (so all 5 shots at 0.10s sound)
  gunR: (t, k) => { noise(t, 0.07, { type: 'lowpass', f: 3200, f2: 900, q: 0.7, v: 0.05 * k, a: 0.009 }); noise(t, 0.08, { type: 'lowpass', f: 1100, f2: 300, v: 0.04 * k, a: 0.01 }); tone(t, 190, 0.08, { to: 85, type: 'triangle', v: 0.03 * k, a: 0.008 }); },
  // crisp arrow impact 'tsk/thwip': bright metallic transient, very short
  tsk: (t, k) => { noise(t, 0.022, { type: 'highpass', f: 5200, v: 0.2 * k, a: 0.001 }); noise(t, 0.04, { type: 'bandpass', f: 7000, f2: 3500, q: 1.8, v: 0.1 * k, a: 0.001 }); tone(t, 3400, 0.045, { to: 2700, type: 'sine', v: 0.05 * k, a: 0.001 }); tone(t, 5100, 0.03, { type: 'sine', v: 0.025 * k, a: 0.001 }); },
  // arrow lodge 'thunk'
  thunk: (t, k) => { tone(t, 210, 0.07, { to: 95, v: 0.12 * k, a: 0.002 }); noise(t, 0.04, { type: 'bandpass', f: 1800, f2: 700, q: 1.5, v: 0.12 * k, a: 0.001 }); },
  // energy orb hum
  hum: (t, k, d = 3) => { tone(t, 110, d, { type: 'sine', v: 0.04 * k, a: 0.25 }); tone(t, 165, d, { type: 'triangle', v: 0.012 * k, a: 0.3 }); },
  // meteor falling whistle
  whistle: (t, k, d = 0.5) => { tone(t, 1400, d, { to: 300, type: 'sine', v: 0.03 * k, a: d * 0.7 }); noise(t, d, { type: 'bandpass', f: 600, f2: 1800, q: 1, v: 0.08 * k, a: d * 0.8 }); },

  // ===== v2 modern punchy set (no wood knocks, no tonal chimes) =====
  // bow release: taut string snap (filtered noise + very short low pluck body) + fast air whoosh
  bowRel: (t, k) => { noise(t, 0.018, { type: 'highpass', f: 3000, v: 0.16 * k, a: 0.001 }); syn(t, 150, 0.05, { to: 95, type: 'triangle', lp: 900, v: 0.12 * k }); noise(t + 0.004, 0.09, { type: 'bandpass', f: 1500, f2: 5200, q: 1.4, v: 0.16 * k, a: 0.02 }); },
  // arrow flight whoosh (short)
  zip: (t, k, d = 0.12) => { noise(t, d, { type: 'bandpass', f: 2200, f2: 700, q: 1.8, v: 0.13 * k, a: d * 0.35 }); },
  // arrow impact: crisp snap + meaty punch
  arrowHit: (t, k) => { noise(t, 0.012, { type: 'highpass', f: 4200, v: 0.26 * k, a: 0.0008 }); noise(t, 0.05, { type: 'bandpass', f: 2400, f2: 900, q: 1.3, v: 0.16 * k, a: 0.001 }); syn(t, 170, 0.07, { to: 60, type: 'sine', lp: 600, v: 0.26 * k, a: 0.001 }); },
  // feathered wing burst (airy, no tone)
  wingV2: (t, k) => { noise(t, 0.3, { type: 'bandpass', f: 500, f2: 2600, q: 0.9, v: 0.16 * k, a: 0.08 }); noise(t + 0.06, 0.24, { type: 'highpass', f: 3500, v: 0.05 * k, a: 0.08 }); },
  // sniper: punchy rifle crack + sub kick + short tail
  rifle: (t, k) => { noise(t, 0.01, { type: 'highpass', f: 2500, v: 0.4 * k, a: 0.0006 }); syn(t, 120, 0.16, { to: 38, type: 'sine', lp: 400, v: 0.42 * k, a: 0.001 }); noise(t, 0.16, { type: 'lowpass', f: 3000, f2: 300, v: 0.3 * k, a: 0.001 }); noise(t + 0.03, 0.35, { type: 'bandpass', f: 900, f2: 250, q: 0.7, v: 0.05 * k, a: 0.04 }); },
  // sniper heavy/charged 4th shot: darker, heavier, with a sizzling tail
  rifleHeavy: (t, k) => { X.rifle(t, k * 1.1); syn(t, 70, 0.3, { to: 30, type: 'sine', lp: 260, v: 0.4 * k, a: 0.002 }); noise(t + 0.02, 0.25, { type: 'bandpass', f: 4500, f2: 1500, q: 2, v: 0.06 * k, a: 0.01 }); },
  // short dark pulse when the crimson charge aura appears
  darkPulse: (t, k, d = 0.45) => { swell(t, d, { type: 'bandpass', f: 180, f2: 700, q: 2, v: 0.12 * k }); syn(t, 55, d, { to: 90, type: 'sawtooth', lp: 220, v: 0.05 * k, sw: 1 }); },
  // energy charge: rising filtered saw + noise riser, ends with a tight 'snap'
  charge2: (t, k, d = 1.0) => { syn(t, 70, d, { to: 280, type: 'sawtooth', lp: 300, lp2: 3200, v: 0.07 * k, sw: 1 }); syn(t, 140.5, d, { to: 561, type: 'sawtooth', lp: 400, lp2: 4000, v: 0.035 * k, sw: 1 }); swell(t, d, { type: 'bandpass', f: 400, f2: 5000, q: 1.2, v: 0.08 * k }); },
  // fast charge whoosh (reverse-swell suck-in, ~0.25s)
  suck: (t, k, d = 0.25) => { swell(t, d, { type: 'bandpass', f: 600, f2: 4200, q: 1.1, v: 0.16 * k }); syn(t, 180, d, { to: 900, type: 'sawtooth', lp: 500, lp2: 3000, v: 0.04 * k, sw: 1 }); },
  // big beam release (element tint via k2: 0 phys,1 fire,2 water,3 ice,4 lightning)
  beam: (t, k, el = 0) => { syn(t, 90, 0.5, { to: 32, type: 'sine', lp: 300, v: 0.45 * k, a: 0.002 }); noise(t, 0.012, { type: 'highpass', f: 2500, v: 0.4 * k, a: 0.0006 }); noise(t, 0.6, { type: 'lowpass', f: 3500, f2: 300, v: 0.32 * k, a: 0.003 });
    if (el === 1) noise(t + 0.02, 0.7, { type: 'bandpass', f: 1200, f2: 400, q: 0.7, v: 0.18 * k, a: 0.02 });
    if (el === 2) noise(t + 0.02, 0.6, { type: 'bandpass', f: 700, f2: 2400, q: 1.6, v: 0.16 * k, a: 0.05 });
    if (el === 3) { noise(t + 0.02, 0.5, { type: 'highpass', f: 5000, v: 0.12 * k, a: 0.01 }); for (let i = 0; i < 6; i++) noise(t + 0.05 + i * 0.035, 0.02, { type: 'bandpass', f: R(3500, 7000), q: 4, v: 0.1 * k, a: 0.001 }); }
    if (el === 4) { for (let i = 0; i < 9; i++) noise(t + i * 0.03 + R(0, 0.01), 0.015, { type: 'highpass', f: R(2000, 5000), v: 0.2 * k, a: 0.0005 }); syn(t, 1800, 0.25, { to: 200, type: 'sawtooth', lp: 4000, lp2: 800, v: 0.05 * k }); }
    if (el === 0) noise(t + 0.02, 0.4, { type: 'bandpass', f: 2000, f2: 600, q: 1, v: 0.1 * k, a: 0.01 }); },
  // blade: sharp swish
  swish: (t, k) => { noise(t, 0.13, { type: 'bandpass', f: 700, f2: 6500, q: 2.2, v: 0.24 * k, a: 0.06 }); noise(t + 0.05, 0.08, { type: 'highpass', f: 5000, v: 0.08 * k, a: 0.01 }); },
  // blade draw: metallic noise scrape (resonant noise, not a pitched ding)
  draw: (t, k) => { noise(t, 0.012, { type: 'highpass', f: 3800, v: 0.2 * k, a: 0.0006 }); noise(t + 0.004, 0.12, { type: 'bandpass', f: 6000, f2: 3200, q: 5, v: 0.08 * k, a: 0.004 }); },
  // meaty hit
  meat: (t, k) => { syn(t, 150, 0.12, { to: 50, type: 'sine', lp: 500, v: 0.4 * k, a: 0.001 }); noise(t, 0.07, { type: 'lowpass', f: 2400, f2: 400, v: 0.3 * k, a: 0.001 }); noise(t, 0.008, { type: 'highpass', f: 3000, v: 0.18 * k, a: 0.0005 }); },
  // heavy ground smash (miner passive): sub hit + rock crunch grit + low rumble tail
  smash: (t, k) => { syn(t, 110, 0.3, { to: 34, type: 'sine', lp: 380, v: 0.5 * k, a: 0.001 }); noise(t, 0.012, { type: 'highpass', f: 2500, v: 0.25 * k, a: 0.0006 }); noise(t, 0.22, { type: 'lowpass', f: 1800, f2: 160, v: 0.4 * k, a: 0.001 });
    for (let i = 0; i < 8; i++) noise(t + 0.01 + i * 0.016 + R(0, 0.008), 0.018, { type: 'bandpass', f: R(700, 2200), q: 2.5, v: 0.13 * k, a: 0.001 }); noise(t + 0.05, 0.5, { type: 'lowpass', f: 300, f2: 90, v: 0.12 * k, a: 0.03 }); },
  // heavy energy boom (miner skill / artillery skill)
  eboom: (t, k) => { syn(t, 85, 0.8, { to: 28, type: 'sine', lp: 260, v: 0.55 * k, a: 0.002 }); noise(t, 0.015, { type: 'highpass', f: 2000, v: 0.45 * k, a: 0.0006 }); noise(t, 0.7, { type: 'lowpass', f: 4000, f2: 200, v: 0.42 * k, a: 0.003 });
    syn(t, 1600, 0.3, { to: 120, type: 'sawtooth', lp: 5000, lp2: 600, v: 0.08 * k }); for (let i = 0; i < 10; i++) noise(t + 0.02 + i * 0.035 + R(0, 0.015), 0.014, { type: 'highpass', f: R(2500, 6000), v: 0.12 * k * (1 - i / 11), a: 0.0005 }); },
  // implosion suck right before a burst
  implode: (t, k, d = 0.08) => { swell(t, d, { type: 'bandpass', f: 800, f2: 6000, q: 1.3, v: 0.22 * k }); syn(t, 300, d, { to: 2400, type: 'sawtooth', lp: 1500, lp2: 6000, v: 0.05 * k, sw: 1 }); },
  // missile: incoming whistle-scream (rising noise + falling sine)
  incoming: (t, k, d = 0.6) => { syn(t, 2300, d, { to: 900, type: 'sine', lp: 6000, v: 0.08 * k, sw: 1 }); swell(t, d, { type: 'bandpass', f: 1200, f2: 3200, q: 1.5, v: 0.14 * k }); swell(t, d, { type: 'lowpass', f: 300, f2: 900, v: 0.12 * k }); },
  // missile embed: heavy thud + dirt spray crunch
  embed: (t, k) => { syn(t, 120, 0.2, { to: 40, type: 'sine', lp: 350, v: 0.45 * k, a: 0.001 }); noise(t, 0.012, { type: 'highpass', f: 2500, v: 0.2 * k, a: 0.0006 }); noise(t, 0.25, { type: 'lowpass', f: 1500, f2: 200, v: 0.3 * k, a: 0.001 }); for (let i = 0; i < 6; i++) noise(t + 0.02 + i * 0.02, 0.02, { type: 'bandpass', f: R(800, 2000), q: 2, v: 0.08 * k, a: 0.001 }); },
  // armed-tension rumble (pulsing, rising) during the 1s stun before the blast
  tension: (t, k, d = 1.0) => { syn(t, 45, d, { to: 70, type: 'sawtooth', lp: 160, lp2: 400, v: 0.08 * k, sw: 1 }); for (let i = 0; i < 9; i++) { const u = i / 9, tt = t + d * (1 - Math.pow(1 - u, 1.6)); noise(tt, 0.03, { type: 'bandpass', f: 900 + 900 * u, q: 3, v: (0.04 + 0.06 * u) * k, a: 0.002 }); } },
  // cannon launch (artillery passive)
  launch: (t, k) => { syn(t, 100, 0.25, { to: 40, type: 'sine', lp: 400, v: 0.45 * k, a: 0.001 }); noise(t, 0.01, { type: 'highpass', f: 2200, v: 0.3 * k, a: 0.0006 }); noise(t, 0.3, { type: 'lowpass', f: 2500, f2: 250, v: 0.3 * k, a: 0.001 }); },
  // shell arc whistle (short)
  arc: (t, k, d = 0.5) => { syn(t, 1400, d, { to: 600, type: 'sine', lp: 5000, v: 0.05 * k, sw: 0, a: d * 0.5 }); noise(t, d, { type: 'bandpass', f: 1800, f2: 900, q: 2, v: 0.08 * k, a: d * 0.6 }); },
  // fire explosion (artillery passive / meteor)
  fireboom: (t, k) => { syn(t, 80, 0.7, { to: 30, type: 'sine', lp: 260, v: 0.55 * k, a: 0.002 }); noise(t, 0.015, { type: 'highpass', f: 2000, v: 0.4 * k, a: 0.0006 }); noise(t, 0.8, { type: 'lowpass', f: 2600, f2: 180, v: 0.45 * k, a: 0.003 }); noise(t + 0.05, 0.9, { type: 'bandpass', f: 600, f2: 200, q: 0.7, v: 0.14 * k, a: 0.06 }); },
  // meteor incoming roar
  roar: (t, k, d = 0.5) => { swell(t, d, { type: 'lowpass', f: 200, f2: 1800, v: 0.22 * k }); swell(t, d, { type: 'bandpass', f: 900, f2: 3000, q: 1.2, v: 0.1 * k }); },
  // arcane orb: cast whoosh + zap blast
  cast: (t, k) => { noise(t, 0.2, { type: 'bandpass', f: 500, f2: 3000, q: 1.4, v: 0.16 * k, a: 0.06 }); syn(t, 200, 0.2, { to: 600, type: 'sawtooth', lp: 900, lp2: 3000, v: 0.04 * k, sw: 1 }); },
  arcane: (t, k) => { syn(t, 110, 0.4, { to: 40, type: 'sine', lp: 300, v: 0.42 * k, a: 0.001 }); noise(t, 0.012, { type: 'highpass', f: 3000, v: 0.3 * k, a: 0.0006 }); noise(t, 0.35, { type: 'bandpass', f: 2600, f2: 500, q: 1, v: 0.22 * k, a: 0.002 }); syn(t, 900, 0.25, { to: 140, type: 'square', lp: 3000, lp2: 500, v: 0.05 * k }); },
  zap: (t, k) => { for (let i = 0; i < 4; i++) noise(t + i * 0.018 + R(0, 0.006), 0.012, { type: 'highpass', f: R(2500, 6000), v: 0.2 * k, a: 0.0005 }); syn(t, 2400, 0.08, { to: 400, type: 'sawtooth', lp: 6000, lp2: 1000, v: 0.06 * k }); },
  // energy orb: low pulsing hum bed + per-tick electric tick
  orbHum: (t, k, d = 3) => { syn(t, 82, d, { type: 'sawtooth', lp: 260, v: 0.06 * k, a: 0.12 }); syn(t, 123.3, d, { type: 'sawtooth', lp: 380, v: 0.025 * k, a: 0.15 }); },
  orbTick: (t, k) => { noise(t, 0.01, { type: 'highpass', f: 3500, v: 0.14 * k, a: 0.0005 }); syn(t, 1600, 0.05, { to: 500, type: 'sawtooth', lp: 4500, lp2: 900, v: 0.05 * k }); syn(t, 140, 0.06, { to: 70, type: 'sine', lp: 400, v: 0.12 * k }); },
  orbOpen: (t, k) => { syn(t, 100, 0.25, { to: 50, type: 'sine', lp: 300, v: 0.35 * k }); noise(t, 0.2, { type: 'bandpass', f: 3000, f2: 800, q: 1, v: 0.14 * k, a: 0.002 }); },
  // coins: metallic noise shimmer burst (no pitched chime) + soft thump
  coins: (t, k, n = 4) => { syn(t, 130, 0.07, { to: 70, type: 'sine', lp: 400, v: 0.18 * k }); for (let i = 0; i < n; i++) { const tt = t + i * 0.035 + R(0, 0.012); noise(tt, 0.012, { type: 'highpass', f: 6000, v: 0.12 * k, a: 0.0005 }); noise(tt, 0.06, { type: 'bandpass', f: R(4200, 7500), q: 6, v: 0.07 * k, a: 0.001 }); } },
  pouch: (t, k) => { noise(t, 0.12, { type: 'bandpass', f: 900, f2: 300, q: 1, v: 0.14 * k, a: 0.004 }); syn(t, 160, 0.09, { to: 70, type: 'sine', lp: 400, v: 0.25 * k }); },
  // swamp: thick spreading squelch + low bubbling
  swamp: (t, k, d = 2.4) => { noise(t, 0.35, { type: 'lowpass', f: 700, f2: 180, v: 0.3 * k, a: 0.03 }); syn(t, 90, 0.3, { to: 45, type: 'sine', lp: 300, v: 0.3 * k }); for (let i = 0; i < 14; i++) { const tt = t + 0.25 + R(0, d - 0.3); syn(tt, R(120, 220), 0.06, { to: R(260, 420), type: 'sine', lp: 600, v: 0.06 * k, a: 0.004 }); noise(tt, 0.05, { type: 'lowpass', f: 500, v: 0.05 * k, a: 0.003 }); } },
  // holy arrow hit: crisp punch + short airy choir-like shimmer (formant-filtered noise + soft detuned overtones, no jingle)
  holyHit: (t, k) => { X.arrowHit(t, k); const d = 0.32;
    for (const [f, q, v] of [[800, 9, 0.05], [1150, 10, 0.04], [2600, 12, 0.03], [5200, 6, 0.03]]) noise(t + 0.008, d, { type: 'bandpass', f, q, v: v * k, a: 0.02 });
    for (const [f, v] of [[1318.5, 0.012], [1322, 0.012], [1975.5, 0.008], [2637, 0.005]]) tone(t + 0.01, f, d, { type: 'sine', v: v * k, a: 0.025 }); },
  launch2: (t, k) => { syn(t, 78, 0.38, { to: 32, type: 'sine', lp: 300, v: 0.6 * k, a: 0.001 }); noise(t, 0.01, { type: 'highpass', f: 2200, v: 0.35 * k, a: 0.0005 }); noise(t, 0.3, { type: 'lowpass', f: 1400, f2: 160, v: 0.45 * k, a: 0.001 }); noise(t + 0.005, 0.18, { type: 'bandpass', f: 380, f2: 160, q: 1.2, v: 0.25 * k, a: 0.004 }); },
  whistle2: (t, k, d = 0.6) => { syn(t, 3400, d, { to: 1050, type: 'sine', lp: 8000, v: 0.16 * k, sw: 1 }); syn(t, 3420, d, { to: 1062, type: 'sine', lp: 8000, v: 0.08 * k, sw: 1 }); swell(t, d, { type: 'bandpass', f: 4200, f2: 1500, q: 5, v: 0.12 * k }); swell(t, d, { type: 'lowpass', f: 400, f2: 1600, v: 0.12 * k }); },
  embed2: (t, k) => { syn(t, 95, 0.42, { to: 27, type: 'sine', lp: 260, v: 0.65 * k, a: 0.001 }); noise(t, 0.012, { type: 'highpass', f: 2500, v: 0.32 * k, a: 0.0005 }); noise(t, 0.35, { type: 'lowpass', f: 1000, f2: 120, v: 0.5 * k, a: 0.001 });
    for (let i = 0; i < 10; i++) noise(t + 0.012 + i * 0.015 + R(0, 0.006), 0.02, { type: 'bandpass', f: R(600, 1800), q: 2.2, v: 0.12 * k, a: 0.001 }); },
  burst2: (t, k) => { syn(t, 62, 1.1, { to: 22, type: 'sine', lp: 220, v: 0.7 * k, a: 0.002 }); syn(t, 124, 0.5, { to: 40, type: 'triangle', lp: 400, v: 0.25 * k, a: 0.002 }); noise(t, 0.015, { type: 'highpass', f: 2200, v: 0.5 * k, a: 0.0005 }); noise(t, 0.9, { type: 'lowpass', f: 3200, f2: 140, v: 0.55 * k, a: 0.003 });
    syn(t, 2200, 0.45, { to: 80, type: 'sawtooth', lp: 6000, lp2: 500, v: 0.1 * k }); noise(t + 0.02, 0.7, { type: 'bandpass', f: 6500, f2: 3000, q: 1.5, v: 0.08 * k, a: 0.02 });
    for (let i = 0; i < 26; i++) { const u = Math.pow(i / 26, 1.5), tt = t + 0.03 + u * 1.0 + R(0, 0.02); noise(tt, 0.012, { type: 'highpass', f: R(2500, 7000), v: 0.16 * k * (1 - 0.8 * u), a: 0.0004 }); } },

  // ===== warrior iai v2 (redesign): tension pulses, koiguchi click, metallic shing, crisp cut, split =====
  iaiTense: (t, k, d = 0.95) => { swell(t, d, { type: 'bandpass', f: 260, f2: 1500, q: 2.2, v: 0.05 * k }); [0.46, 0.72, 0.92].forEach((b, i) => { if (b < d) { syn(t + b, 92, 0.09, { to: 58, type: 'sine', lp: 400, v: (0.14 + 0.06 * i) * k, a: 0.004 }); noise(t + b, 0.03, { type: 'bandpass', f: 1200, q: 2, v: 0.03 * k, a: 0.003 }); } }); },
  koiguchi: (t, k) => { noise(t, 0.004, { type: 'highpass', f: 4500, v: 0.3 * k, a: 0.0004 }); noise(t, 0.022, { type: 'bandpass', f: 3100, q: 9, v: 0.22 * k, a: 0.0006 }); tone(t, 2380, 0.035, { type: 'triangle', v: 0.035 * k, a: 0.001 }); noise(t + 0.012, 0.05, { type: 'bandpass', f: 7200, f2: 4800, q: 3, v: 0.07 * k, a: 0.004 }); },
  shing: (t, k) => { if (!X.__rv) { const L = Math.floor(oac.sampleRate * 0.55), ir = oac.createBuffer(2, L, oac.sampleRate); for (let c = 0; c < 2; c++) { const d = ir.getChannelData(c); for (let i = 0; i < L; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / L, 3.2); let e = 0; for (let i = 0; i < L; i++) e += d[i] * d[i]; e = Math.sqrt(e); for (let i = 0; i < L; i++) d[i] /= e; } const cv = oac.createConvolver(); cv.buffer = ir; const g = oac.createGain(); g.gain.value = 0.35; cv.connect(g); g.connect(out); X.__rv = cv; }
    noise(t, 0.1, { type: 'bandpass', f: 2600, f2: 9500, q: 5, v: 0.24 * k, a: 0.012 }); noise(t, 0.13, { type: 'bandpass', f: 700, f2: 4200, q: 1.3, v: 0.16 * k, a: 0.03 }); noise(t + 0.02, 0.16, { type: 'highpass', f: 8000, v: 0.05 * k, a: 0.01 });
    [[1873, 0.042], [2987, 0.034], [4412, 0.026], [6231, 0.018], [8107, 0.01]].forEach(([f, v], i) => { const s = oac.createOscillator(), g = oac.createGain(); s.type = 'sine'; s.frequency.setValueAtTime(f * 1.012, t + 0.01); s.frequency.exponentialRampToValueAtTime(f, t + 0.12); g.gain.setValueAtTime(0.0001, t); g.gain.setValueAtTime(0.0001, t + 0.01); g.gain.linearRampToValueAtTime(v * k, t + 0.018); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.018 + 0.3 - i * 0.04); s.connect(g); g.connect(out); g.connect(X.__rv); s.start(t); s.stop(t + 0.45); }); },
  slice: (t, k) => { noise(t, 0.006, { type: 'highpass', f: 3500, v: 0.34 * k, a: 0.0004 }); noise(t, 0.055, { type: 'bandpass', f: 3000, f2: 900, q: 1.6, v: 0.22 * k, a: 0.001 }); syn(t, 180, 0.1, { to: 62, type: 'sine', lp: 600, v: 0.36 * k, a: 0.001 }); },
  hitStop: (t, k) => { syn(t, 64, 0.2, { to: 38, type: 'sine', lp: 200, v: 0.42 * k, a: 0.002 }); },
  split: (t, k) => { noise(t, 0.09, { type: 'bandpass', f: 6500, f2: 1800, q: 2.2, v: 0.2 * k, a: 0.002 }); noise(t, 0.05, { type: 'lowpass', f: 1800, f2: 400, v: 0.16 * k, a: 0.001 }); for (let i = 0; i < 4; i++) noise(t + 0.02 + i * 0.022 + R(0, 0.008), 0.012, { type: 'bandpass', f: R(5000, 8500), q: 4, v: 0.07 * k, a: 0.0005 }); },

  // ===== warrior iai v3: clean sword cuts only (no glassy partials, no debris clicks) =====
  iaiTense2: (t, k) => { noise(t, 0.95, { type: 'bandpass', f: 1400, f2: 300, q: 2.2, v: 0.05 * k, a: 0.08 }); [0.05, 0.37, 0.69].forEach((b, i) => { syn(t + b, 96, 0.1, { to: 56, type: 'sine', lp: 400, v: (0.15 + 0.05 * i) * k, a: 0.003 }); noise(t + b, 0.06, { type: 'bandpass', f: 900, f2: 300, q: 1.5, v: 0.05 * k, a: 0.003 }); }); },
  shing2: (t, k) => { noise(t, 0.2, { type: 'bandpass', f: 3200, f2: 7600, q: 7, v: 0.3 * k, a: 0.01 }); noise(t, 0.16, { type: 'bandpass', f: 4800, f2: 9800, q: 10, v: 0.14 * k, a: 0.015 }); noise(t, 0.05, { type: 'highpass', f: 6000, v: 0.08 * k, a: 0.004 }); },
  sliceWhoosh: (t, k) => { noise(t, 0.16, { type: 'bandpass', f: 500, f2: 3600, q: 1.2, v: 0.28 * k, a: 0.035 }); noise(t + 0.03, 0.1, { type: 'bandpass', f: 2500, f2: 5000, q: 1.5, v: 0.08 * k, a: 0.02 }); },
  cutHit: (t, k) => { noise(t, 0.004, { type: 'highpass', f: 2500, v: 0.18 * k, a: 0.0005 }); noise(t, 0.07, { type: 'lowpass', f: 2000, f2: 300, v: 0.3 * k, a: 0.001 }); syn(t, 140, 0.13, { to: 52, type: 'sine', lp: 400, v: 0.45 * k, a: 0.002 }); },

  // ===== ranger passive '탕': solid pistol bang (sharp crack + low thump, short tail) =====
  bang: (t, k) => { noise(t, 0.006, { type: 'highpass', f: 3000, v: 0.45 * k, a: 0.0003 }); noise(t, 0.03, { type: 'bandpass', f: 2600, f2: 1200, q: 1.1, v: 0.35 * k, a: 0.0005 }); syn(t, 160, 0.13, { to: 44, type: 'sine', lp: 500, v: 0.6 * k, a: 0.001 }); noise(t, 0.09, { type: 'lowpass', f: 1800, f2: 220, v: 0.42 * k, a: 0.001 }); noise(t + 0.03, 0.16, { type: 'lowpass', f: 900, f2: 150, v: 0.08 * k, a: 0.01 }); },
  // ===== merchant '띠로링': bright ascending coin pickup jingle =====
  coinChime: (t, k) => { [[1319, 0], [1661, 0.055], [1976, 0.11], [2637, 0.165]].forEach(([f, d], i) => { const L = i === 3 ? 0.45 : 0.2; tone(t + d, f, L, { type: 'triangle', v: 0.16 * k, a: 0.002 }); tone(t + d, f * 2, L * 0.6, { type: 'sine', v: 0.05 * k, a: 0.002 }); tone(t + d, f * 3.01, L * 0.35, { type: 'sine', v: 0.02 * k, a: 0.002 }); });
    noise(t + 0.165, 0.3, { type: 'highpass', f: 7000, v: 0.03 * k, a: 0.01 }); },

  // ===== warrior v4: only 찰칵 (light guard click at charge start) + 샤앙 (clean sword swing) =====
  guardClick: (t, k) => { noise(t, 0.003, { type: 'highpass', f: 4000, v: 0.4 * k, a: 0.0008 }); noise(t, 0.018, { type: 'bandpass', f: 2600, q: 3.5, v: 0.22 * k, a: 0.0008 }); syn(t, 420, 0.025, { to: 260, type: 'triangle', lp: 1800, v: 0.12 * k, a: 0.001 });
    noise(t + 0.045, 0.003, { type: 'highpass', f: 4500, v: 0.22 * k, a: 0.0008 }); noise(t + 0.045, 0.014, { type: 'bandpass', f: 3200, q: 3.5, v: 0.12 * k, a: 0.0008 }); },
  shaang: (t, k) => { noise(t, 0.24, { type: 'bandpass', f: 700, f2: 5200, q: 2.2, v: 0.32 * k, a: 0.05 }); noise(t + 0.02, 0.22, { type: 'bandpass', f: 3000, f2: 8500, q: 4, v: 0.12 * k, a: 0.05 }); noise(t + 0.05, 0.2, { type: 'highpass', f: 6500, v: 0.04 * k, a: 0.06 }); },

  // ===== ranger skill: one crisp light reload rack 'chk-chak' =====
  rackClick: (t, k, f = 2200) => { noise(t, 0.003, { type: 'highpass', f: 3500, v: 0.38 * k, a: 0.0008 }); noise(t, 0.02, { type: 'bandpass', f, q: 3, v: 0.22 * k, a: 0.0008 }); syn(t, 300, 0.03, { to: 180, type: 'triangle', lp: 1500, v: 0.12 * k, a: 0.001 }); noise(t + 0.005, 0.05, { type: 'bandpass', f: 4200, f2: 2600, q: 2, v: 0.04 * k, a: 0.008 }); },

  // ===== warrior: koiguchi-kiri 'tink' (thumb pushes the tsuba out of the scabbard): one short bright metallic click, slight shimmer, no low end =====
  tsuba: (t, k) => { noise(t, 0.003, { type: 'highpass', f: 5000, v: 0.07 * k, a: 0.0008 }); [[3870, 0.12, 0.12], [5630, 0.07, 0.1], [7940, 0.035, 0.08]].forEach(([f, v, d]) => tone(t, f, d, { type: 'sine', v: v * k, a: 0.0008 })); noise(t + 0.004, 0.11, { type: 'bandpass', f: 8500, q: 4, v: 0.02 * k, a: 0.006 }); },

  // ===== sniper ult v2 hit: sharp crisp beam-pierce (no low thud/boom): bright crack + hot sizzle + crackle, element flavour kept bright =====
  beam2: (t, k, el = 0) => { noise(t, 0.004, { type: 'highpass', f: 3500, v: 0.4 * k, a: 0.0008 }); noise(t, 0.05, { type: 'bandpass', f: 4200, f2: 2200, q: 1.4, v: 0.3 * k, a: 0.001 }); noise(t + 0.006, 0.3, { type: 'bandpass', f: 7000, f2: 3600, q: 2.2, v: 0.14 * k, a: 0.01 });
    for (let i = 0; i < 6; i++) noise(t + 0.02 + i * 0.03 + R(0, 0.008), 0.01, { type: 'highpass', f: R(4000, 8000), v: 0.12 * k * (1 - i / 7), a: 0.0008 });
    if (el === 0) noise(t + 0.01, 0.18, { type: 'bandpass', f: 3000, f2: 1400, q: 1.2, v: 0.09 * k, a: 0.004 });
    if (el === 1) noise(t + 0.01, 0.3, { type: 'bandpass', f: 2600, f2: 1300, q: 1.0, v: 0.1 * k, a: 0.01 });
    if (el === 2) noise(t + 0.01, 0.3, { type: 'bandpass', f: 1500, f2: 3600, q: 1.8, v: 0.1 * k, a: 0.02 });
    if (el === 3) { noise(t + 0.01, 0.3, { type: 'highpass', f: 6000, v: 0.08 * k, a: 0.008 }); for (let i = 0; i < 5; i++) noise(t + 0.04 + i * 0.035, 0.015, { type: 'bandpass', f: R(4500, 8000), q: 5, v: 0.07 * k, a: 0.0008 }); }
    if (el === 4) { for (let i = 0; i < 8; i++) noise(t + i * 0.028 + R(0, 0.008), 0.012, { type: 'highpass', f: R(3000, 6500), v: 0.16 * k, a: 0.0008 }); } },

  // ===== warrior per-mob cut hit: crisp, mid-body (1-4k), short, no low thud, no glassy partials =====
  cutHit2: (t, k) => { noise(t, 0.003, { type: 'highpass', f: 3000, v: 0.12 * k, a: 0.0008 }); noise(t, 0.06, { type: 'bandpass', f: 3600, f2: 1500, q: 1.3, v: 0.3 * k, a: 0.001 }); noise(t, 0.045, { type: 'bandpass', f: 1300, f2: 900, q: 1.6, v: 0.22 * k, a: 0.001 }); noise(t + 0.008, 0.05, { type: 'highpass', f: 1000, v: 0.05 * k, a: 0.004 }); },
  // ===== sniper ult v3 hit: beam2 + mid-band body (800-4k punch/crack), still nothing below ~200Hz =====
  beam3: (t, k, el = 0) => { X.beam2(t, k * 0.6, el); noise(t, 0.08, { type: 'bandpass', f: 2200, f2: 1100, q: 1.0, v: 0.6 * k, a: 0.001 }); noise(t, 0.06, { type: 'bandpass', f: 1000, f2: 800, q: 1.4, v: 0.45 * k, a: 0.001 }); noise(t + 0.004, 0.14, { type: 'bandpass', f: 3500, f2: 2200, q: 1.5, v: 0.26 * k, a: 0.003 }); },

  // ===== sniper ult v4 hit: railgun pierce = energy crack + meaty 200-800Hz crunch body + sizzling burn tail (~0.35s); no pitched sub sweep =====
  rail: (t, k, el = 0) => {
    noise(t, 0.004, { type: 'highpass', f: 3000, v: 0.3 * k, a: 0.0008 }); noise(t, 0.025, { type: 'bandpass', f: 3200, f2: 1800, q: 1.2, v: 0.32 * k, a: 0.0008 });       // sharp energy crack
    syn(t, 2600, 0.07, { to: 700, type: 'sawtooth', lp: 5000, lp2: 1500, v: 0.07 * k, a: 0.001 });                                                                       // short zap edge
    noise(t, 0.16, { type: 'bandpass', f: 520, f2: 300, q: 0.9, v: 1.5 * k, a: 0.002 }); noise(t, 0.1, { type: 'bandpass', f: 800, f2: 450, q: 1.0, v: 0.8 * k, a: 0.002 }); // meaty body / punch (unpitched)
    for (let i = 0; i < 7; i++) noise(t + 0.004 + i * 0.012 + R(0, 0.004), 0.018, { type: 'bandpass', f: R(300, 900), q: 1.6, v: 0.5 * k * (1 - i / 9), a: 0.0008 });   // crunch grains
    noise(t + 0.02, 0.34, { type: 'lowpass', f: 1100, f2: 300, q: 0.7, v: 0.3 * k, a: 0.01 });                                                                          // weighty tail
    noise(t + 0.01, 0.36, { type: 'bandpass', f: 5200, f2: 2800, q: 1.8, v: 0.1 * k, a: 0.02 }); for (let i = 0; i < 6; i++) noise(t + 0.06 + i * 0.045 + R(0, 0.012), 0.012, { type: 'highpass', f: R(3000, 6000), v: 0.06 * k, a: 0.0008 }); // sizzling burn
    X.beam2(t + 0.005, k * 0.22, el); },                                                                                                                                   // light element flavour
};

X.splash=(t,k)=>{noise(t,.11,{type:'lowpass',f:2100,f2:650,v:.52*k,a:.001});noise(t+.018,.23,{type:'bandpass',f:1250,f2:450,q:.65,v:.34*k,a:.009});for(let i=0;i<5;i++)noise(t+.04+i*.026,.022,{type:'bandpass',f:1800+i*290,q:1.8,v:(.14-i*.018)*k,a:.001});};
X.ghostWave=(t,k)=>{noise(t,.19,{type:'bandpass',f:340,f2:1200,q:.65,v:.48*k,a:.025});noise(t+.025,.24,{type:'highpass',f:1500,f2:800,q:.7,v:.14*k,a:.02});};
X.iceCrack=(t,k)=>{for(let i=0;i<4;i++)noise(t+i*.031,.035,{type:'bandpass',f:2300+i*690,f2:1100,q:2,v:(.28-i*.04)*k,a:.0008});noise(t+.018,.16,{type:'highpass',f:4100,v:.12*k,a:.002});};
X.iceShatter=(t,k)=>{noise(t,.018,{type:'highpass',f:5200,v:.34*k,a:.0008});noise(t+.008,.19,{type:'bandpass',f:3700,f2:1900,q:1.4,v:.29*k,a:.001});tone(t,2750,.14,{type:'triangle',v:.035*k,a:.001});for(let i=0;i<7;i++)noise(t+.018+i*.018,.015,{type:'highpass',f:4600+i*260,v:(.14-i*.013)*k,a:.0008});};
X.mageCrack=(t,k)=>{for(let i=0;i<4;i++)noise(t+i*.019,.021,{type:'bandpass',f:2100-i*220,f2:900,q:1.2,v:(.30-i*.045)*k,a:.0015});noise(t+.018,.085,{type:'bandpass',f:1400,f2:650,q:.7,v:.15*k,a:.004});};
return X;

};
