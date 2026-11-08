/* =====================================================================
   MAM Weihnachts-Rallye – Pseudo-3D-Rennspiel (Follow-me-Ansicht)
   Modi: Rennen, DTM, Rallye, Drag Race · Wischsteuerung
   3D-Auto: Drift in steilen Kurven, Schleudern neben der Straße, Überschlag wenn man driftend abkommt
   Live-Duell über einen MQTT-Vermittler (funktioniert auch im Mobilfunk) + Geisterauto · Ergebnisliste · Pokal
   ===================================================================== */
import { tx, LANG } from './text.js?v=3';

const Q = new URLSearchParams(location.search);
const FIRMA = (Q.get('firma') || '').trim();
const $ = id => document.getElementById(id);
const cv = $('game'), g = cv.getContext('2d');
let W = 0, H = 0, DPR = 1;
function resize(){ DPR = Math.min(2, window.devicePixelRatio || 1); W = cv.width = Math.round(innerWidth*DPR); H = cv.height = Math.round(innerHeight*DPR); }
addEventListener('resize', resize); resize();

/* ---------- Zufall mit Startwert (gleiche Strecke für beide Duell-Spieler) ---------- */
let seedV = 1; const srand = s => { seedV = s >>> 0 || 1; }; const rnd = () => (seedV = (seedV*1664525 + 1013904223) >>> 0)/4294967296;
const R = (a, b) => a + rnd()*(b - a); const rr = (a, b) => a + Math.random()*(b - a);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

/* ---------- Ton ---------- */
let ac = null, engine = null, screech = null;
function audio(){ try{ if(!ac) ac = new (window.AudioContext || window.webkitAudioContext)(); if(ac.state !== 'running') ac.resume(); }catch(e){} }
addEventListener('touchend', audio, {passive: true}); addEventListener('click', audio);
function tone(f, t0 = 0, d = .2, type = 'square', v = .06){ if(!ac) return; const o = ac.createOscillator(), gn = ac.createGain(); o.type = type; o.frequency.value = f; gn.gain.setValueAtTime(0, ac.currentTime + t0); gn.gain.linearRampToValueAtTime(v, ac.currentTime + t0 + .01); gn.gain.exponentialRampToValueAtTime(.0005, ac.currentTime + t0 + d); o.connect(gn); gn.connect(ac.destination); o.start(ac.currentTime + t0); o.stop(ac.currentTime + t0 + d + .05); }
function noise(d = .3, v = .2, hp = 600){ if(!ac) return; const n = Math.floor(ac.sampleRate*d), b = ac.createBuffer(1, n, ac.sampleRate), a = b.getChannelData(0); for(let i=0;i<n;i++) a[i] = (Math.random()*2 - 1)*Math.pow(1 - i/n, 2); const s = ac.createBufferSource(); s.buffer = b; const f = ac.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = hp; const gn = ac.createGain(); gn.gain.value = v; s.connect(f); f.connect(gn); gn.connect(ac.destination); s.start(); }
function engineStart(){ if(!ac || engine) return; const o = ac.createOscillator(), o2 = ac.createOscillator(), gn = ac.createGain(), f = ac.createBiquadFilter(); o.type = 'sawtooth'; o2.type = 'square'; f.type = 'lowpass'; f.frequency.value = 900; gn.gain.value = .03; o.connect(f); o2.connect(f); f.connect(gn); gn.connect(ac.destination); o.start(); o2.start(); engine = { o, o2, gn };
  // Reifenquietschen (gefiltertes Rauschen, Lautstärke = Drift)
  const n = ac.sampleRate, b = ac.createBuffer(1, n, ac.sampleRate), a = b.getChannelData(0); for(let i=0;i<n;i++) a[i] = Math.random()*2 - 1;
  const s = ac.createBufferSource(); s.buffer = b; s.loop = true; const bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 2400; bp.Q.value = 6; const sg = ac.createGain(); sg.gain.value = 0; s.connect(bp); bp.connect(sg); sg.connect(ac.destination); s.start(); screech = { s, sg }; }
function engineSet(rpm, slide = 0){ if(!engine) return; const f = 60 + rpm*160; engine.o.frequency.setTargetAtTime(f, ac.currentTime, .05); engine.o2.frequency.setTargetAtTime(f*.5, ac.currentTime, .05); screech.sg.gain.setTargetAtTime(slide*.12, ac.currentTime, .05); }
function engineStop(){ if(!engine) return; try{ engine.gn.gain.setTargetAtTime(0, ac.currentTime, .1); engine.o.stop(ac.currentTime + .4); engine.o2.stop(ac.currentTime + .4); screech.sg.gain.setTargetAtTime(0, ac.currentTime, .05); screech.s.stop(ac.currentTime + .3); }catch(e){} engine = null; screech = null; }

/* ---------- Strecke ---------- */
const SEG = 200, ROADW = 2000, RUMBLE = 3, FOV = 100, CAMH = 1000, DEPTH = 1/Math.tan(FOV/2*Math.PI/180), DRAW = 170;
const PLAYERZ = CAMH*DEPTH, MAXSPEED = SEG*60;          // 60 Segmente pro Sekunde
let segs = [], trackLen = 0;
const lastY = () => segs.length ? segs[segs.length - 1].p2.world.y : 0;
function addSeg(curve, y){ const n = segs.length; segs.push({ index: n, p1: { world: { y: lastY(), z: n*SEG }, camera: {}, screen: {} }, p2: { world: { y, z: (n + 1)*SEG }, camera: {}, screen: {} }, curve, sprites: [], cars: [], dark: Math.floor(n/RUMBLE) % 2 }); }
const easeIn = (a, b, p) => a + (b - a)*Math.pow(p, 2), easeInOut = (a, b, p) => a + (b - a)*((-Math.cos(p*Math.PI)/2) + .5);
function road(enter, hold, leave, curve, hill = 0){ const sy = lastY(), ey = sy + hill*SEG, tot = enter + hold + leave; let i;
  for(i=0;i<enter;i++) addSeg(easeIn(0, curve, i/enter), easeInOut(sy, ey, i/tot));
  for(i=0;i<hold;i++) addSeg(curve, easeInOut(sy, ey, (enter + i)/tot));
  for(i=0;i<leave;i++) addSeg(easeInOut(curve, 0, i/leave), easeInOut(sy, ey, (enter + hold + i)/tot)); }
function sprite(n, type, offset, extra){ if(segs[n]) segs[n].sprites.push(Object.assign({ type, offset }, extra || {})); }
const SP = { tree: [.55, 1.6], snowman: [.22, 1.4], banner: [1.0, .42], pump: [.18, 1.7], charger: [.14, 2.2], rock: [.3, .65], ped: [.09, 2.6], lamp: [.06, 6], cone: [.09, 1.2] };

function buildTrack(mode, seed){
  segs = []; srand(seed);
  if(mode === 'drag') road(0, 700, 0, 0, 0);
  else if(mode === 'rally'){
    road(0, 40, 0, 0, 0);
    for(let k=0;k<26;k++){ road(R(10, 25)|0, R(10, 45)|0, R(10, 25)|0, R(2, 6.5)*(rnd() < .5 ? -1 : 1), R(-25, 25)); if(rnd() < .35) road(10, R(10, 40)|0, 10, 0, R(-15, 15)); }
    road(20, 60, 20, 0, -lastY()/SEG);
  } else {
    const k = mode === 'dtm' ? 1.15 : 1;
    road(0, 60, 0, 0, 0);
    road(20, 40, 20, 3*k, 10); road(10, 50, 10, 0, 0); road(25, 30, 25, -4*k, -10);
    road(20, 25, 20, 5*k, 20); road(15, 60, 15, 0, 0); road(15, 25, 15, -2.5, 0); road(15, 25, 15, 2.5, -10);
    road(30, 20, 30, -6*k, 0); road(20, 90, 20, 0, 15); road(20, 30, 20, 4*k, -15); road(25, 40, 25, -3*k, 0);
    road(20, 60, 20, 0, -lastY()/SEG);
  }
  trackLen = segs.length*SEG;
  const N = segs.length;
  for(let n=10;n<N;n+=(mode === 'drag' ? 6 : 4)){
    const side = (n/4) % 2 ? 1 : -1;
    sprite(n, rnd() < .85 ? 'tree' : 'snowman', side*R(1.3, 2.6), { lit: rnd() < .4 });
    if(rnd() < .6) sprite(n, 'tree', -side*R(1.4, 3.2), { lit: rnd() < .3 });
  }
  for(let n=40;n<N;n+=150) sprite(n, 'banner', -1.55);
  for(let n=110;n<N;n+=150) sprite(n, 'banner', 1.55);
  if(mode !== 'drag'){
    for(let n=60;n<N;n+=R(18, 45)|0) sprite(n, rnd() < .5 ? 'charger' : 'pump', (rnd() < .5 ? -1 : 1)*R(1.15, 1.3), { hit: 1 });
    const gap = mode === 'rally' ? [28, 55] : [70, 140];
    for(let n=120;n<N - 30;n+=R(gap[0], gap[1])|0){
      const r = rnd();
      if(mode === 'rally' && r < .3) sprite(n, 'ped', -1.1, { hit: 1, walk: R(.25, .45), dir: 1, ped: 1 });
      else if(r < .55) sprite(n, 'rock', R(-.65, .65), { hit: 1 });
      else if(r < .75) sprite(n, 'charger', R(-.6, .6), { hit: 1 });
      else if(r < .9) sprite(n, 'pump', R(-.6, .6), { hit: 1 });
      else for(let i=0;i<3;i++) sprite(n + i*2, 'cone', R(-.7, .7), { hit: 1, soft: 1 });
    }
  }
  if(mode !== 'rally') for(let n=0;n<N;n+=8) sprite(n, 'lamp', (n/8) % 2 ? 1.1 : -1.1);
}
const findSeg = z => segs[Math.floor(((z % trackLen) + trackLen) % trackLen/SEG) % segs.length];
const pctRem = (n, total) => (((n % total) + total) % total)/total;
const interp = (a, b, p) => a + (b - a)*p;
function project(p, camX, camY, camZ){
  p.camera.x = (p.world.x || 0) - camX; p.camera.y = (p.world.y || 0) - camY; p.camera.z = (p.world.z || 0) - camZ;
  p.screen.scale = DEPTH/p.camera.z;
  p.screen.x = Math.round(W/2 + p.screen.scale*p.camera.x*W/2);
  p.screen.y = Math.round(H*.56 - p.screen.scale*p.camera.y*H/2);
  p.screen.w = Math.round(p.screen.scale*ROADW*W/2);
}

