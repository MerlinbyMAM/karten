/* =====================================================================
   MAM Weihnachts-Rallye – Pseudo-3D-Rennspiel (Follow-me-Ansicht)
   Modi: Rennen, DTM, Rallye, Drag Race · Wischsteuerung · Drift, Schleudern, Überschlag
   Live-Duell (PeerJS) + Geisterauto (Bestzeit auf diesem Handy) · Pokal
   ===================================================================== */
import { tx, LANG } from './text.js';

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

/* ---------- Ton (ein AudioContext, nur nach Tippen) ---------- */
let ac = null, engine = null;
function audio(){ try{ if(!ac){ ac = new (window.AudioContext || window.webkitAudioContext)(); } if(ac.state !== 'running') ac.resume(); }catch(e){} }
addEventListener('touchend', audio, {passive: true}); addEventListener('click', audio);
function tone(f, t0 = 0, d = .2, type = 'square', v = .06){ if(!ac) return; const o = ac.createOscillator(), gn = ac.createGain(); o.type = type; o.frequency.value = f; gn.gain.setValueAtTime(0, ac.currentTime + t0); gn.gain.linearRampToValueAtTime(v, ac.currentTime + t0 + .01); gn.gain.exponentialRampToValueAtTime(.0005, ac.currentTime + t0 + d); o.connect(gn); gn.connect(ac.destination); o.start(ac.currentTime + t0); o.stop(ac.currentTime + t0 + d + .05); }
function noise(d = .3, v = .2, hp = 600){ if(!ac) return; const n = Math.floor(ac.sampleRate*d), b = ac.createBuffer(1, n, ac.sampleRate), a = b.getChannelData(0); for(let i=0;i<n;i++) a[i] = (Math.random()*2 - 1)*Math.pow(1 - i/n, 2); const s = ac.createBufferSource(); s.buffer = b; const f = ac.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = hp; const gn = ac.createGain(); gn.gain.value = v; s.connect(f); f.connect(gn); gn.connect(ac.destination); s.start(); }
function engineStart(){ if(!ac || engine) return; const o = ac.createOscillator(), o2 = ac.createOscillator(), gn = ac.createGain(), f = ac.createBiquadFilter(); o.type = 'sawtooth'; o2.type = 'square'; f.type = 'lowpass'; f.frequency.value = 900; gn.gain.value = .035; o.connect(f); o2.connect(f); f.connect(gn); gn.connect(ac.destination); o.start(); o2.start(); engine = { o, o2, gn }; }
function engineSet(rpm){ if(!engine) return; const f = 60 + rpm*160; engine.o.frequency.setTargetAtTime(f, ac.currentTime, .05); engine.o2.frequency.setTargetAtTime(f*.5, ac.currentTime, .05); }
function engineStop(){ if(!engine) return; try{ engine.gn.gain.setTargetAtTime(0, ac.currentTime, .1); engine.o.stop(ac.currentTime + .4); engine.o2.stop(ac.currentTime + .4); }catch(e){} engine = null; }

/* ---------- Strecke ---------- */
const SEG = 200, ROADW = 2000, RUMBLE = 3, FOV = 100, CAMH = 1000, DEPTH = 1/Math.tan(FOV/2*Math.PI/180), DRAW = 170;
const PLAYERZ = CAMH*DEPTH, MAXSPEED = SEG/(1/60);         // = 60 Segmente pro Sekunde
let segs = [], trackLen = 0;
const lastY = () => segs.length ? segs[segs.length - 1].p2.world.y : 0;
function addSeg(curve, y){ const n = segs.length; segs.push({ index: n, p1: { world: { y: lastY(), z: n*SEG }, camera: {}, screen: {} }, p2: { world: { y, z: (n + 1)*SEG }, camera: {}, screen: {} }, curve, sprites: [], cars: [], dark: Math.floor(n/RUMBLE) % 2 }); }
const easeIn = (a, b, p) => a + (b - a)*Math.pow(p, 2), easeInOut = (a, b, p) => a + (b - a)*((-Math.cos(p*Math.PI)/2) + .5);
function road(enter, hold, leave, curve, hill = 0){ const sy = lastY(), ey = sy + hill*SEG, tot = enter + hold + leave; let i;
  for(i=0;i<enter;i++) addSeg(easeIn(0, curve, i/enter), easeInOut(sy, ey, i/tot));
  for(i=0;i<hold;i++) addSeg(curve, easeInOut(sy, ey, (enter + i)/tot));
  for(i=0;i<leave;i++) addSeg(easeInOut(curve, 0, i/leave), easeInOut(sy, ey, (enter + hold + i)/tot)); }
function sprite(n, type, offset, extra){ if(segs[n]) segs[n].sprites.push(Object.assign({ type, offset }, extra || {})); }

// Sprite-Größen in Straßenbreiten (Breite, Seitenverhältnis H/B), ob ein Hindernis
const SP = { tree: [.55, 1.6], snowman: [.22, 1.4], banner: [1.0, .42], pump: [.18, 1.7], charger: [.14, 2.2], rock: [.3, .65], ped: [.09, 2.6], lamp: [.06, 6], cone: [.09, 1.2] };

function buildTrack(mode, seed){
  segs = []; srand(seed);
  if(mode === 'drag'){
    road(0, 700, 0, 0, 0);
  } else if(mode === 'rally'){
    road(0, 40, 0, 0, 0);
    for(let k=0;k<26;k++){
      const c = R(2, 6.5)*(rnd() < .5 ? -1 : 1), hill = R(-25, 25);
      road(R(10, 25)|0, R(10, 45)|0, R(10, 25)|0, c, hill);
      if(rnd() < .35) road(10, R(10, 40)|0, 10, 0, R(-15, 15));
    }
    road(20, 60, 20, 0, -lastY()/SEG);
  } else {
    const sharp = mode === 'dtm' ? 1.15 : 1;
    road(0, 60, 0, 0, 0);
    road(20, 40, 20, 3*sharp, 10); road(10, 50, 10, 0, 0); road(25, 30, 25, -4*sharp, -10);
    road(20, 25, 20, 5*sharp, 20); road(15, 60, 15, 0, 0); road(15, 25, 15, -2.5, 0); road(15, 25, 15, 2.5, -10);
    road(30, 20, 30, -6*sharp, 0); road(20, 90, 20, 0, 15); road(20, 30, 20, 4*sharp, -15); road(25, 40, 25, -3*sharp, 0);
    road(20, 60, 20, 0, -lastY()/SEG);
  }
  trackLen = segs.length*SEG;
  // Kulisse + Hindernisse
  const N = segs.length;
  for(let n=10;n<N;n+=(mode === 'drag' ? 6 : 4)){
    const side = (n/4) % 2 ? 1 : -1;
    sprite(n, rnd() < .85 ? 'tree' : 'snowman', side*R(1.3, 2.6), { lit: rnd() < .4 });
    if(rnd() < .6) sprite(n, 'tree', -side*R(1.4, 3.2), { lit: rnd() < .3 });
  }
  for(let n=40;n<N;n+=150) sprite(n, 'banner', -1.55);
  for(let n=110;n<N;n+=150) sprite(n, 'banner', 1.55);
  if(mode !== 'drag'){
    for(let n=60;n<N;n+=R(18, 45)|0){                          // Lade- und Tanksäulen am Rand
      sprite(n, rnd() < .5 ? 'charger' : 'pump', (rnd() < .5 ? -1 : 1)*R(1.15, 1.3), { hit: 1 });
    }
    const obstGap = mode === 'rally' ? [28, 55] : [70, 140];
    for(let n=120;n<N - 30;n+=R(obstGap[0], obstGap[1])|0){      // Hindernisse auf der Fahrbahn
      const r = rnd();
      if(mode === 'rally' && r < .3) sprite(n, 'ped', -1.1, { hit: 1, walk: R(.25, .45), dir: 1, ped: 1 });
      else if(r < .55) sprite(n, 'rock', R(-.65, .65), { hit: 1 });
      else if(r < .75) sprite(n, 'charger', R(-.6, .6), { hit: 1 });
      else if(r < .9) sprite(n, 'pump', R(-.6, .6), { hit: 1 });
      else { for(let i=0;i<3;i++) sprite(n + i*2, 'cone', R(-.7, .7), { hit: 1, soft: 1 }); }
    }
  }
  for(let n=0;n<N;n+=8) if(mode !== 'rally') sprite(n, 'lamp', (n/8) % 2 ? 1.1 : -1.1);
}
const findSeg = z => segs[Math.floor(z/SEG) % segs.length];
const pctRem = (n, total) => (n % total)/total;
const interp = (a, b, p) => a + (b - a)*p;
function project(p, camX, camY, camZ){
  p.camera.x = (p.world.x || 0) - camX; p.camera.y = (p.world.y || 0) - camY; p.camera.z = (p.world.z || 0) - camZ;
  p.screen.scale = DEPTH/p.camera.z;
  p.screen.x = Math.round(W/2 + p.screen.scale*p.camera.x*W/2);
  p.screen.y = Math.round(H*.56 - p.screen.scale*p.camera.y*H/2);
  p.screen.w = Math.round(p.screen.scale*ROADW*W/2);
}

