// Dienstjubiläum: „Feuerwerk-Show“. Die gedruckten Raketen antippen – sie zischen in den Nachthimmel und explodieren in ihrer Farbe. Nach 12 Raketen startet das große Finale.
import { startCard, t } from '../core/card.js';
import { makeFx, makeFinale, hud2, best, peekBest, greeting, hint, MEL } from '../core/kit.js';
const OB = [
  { n: 'rakete1', x: 380, y: 452, w: 54, h: 148, cx: 407.0, cy: 532.2, px: 378.5, py: 483.5, pw: 54.5, ph: 101 },
  { n: 'rakete2', x: 421, y: 442, w: 51, h: 158, cx: 444.5, cy: 513.4, px: 421, py: 444.5, pw: 46, ph: 131 },
  { n: 'rakete3', x: 461, y: 438, w: 45, h: 162, cx: 484.7, cy: 510.7, px: 464.5, py: 439.5, pw: 43, ph: 134 },
  { n: 'rakete4', x: 497, y: 450, w: 50, h: 150, cx: 521.7, cy: 530.7, px: 498, py: 480.5, pw: 50.5, ph: 102 },
  { n: 'rakete5', x: 529, y: 460, w: 58, h: 140, cx: 556.6, cy: 541.9, px: 529.5, py: 491.5, pw: 57, ph: 103 } ];
const IMG = OB.map(b => { const a = new Image(); a.src = b.n + '.png'; const p = new Image(); p.src = b.n + '_platz.png'; return { spr: a, bg: p }; });
function spr(g, i, x, y, s = 1, r = 0, a = 1, fx = 1){ const b = OB[i]; if(!IMG[i].spr.complete) return; g.save(); g.globalAlpha = a; g.translate(x, y); g.rotate(r); g.scale(s*fx, s); g.drawImage(IMG[i].spr, -b.w/2, -b.h/2, b.w, b.h); g.restore(); }
function hole(g, i){ const b = OB[i]; if(IMG[i].bg.complete && IMG[i].bg.naturalWidth) g.drawImage(IMG[i].bg, b.px, b.py, b.pw, b.ph); }
const ctr = i => ({ x: OB[i].x + OB[i].w/2, y: OB[i].y + OB[i].h/2 });
function flick(track){ const now = performance.now(), tr = track.filter(p => now - p[2] < 140), a = tr[0] || track[0], b = track[track.length - 1], d = Math.max(16, b[2] - a[2]); return { vx: (b[0] - a[0])/d*1000, vy: (b[1] - a[1])/d*1000, x: b[0], y: b[1] }; }


const COL = [['#ff4a3a', '#ffd36a'], ['#3a8aff', '#ffffff'], ['#b05aff', '#ffd0ff'], ['#3fbf5f', '#e0ffd0'], ['#ff8a2a', '#ffe08a']], GOAL = 12;
let R, flying, fired, phase, fx, fin, tt, glow;
function burst(x, y, col, big, ctx){ const n = big ? 70 : 42; for(let k = 0; k < n; k++){ const a = k/n*Math.PI*2, v = (big ? 260 : 170)*(.7 + Math.random()*.5); R.sparks.push({ x, y, vx: Math.cos(a)*v, vy: Math.sin(a)*v, life: 1.4 + Math.random()*.5, t: 0, c: col[k % 2] }); }
  ctx.noise(0, .5, big ? .28 : .18, 300); ctx.tone(80, 0, .4, 'sine', .08); }