/* ---------- Spielzustand ---------- */
let mode = 'race', state = 'menu', duel = null, ghost = null, ghostRec = [], ghostT = 0, seedNow = 1;
let P, cars = [], msgs = [], parts = [], raceT = 0, countdown, skyX = 0, hillX = 0, snow = [], resultsShown = false;
const LAPS = 3;
const CAR_COLS = ['#e63946', '#3a86ff', '#f4a261', '#8338ec', '#ffbe0b', '#e9ecef', '#fb5607', '#06d6a0'];
const NAMES = ['Rudi', 'Blitzen', 'Komet', 'Donner', 'Cupid', 'Vixen', 'Dasher'];
const myName = () => ($('pname').value || '').trim() || tx('you');
function newPlayer(){ return { dist: 0, x: 0, speed: 0, steer: 0, brake: false, yaw: 0, drift: 0, spin: 0, spinA: 0, roll: 0, rollA: 0, lift: 0, inv: 0, lap: 1, fin: 0, gear: 1, rpm: 0, slide: 0 }; }

function startRace(m, seed){
  mode = m; seedNow = seed; buildTrack(m, seed); P = newPlayer(); cars = []; msgs = []; parts = []; raceT = 0; countdown = 3.2; skyX = 0; hillX = 0; resultsShown = false;
  snow = Array.from({length: 90}, () => ({ x: Math.random(), y: Math.random(), s: rr(.4, 1.2) }));
  srand(seed ^ 0x5eed);
  const nAI = duel ? 0 : m === 'race' ? 3 : m === 'dtm' ? 7 : m === 'drag' ? 1 : 0;
  for(let i=0;i<nAI;i++){
    const grid = i + 1;
    cars.push({ ai: 1, name: NAMES[i], col: CAR_COLS[i % CAR_COLS.length], x: m === 'drag' ? .5 : (grid % 2 ? .45 : -.45),
      dist: m === 'drag' ? PLAYERZ : PLAYERZ + grid*SEG*3, speed: 0,
      top: MAXSPEED*(m === 'dtm' ? R(.95, 1.01) : m === 'drag' ? 1 : R(.92, .99)), skill: R(.9, 1), fin: 0, gear: 1, rpm: 0, yaw: 0 });
  }
  P.x = m === 'drag' ? -.5 : duel ? (duel.host ? -.45 : .45) : 0;
  if(duel) duel.opp = { name: duel.oppName || tx('opp'), col: '#e63946', dist: PLAYERZ, x: duel.host ? .45 : -.45, speed: 0, yaw: 0, rollA: 0, lift: 0, fin: 0, net: 1 };
  ghost = null; ghostRec = []; ghostT = 0;
  if(!duel && (m === 'rally' || m === 'drag')){ try{ const gd = JSON.parse(localStorage.getItem('mamrally_' + m) || 'null'); if(gd && gd.v === 2) ghost = gd; }catch(e){} }
  state = 'count'; showUI(null); $('pauseBtn').style.display = 'block'; engineStart(); tone(440, 0, .25);
}

function say(text, col = '#fff', t = 1.2){ if(msgs.length && msgs[msgs.length - 1].text === text){ msgs[msgs.length - 1].t = t; return; } msgs.push({ text, col, t, t0: t }); if(msgs.length > 3) msgs.shift(); }
function puff(x, y, n, col, sp = 1, r = 1){ for(let i=0;i<n;i++) parts.push({ x, y, vx: rr(-60, 60)*sp*DPR, vy: rr(-80, -20)*sp*DPR, r: rr(6, 16)*DPR*r, life: rr(.5, 1), c: col }); }

/* ---------- Eingabe ---------- */
let touchX = null, touchId = null;
const brakeZone = (x, y) => x < W*.3 && y > H*.78;
cv.addEventListener('pointerdown', e => {
  audio(); const x = e.clientX*DPR, y = e.clientY*DPR;
  if(state !== 'race' && state !== 'count') return;
  if(mode === 'drag'){ if(state === 'race') shift(); return; }
  if(brakeZone(x, y)){ P.brake = true; P.brakeId = e.pointerId; return; }
  touchX = x; touchId = e.pointerId; P.steerBase = P.steer;
});
cv.addEventListener('pointermove', e => { if(e.pointerId !== touchId || !P || touchX === null) return; P.steer = clamp((P.steerBase || 0) + (e.clientX*DPR - touchX)/(W*.22), -1, 1); });
const up = e => { if(!P) return; if(e.pointerId === touchId){ touchId = null; touchX = null; P.steer = 0; } if(e.pointerId === P.brakeId){ P.brake = false; P.brakeId = null; } };
cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
addEventListener('keydown', e => { if(!P) return; if(e.key === 'ArrowLeft') P.steer = -1; if(e.key === 'ArrowRight') P.steer = 1; if(e.key === 'ArrowDown') P.brake = true; if(e.key === ' ' && mode === 'drag') shift(); if(e.key === 'Escape') pause(); });
addEventListener('keyup', e => { if(!P) return; if(e.key === 'ArrowLeft' || e.key === 'ArrowRight') P.steer = 0; if(e.key === 'ArrowDown') P.brake = false; });

/* ---------- Pause ---------- */
function pause(){ if(state !== 'race' && state !== 'count') return; P.wasState = state; if(!duel) state = 'pause'; $('pauseOv').style.display = 'flex'; $('pRestart').style.display = duel && !duel.host ? 'none' : ''; P.steer = 0; P.brake = false; engineSet(0, 0); }
$('pResume').onclick = () => { $('pauseOv').style.display = 'none'; if(state === 'pause') state = P.wasState; last = performance.now(); };
$('pRestart').onclick = () => { $('pauseOv').style.display = 'none'; engineStop(); $('trophy').dataset.done = ''; const s = (Math.random()*1e9)|0; if(duel && duel.host) send({ t: 'go', mode, seed: s, name: myName() }); startRace(mode, s); };
$('pMenu').onclick = () => { $('pauseOv').style.display = 'none'; toMenu(); };
function toMenu(){ engineStop(); state = 'menu'; $('pauseBtn').style.display = 'none'; if(duel && !duel.host){ showUI('lobby'); $('qr').innerHTML = ''; $('lobbyText').textContent = tx('waitHost'); } else showUI('menu'); }

/* ---------- Drag Race ---------- */
function shift(){
  if(!P || P.fin || P.gear >= 6) return;
  const r = P.rpm;
  if(r < .78){ say(tx('wrong'), '#ffb703'); P.shiftBonus = .75; } else if(r <= .95){ say(tx('perfect'), '#06d6a0'); P.shiftBonus = 1.15; tone(1200, 0, .08); } else { say(tx('late'), '#ffb703'); P.shiftBonus = .9; }
  P.gear++; P.rpm = .45; tone(300, 0, .08, 'sawtooth', .05);
}
const DRAG_LEN = 640*SEG;
const GEARMAX = [0, .32, .5, .66, .8, .92, 1];