/* ---------- Spielzustand ---------- */
let mode = 'race', state = 'menu', duel = null, ghost = null, ghostRec = [], ghostT = 0;
let P, cars, msgs, parts, raceT, countdown, laps, finishOrder, skyX, hillX, snow;
const LAPS = 3;
const CAR_COLS = ['#e63946', '#2a9d8f', '#f4a261', '#8338ec', '#ffbe0b', '#3a86ff', '#fb5607', '#06d6a0'];
const NAMES = ['Rudi', 'Blitzen', 'Komet', 'Donner', 'Cupid', 'Vixen', 'Dasher'];
function newPlayer(){ return { dist: 0, x: 0, speed: 0, steer: 0, brake: false, yaw: 0, drift: 0, spin: 0, roll: 0, rollA: 0, inv: 0, lap: 1, fin: 0, gear: 1, rpm: 0, smoke: 0 }; }

function startRace(m, seed){
  mode = m; buildTrack(m, seed); P = newPlayer(); cars = []; msgs = []; parts = []; raceT = 0; countdown = 3.2; finishOrder = []; skyX = 0; hillX = 0;
  snow = Array.from({length: 90}, () => ({ x: Math.random(), y: Math.random(), s: rr(.4, 1.2) }));
  const nAI = duel ? 0 : m === 'race' ? 3 : m === 'dtm' ? 7 : m === 'drag' ? 1 : 0;
  for(let i=0;i<nAI;i++){
    const grid = i + 1;
    cars.push({ ai: 1, name: NAMES[i], col: CAR_COLS[(i + 1) % CAR_COLS.length], dist: m === 'drag' ? PLAYERZ : PLAYERZ + grid*SEG*3, x: m === 'drag' ? .5 : (grid % 2 ? .45 : -.45), speed: 0,
      top: MAXSPEED*(m === 'dtm' ? rr(.84, .93) : rr(.8, .9)), lap: 1, fin: 0, skill: rr(.85, 1), shiftT: rr(.08, .2), gear: 1, rpm: 0, yaw: 0 });
  }
  if(m === 'drag') P.x = -.5;
  else if(!duel) P.x = 0;
  else P.x = duel.host ? -.45 : .45;
  // Geisterauto (Bestzeit auf diesem Handy) – in der Rallye und im Drag Race
  ghost = null; ghostRec = []; ghostT = 0;
  if(!duel && (m === 'rally' || m === 'drag')){ try{ const gd = JSON.parse(localStorage.getItem('mamrally_' + m) || 'null'); if(gd && gd.v === 1) ghost = gd; }catch(e){} }
  state = 'count'; showUI('hud'); engineStart(); tone(440, 0, .25);
}

function say(text, col = '#fff', t = 1.2){ msgs.push({ text, col, t, t0: t }); }
function puff(x, y, n, col, sp = 1){ for(let i=0;i<n;i++) parts.push({ x, y, vx: rr(-60, 60)*sp, vy: rr(-80, -20)*sp, r: rr(6, 16)*DPR, life: rr(.5, 1), c: col }); }

/* ---------- Eingabe: Wischen = Lenken, Bremsknopf ---------- */
let touchX = null, touchId = null;
function brakeZone(x, y){ return x < W*.28 && y > H*.78; }
cv.addEventListener('pointerdown', e => {
  audio(); const x = e.clientX*DPR, y = e.clientY*DPR;
  if(state === 'race' && mode === 'drag'){ shift(); return; }
  if(brakeZone(x, y)){ P && (P.brake = true); return; }
  touchX = x; touchId = e.pointerId; if(P) P.steerBase = P.steer;
});
cv.addEventListener('pointermove', e => { if(e.pointerId !== touchId || !P || touchX === null) return; P.steer = Math.max(-1, Math.min(1, (P.steerBase || 0) + (e.clientX*DPR - touchX)/(W*.22))); });
const up = e => { if(e.pointerId === touchId){ touchId = null; touchX = null; if(P) P.steer = 0; } if(P) P.brake = false; };
cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
addEventListener('keydown', e => { if(!P) return; if(e.key === 'ArrowLeft') P.steer = -1; if(e.key === 'ArrowRight') P.steer = 1; if(e.key === 'ArrowDown') P.brake = true; if(e.key === ' ' && mode === 'drag') shift(); });
addEventListener('keyup', e => { if(!P) return; if(e.key === 'ArrowLeft' || e.key === 'ArrowRight') P.steer = 0; if(e.key === 'ArrowDown') P.brake = false; });

/* ---------- Drag Race: Schalten ---------- */
function shift(){
  if(!P || P.fin || P.gear >= 6) return;
  const r = P.rpm;
  if(r < .78){ say(tx('wrong'), '#ffb703'); P.shiftBonus = .75; } else if(r <= .95){ say(tx('perfect'), '#06d6a0'); P.shiftBonus = 1.15; tone(1200, 0, .08); } else { say(tx('late'), '#ffb703'); P.shiftBonus = .9; }
  P.gear++; P.rpm = .45; tone(300, 0, .08, 'sawtooth', .05);
}
const DRAG_LEN = 640*SEG;