const scene = {
  title: t('jubilaeum.title'), subtitle: t('jubilaeum.sub'), emoji: '🎆', accent: '#ffd36a', button: '#2a3a8a', bg: '#0a1030',
  init(ctx){ fx = makeFx(); fin = makeFinale(); this.restart(ctx); },
  restart(ctx){ R = { cd: OB.map(() => 0), sparks: [] }; flying = []; fired = 0; phase = 'play'; tt = 0; glow = 0; fx.clear(); fin.stop(); },
  launch(i, ctx, h){ const b = OB[i]; flying.push({ i, x: b.x + b.w/2, y: b.y + b.h*.3, vy: -520 - Math.random()*80, top: h || 110 + Math.random()*180, t: 0, wob: Math.random()*6 }); R.cd[i] = 1.2; ctx.noise(0, .4, .08, 2500); ctx.tone(1200, 0, .3, 'sine', .02); },
  onTap(x, y, ctx){ if(phase !== 'play') return; let bi = -1, bd = 60; OB.forEach((b, i) => { const d = Math.hypot(x - (b.x + b.w/2), y - (b.y + b.h*.45)); if(d < bd && R.cd[i] <= 0){ bd = d; bi = i; } });
    if(bi < 0) return; this.launch(bi, ctx); fired++; if(fired >= GOAL){ phase = 'finale'; setTimeout(() => { OB.forEach((b, i) => setTimeout(() => this.launch(i, ctx, 90 + i*30), i*180)); }, 900); } },
  update(dt, ctx){ tt += dt; fx.update(dt); R.cd = R.cd.map(v => Math.max(0, v - dt)); glow = Math.max(0, glow - dt*.8);
    for(const f of flying){ f.t += dt; f.y += f.vy*dt; f.x += Math.sin(f.t*10 + f.wob)*.6; if(Math.random() < .8) R.sparks.push({ x: f.x, y: f.y + 10, vx: (Math.random() - .5)*30, vy: 60, life: .4, t: 0, c: '#ffd9a0' });
      if(f.y <= f.top){ f.done = true; burst(f.x, f.y, COL[f.i], phase === 'finale', ctx); glow = 1; } }
    flying = flying.filter(f => !f.done);
    for(const s of R.sparks){ s.t += dt; s.vy += 120*dt; s.vx *= Math.pow(.4, dt); s.vy *= Math.pow(.6, dt); s.x += s.vx*dt; s.y += s.vy*dt; }
    R.sparks = R.sparks.filter(s => s.t < s.life);
    if(phase === 'finale' && fired >= GOAL && !flying.length && tt > 3 && R.sparks.length < 20 && !this._f){ this._f = true; setTimeout(() => { phase = 'end'; ctx.melody([['C5', .25], ['E5', .25], ['G5', .25], ['C6', .5], ['G5', .25], ['C6', .75]], 200, 'triangle', .1); fin.start(ctx, greeting('jubilaeum'), [t('jubilaeum.line')], MEL.birthday); }, 600); } },
  draw(g, ctx){ const dt = 1/60;
    if(glow > 0){ g.save(); g.globalAlpha = glow*.35; g.globalCompositeOperation = 'lighter'; const r = g.createRadialGradient(262, 500, 10, 262, 500, 160); r.addColorStop(0, '#ffe8a0'); r.addColorStop(1, 'rgba(255,200,80,0)'); g.fillStyle = r; g.fillRect(100, 340, 330, 330); g.restore(); }
    OB.forEach((b, i) => { if(R.cd[i] > 0){ g.save(); g.globalAlpha = .55; g.fillStyle = '#0a1030'; g.fillRect(b.x + 4, b.y, b.w - 8, b.h*.72); g.restore(); spr(g, i, b.x + b.w/2, b.y + b.h/2, 1, 0, 1 - R.cd[i]/1.2); }
      else if(phase === 'play'){ const k = .3 + .3*Math.sin(tt*5 + i); g.save(); g.fillStyle = `rgba(255,220,120,${k})`; g.beginPath(); g.arc(b.x + b.w/2, b.y + 6, 5, 0, 7); g.fill(); g.restore(); } });
    for(const f of flying){ const b = OB[f.i]; g.save(); g.translate(f.x, f.y); g.drawImage(IMG[f.i].spr, -b.w*.3, -b.h*.3, b.w*.6, b.h*.6); g.restore(); }
    g.save(); g.globalCompositeOperation = 'lighter'; for(const s of R.sparks){ g.globalAlpha = Math.max(0, 1 - s.t/s.life); g.fillStyle = s.c; g.fillRect(s.x - 1.5, s.y - 1.5, 3, 3); } g.restore();
    fx.draw(g);
    if(!fin.on) hud2(g, '🎆 ' + Math.min(fired, GOAL) + '/' + GOAL, '', 846);
    if(!fin.on && fired === 0) hint(g, t('jubilaeum.hint'), tt, 700, 99);
    fin.draw(g, dt, 'rgba(5,10,30,', .15); } };
startCard(scene);
window.__jb = { OB, get fired(){ return fired; }, get phase(){ return phase; } };