/* ---------- Physik Spieler ---------- */
function updatePlayer(dt){
  const seg = findSeg(P.dist + PLAYERZ), sp = P.speed/MAXSPEED;
  if(P.fin){ P.speed = Math.max(0, P.speed - MAXSPEED*.7*dt); P.dist += P.speed*dt; P.yaw *= .9; P.spinA = 0; P.slide = 0; P.x += (clamp(P.x, -.7, .7) - P.x)*dt*2; engineSet(sp*.6); return; }
  if(mode === 'drag'){
    P.rpm = Math.min(1.02, P.rpm + dt*(1.1 - P.gear*.12)*(P.shiftBonus || 1));
    if(P.rpm >= 1) P.rpm = .97 + Math.random()*.05;
    else P.speed = Math.min(MAXSPEED*GEARMAX[P.gear], P.speed + MAXSPEED*dt*(.55 - P.gear*.05)*(P.shiftBonus || 1));
    P.dist += P.speed*dt; engineSet(P.rpm);
    if(P.dist >= DRAG_LEN) finishPlayer();
    return;
  }
  // ---- Überschlag: Auto hebt ab, rollt zweimal um die Längsachse, landet, wird zurückgesetzt
  if(P.roll > 0){
    const T = 1.9, k = 1 - P.roll/T;
    P.roll -= dt;
    P.rollA = P.rollDir*Math.min(1, k/.75)*Math.PI*4;
    P.lift = Math.max(0, Math.sin(Math.min(1, k/.75)*Math.PI))*1.8 + (k > .75 ? Math.abs(Math.sin((k - .75)*4*Math.PI))*.3*(1 - k) : 0);
    P.x += P.rollDir*dt*.6*(1 - k);
    P.speed *= Math.pow(.25, dt); P.dist += P.speed*dt; P.slide = 0;
    if(Math.random() < .5) puff(W/2 + rr(-W*.15, W*.15), H*.86, 1, 'rgba(255,255,255,.95)', 1.5);
    if(P.roll <= 0){ P.x = clamp(P.x, -.6, .6)*.5; P.rollA = 0; P.lift = 0; P.yaw = 0; P.inv = 1.6; P.drift = 0; P.speed = MAXSPEED*.15; }
    engineSet(.2); return;
  }
  // ---- Schleudern: eine ganze Drehung um die Hochachse
  if(P.spin > 0){ P.spin -= dt; P.spinA += dt*P.spinDir*Math.PI*2.4; P.speed *= Math.pow(.3, dt); P.slide = 1; if(P.spin <= 0){ P.spinA = 0; P.yaw = 0; } }
  P.inv = Math.max(0, P.inv - dt);
  const off = Math.abs(P.x) > 1.02;
  let accel = MAXSPEED/4.5;
  if(P.brake) accel = -MAXSPEED*.9;
  if(off) accel = P.speed > MAXSPEED*.3 ? -MAXSPEED*.8 : MAXSPEED/10;
  if(P.spin > 0) accel = 0;
  P.speed = clamp(P.speed + accel*dt, 0, MAXSPEED);
  const steerPow = dt*2*Math.max(sp, .25);
  if(P.spin <= 0) P.x += steerPow*P.steer*1.3;
  P.x -= dt*2*sp*sp*seg.curve*.22;                         // Fliehkraft wächst mit dem Quadrat der Geschwindigkeit
  // ---- Drift: in steilen Kurven bei hohem Tempo bricht das Heck aus
  const dir = Math.sign(seg.curve);
  if(Math.abs(seg.curve) >= 3 && sp > .62 && P.spin <= 0 && !P.brake){ if(P.drift <= 0) say(tx('drift'), '#ffd166', .9); P.drift = .35; P.driftDir = dir; }
  if(P.drift > 0){
    P.drift -= dt;
    const dd = P.driftDir || dir;
    P.x -= dt*2*sp*dd*.25;                                   // das Auto rutscht nach außen
    P.speed *= Math.pow(.85, dt);
    const into = Math.max(0, P.steer*dd);
    P.yaw += (dd*(.4 + .3*into) - P.yaw)*Math.min(1, dt*6);   // Nase zeigt in die Kurve, Heck nach außen
    P.slide = Math.min(1, .5 + sp*.5);
  } else if(P.spin <= 0){ P.yaw += (P.steer*.1 - P.yaw)*Math.min(1, dt*8); P.slide = Math.max(0, P.slide - dt*3); }
  // ---- von der Fahrbahn: driftend → Überschlag, schnell → Schleudern
  const nowOff = Math.abs(P.x) > 1.05;
  if(nowOff && !P.wasOff && P.inv <= 0){
    if(P.drift > 0 && sp > .45){ P.roll = 1.9; P.rollDir = Math.sign(P.x); P.yaw = 0; say(tx('roll'), '#ff6b6b', 1.8); noise(1, .4, 120); tone(90, .1, .6, 'sawtooth', .05); for(let i=0;i<3;i++) setTimeout(() => noise(.25, .3, 300), 400 + i*350); }
    else if(sp > .5){ P.spin = .85; P.spinDir = -Math.sign(P.x) || 1; say(tx('spin'), '#ffb703'); noise(.6, .25, 500); }
  }
  P.wasOff = nowOff;
  P.x = clamp(P.x, -2.4, 2.4);
  // ---- Hindernisse
  if(P.inv <= 0 && P.roll <= 0) for(const s of seg.sprites){
    if(!s.hit || s.gone) continue;
    if(Math.abs(P.x - s.offset) < (SP[s.type][0] + .32)/2){
      if(s.ped){ s.dodge = 1; P.speed *= .15; say(tx('ped'), '#ff6b6b', 1.4); tone(660, 0, .15); tone(660, .2, .15); P.inv = 1; }
      else if(s.soft){ s.gone = 1; P.speed *= .85; tone(200, 0, .1, 'triangle'); puff(W/2, H*.84, 6, '#ff7b00'); }
      else { P.speed *= .3; P.spin = .7; P.spinDir = Math.sign(P.x - s.offset) || 1; say(tx('crash'), '#ff6b6b'); noise(.4, .35, 200); P.inv = .8; }
      break;
    }
  }
  // ---- andere Autos (Auffahren, Seitenkontakt)
  for(const c of others()){
    const dz = c.dist - (P.dist + PLAYERZ);
    if(dz > -SEG*.6 && dz < SEG*1.2 && Math.abs(P.x - c.x) < .4){
      if(dz > 0 && P.speed > c.speed){ P.speed = c.speed*.85; say(tx('crash'), '#ffd166', .6); tone(180, 0, .1, 'square', .05); }
      else { const push = Math.sign(P.x - c.x) || 1; P.x += push*dt*1.5; if(c.ai) c.x -= push*dt*1.5; }
    }
  }
  P.dist += P.speed*dt;
  if(mode !== 'rally'){
    const lapNow = Math.floor((P.dist + PLAYERZ)/trackLen) + 1;
    if(lapNow > P.lap){ P.lap = lapNow; if(P.lap > LAPS) finishPlayer(); else { say(tx('lap') + ' ' + P.lap + '/' + LAPS, '#9bf6ff'); tone(880, 0, .1); tone(1320, .1, .15); } }
  } else if(P.dist + PLAYERZ >= trackLen - SEG*40) finishPlayer();
  engineSet(Math.min(1, sp*1.05), P.slide);
}
function others(){ const o = cars.slice(); if(duel && duel.opp && !duel.opp.fin) o.push(duel.opp); return o; }

/* ---------- KI-Gegner ---------- */
function updateAI(c, dt, t){
  if(c.fin){ c.speed = Math.max(0, c.speed - MAXSPEED*.5*dt); c.dist += c.speed*dt; return; }
  if(mode === 'drag'){
    c.rpm = Math.min(1, c.rpm + dt*(1.1 - c.gear*.12));
    if(c.rpm > .84 + c.skill*.08 && c.gear < 6){ c.gear++; c.rpm = .45; c.bonus = c.skill > .94 ? 1.15 : 1; }
    c.speed = Math.min(MAXSPEED*GEARMAX[c.gear], c.speed + MAXSPEED*dt*(.55 - c.gear*.05)*(c.bonus || 1)*(.97 + c.skill*.06));
    c.dist += c.speed*dt; if(c.dist >= DRAG_LEN + PLAYERZ) aiFinish(c, t); return;
  }
  const seg = findSeg(c.dist), ahead = findSeg(c.dist + SEG*20);
  let want = c.top*(1 - Math.min(.18, Math.abs(ahead.curve)*.028))*c.skill;
  const gap = (P.dist + PLAYERZ) - c.dist;                     // > 0: Spieler liegt vorne
  if(!P.fin){ if(gap > 2500) want *= 1 + Math.min(.14, gap/60000); else if(gap < -6000) want *= .9; }
  c.speed += Math.sign(want - c.speed)*Math.min(Math.abs(want - c.speed), MAXSPEED*.3*dt);
  let tgt = c.baseX ?? (c.baseX = c.x);
  for(let i=1;i<12;i++){ const s = segs[(seg.index + i) % segs.length]; for(const sp of s.sprites) if(sp.hit && !sp.gone && Math.abs(sp.offset - c.x) < .45) tgt = sp.offset > 0 ? sp.offset - .7 : sp.offset + .7; }
  if(gap < 0 && gap > -SEG*8 && Math.abs(P.x - c.x) < .5 && c.speed > P.speed) tgt = P.x > 0 ? P.x - .7 : P.x + .7;
  for(const o of cars) if(o !== c){ const d = o.dist - c.dist; if(d > 0 && d < SEG*6 && Math.abs(o.x - c.x) < .45 && c.speed > o.speed) tgt = o.x > 0 ? o.x - .7 : o.x + .7; }
  tgt = clamp(tgt, -.8, .8);
  c.x += (tgt - c.x)*Math.min(1, dt*2); c.yaw = clamp((tgt - c.x)*.5 + seg.curve*.02, -.3, .3);
  c.dist += c.speed*dt;
  if(mode !== 'rally' && c.dist >= LAPS*trackLen) aiFinish(c, t);
}
function aiFinish(c, t){ if(!c.fin) c.fin = t; }