/* ---------- Physik ---------- */
function updatePlayer(dt){
  const seg = findSeg(P.dist + PLAYERZ), sp = P.speed/MAXSPEED;
  if(P.fin){ P.speed *= Math.pow(.4, dt); P.dist += P.speed*dt; return; }
  if(mode === 'drag'){
    const gearMax = [0, .32, .5, .66, .8, .92, 1][P.gear];
    P.rpm = Math.min(1.02, P.rpm + dt*(1.1 - P.gear*.12)*(P.shiftBonus || 1));
    if(P.rpm >= 1){ P.rpm = .97 + Math.random()*.05; } else P.speed = Math.min(MAXSPEED*gearMax, P.speed + MAXSPEED*dt*(.55 - P.gear*.05)*(P.shiftBonus || 1));
    P.dist += P.speed*dt; engineSet(P.rpm);
    if(P.dist >= DRAG_LEN) finishPlayer();
    return;
  }
  // Überschlag / Schleudern
  if(P.roll > 0){
    P.roll -= dt; P.rollA += dt*9; P.speed *= Math.pow(.2, dt); P.dist += P.speed*dt;
    if(P.roll <= 0){ P.x = 0; P.rollA = 0; P.yaw = 0; P.inv = 1.5; P.drift = 0; }
    return;
  }
  if(P.spin > 0){ P.spin -= dt; P.yaw += dt*12; P.speed *= Math.pow(.35, dt); if(P.spin <= 0) P.yaw = 0; }
  P.inv = Math.max(0, P.inv - dt);
  const offroad = Math.abs(P.x) > 1.02;
  // Gas automatisch, Bremse auf Knopfdruck
  let accel = MAXSPEED/5;
  if(P.brake) accel = -MAXSPEED*.9;
  if(offroad) accel = P.speed > MAXSPEED/3.5 ? -MAXSPEED*.9 : MAXSPEED/10;
  if(P.spin > 0) accel = 0;
  P.speed = Math.max(0, Math.min(MAXSPEED*(mode === 'dtm' ? .97 : 1), P.speed + accel*dt));
  // Lenken + Fliehkraft
  const dx = dt*2*sp;
  if(P.spin <= 0) P.x += dx*P.steer*1.25;
  P.x -= dx*sp*seg.curve*.2;
  // Drift: enge Kurve, hohes Tempo, Lenkung in die Kurve
  const tight = Math.abs(seg.curve) >= 3.5 && sp > .7 && P.steer*seg.curve > .35;
  if(tight && P.spin <= 0){ if(P.drift <= 0) say(tx('drift'), '#ffd166', .8); P.drift = .45; }
  if(P.drift > 0){
    P.drift -= dt; P.x -= dx*Math.sign(seg.curve)*.2; P.speed *= Math.pow(.75, dt); P.smoke += dt;
    P.yaw += ((Math.sign(seg.curve)*.42) - P.yaw)*Math.min(1, dt*8);
  } else if(P.spin <= 0) P.yaw += (P.steer*.12 - P.yaw)*Math.min(1, dt*8);
  // von der Fahrbahn: driftend -> Überschlag, schnell -> Schleudern
  if(!P.wasOff && Math.abs(P.x) > 1.05){
    if(P.drift > 0 && sp > .5){ P.roll = 1.6; say(tx('roll'), '#ff6b6b', 1.5); noise(.8, .35, 150); tone(90, .1, .6, 'sawtooth', .05); }
    else if(sp > .55){ P.spin = 1.0; say(tx('spin'), '#ffb703'); noise(.5, .25, 400); }
  }
  P.wasOff = Math.abs(P.x) > 1.05;
  P.x = Math.max(-2.4, Math.min(2.4, P.x));
  // Hindernisse
  if(P.inv <= 0) for(const s of seg.sprites){
    if(!s.hit || s.gone) continue;
    const sw = SP[s.type][0];
    if(Math.abs(P.x - s.offset) < (sw + .32)/2){
      if(s.ped){ s.dodge = 1; P.speed *= .15; say(tx('ped'), '#ff6b6b', 1.4); tone(660, 0, .15); tone(660, .2, .15); P.inv = 1; }
      else if(s.soft){ s.gone = 1; P.speed *= .85; tone(200, 0, .1, 'triangle'); puff(W/2, H*.84, 6, '#ff7b00'); }
      else { P.speed *= .3; P.spin = .7; say(tx('crash'), '#ff6b6b'); noise(.4, .35, 200); P.inv = .8; }
      break;
    }
  }
  // Autos
  for(const c of cars.concat(duel && duel.opp ? [duel.opp] : [])){
    if(c.fin && !c.ai) continue;
    const dz = ((c.dist - P.dist - PLAYERZ) % trackLen + trackLen) % trackLen;
    if(dz < SEG*1.2 && Math.abs(P.x - c.x) < .38 && P.speed > c.speed){ P.speed = c.speed*.85; say(tx('crash'), '#ffd166', .6); tone(180, 0, .1, 'square', .05); if(c.ai) c.speed *= 1.05; }
  }
  P.dist += P.speed*dt;
  // Runden
  const lapNow = Math.floor((P.dist + PLAYERZ)/trackLen) + 1;
  if(mode !== 'rally' && lapNow > P.lap){ P.lap = lapNow; if(P.lap > LAPS) finishPlayer(); else { say(tx('lap') + ' ' + P.lap + '/' + LAPS, '#9bf6ff'); tone(880, 0, .1); tone(1320, .1, .15); } }
  if(mode === 'rally' && P.dist + PLAYERZ >= trackLen - SEG*40) finishPlayer();
  engineSet(Math.min(1, sp*1.05));
}
function updateAI(c, dt){
  if(c.fin){ c.speed *= Math.pow(.5, dt); c.dist += c.speed*dt; return; }
  if(mode === 'drag'){
    const gearMax = [0, .32, .5, .66, .8, .92, 1][c.gear];
    c.rpm = Math.min(1, c.rpm + dt*(1.1 - c.gear*.12));
    if(c.rpm > .86 + c.skill*.06 - .05 && c.gear < 6){ c.gear++; c.rpm = .45; }
    c.speed = Math.min(MAXSPEED*gearMax, c.speed + MAXSPEED*dt*(.55 - c.gear*.05)*(.95 + c.skill*.12));
    c.dist += c.speed*dt; if(c.dist >= DRAG_LEN + PLAYERZ) aiFinish(c); return;
  }
  const seg = findSeg(c.dist), ahead = findSeg(c.dist + SEG*25);
  const want = c.top*(1 - Math.min(.3, Math.abs(ahead.curve)*.045))*(c.skill);
  c.speed += Math.sign(want - c.speed)*Math.min(Math.abs(want - c.speed), MAXSPEED*.25*dt);
  // ausweichen: Spieler und Hindernisse vor sich
  let tx_ = c.baseX ?? (c.baseX = c.x);
  for(let i=1;i<12;i++){ const s = segs[(seg.index + i) % segs.length]; for(const sp of s.sprites) if(sp.hit && !sp.gone && Math.abs(sp.offset - c.x) < .45) tx_ = sp.offset > 0 ? sp.offset - .7 : sp.offset + .7; }
  const dzp = ((P.dist + PLAYERZ - c.dist) % trackLen + trackLen) % trackLen;
  if(dzp < SEG*8 && Math.abs(P.x - c.x) < .5 && c.speed > P.speed) tx_ = P.x > 0 ? P.x - .65 : P.x + .65;
  tx_ = Math.max(-.8, Math.min(.8, tx_));
  c.x += (tx_ - c.x)*Math.min(1, dt*1.8); c.yaw = (tx_ - c.x)*.3;
  c.dist += c.speed*dt;
  const lap = Math.floor(c.dist/trackLen) + 1;
  if(mode !== 'rally' && lap > LAPS) aiFinish(c);
}
function aiFinish(c){ if(c.fin) return; c.fin = raceT; finishOrder.push(c.name); }
function finishPlayer(){
  if(P.fin) return; P.fin = raceT; finishOrder.push('__me'); say(tx('finish'), '#ffd166', 2);
  tone(784, 0, .2); tone(988, .2, .2); tone(1175, .4, .5);
  if(duel && duel.conn) send({ t: 'fin', time: raceT });
  // Geisterauto speichern, wenn Bestzeit
  if(!duel && (mode === 'rally' || mode === 'drag')){ try{ const old = JSON.parse(localStorage.getItem('mamrally_' + mode) || 'null'); if(!old || raceT < old.time) localStorage.setItem('mamrally_' + mode, JSON.stringify({ v: 1, time: raceT, s: ghostRec })); }catch(e){} }
  setTimeout(results, 2200);
}