/* ---------- Ziel ---------- */
function finishPlayer(){
  if(P.fin) return; P.fin = raceT; P.brake = false; say(tx('finish'), '#ffd166', 2);
  tone(784, 0, .2); tone(988, .2, .2); tone(1175, .4, .5);
  if(duel) send({ t: 'fin', time: P.fin });
  if(!duel && (mode === 'rally' || mode === 'drag')){ try{ const old = JSON.parse(localStorage.getItem('mamrally_' + mode) || 'null'); if(!old || old.v !== 2 || P.fin < old.time) localStorage.setItem('mamrally_' + mode, JSON.stringify({ v: 2, time: P.fin, s: ghostRec })); }catch(e){} }
  try{ const k = 'mamrally_best_' + mode, b = JSON.parse(localStorage.getItem(k) || '[]'); b.push({ n: myName(), t: P.fin }); b.sort((a, c) => a.t - c.t); localStorage.setItem(k, JSON.stringify(b.slice(0, 5))); }catch(e){}
  setTimeout(results, 2000);
}
// Gegner, die noch fahren, im Zeitraffer zu Ende fahren lassen, damit jede Zeit feststeht
function finishAI(){ let t = raceT, n = 0; while(cars.some(c => !c.fin) && n++ < 30000){ t += 1/30; for(const c of cars) updateAI(c, 1/30, t); } }

/* ---------- 3D-Auto ---------- */
// Quader mit schrägem Dach: x links/rechts, y hoch, z nach vorn (Heck bei -2.15)
function hex(x0, x1, y0, y1, z0, z1, ix = 0, izb = 0, izf = 0){ return [[x0,y0,z0],[x1,y0,z0],[x1,y0,z1],[x0,y0,z1],[x0+ix,y1,z0+izb],[x1-ix,y1,z0+izb],[x1-ix,y1,z1-izf],[x0+ix,y1,z1-izf]]; }
const FACES = [[0,1,2,3],[4,7,6,5],[0,4,5,1],[3,2,6,7],[0,3,7,4],[1,5,6,2]];   // unten, oben, hinten, vorn, links, rechts
function carParts(me){
  const p = [
    { v: hex(-.92,.92,.24,.36,-2.24,2.24), c: 'dark' },
    { v: hex(-.9,.9,.28,.86,-2.15,2.15,.02,.06,.45), c: ['dark','body','body','body','body','body'] },
    { v: hex(-.915,.915,.52,.62,-2.165,2.1), c: 'stripe' },
    { v: hex(-.78,.78,.86,1.36,-1.45,.75,.1,.3,.5), c: ['body','body','glass','glass','glass','glass'] },
    { v: hex(-.86,-.5,.64,.8,-2.19,-2.12), c: 'tail' }, { v: hex(.5,.86,.64,.8,-2.19,-2.12), c: 'tail' },
    { v: hex(-.24,.24,.38,.5,-2.27,-2.22), c: 'plate' },
  ];
  for(const z of [-1.4, 1.35]) for(const s of [-1, 1]) p.push({ v: hex(s < 0 ? -1 : .72, s < 0 ? -.72 : 1, 0, .64, z - .33, z + .33), c: 'wheel' });
  if(me){ p.push({ v: hex(-.26,.26,1.36,1.68,-.7,-.18), c: 'gift' }); p.push({ v: hex(-.05,.05,1.36,1.71,-.72,-.16), c: 'ribbon' }); p.push({ v: hex(-.27,.27,1.5,1.56,-.71,-.17), c: 'ribbon' }); }
  return p;
}
const PARTS = carParts(false), PARTS_ME = carParts(true);
const ANTLER = [[[.3,1.36,.25],[.5,1.85,.05],[.75,2.0,-.15]],[[.5,1.85,.05],[.42,2.1,.25]],[[.62,1.93,-.05],[.8,1.8,.25]]];
const rgbCache = {};
function rgb(c){ if(rgbCache[c]) return rgbCache[c]; const n = parseInt(c.slice(1), 16); return rgbCache[c] = [n >> 16, (n >> 8) & 255, n & 255]; }
const LIGHT = (() => { const l = [-.35, .85, -.4], m = Math.hypot(...l); return l.map(v => v/m); })();
const CAM = [0, 2.5, -6.8], PITCH = .2, PC = Math.cos(PITCH), PS = Math.sin(PITCH);
function drawCar3D(cx, cy, w, col, o = {}){
  const yaw = o.yaw || 0, roll = o.roll || 0, lift = o.lift || 0, alpha = o.alpha ?? 1;
  const cyw = Math.cos(yaw), syw = Math.sin(yaw), cr = Math.cos(roll), sr = Math.sin(roll);
  const pal = { body: col, dark: '#1b1f24', stripe: '#f4a261', glass: '#2b4d5c', tail: (o.brake ? '#ff3030' : '#c1121f'), plate: '#f1f3f5', wheel: '#111418', gift: '#f77f00', ribbon: '#ffffff' };
  const tf = ([x, y, z]) => { const yy = y - .7, x1 = x*cr - yy*sr, y1 = x*sr + yy*cr + .7; return [x1*cyw + z*syw, y1 + lift, -x1*syw + z*cyw]; };
  // Kamera hinter dem Auto: Bodenmitte des Autos → (cx, cy), Autobreite 1.8 → w Pixel
  const oy = -CAM[1], oz = -CAM[2], y0 = oy*PC + oz*PS, z0 = oz*PC - oy*PS, F = w*z0/1.8, cy0 = cy + y0/z0*F;
  const pr = ([x, y, z]) => { const qy = y - CAM[1], qz = z - CAM[2], y2 = qy*PC + qz*PS, z2 = Math.max(.3, qz*PC - qy*PS); return [cx + x/z2*F, cy0 - y2/z2*F, z2]; };
  g.save(); g.globalAlpha = alpha;
  const sh = 1/(1 + lift*.6); g.fillStyle = `rgba(0,0,0,${.35*sh})`; g.beginPath(); g.ellipse(cx, cy + w*.05, w*.62*sh, w*.16*sh, 0, 0, 7); g.fill();
  const faces = [];
  for(const part of (o.me ? PARTS_ME : PARTS)){
    const V = part.v.map(tf), ctr = V.reduce((a, v) => [a[0] + v[0]/8, a[1] + v[1]/8, a[2] + v[2]/8], [0, 0, 0]);
    FACES.forEach((f, fi) => {
      const fc = f.reduce((a, i) => [a[0] + V[i][0]/4, a[1] + V[i][1]/4, a[2] + V[i][2]/4], [0, 0, 0]);
      let n = [fc[0] - ctr[0], fc[1] - ctr[1], fc[2] - ctr[2]]; const m = Math.hypot(...n) || 1; n = n.map(v => v/m);
      const view = [fc[0] - CAM[0], fc[1] - CAM[1], fc[2] - CAM[2]];
      if(n[0]*view[0] + n[1]*view[1] + n[2]*view[2] >= 0) return;
      const key = Array.isArray(part.c) ? part.c[fi] : part.c;
      faces.push({ pts: f.map(i => pr(V[i])), d: Math.hypot(...view), c: pal[key], l: .55 + .55*Math.max(0, n[0]*LIGHT[0] + n[1]*LIGHT[1] + n[2]*LIGHT[2]) });
    });
  }
  faces.sort((a, b) => b.d - a.d);
  for(const f of faces){ const [r, gg, b] = rgb(f.c); g.fillStyle = `rgb(${Math.min(255, r*f.l)|0},${Math.min(255, gg*f.l)|0},${Math.min(255, b*f.l)|0})`;
    g.beginPath(); g.moveTo(f.pts[0][0], f.pts[0][1]); for(let i=1;i<4;i++) g.lineTo(f.pts[i][0], f.pts[i][1]); g.closePath(); g.fill(); g.strokeStyle = g.fillStyle; g.lineWidth = 1; g.stroke(); }
  if(o.me){ g.strokeStyle = '#7f4f24'; g.lineCap = 'round'; g.lineWidth = Math.max(2, w*.03);
    for(const s of [-1, 1]) for(const line of ANTLER){ g.beginPath(); line.forEach((p, i) => { const q = pr(tf([p[0]*s, p[1], p[2]])); i ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1]); }); g.stroke(); } }
  g.restore();
  return [pr(tf([-.86, 0, -1.4])), pr(tf([.86, 0, -1.4]))];      // Hinterräder (für Rauch)
}

/* ---------- Kulisse ---------- */
function poly(x1, y1, x2, y2, x3, y3, x4, y4, c){ g.fillStyle = c; g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.lineTo(x3, y3); g.lineTo(x4, y4); g.closePath(); g.fill(); }
function drawSeg(x1, y1, w1, x2, y2, w2, dark, n){
  g.fillStyle = dark ? '#dfe9ee' : '#eef5f8'; g.fillRect(0, y2, W, y1 - y2);
  const r1 = w1/6, r2 = w2/6;
  poly(x1 - w1 - r1, y1, x1 - w1, y1, x2 - w2, y2, x2 - w2 - r2, y2, dark ? '#f77f00' : '#ffffff');
  poly(x1 + w1 + r1, y1, x1 + w1, y1, x2 + w2, y2, x2 + w2 + r2, y2, dark ? '#f77f00' : '#ffffff');
  poly(x1 - w1, y1, x1 + w1, y1, x2 + w2, y2, x2 - w2, y2, mode === 'rally' ? (dark ? '#8d99a6' : '#99a5b1') : (dark ? '#1e2a3a' : '#223044'));
  if(n % 6 < 3 && mode !== 'rally'){ const l1 = w1/40, l2 = w2/40; for(const k of [-1/3, 1/3]) poly(x1 + k*2*w1 - l1, y1, x1 + k*2*w1 + l1, y1, x2 + k*2*w2 + l2, y2, x2 + k*2*w2 - l2, y2, '#ffb703'); }
  const chk = (n >= 0 && n < 4 && mode !== 'drag') || (mode === 'drag' && n >= 640 && n < 644);
  if(chk) for(let i=0;i<8;i++) poly(x1 - w1 + i*w1/4, y1, x1 - w1 + (i + 1)*w1/4, y1, x2 - w2 + (i + 1)*w2/4, y2, x2 - w2 + i*w2/4, y2, (i + n) % 2 ? '#111' : '#fff');
}
function drawSky(){
  const gr = g.createLinearGradient(0, 0, 0, H*.6); gr.addColorStop(0, '#0f3b4f'); gr.addColorStop(1, '#3f8c9a');
  g.fillStyle = gr; g.fillRect(0, 0, W, H*.62);
  g.fillStyle = 'rgba(255,255,240,.18)'; g.beginPath(); g.arc(W*.78 - skyX*W*.1, H*.16, W*.13, 0, 7); g.fill();
  g.fillStyle = '#fbfbf2'; g.beginPath(); g.arc(W*.78 - skyX*W*.1, H*.16, W*.09, 0, 7); g.fill();
  g.strokeStyle = '#0b2533'; g.lineWidth = 2*DPR; g.beginPath(); g.moveTo(0, H*.03); g.quadraticCurveTo(W*.25, H*.07, W*.5, H*.03); g.quadraticCurveTo(W*.75, H*.07, W, H*.03); g.stroke();
  for(let i=0;i<9;i++){ const x = W*(i + .5)/9, y = H*.03 + Math.sin((x/W)*Math.PI*2 - Math.PI/2)*H*.02 + H*.02; g.fillStyle = (i + Math.floor(raceT*2)) % 3 ? '#f4a261' : '#fff7d6'; g.beginPath(); g.arc(x, y, 5*DPR, 0, 7); g.fill(); }
  g.fillStyle = '#bfe3e6'; g.beginPath(); g.moveTo(0, H*.58); for(let i=0;i<=20;i++){ const x = i/20*W; g.lineTo(x, H*.5 - Math.sin(i*1.3 + hillX*3)*H*.03 - Math.sin(i*.4 + hillX)*H*.04); } g.lineTo(W, H*.6); g.lineTo(0, H*.6); g.fill();
}
function drawTree(x, y, w, lit){ const h = w*1.6; g.fillStyle = '#5b3a29'; g.fillRect(x - w*.06, y - h*.18, w*.12, h*.18);
  for(let i=0;i<3;i++){ g.fillStyle = i % 2 ? '#2a7f6f' : '#1f6b5c'; g.beginPath(); g.moveTo(x, y - h*(.45 + i*.18) - h*.2); g.lineTo(x - w*(.5 - i*.12), y - h*(.12 + i*.2)); g.lineTo(x + w*(.5 - i*.12), y - h*(.12 + i*.2)); g.fill(); g.fillStyle = '#fff'; g.fillRect(x - w*(.42 - i*.12), y - h*(.14 + i*.2), w*(.84 - i*.24), Math.max(1, h*.025)); }
  if(lit) for(let i=0;i<6;i++){ g.fillStyle = (i + Math.floor(raceT*3)) % 2 ? '#ffd166' : '#f77f00'; g.beginPath(); g.arc(x + Math.sin(i*2.1)*w*.25, y - h*(.25 + i*.1), Math.max(1.5, w*.035), 0, 7); g.fill(); }
  g.fillStyle = '#f4a261'; g.beginPath(); g.arc(x, y - h*.83, Math.max(2, w*.06), 0, 7); g.fill(); }
function drawSnowman(x, y, w){ g.fillStyle = '#fff'; g.beginPath(); g.arc(x, y - w*.4, w*.42, 0, 7); g.arc(x, y - w*1.05, w*.3, 0, 7); g.fill(); g.fillStyle = '#f77f00'; g.fillRect(x, y - w*1.08, w*.22, w*.06); g.fillStyle = '#222'; g.fillRect(x - w*.25, y - w*1.45, w*.5, w*.08); g.fillRect(x - w*.15, y - w*1.7, w*.3, w*.25); }
function drawPump(x, y, w){ const h = w*1.7; g.fillStyle = '#e63946'; g.fillRect(x - w/2, y - h, w, h); g.fillStyle = '#fff'; g.fillRect(x - w*.35, y - h*.85, w*.7, h*.25); g.fillStyle = '#222'; g.fillRect(x + w*.5, y - h*.6, w*.12, h*.5); g.fillStyle = '#ffb703'; g.font = `bold ${Math.max(6, w*.35)}px sans-serif`; g.textAlign = 'center'; g.fillText('⛽', x, y - h*.35); }
function drawCharger(x, y, w){ const h = w*2.2; g.fillStyle = '#123547'; g.fillRect(x - w/2, y - h, w, h); g.fillStyle = '#bfe3e6'; g.fillRect(x - w*.35, y - h*.9, w*.7, h*.28); g.fillStyle = '#f77f00'; g.beginPath(); g.moveTo(x + w*.08, y - h*.88); g.lineTo(x - w*.15, y - h*.74); g.lineTo(x, y - h*.74); g.lineTo(x - w*.08, y - h*.63); g.lineTo(x + w*.15, y - h*.78); g.lineTo(x, y - h*.78); g.fill(); g.strokeStyle = '#111'; g.lineWidth = Math.max(1, w*.06); g.beginPath(); g.moveTo(x + w*.5, y - h*.5); g.quadraticCurveTo(x + w, y - h*.3, x + w*.6, y - h*.1); g.stroke(); }
function drawRock(x, y, w){ const h = w*.65; g.fillStyle = '#6c757d'; g.beginPath(); g.moveTo(x - w/2, y); g.lineTo(x - w*.4, y - h*.6); g.lineTo(x - w*.1, y - h); g.lineTo(x + w*.3, y - h*.85); g.lineTo(x + w/2, y - h*.3); g.lineTo(x + w/2, y); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.moveTo(x - w*.35, y - h*.65); g.lineTo(x - w*.1, y - h); g.lineTo(x + w*.3, y - h*.85); g.lineTo(x + w*.2, y - h*.72); g.lineTo(x - w*.15, y - h*.82); g.fill(); }
function drawPed(x, y, w, s){ const h = w*2.6, j = s.dodge ? Math.max(0, 1 - (s.dt || 0)) : 0; y -= j*h*.3;
  g.fillStyle = '#264653'; g.fillRect(x - w*.3, y - h*.45, w*.22, h*.45); g.fillRect(x + w*.08, y - h*.45, w*.22, h*.45);
  g.fillStyle = '#e76f51'; g.fillRect(x - w*.45, y - h*.82, w*.9, h*.4); g.fillStyle = '#f4a261'; g.fillRect(x - w*.45, y - h*.8, w*.9, h*.08);
  g.fillStyle = '#f1c27d'; g.beginPath(); g.arc(x, y - h*.9, w*.28, 0, 7); g.fill(); g.fillStyle = '#c1121f'; g.beginPath(); g.moveTo(x - w*.3, y - h*.95); g.lineTo(x + w*.3, y - h*.95); g.lineTo(x + w*.1, y - h*1.15); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.arc(x + w*.12, y - h*1.15, w*.08, 0, 7); g.fill(); }
function drawCone(x, y, w){ g.fillStyle = '#f77f00'; g.beginPath(); g.moveTo(x - w/2, y); g.lineTo(x, y - w*1.2); g.lineTo(x + w/2, y); g.fill(); g.fillStyle = '#fff'; g.fillRect(x - w*.25, y - w*.6, w*.5, w*.15); }
function drawLamp(x, y, w){ const h = w*6; g.fillStyle = '#334'; g.fillRect(x - w*.15, y - h, w*.3, h); g.fillStyle = 'rgba(255,220,140,.9)'; g.beginPath(); g.arc(x, y - h, w*.6, 0, 7); g.fill(); }
function drawBanner(x, y, w){ const h = w*.42; g.fillStyle = '#2b2d42'; g.fillRect(x - w*.47, y - h*1.6, w*.04, h*1.6); g.fillRect(x + w*.43, y - h*1.6, w*.04, h*1.6);
  g.fillStyle = '#0f3b4f'; g.fillRect(x - w/2, y - h*1.6, w, h); g.strokeStyle = '#f77f00'; g.lineWidth = Math.max(1, w*.02); g.strokeRect(x - w/2, y - h*1.6, w, h);
  g.fillStyle = '#fff'; g.textAlign = 'center'; g.textBaseline = 'middle'; const txt = FIRMA ? tx('merry') + ' · ' + FIRMA : tx('merry') + '!';
  let fs = h*.38; g.font = `bold ${fs}px Georgia`; while(g.measureText(txt).width > w*.9 && fs > 4){ fs *= .9; g.font = `bold ${fs}px Georgia`; } g.fillText(txt, x, y - h*1.1); g.textBaseline = 'alphabetic'; }