/* ---------- Zeichnen ---------- */
function poly(x1, y1, x2, y2, x3, y3, x4, y4, c){ g.fillStyle = c; g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.lineTo(x3, y3); g.lineTo(x4, y4); g.closePath(); g.fill(); }
function drawSeg(x1, y1, w1, x2, y2, w2, dark, n){
  const snowC = dark ? '#dfe9ee' : '#eef5f8';
  g.fillStyle = snowC; g.fillRect(0, y2, W, y1 - y2);
  const r1 = w1/6, r2 = w2/6;
  poly(x1 - w1 - r1, y1, x1 - w1, y1, x2 - w2, y2, x2 - w2 - r2, y2, dark ? '#f77f00' : '#ffffff');
  poly(x1 + w1 + r1, y1, x1 + w1, y1, x2 + w2, y2, x2 + w2 + r2, y2, dark ? '#f77f00' : '#ffffff');
  poly(x1 - w1, y1, x1 + w1, y1, x2 + w2, y2, x2 - w2, y2, mode === 'rally' ? (dark ? '#8d99a6' : '#99a5b1') : (dark ? '#1e2a3a' : '#223044'));
  if(n % 6 < 3 && mode !== 'rally'){
    const l1 = w1/40, l2 = w2/40;
    for(const k of [-1/3, 1/3]) poly(x1 + k*2*w1 - l1, y1, x1 + k*2*w1 + l1, y1, x2 + k*2*w2 + l2, y2, x2 + k*2*w2 - l2, y2, '#ffb703');
  }
  if(n >= 0 && n < 4 && mode !== 'drag'){ for(let i=0;i<8;i++) poly(x1 - w1 + i*w1/4, y1, x1 - w1 + (i + 1)*w1/4, y1, x2 - w2 + (i + 1)*w2/4, y2, x2 - w2 + i*w2/4, y2, (i + n) % 2 ? '#111' : '#fff'); }
}
function drawSky(){
  const gr = g.createLinearGradient(0, 0, 0, H*.6); gr.addColorStop(0, '#0f3b4f'); gr.addColorStop(1, '#3f8c9a');
  g.fillStyle = gr; g.fillRect(0, 0, W, H*.62);
  g.fillStyle = 'rgba(255,255,240,.18)'; g.beginPath(); g.arc(W*.78 - skyX*W*.1, H*.16, W*.13, 0, 7); g.fill();
  g.fillStyle = '#fbfbf2'; g.beginPath(); g.arc(W*.78 - skyX*W*.1, H*.16, W*.09, 0, 7); g.fill();
  // Lichterkette wie auf der Karte
  g.strokeStyle = '#0b2533'; g.lineWidth = 2*DPR; g.beginPath(); g.moveTo(0, H*.03); g.quadraticCurveTo(W*.25, H*.07, W*.5, H*.03); g.quadraticCurveTo(W*.75, H*.07, W, H*.03); g.stroke();
  for(let i=0;i<9;i++){ const x = W*(i + .5)/9, y = H*.03 + Math.sin((x/W)*Math.PI*2 - Math.PI/2)*H*.02 + H*.02; g.fillStyle = (i + Math.floor(raceT*2)) % 3 ? '#f4a261' : '#fff7d6'; g.beginPath(); g.arc(x, y, 5*DPR, 0, 7); g.fill(); }
  // Hügel mit Tannen (Parallaxe)
  g.fillStyle = '#bfe3e6';
  g.beginPath(); g.moveTo(0, H*.58); for(let i=0;i<=20;i++){ const x = i/20*W; g.lineTo(x, H*.5 - Math.sin(i*1.3 + hillX*3)*H*.03 - Math.sin(i*.4 + hillX)*H*.04); } g.lineTo(W, H*.6); g.lineTo(0, H*.6); g.fill();
}
function drawTree(x, y, w, lit){ const h = w*1.6; g.fillStyle = '#5b3a29'; g.fillRect(x - w*.06, y - h*.18, w*.12, h*.18);
  for(let i=0;i<3;i++){ g.fillStyle = i % 2 ? '#2a7f6f' : '#1f6b5c'; g.beginPath(); g.moveTo(x, y - h*(.45 + i*.18) - h*.2); g.lineTo(x - w*(.5 - i*.12), y - h*(.12 + i*.2)); g.lineTo(x + w*(.5 - i*.12), y - h*(.12 + i*.2)); g.fill();
    g.fillStyle = '#fff'; g.fillRect(x - w*(.42 - i*.12), y - h*(.14 + i*.2), w*(.84 - i*.24), Math.max(1, h*.025)); }
  if(lit){ for(let i=0;i<6;i++){ g.fillStyle = (i + Math.floor(raceT*3)) % 2 ? '#ffd166' : '#f77f00'; g.beginPath(); g.arc(x + Math.sin(i*2.1)*w*.25, y - h*(.25 + i*.1), Math.max(1.5, w*.035), 0, 7); g.fill(); } }
  g.fillStyle = '#f4a261'; g.beginPath(); g.arc(x, y - h*.83, Math.max(2, w*.06), 0, 7); g.fill(); }
function drawSnowman(x, y, w){ g.fillStyle = '#fff'; g.beginPath(); g.arc(x, y - w*.4, w*.42, 0, 7); g.arc(x, y - w*1.05, w*.3, 0, 7); g.fill(); g.fillStyle = '#f77f00'; g.fillRect(x, y - w*1.08, w*.22, w*.06); g.fillStyle = '#222'; g.fillRect(x - w*.25, y - w*1.45, w*.5, w*.08); g.fillRect(x - w*.15, y - w*1.7, w*.3, w*.25); }
function drawPump(x, y, w){ const h = w*1.7; g.fillStyle = '#e63946'; g.fillRect(x - w/2, y - h, w, h); g.fillStyle = '#fff'; g.fillRect(x - w*.35, y - h*.85, w*.7, h*.25); g.fillStyle = '#222'; g.fillRect(x + w*.5, y - h*.6, w*.12, h*.5); g.fillStyle = '#ffb703'; g.font = `bold ${Math.max(6, w*.35)}px sans-serif`; g.textAlign = 'center'; g.fillText('⛽', x, y - h*.35); }
function drawCharger(x, y, w){ const h = w*2.2; g.fillStyle = '#123547'; g.fillRect(x - w/2, y - h, w, h); g.fillStyle = '#bfe3e6'; g.fillRect(x - w*.35, y - h*.9, w*.7, h*.28); g.fillStyle = '#f77f00'; g.beginPath(); g.moveTo(x + w*.08, y - h*.88); g.lineTo(x - w*.15, y - h*.74); g.lineTo(x, y - h*.74); g.lineTo(x - w*.08, y - h*.63); g.lineTo(x + w*.15, y - h*.78); g.lineTo(x, y - h*.78); g.fill(); g.strokeStyle = '#111'; g.lineWidth = Math.max(1, w*.06); g.beginPath(); g.moveTo(x + w*.5, y - h*.5); g.quadraticCurveTo(x + w, y - h*.3, x + w*.6, y - h*.1); g.stroke(); }
function drawRock(x, y, w){ const h = w*.65; g.fillStyle = '#6c757d'; g.beginPath(); g.moveTo(x - w/2, y); g.lineTo(x - w*.4, y - h*.6); g.lineTo(x - w*.1, y - h); g.lineTo(x + w*.3, y - h*.85); g.lineTo(x + w/2, y - h*.3); g.lineTo(x + w/2, y); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.moveTo(x - w*.35, y - h*.65); g.lineTo(x - w*.1, y - h); g.lineTo(x + w*.3, y - h*.85); g.lineTo(x + w*.2, y - h*.72); g.lineTo(x - w*.15, y - h*.82); g.fill(); }
function drawPed(x, y, w, s){ const h = w*2.6, j = s.dodge ? Math.max(0, 1 - (s.dt || 0)) : 0; y -= j*h*.3;
  g.fillStyle = '#264653'; g.fillRect(x - w*.3, y - h*.45, w*.22, h*.45); g.fillRect(x + w*.08, y - h*.45, w*.22, h*.45);
  g.fillStyle = s.col || '#e76f51'; g.fillRect(x - w*.45, y - h*.82, w*.9, h*.4); g.fillStyle = '#f4a261'; g.fillRect(x - w*.45, y - h*.8, w*.9, h*.08);
  g.fillStyle = '#f1c27d'; g.beginPath(); g.arc(x, y - h*.9, w*.28, 0, 7); g.fill(); g.fillStyle = '#c1121f'; g.beginPath(); g.moveTo(x - w*.3, y - h*.95); g.lineTo(x + w*.3, y - h*.95); g.lineTo(x + w*.1, y - h*1.15); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.arc(x + w*.12, y - h*1.15, w*.08, 0, 7); g.fill(); }
function drawCone(x, y, w){ g.fillStyle = '#f77f00'; g.beginPath(); g.moveTo(x - w/2, y); g.lineTo(x, y - w*1.2); g.lineTo(x + w/2, y); g.fill(); g.fillStyle = '#fff'; g.fillRect(x - w*.25, y - w*.6, w*.5, w*.15); }
function drawLamp(x, y, w){ const h = w*6; g.fillStyle = '#334'; g.fillRect(x - w*.15, y - h, w*.3, h); g.fillStyle = 'rgba(255,220,140,.9)'; g.beginPath(); g.arc(x, y - h, w*.6, 0, 7); g.fill(); }
function drawBanner(x, y, w){ const h = w*.42; g.fillStyle = '#2b2d42'; g.fillRect(x - w*.47, y - h*1.6, w*.04, h*1.6); g.fillRect(x + w*.43, y - h*1.6, w*.04, h*1.6);
  g.fillStyle = '#0f3b4f'; g.fillRect(x - w/2, y - h*1.6, w, h); g.strokeStyle = '#f77f00'; g.lineWidth = Math.max(1, w*.02); g.strokeRect(x - w/2, y - h*1.6, w, h);
  g.fillStyle = '#fff'; g.textAlign = 'center'; g.textBaseline = 'middle'; const txt = FIRMA ? tx('merry') + ' · ' + FIRMA : tx('merry') + '!';
  let fs = h*.38; g.font = `bold ${fs}px Georgia`; while(g.measureText(txt).width > w*.9 && fs > 4){ fs *= .9; g.font = `bold ${fs}px Georgia`; } g.fillText(txt, x, y - h*1.1); }
function drawSprite(s, x, y, w){
  if(w < 2 || s.gone) return;
  switch(s.type){ case 'tree': return drawTree(x, y, w, s.lit); case 'snowman': return drawSnowman(x, y, w); case 'pump': return drawPump(x, y, w); case 'charger': return drawCharger(x, y, w);
    case 'rock': return drawRock(x, y, w); case 'ped': return drawPed(x, y, w, s); case 'cone': return drawCone(x, y, w); case 'lamp': return drawLamp(x, y, w); case 'banner': return drawBanner(x, y, w); }
}
// Auto von hinten (Follow-me); yaw zeigt die Seite (Drift), rollA dreht es beim Überschlag
function drawCar(x, y, w, col, yaw = 0, rollA = 0, alpha = 1, me = false){
  const h = w*.62; g.save(); g.globalAlpha = alpha; g.translate(x, y - h*.5); if(rollA){ g.translate(0, -Math.abs(Math.sin(rollA/2))*h*1.2); g.rotate(rollA); }
  g.fillStyle = 'rgba(0,0,0,.35)'; g.beginPath(); g.ellipse(0, h*.5, w*.55, h*.12, 0, 0, 7); g.fill();
  const side = Math.max(-1, Math.min(1, yaw))*w*.2;
  // Seitenwand (sichtbar beim Driften)
  if(Math.abs(side) > 1){ g.fillStyle = shade(col, -40); g.beginPath(); g.moveTo(Math.sign(side)*w*.5, -h*.1); g.lineTo(Math.sign(side)*w*.38 + side, -h*.16); g.lineTo(Math.sign(side)*w*.45 + side, h*.3); g.lineTo(Math.sign(side)*w*.5, h*.38); g.fill(); g.fillStyle = '#111'; g.fillRect(Math.sign(side)*w*.47 + side*.6 - w*.06, h*.22, w*.12, h*.2); }
  g.fillStyle = '#111'; g.fillRect(-w*.46, h*.25, w*.16, h*.25); g.fillRect(w*.3, h*.25, w*.16, h*.25);
  g.fillStyle = col; g.beginPath(); g.moveTo(-w*.5, h*.35); g.lineTo(-w*.5, -h*.05); g.lineTo(-w*.38, -h*.12); g.lineTo(w*.38, -h*.12); g.lineTo(w*.5, -h*.05); g.lineTo(w*.5, h*.35); g.closePath(); g.fill();
  g.fillStyle = '#f4a261'; g.fillRect(-w*.5, h*.12, w, h*.08);                               // Zierstreifen wie auf der Karte
  g.fillStyle = shade(col, -25); g.beginPath(); g.moveTo(-w*.36, -h*.12); g.lineTo(-w*.27, -h*.5); g.lineTo(w*.27, -h*.5); g.lineTo(w*.36, -h*.12); g.fill();
  g.fillStyle = '#9fd3e0'; g.beginPath(); g.moveTo(-w*.3, -h*.15); g.lineTo(-w*.23, -h*.44); g.lineTo(w*.23, -h*.44); g.lineTo(w*.3, -h*.15); g.fill();
  g.fillStyle = '#ff2d2d'; g.fillRect(-w*.47, -h*.02, w*.16, h*.09); g.fillRect(w*.31, -h*.02, w*.16, h*.09);
  if(P && me && P.brake){ g.fillStyle = 'rgba(255,40,40,.5)'; g.beginPath(); g.arc(-w*.39, h*.02, w*.12, 0, 7); g.arc(w*.39, h*.02, w*.12, 0, 7); g.fill(); }
  g.fillStyle = '#e9ecef'; g.fillRect(-w*.12, h*.2, w*.24, h*.08);
  if(me){ // Geweih + Geschenke auf dem Dach wie auf der Karte
    g.strokeStyle = '#7f4f24'; g.lineWidth = Math.max(2, w*.025); g.lineCap = 'round';
    for(const sx of [-1, 1]){ g.beginPath(); g.moveTo(sx*w*.12, -h*.5); g.lineTo(sx*w*.2, -h*.72); g.lineTo(sx*w*.3, -h*.8); g.moveTo(sx*w*.2, -h*.72); g.lineTo(sx*w*.14, -h*.82); g.stroke(); }
    g.fillStyle = '#f77f00'; g.fillRect(-w*.08, -h*.62, w*.16, h*.12); g.fillStyle = '#fff'; g.fillRect(-w*.01, -h*.62, w*.02, h*.12);
  }
  g.restore();
}
function shade(hex, p){ const n = parseInt(hex.slice(1), 16); const c = v => Math.max(0, Math.min(255, v + p)); return `rgb(${c(n >> 16)},${c((n >> 8) & 255)},${c(n & 255)})`; }