function drawSprite(s, x, y, w){
  if(w < 2 || s.gone) return;
  switch(s.type){ case 'tree': return drawTree(x, y, w, s.lit); case 'snowman': return drawSnowman(x, y, w); case 'pump': return drawPump(x, y, w); case 'charger': return drawCharger(x, y, w);
    case 'rock': return drawRock(x, y, w); case 'ped': return drawPed(x, y, w, s); case 'cone': return drawCone(x, y, w); case 'lamp': return drawLamp(x, y, w); case 'banner': return drawBanner(x, y, w); }
}

/* ---------- Bild ---------- */
function render(dt){
  g.clearRect(0, 0, W, H); drawSky();
  const base = findSeg(P.dist), bp = pctRem(P.dist, SEG), pseg = findSeg(P.dist + PLAYERZ), pp = pctRem(P.dist + PLAYERZ, SEG);
  const py = interp(pseg.p1.world.y, pseg.p2.world.y, pp);
  let maxy = H, x = 0, dx = -(base.curve*bp);
  const camX = P.x*ROADW, camY = py + CAMH, lapZ = Math.floor(P.dist/trackLen)*trackLen;
  for(let n=0;n<DRAW;n++){
    const idx = base.index + n, s = segs[idx % segs.length]; s.clip = maxy;
    if(mode === 'drag' && idx >= segs.length){ s.clip = 0; continue; }
    const cz = P.dist - lapZ - (idx >= segs.length ? trackLen : 0);
    project(s.p1, camX - x, camY, cz); project(s.p2, camX - x - dx, camY, cz);
    x += dx; dx += s.curve;
    if(s.p1.camera.z <= DEPTH || s.p2.screen.y >= s.p1.screen.y || s.p2.screen.y >= maxy) continue;
    drawSeg(s.p1.screen.x, s.p1.screen.y, s.p1.screen.w, s.p2.screen.x, s.p2.screen.y, s.p2.screen.w, s.dark, s.index);
    maxy = s.p1.screen.y;
  }
  for(const s of segs) s.cars.length = 0;
  const list = others();
  if(ghost){ const gs = ghostAt(raceT); if(gs) list.push({ dist: gs[0] + PLAYERZ, x: gs[1], col: '#ffffff', ghost: 1, yaw: gs[2] || 0 }); }
  for(const c of list){ const dz = c.dist - (P.dist + PLAYERZ); if(dz < -SEG*2 || dz > DRAW*SEG*.95) continue; findSeg(c.dist).cars.push(c); }
  for(let n=DRAW - 1;n>0;n--){
    const s = segs[(base.index + n) % segs.length];
    if(s.p1.camera.z <= DEPTH || (mode === 'drag' && base.index + n >= segs.length)) continue;
    g.save(); g.beginPath(); g.rect(0, 0, W, s.clip); g.clip();
    for(const sp of s.sprites){
      const sc = s.p1.screen.scale, sx = s.p1.screen.x + sc*sp.offset*ROADW*W/2, sw = sc*ROADW*W/2*SP[sp.type][0];
      if(sp.ped && sp.dodge){ sp.dt = (sp.dt || 0) + dt; sp.offset += (sp.offset < 0 ? -1 : 1)*dt*1.8; }
      else if(sp.ped && state === 'race'){ sp.offset += sp.walk*sp.dir*dt*.6; if(Math.abs(sp.offset) > 1.15) sp.dir *= -1; }
      drawSprite(sp, sx, s.p1.screen.y, sw);
    }
    for(const c of s.cars){
      const p = pctRem(c.dist, SEG), sc = interp(s.p1.screen.scale, s.p2.screen.scale, p), cx = interp(s.p1.screen.x, s.p2.screen.x, p) + sc*c.x*ROADW*W/2, cy = interp(s.p1.screen.y, s.p2.screen.y, p);
      const cw = sc*ROADW*W/2*.36;
      if(cw > 3) drawCar3D(cx, cy, cw, c.col, { yaw: c.yaw || 0, roll: c.rollA || 0, lift: c.lift || 0, alpha: c.ghost ? .45 : 1 });
      if(c.name && cw > 16){ g.fillStyle = '#fff'; g.font = `bold ${Math.max(10*DPR, cw*.15)}px system-ui`; g.textAlign = 'center'; g.fillText(c.name, cx, cy - cw*.95); }
    }
    g.restore();
  }
  // eigenes Auto
  const cw = Math.min(W*.3, H*.26), cxp = W/2, cyp = H*.86;
  const wheels = drawCar3D(cxp, cyp, cw, '#3aa59b', { yaw: P.yaw + P.spinA, roll: P.rollA, lift: P.lift, me: 1, brake: P.brake, alpha: P.inv > 0 && P.roll <= 0 && Math.floor(raceT*10) % 2 ? .5 : 1 });
  if(P.slide > .2) for(const wp of wheels) if(Math.random() < P.slide*.9) puff(wp[0], wp[1], 1, 'rgba(235,240,242,.85)', .7, 1.3);
  if(Math.abs(P.x) > 1.02 && P.speed > MAXSPEED*.2) for(const wp of wheels) puff(wp[0], wp[1], 1, 'rgba(255,255,255,.95)', 1.2);
  for(const p of parts){ g.globalAlpha = clamp(p.life, 0, 1)*.9; g.fillStyle = p.c; g.beginPath(); g.arc(p.x, p.y, p.r, 0, 7); g.fill(); }
  g.globalAlpha = 1;
  g.fillStyle = 'rgba(255,255,255,.85)'; for(const f of snow){ g.beginPath(); g.arc(f.x*W, f.y*H, f.s*2.4*DPR, 0, 7); g.fill(); }
  drawHUD();
}
function ghostAt(t){ if(!ghost || !ghost.s.length) return null; return ghost.s[Math.min(Math.floor(t*10), ghost.s.length - 1)]; }

function fmt(t){ const m = Math.floor(t/60), s = t - m*60; return (m ? m + ':' : '') + (s < 10 && m ? '0' : '') + s.toFixed(2); }
function standings(){
  const all = [{ name: myName(), me: 1, fin: P.fin, prog: P.dist + PLAYERZ }].concat(cars.map(c => ({ name: c.name, fin: c.fin, prog: c.dist })));
  if(duel && duel.opp) all.push({ name: duel.opp.name, fin: duel.opp.fin, prog: duel.opp.dist, opp: 1 });
  all.sort((a, b) => (a.fin && b.fin) ? a.fin - b.fin : a.fin ? -1 : b.fin ? 1 : b.prog - a.prog);
  return all;
}
function drawHUD(){
  const s = DPR, pad = 14*s, st = standings();
  g.fillStyle = 'rgba(11,37,51,.7)'; g.fillRect(0, 0, W, 54*s);
  g.fillStyle = '#fff'; g.font = `bold ${20*s}px system-ui, sans-serif`; g.textBaseline = 'middle';
  g.textAlign = 'left'; g.fillText('⏱ ' + fmt(P.fin || raceT), pad, 28*s);
  g.textAlign = 'center';
  if(mode === 'rally') g.fillText(ghost ? '👻 ' + fmt(ghost.time) : tx('m_rally'), W/2, 28*s);
  else if(mode === 'drag') g.fillText(Math.min(400, Math.round(P.dist/DRAG_LEN*400)) + ' m', W/2, 28*s);
  else g.fillText(tx('lap') + ' ' + Math.min(P.lap, LAPS) + '/' + LAPS, W/2, 28*s);
  g.textAlign = 'right'; if(mode !== 'rally') g.fillText(tx('pos') + ' ' + (st.findIndex(r => r.me) + 1) + '/' + st.length, W - pad, 28*s);
  g.font = `bold ${30*s}px system-ui`; g.fillText(Math.round(P.speed/MAXSPEED*(mode === 'drag' ? 320 : 240)), W - pad, H - 60*s); g.font = `${14*s}px system-ui`; g.fillText(tx('kmh'), W - pad, H - 36*s);
  if(mode === 'drag'){
    const bw = W*.6, bx = W*.2, by = H*.66, bh = 22*s;
    g.fillStyle = 'rgba(0,0,0,.5)'; g.fillRect(bx, by, bw, bh);
    g.fillStyle = 'rgba(6,214,160,.7)'; g.fillRect(bx + bw*.78, by, bw*.17, bh); g.fillStyle = 'rgba(239,35,60,.7)'; g.fillRect(bx + bw*.95, by, bw*.05, bh);
    g.fillStyle = '#fff'; g.fillRect(bx + bw*Math.min(1, P.rpm) - 3*s, by - 6*s, 6*s, bh + 12*s);
    g.font = `bold ${16*s}px system-ui`; g.textAlign = 'center'; g.fillText((P.gear < 6 ? tx('shift') + '  ' : '') + '⚙ ' + P.gear, W/2, by - 18*s);
  } else {
    g.fillStyle = P.brake ? 'rgba(239,35,60,.9)' : 'rgba(239,35,60,.45)'; g.beginPath(); g.arc(W*.13, H*.88, 38*s, 0, 7); g.fill();
    g.fillStyle = '#fff'; g.font = `bold ${13*s}px system-ui`; g.textAlign = 'center'; g.fillText(tx('brake'), W*.13, H*.88);
  }
  if(state === 'count'){ const n = Math.ceil(countdown - .2); g.font = `bold ${110*s}px Georgia`; g.textAlign = 'center'; g.fillStyle = n > 0 ? '#ffd166' : '#06d6a0'; g.strokeStyle = 'rgba(0,0,0,.6)'; g.lineWidth = 8*s; const tt = n > 0 ? String(n) : tx('go'); g.strokeText(tt, W/2, H*.33); g.fillText(tt, W/2, H*.33);
    g.font = `bold ${18*s}px system-ui`; g.fillStyle = '#fff'; g.fillText(mode === 'drag' ? tx('m_drag_d') : tx('steer'), W/2, H*.44); if(ghost) g.fillText(tx('ghost'), W/2, H*.48); }
  let y = H*.26;
  for(const m of msgs){ g.globalAlpha = Math.min(1, m.t/m.t0*2); g.font = `italic bold ${34*s}px Georgia`; g.textAlign = 'center'; g.lineWidth = 6*s; g.strokeStyle = 'rgba(11,37,51,.85)'; g.fillStyle = m.col; g.strokeText(m.text, W/2, y); g.fillText(m.text, W/2, y); y += 44*s; }
  g.globalAlpha = 1; g.textBaseline = 'alphabetic';
}

/* ---------- Hauptschleife ---------- */
let last = performance.now(), netT = 0;
function tick(dt){
  if(state === 'count'){ const before = Math.ceil(countdown - .2); countdown -= dt; const after = Math.ceil(countdown - .2); if(after !== before) tone(after > 0 ? 440 : 880, 0, after > 0 ? .2 : .45); if(countdown <= 0) state = 'race'; }
  if(state === 'race' || state === 'done'){
    if(!P.fin) raceT += dt;
    updatePlayer(dt); for(const c of cars) updateAI(c, dt, raceT);
    if(!P.fin){ ghostT += dt; if(ghostT >= .1){ ghostT -= .1; ghostRec.push([Math.round(P.dist), +P.x.toFixed(2), +(P.yaw + P.spinA).toFixed(2)]); } }
    if(duel && duel.opp && !duel.opp.fin) duel.opp.dist += duel.opp.speed*dt;      // zwischen zwei Funksprüchen weiterrechnen
    if(duel){ netT += dt; if(netT > .1){ netT = 0; send({ t: 'p', d: Math.round(P.dist + PLAYERZ), x: +P.x.toFixed(3), s: Math.round(P.speed), y: +(P.yaw + P.spinA).toFixed(2), r: +P.rollA.toFixed(2), l: +P.lift.toFixed(2) }); } }
  }
  const curve = findSeg(P.dist).curve, k = P.speed/MAXSPEED;
  skyX += dt*k*curve*.02; hillX += dt*k*curve*.03;
  for(const f of snow){ f.y += dt*f.s*.18*(1 + k); f.x += dt*.02*Math.sin(f.y*6) - dt*(P.steer || 0)*.05*k; if(f.y > 1){ f.y = 0; f.x = Math.random(); } if(f.x < 0) f.x += 1; if(f.x > 1) f.x -= 1; }
  for(const p of parts){ p.x += p.vx*dt; p.y += p.vy*dt; p.life -= dt; p.r *= 1 + dt*1.2; }
  parts = parts.filter(p => p.life > 0); if(parts.length > 260) parts.splice(0, parts.length - 260);
  for(const m of msgs) m.t -= dt; msgs = msgs.filter(m => m.t > 0);
}
function loop(now){
  const dt = Math.min(.05, (now - last)/1000); last = now;
  if(P && (state === 'count' || state === 'race' || state === 'done')){ tick(dt); render(dt); }
  else if(P && state === 'pause') render(0);
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

/* ---------- Ergebnis, Zeitenliste, Pokal ---------- */
function results(){
  if(resultsShown || !P || !P.fin) return; resultsShown = true;
  state = 'done'; engineStop(); $('pauseBtn').style.display = 'none';
  finishAI(); renderResults(); showUI('res');
}
function renderResults(){
  const rows = standings(), place = rows.findIndex(r => r.me) + 1;
  let won = place === 1;
  if(mode === 'rally') won = !ghost || P.fin <= ghost.time;
  $('resTitle').textContent = won ? tx('win') : tx('yourPlace', { n: place });
  const best = rows[0].fin;
  let h = `<div class="rh">${tx('standings')} · ${tx('m_' + mode)}</div>`;
  rows.forEach((r, i) => { const tm = r.fin ? (i && best ? fmt(r.fin) + ` <small>+${(r.fin - best).toFixed(2)}</small>` : fmt(r.fin)) : `<small>${tx('still')}</small>`;
    h += `<div class="rr${r.me ? ' me' : ''}"><span>${i + 1}.</span><b>${esc(r.name)}</b><i>${tm}</i></div>`; });
  if(mode === 'rally' && ghost) h += `<div class="rr"><span>👻</span><b>${tx('ghost')}</b><i>${fmt(ghost.time)}</i></div>`;
  try{ const b = JSON.parse(localStorage.getItem('mamrally_best_' + mode) || '[]'); if(b.length){ h += `<div class="rh">${tx('localBest')}</div>`; b.forEach((e, i) => h += `<div class="rr${Math.abs(e.t - P.fin) < .001 ? ' me' : ''}"><span>${i + 1}.</span><b>${esc(e.n)}</b><i>${fmt(e.t)}</i></div>`); } }catch(e){}
  $('resList').innerHTML = h;
  $('trophy').style.display = won ? 'block' : 'none';
  if(won && !$('trophy').dataset.done){ drawTrophy($('trophy'), myName()); $('trophy').dataset.done = 1; [523, 659, 784, 1047, 784, 1047].forEach((f, i) => tone(f, i*.16, .3, 'triangle', .08)); }
}
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
function drawTrophy(c, name){
  const x = c.getContext('2d'); c.width = 600; c.height = 700; x.clearRect(0, 0, 600, 700);
  const gr = x.createLinearGradient(150, 0, 450, 0); gr.addColorStop(0, '#a67c00'); gr.addColorStop(.35, '#fce38a'); gr.addColorStop(.6, '#d4a017'); gr.addColorStop(1, '#8a6a12');
  x.fillStyle = gr; x.beginPath(); x.moveTo(170, 90); x.lineTo(430, 90); x.quadraticCurveTo(440, 300, 330, 360); x.lineTo(270, 360); x.quadraticCurveTo(160, 300, 170, 90); x.fill();
  x.lineWidth = 22; x.strokeStyle = gr; x.beginPath(); x.arc(170, 170, 60, Math.PI*.5, Math.PI*1.5); x.stroke(); x.beginPath(); x.arc(430, 170, 60, -Math.PI*.5, Math.PI*.5); x.stroke();
  x.fillRect(280, 360, 40, 90); x.fillRect(200, 450, 200, 30); x.fillStyle = '#2b2d42'; x.fillRect(160, 480, 280, 100);
  x.fillStyle = 'rgba(255,255,255,.5)'; x.fillRect(205, 110, 18, 160);
  x.fillStyle = '#fff'; x.textAlign = 'center'; x.font = 'bold 54px Georgia'; x.fillText('★', 300, 230);
  x.fillStyle = '#ffd166'; x.font = 'bold 30px Georgia'; x.fillText(tx('trophy'), 300, 518);
  let fs = 40; x.font = `bold ${fs}px Georgia`; while(x.measureText(name).width > 260 && fs > 14){ fs--; x.font = `bold ${fs}px Georgia`; } x.fillText(name, 300, 562);
  x.fillStyle = '#fff'; x.font = 'italic 28px Georgia'; x.fillText(tx('merry') + (FIRMA ? '' : '!'), 300, 625); if(FIRMA){ x.font = 'bold 30px Georgia'; x.fillText(FIRMA, 300, 668); }
}

/* ---------- Oberfläche ---------- */
function showUI(which){ for(const id of ['menu', 'lobby', 'res', 'joinOv', 'pauseOv']) $(id).style.display = id === which ? 'flex' : 'none'; if(which) $('pauseBtn').style.display = 'none'; if(which !== 'joinOv') stopScan(); }
document.querySelectorAll('[data-mode]').forEach(b => b.onclick = () => {
  audio(); const m = b.dataset.mode, s = (Math.random()*1e9)|0; $('trophy').dataset.done = '';
  if(duel && duel.host){ if(!duel.connected) return; send({ t: 'go', mode: m, seed: s, name: myName() }); }
  startRace(m, s);
});
$('again').onclick = () => { $('trophy').dataset.done = ''; if(duel){ toMenu(); return; } startRace(mode, (Math.random()*1e9)|0); };
$('tomenu').onclick = () => { $('trophy').dataset.done = ''; toMenu(); };
$('pauseBtn').onclick = pause;

/* ---------- Live-Duell über MQTT-Vermittler (öffentliche Broker, kein Konto nötig) ---------- */
const BROKERS = ['wss://broker.hivemq.com:8884/mqtt', 'wss://broker.emqx.io:8084/mqtt', 'wss://test.mosquitto.org:8081'];
const TOPIC = (code, who) => `mam-lebendige-karten/rallye/v1/${code}/${who}`;
function loadMqtt(){ return new Promise((ok, no) => { if(window.mqtt) return ok(); const s = document.createElement('script'); s.src = 'https://unpkg.com/mqtt@5.10.1/dist/mqtt.min.js'; s.onload = () => window.mqtt ? ok() : no(); s.onerror = no; document.head.appendChild(s); setTimeout(no, 10000); }); }
function connectBroker(url){ return new Promise((ok, no) => {
  let done = false; const c = window.mqtt.connect(url, { clientId: 'mamr_' + Math.random().toString(36).slice(2, 10), clean: true, connectTimeout: 5000, reconnectPeriod: 2000, keepalive: 20 });
  c.on('connect', () => { if(!done){ done = true; ok(c); } });
  c.on('error', () => { if(!done){ done = true; try{ c.end(true); }catch(e){} no(); } });
  setTimeout(() => { if(!done){ done = true; try{ c.end(true); }catch(e){} no(); } }, 6000);
}); }
function send(o){ try{ if(duel && duel.client) duel.client.publish(duel.out, JSON.stringify(o), { qos: o.t === 'p' ? 0 : 1 }); }catch(e){} }
function handle(d){
  if(!duel) return; duel.lastRx = performance.now();
  if(d.t === 'hi' && duel.host){ const fresh = !duel.connected; duel.oppName = d.name || tx('opp'); duel.connected = true; send({ t: 'hello', name: myName() });
    if(fresh){ $('lobbyText').textContent = tx('connected'); setTimeout(() => { $('duelBanner').textContent = '🎮 ' + myName() + ' vs. ' + duel.oppName; if(state === 'menu') showUI('menu'); }, 900); } }
  else if(d.t === 'hello' && !duel.host){ duel.oppName = d.name || tx('opp'); duel.connected = true; if(duel.onHello) duel.onHello(); }
  else if(d.t === 'go' && !duel.host){ duel.oppName = d.name || duel.oppName; $('trophy').dataset.done = ''; startRace(d.mode, d.seed); }
  else if(d.t === 'p' && duel.opp){ Object.assign(duel.opp, { dist: d.d, x: d.x, speed: d.s, yaw: d.y, rollA: d.r, lift: d.l }); }
  else if(d.t === 'fin' && duel.opp){ duel.opp.fin = d.time; if(resultsShown) renderResults(); }
}
function wire(client, code, host){
  duel.client = client; duel.out = TOPIC(code, host ? 'h' : 'g');
  client.subscribe(TOPIC(code, host ? 'g' : 'h'), { qos: 1 });
  client.on('message', (t, m) => { try{ handle(JSON.parse(m.toString())); }catch(e){} });
}
setInterval(() => { if(!duel || !duel.client || !duel.connected) return; send({ t: 'ping' });
  const quiet = performance.now() - (duel.lastRx || 0) > 9000;
  if(quiet && !duel.warned){ duel.warned = true; say(tx('lost'), '#ffb703', 3); $('duelBanner').textContent = '⚠ ' + tx('lost'); }
  if(!quiet && duel.warned){ duel.warned = false; $('duelBanner').textContent = '🎮 ' + myName() + ' vs. ' + duel.oppName; } }, 2500);

$('btnHost').onclick = async () => {
  audio(); leaveDuel(); showUI('lobby'); $('lobbyText').textContent = tx('connecting'); $('qr').innerHTML = ''; $('code').textContent = '';
  try{
    await loadMqtt();
    const code = Array.from({length: 5}, () => 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[Math.floor(Math.random()*32)]).join('');
    for(let b=0;b<BROKERS.length;b++){
      let client; try{ client = await connectBroker(BROKERS[b]); }catch(e){ continue; }
      duel = { host: true, code, b }; wire(client, code, true);
      const url = location.href.replace(/[?#].*$/, '') + '?join=' + code + '&b=' + b + '&lang=' + LANG + (FIRMA ? '&firma=' + encodeURIComponent(FIRMA) : '');
      $('lobbyText').textContent = tx('wait'); $('code').textContent = code;
      try{ const q = qrcode(0, 'M'); q.addData(url); q.make(); $('qr').innerHTML = q.createSvgTag({ cellSize: 5, margin: 2 }); }catch(e){ $('qr').textContent = url; }
      return;
    }
    throw 0;
  }catch(e){ $('lobbyText').textContent = tx('noNet'); duel = null; }
};
function leaveDuel(){ if(duel && duel.client){ try{ duel.client.end(true); }catch(e){} } duel = null; $('duelBanner').textContent = ''; }
async function joinDuel(code, bHint){
  code = String(code || '').toUpperCase().replace(/[^A-Z0-9]/g, ''); if(code.length < 4) return;
  leaveDuel(); showUI('lobby'); $('qr').innerHTML = ''; $('code').textContent = code; $('lobbyText').textContent = tx('connecting');
  try{ await loadMqtt(); }catch(e){ $('lobbyText').textContent = tx('noNet'); return; }
  const order = [...BROKERS.keys()]; const bi = parseInt(bHint, 10); if(bi >= 0 && bi < BROKERS.length){ order.splice(order.indexOf(bi), 1); order.unshift(bi); }
  for(const b of order){
    let client; try{ client = await connectBroker(BROKERS[b]); }catch(e){ continue; }
    duel = { host: false, code, b }; wire(client, code, false);
    const ok = await new Promise(res => { duel.onHello = () => res(true); let n = 0; const iv = setInterval(() => { if(duel && duel.connected){ clearInterval(iv); return; } send({ t: 'hi', name: myName() }); if(++n > 6){ clearInterval(iv); res(false); } }, 800); });
    if(ok){ $('lobbyText').textContent = tx('waitHost'); $('duelBanner').textContent = '🎮 ' + myName() + ' vs. ' + duel.oppName; return; }
    try{ client.end(true); }catch(e){} duel = null;
  }
  $('lobbyText').textContent = tx('notFound');
}

/* ---------- QR-Scanner zum Beitreten ---------- */
let scanStream = null, scanTimer = null, detector = null;
function stopScan(){ if(scanTimer){ clearInterval(scanTimer); scanTimer = null; } if(scanStream){ scanStream.getTracks().forEach(t => t.stop()); scanStream = null; } }
function loadJsQR(){ return new Promise((ok, no) => { if(window.jsQR) return ok(); const s = document.createElement('script'); s.src = 'https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.js'; s.onload = ok; s.onerror = no; document.head.appendChild(s); }); }
function parseJoin(text){ try{ const u = new URL(text); const j = u.searchParams.get('join'); if(j) return [j, u.searchParams.get('b')]; }catch(e){} const m = /^[A-Za-z0-9]{4,6}$/.exec(String(text).trim()); return m ? [m[0], null] : null; }
$('btnJoin').onclick = async () => {
  audio(); leaveDuel(); showUI('joinOv'); $('scanMsg').textContent = tx('scanHint'); $('joinCode').value = '';
  try{
    scanStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
    const v = $('scanVid'); v.srcObject = scanStream; await v.play();
    if('BarcodeDetector' in window){ try{ detector = new BarcodeDetector({ formats: ['qr_code'] }); }catch(e){ detector = null; } }
    if(!detector) await loadJsQR();
    const c = document.createElement('canvas'), x = c.getContext('2d', { willReadFrequently: true });
    scanTimer = setInterval(async () => {
      if(!v.videoWidth) return;
      let txt = null;
      try{
        if(detector){ const r = await detector.detect(v); if(r.length) txt = r[0].rawValue; }
        else { const s = Math.min(1, 640/v.videoWidth); c.width = v.videoWidth*s; c.height = v.videoHeight*s; x.drawImage(v, 0, 0, c.width, c.height); const r = window.jsQR(x.getImageData(0, 0, c.width, c.height).data, c.width, c.height); if(r) txt = r.data; }
      }catch(e){}
      const j = txt && parseJoin(txt);
      if(j){ stopScan(); tone(1200, 0, .1); joinDuel(j[0], j[1]); }
    }, 250);
  }catch(e){ $('scanMsg').textContent = tx('noCam'); }
};
$('joinGo').onclick = () => { const j = parseJoin($('joinCode').value); if(j){ stopScan(); joinDuel(j[0], j[1]); } };
$('joinBack').onclick = () => { stopScan(); showUI('menu'); };
$('lobbyBack').onclick = () => { leaveDuel(); showUI('menu'); };

/* ---------- Start ---------- */
export function openMenu(){ showUI('menu'); const j = Q.get('join'); if(j && !duel) joinDuel(j, Q.get('b')); }
window.__rally = { startRace, tick, results, get P(){ return P; }, get state(){ return state; }, get trackLen(){ return trackLen; }, get cars(){ return cars; }, shift, curve: () => findSeg(P.dist + PLAYERZ).curve, get duel(){ return duel; } };