function render(){
  g.clearRect(0, 0, W, H); drawSky();
  const base = findSeg(P.dist), bp = pctRem(P.dist, SEG), pseg = findSeg(P.dist + PLAYERZ), pp = pctRem(P.dist + PLAYERZ, SEG);
  const py = interp(pseg.p1.world.y, pseg.p2.world.y, pp);
  let maxy = H, x = 0, dx = -(base.curve*bp);
  const camX = P.x*ROADW, camY = py + CAMH;
  for(let n=0;n<DRAW;n++){
    const s = segs[(base.index + n) % segs.length]; s.looped = s.index < base.index; s.clip = maxy;
    if(mode === 'drag' && base.index + n >= segs.length){ s.clip = 0; continue; }
    const cz = P.dist - (s.looped ? trackLen : 0);
    project(s.p1, camX - x, camY, cz); project(s.p2, camX - x - dx, camY, cz);
    x += dx; dx += s.curve;
    if(s.p1.camera.z <= DEPTH || s.p2.screen.y >= s.p1.screen.y || s.p2.screen.y >= maxy) continue;
    drawSeg(s.p1.screen.x, s.p1.screen.y, s.p1.screen.w, s.p2.screen.x, s.p2.screen.y, s.p2.screen.w, s.dark, s.index);
    maxy = s.p1.screen.y;
  }
  // Autos den Segmenten zuordnen
  for(const s of segs) s.cars.length = 0;
  const others = cars.slice();
  if(duel && duel.opp && duel.opp.dist !== undefined) others.push(duel.opp);
  if(ghost){ const gs = ghostAt(raceT); if(gs) others.push({ dist: gs[0] + PLAYERZ, x: gs[1], col: '#ffffff', ghost: 1, yaw: 0 }); }
  for(const c of others){ const z = ((c.dist % trackLen) + trackLen) % trackLen; if(mode === 'drag' && c.dist > DRAG_LEN + PLAYERZ + SEG*20) continue; findSeg(z).cars.push(c); }
  // von hinten nach vorn
  for(let n=DRAW - 1;n>0;n--){
    const s = segs[(base.index + n) % segs.length];
    if(s.p1.camera.z <= DEPTH) continue;
    g.save(); g.beginPath(); g.rect(0, 0, W, s.clip); g.clip();
    for(const c of s.cars){
      const z = ((c.dist % trackLen) + trackLen) % trackLen, p = pctRem(z, SEG);
      const sc = interp(s.p1.screen.scale, s.p2.screen.scale, p), cx = interp(s.p1.screen.x, s.p2.screen.x, p) + sc*c.x*ROADW*W/2, cy = interp(s.p1.screen.y, s.p2.screen.y, p);
      const cw = sc*ROADW*W/2*.36;
      if(cw > 2) drawCar(cx, cy, cw, c.col, c.yaw || 0, c.rollA || 0, c.ghost ? .45 : 1);
      if(c.name && cw > 18){ g.fillStyle = '#fff'; g.font = `bold ${Math.max(9, cw*.16)}px sans-serif`; g.textAlign = 'center'; g.fillText(c.name, cx, cy - cw*.8); }
    }
    for(const sp of s.sprites){
      const sc = s.p1.screen.scale, sx = s.p1.screen.x + sc*sp.offset*ROADW*W/2, sw = sc*ROADW*W/2*SP[sp.type][0];
      if(sp.ped && sp.dodge){ sp.dt = (sp.dt || 0) + 1/60; sp.offset += (sp.offset < 0 ? -1 : 1)*.03; }
      else if(sp.ped && state === 'race'){ sp.offset += sp.walk*sp.dir/60*.6; if(Math.abs(sp.offset) > 1.15) sp.dir *= -1; }
      drawSprite(sp, sx, s.p1.screen.y, sw);
    }
    g.restore();
  }
  // eigenes Auto
  const cw = Math.min(W*.34, H*.3), cxp = W/2 + (P.spin > 0 ? Math.sin(P.yaw*2)*W*.03 : 0), cyp = H*.93 - (pseg.p2.world.y - pseg.p1.world.y)*.0*H;
  if(P.drift > 0 || P.smoke > 0) if(Math.random() < .7) puff(cxp + rr(-cw*.4, cw*.4), cyp - cw*.1, 1, 'rgba(240,240,240,.8)', .6);
  if(Math.abs(P.x) > 1.02 && P.speed > MAXSPEED*.2) puff(cxp + rr(-cw*.4, cw*.4), cyp, 1, 'rgba(255,255,255,.9)', 1);
  for(const p of parts){ g.globalAlpha = Math.max(0, p.life); g.fillStyle = p.c; g.beginPath(); g.arc(p.x, p.y, p.r, 0, 7); g.fill(); }
  g.globalAlpha = 1;
  drawCar(cxp, cyp, cw, '#3aa59b', P.spin > 0 ? Math.sin(P.yaw)*1.2 : P.yaw*2.2, P.rollA, P.inv > 0 && Math.floor(raceT*10) % 2 ? .5 : 1, true);
  // Schnee
  g.fillStyle = 'rgba(255,255,255,.85)';
  for(const f of snow){ g.beginPath(); g.arc(f.x*W, f.y*H, f.s*2.4*DPR, 0, 7); g.fill(); }
  drawHUD();
}
function ghostAt(t){ if(!ghost) return null; const i = Math.floor(t*10); const s = ghost.s; if(!s.length) return null; return s[Math.min(i, s.length - 1)]; }

function fmt(t){ const m = Math.floor(t/60), s = t - m*60; return (m ? m + ':' : '') + (s < 10 && m ? '0' : '') + s.toFixed(2); }
function position(){
  if(mode === 'rally') return 1;
  const me = P.fin ? -1e9 + P.fin : -(P.dist + PLAYERZ);
  const list = cars.map(c => c.fin ? -1e9 + c.fin : -c.dist);
  if(duel && duel.opp) list.push(duel.opp.fin ? -1e9 + duel.opp.fin : -duel.opp.dist);
  return 1 + list.filter(v => v < me).length;
}
function drawHUD(){
  const s = DPR, pad = 14*s;
  g.fillStyle = 'rgba(11,37,51,.7)'; g.fillRect(0, 0, W, 54*s);
  g.fillStyle = '#fff'; g.font = `bold ${20*s}px system-ui, sans-serif`; g.textBaseline = 'middle';
  g.textAlign = 'left'; g.fillText('⏱ ' + fmt(raceT), pad, 28*s);
  g.textAlign = 'center';
  if(mode === 'rally') g.fillText(ghost ? '👻 ' + fmt(ghost.time) : tx('m_rally'), W/2, 28*s);
  else if(mode === 'drag') g.fillText(tx('m_drag') + ' ' + Math.min(400, Math.round(P.dist/DRAG_LEN*400)) + ' m', W/2, 28*s);
  else g.fillText(tx('lap') + ' ' + Math.min(P.lap, LAPS) + '/' + LAPS, W/2, 28*s);
  g.textAlign = 'right'; g.fillText(mode === 'rally' ? '' : tx('pos') + ' ' + position() + '/' + (1 + cars.length + (duel && duel.opp ? 1 : 0)), W - pad, 28*s);
  // Tacho
  g.textAlign = 'right'; g.font = `bold ${30*s}px system-ui, sans-serif`; g.fillStyle = '#fff';
  g.fillText(Math.round(P.speed/MAXSPEED*(mode === 'drag' ? 320 : 240)), W - pad, H - 60*s); g.font = `${14*s}px system-ui`; g.fillText(tx('kmh'), W - pad, H - 36*s);
  if(mode === 'drag'){
    const bw = W*.6, bx = W*.2, by = H*.7, bh = 22*s;
    g.fillStyle = 'rgba(0,0,0,.5)'; g.fillRect(bx, by, bw, bh);
    g.fillStyle = 'rgba(6,214,160,.6)'; g.fillRect(bx + bw*.78, by, bw*.17, bh); g.fillStyle = 'rgba(239,35,60,.7)'; g.fillRect(bx + bw*.95, by, bw*.05, bh);
    g.fillStyle = '#fff'; g.fillRect(bx + bw*Math.min(1, P.rpm) - 3*s, by - 6*s, 6*s, bh + 12*s);
    g.font = `bold ${16*s}px system-ui`; g.textAlign = 'center'; g.fillText((P.gear < 6 ? tx('shift') + '  ' : '') + '⚙ ' + P.gear, W/2, by - 18*s);
  } else {
    // Bremsknopf
    g.fillStyle = P.brake ? 'rgba(239,35,60,.85)' : 'rgba(239,35,60,.45)'; g.beginPath(); g.arc(W*.13, H*.88, 38*s, 0, 7); g.fill();
    g.fillStyle = '#fff'; g.font = `bold ${13*s}px system-ui`; g.textAlign = 'center'; g.fillText(tx('brake'), W*.13, H*.88);
  }
  // Countdown
  if(state === 'count'){ const n = Math.ceil(countdown - .2); g.font = `bold ${110*s}px Georgia`; g.textAlign = 'center'; g.fillStyle = n > 0 ? '#ffd166' : '#06d6a0'; g.strokeStyle = 'rgba(0,0,0,.6)'; g.lineWidth = 8*s; const tt = n > 0 ? String(n) : tx('go'); g.strokeText(tt, W/2, H*.35); g.fillText(tt, W/2, H*.35);
    g.font = `bold ${18*s}px system-ui`; g.fillStyle = '#fff'; g.fillText(mode === 'drag' ? tx('m_drag_d') : tx('steer'), W/2, H*.46); if(ghost) g.fillText(tx('ghost'), W/2, H*.5); }
  // Meldungen
  let y = H*.28;
  for(const m of msgs){ g.globalAlpha = Math.min(1, m.t/m.t0*2); g.font = `italic bold ${34*s}px Georgia`; g.textAlign = 'center'; g.lineWidth = 6*s; g.strokeStyle = 'rgba(11,37,51,.85)'; g.fillStyle = m.col; g.strokeText(m.text, W/2, y); g.fillText(m.text, W/2, y); y += 44*s; }
  g.globalAlpha = 1;
}

/* ---------- Hauptschleife ---------- */
let last = performance.now(), netT = 0;
function loop(now){
  const dt = Math.min(.05, (now - last)/1000); last = now;
  if(state === 'count' || state === 'race' || state === 'done'){
    if(state === 'count'){ const before = Math.ceil(countdown - .2); countdown -= dt; const after = Math.ceil(countdown - .2); if(after !== before){ if(after > 0) tone(440, 0, .2); else tone(880, 0, .45); } if(countdown <= 0) state = 'race'; }
    if(state === 'race' || state === 'done'){
      raceT += state === 'race' && !P.fin ? dt : 0;
      updatePlayer(dt); for(const c of cars) updateAI(c, dt);
      if(!P.fin){ ghostT += dt; if(ghostT >= .1){ ghostT -= .1; ghostRec.push([Math.round(P.dist), +P.x.toFixed(2)]); } }
      if(duel && duel.conn){ netT += dt; if(netT > .08){ netT = 0; send({ t: 'p', d: P.dist + PLAYERZ, x: P.x, s: P.speed, y: P.yaw, r: P.rollA }); } }
    }
    skyX += dt*(P.speed/MAXSPEED)*findSeg(P.dist).curve*.02; hillX += dt*(P.speed/MAXSPEED)*findSeg(P.dist).curve*.03;
    for(const f of snow){ f.y += dt*f.s*.18*(1 + P.speed/MAXSPEED); f.x += dt*.02*Math.sin(f.y*6) - dt*(P.steer || 0)*.05*P.speed/MAXSPEED; if(f.y > 1){ f.y = 0; f.x = Math.random(); } }
    for(const p of parts){ p.x += p.vx*dt; p.y += p.vy*dt; p.life -= dt; p.r *= 1 + dt; }
    parts = parts.filter(p => p.life > 0);
    for(const m of msgs) m.t -= dt; msgs = msgs.filter(m => m.t > 0);
    render();
  }
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

/* ---------- Ergebnis + Pokal ---------- */
function results(){
  state = 'done'; engineStop();
  const place = mode === 'rally' ? (ghost && P.fin > ghost.time ? 2 : 1) : position();
  const duelLost = duel && duel.opp && duel.opp.fin && duel.opp.fin < P.fin;
  const won = duel ? !duelLost : place === 1;
  $('resTitle').textContent = won ? tx('win') : tx('yourPlace', { n: duel ? 2 : place });
  $('resTime').textContent = tx('time') + ': ' + fmt(P.fin) + (mode === 'rally' && ghost ? '  ·  ' + tx('best', { t: fmt(Math.min(ghost.time, P.fin)) }) : '');
  const name = ($('pname').value || '').trim() || tx('you');
  $('trophy').style.display = won ? 'block' : 'none';
  if(won) drawTrophy($('trophy'), name);
  showUI('res');
  if(won){ [523, 659, 784, 1047, 784, 1047].forEach((f, i) => tone(f, i*.16, .3, 'triangle', .08)); }
}
function drawTrophy(c, name){
  const x = c.getContext('2d'), w = c.width = 600, h = c.height = 700;
  const gr = x.createLinearGradient(150, 0, 450, 0); gr.addColorStop(0, '#a67c00'); gr.addColorStop(.35, '#fce38a'); gr.addColorStop(.6, '#d4a017'); gr.addColorStop(1, '#8a6a12');
  x.fillStyle = gr;
  x.beginPath(); x.moveTo(170, 90); x.lineTo(430, 90); x.quadraticCurveTo(440, 300, 330, 360); x.lineTo(270, 360); x.quadraticCurveTo(160, 300, 170, 90); x.fill();
  x.lineWidth = 22; x.strokeStyle = gr; x.beginPath(); x.arc(170, 170, 60, Math.PI*.5, Math.PI*1.5); x.stroke(); x.beginPath(); x.arc(430, 170, 60, -Math.PI*.5, Math.PI*.5); x.stroke();
  x.fillRect(280, 360, 40, 90); x.fillRect(200, 450, 200, 30); x.fillStyle = '#2b2d42'; x.fillRect(180, 480, 240, 90);
  x.fillStyle = 'rgba(255,255,255,.5)'; x.fillRect(205, 110, 18, 160);
  x.fillStyle = '#fff'; x.textAlign = 'center'; x.font = 'bold 54px Georgia'; x.fillText('★', 300, 230);
  x.fillStyle = '#ffd166'; x.font = 'bold 26px Georgia'; x.fillText(tx('trophy'), 300, 512);
  let fs = 34; x.font = `bold ${fs}px Georgia`; while(x.measureText(name).width > 220 && fs > 14){ fs--; x.font = `bold ${fs}px Georgia`; } x.fillText(name, 300, 550);
  x.fillStyle = '#fff'; x.font = 'italic 26px Georgia'; x.fillText(tx('merry') + (FIRMA ? '' : '!'), 300, 620); if(FIRMA){ x.font = 'bold 28px Georgia'; x.fillText(FIRMA, 300, 660); }
}

/* ---------- Menü / Oberfläche ---------- */
function showUI(which){ for(const id of ['menu', 'lobby', 'res']) $(id).style.display = id === which ? 'flex' : 'none'; $('hudtip').style.display = 'none'; }
document.querySelectorAll('[data-mode]').forEach(b => b.onclick = () => { audio(); const m = b.dataset.mode; if(duel && duel.host && duel.conn){ duel.mode = m; duel.seed = (Math.random()*1e9)|0; send({ t: 'go', mode: m, seed: duel.seed, name: $('pname').value }); startRace(m, duel.seed); } else if(!duel) startRace(m, (Math.random()*1e9)|0); });
$('again').onclick = () => { if(duel && duel.conn){ if(duel.host) showUI('menu'); else showUI('lobby'); } else startRace(mode, (Math.random()*1e9)|0); };
$('tomenu').onclick = () => { showUI('menu'); };

/* ---------- Live-Duell über PeerJS (zwei Handys) ---------- */
function send(o){ try{ duel && duel.conn && duel.conn.open && duel.conn.send(o); }catch(e){} }
function loadPeer(){ return new Promise((ok, no) => { if(window.Peer) return ok(); const s = document.createElement('script'); s.src = 'https://unpkg.com/peerjs@1.5.4/dist/peerjs.min.js'; s.onload = ok; s.onerror = no; document.head.appendChild(s); setTimeout(no, 8000); }); }
function wire(conn){
  duel.conn = conn;
  conn.on('data', d => {
    if(d.t === 'p'){ duel.opp = Object.assign(duel.opp || { col: '#e63946', name: duel.oppName || tx('opp') }, { dist: d.d, x: d.x, speed: d.s, yaw: d.y, rollA: d.r }); }
    else if(d.t === 'go'){ duel.oppName = d.name || tx('opp'); duel.opp = null; startRace(d.mode, d.seed); }
    else if(d.t === 'fin'){ duel.opp = duel.opp || {}; duel.opp.fin = d.time; }
    else if(d.t === 'hi'){ duel.oppName = d.name || tx('opp'); $('lobbyText').textContent = tx('connected'); if(duel.host){ setTimeout(() => { $('duelBanner').textContent = '🎮 ' + tx('duel') + ': ' + duel.oppName; showUI('menu'); }, 900); } }
  });
  conn.on('open', () => send({ t: 'hi', name: $('pname').value }));
  conn.on('close', () => { duel.conn = null; say(tx('noNet'), '#ffb703', 3); });
}
$('btnDuel').onclick = async () => {
  audio(); showUI('lobby'); $('lobbyText').textContent = '…'; $('qr').innerHTML = '';
  try{
    await loadPeer();
    const code = Array.from({length: 4}, () => 'ABCDEFGHJKLMNPQRSTUVWXYZ'[Math.floor(Math.random()*24)]).join('');
    duel = { host: true, code };
    const peer = new Peer('mamrally-' + code); duel.peer = peer;
    peer.on('open', () => {
      const url = location.href.replace(/[?#].*$/, '') + '?join=' + code + '&lang=' + LANG + (FIRMA ? '&firma=' + encodeURIComponent(FIRMA) : '');
      $('lobbyText').textContent = tx('wait'); $('code').textContent = code;
      try{ const q = qrcode(0, 'M'); q.addData(url); q.make(); $('qr').innerHTML = q.createSvgTag({ cellSize: 5, margin: 2 }); }catch(e){ $('qr').textContent = url; }
    });
    peer.on('connection', c => wire(c));
    peer.on('error', () => { $('lobbyText').textContent = tx('noNet'); duel = null; });
  }catch(e){ $('lobbyText').textContent = tx('noNet'); duel = null; }
};
async function joinDuel(code){
  showUI('lobby'); $('lobbyText').textContent = '…'; $('code').textContent = code;
  try{
    await loadPeer();
    duel = { host: false, code }; const peer = new Peer(); duel.peer = peer;
    peer.on('open', () => wire(peer.connect('mamrally-' + code, { reliable: true })));
    peer.on('error', () => { $('lobbyText').textContent = tx('noNet'); duel = null; setTimeout(() => showUI('menu'), 2500); });
  }catch(e){ $('lobbyText').textContent = tx('noNet'); duel = null; setTimeout(() => showUI('menu'), 2500); }
}

/* ---------- Start ---------- */
export function openMenu(){ showUI('menu'); const j = Q.get('join'); if(j && !duel) joinDuel(j.toUpperCase()); }
window.__rally = { startRace, get P(){ return P; }, get state(){ return state; }, get trackLen(){ return trackLen; }, get cars(){ return cars; }, shift, curve: () => findSeg(P.dist + PLAYERZ).curve };
