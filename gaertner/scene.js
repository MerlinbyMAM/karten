// Gärtner: „Unkraut-Alarm!“ Die gedruckten Löwenzähne mit einem Wisch nach oben samt Wurzel aus dem Hochbeet ziehen – aber sie wachsen frech nach. 30 Sekunden.
import { startCard, t } from '../core/card.js';
import { makeFx, makeFinale, hud2, best, peekBest, greeting, hint, MEL } from '../core/kit.js';
const OB = [
  { n: 'l1', x: 18, y: 500, w: 130, h: 112, cx: 81.4, cy: 560.2, px: 9, py: 491, pw: 148, ph: 130 },
  { n: 'l2', x: 148, y: 510, w: 134, h: 118, cx: 211.9, cy: 571.3, px: 139, py: 506.5, pw: 142.5, ph: 130.5 },
  { n: 'l3', x: 282, y: 515, w: 130, h: 127, cx: 348.7, cy: 579.0, px: 273, py: 508.5, pw: 148, ph: 142.5 },
  { n: 'l4', x: 425, y: 520, w: 133, h: 128, cx: 488.7, cy: 588.6, px: 416, py: 517.5, pw: 145.5, ph: 139.5 } ];
const IMG = OB.map(b => { const a = new Image(); a.src = b.n + '.png'; const p = new Image(); p.src = b.n + '_platz.png'; return { spr: a, bg: p }; });
function spr(g, i, x, y, s = 1, r = 0, a = 1, fx = 1){ const b = OB[i]; if(!IMG[i].spr.complete) return; g.save(); g.globalAlpha = a; g.translate(x, y); g.rotate(r); g.scale(s*fx, s); g.drawImage(IMG[i].spr, -b.w/2, -b.h/2, b.w, b.h); g.restore(); }
function hole(g, i){ const b = OB[i]; if(IMG[i].bg.complete && IMG[i].bg.naturalWidth) g.drawImage(IMG[i].bg, b.px, b.py, b.pw, b.ph); }
const ctr = i => ({ x: OB[i].x + OB[i].w/2, y: OB[i].y + OB[i].h/2 });
function flick(track){ const now = performance.now(), tr = track.filter(p => now - p[2] < 140), a = tr[0] || track[0], b = track[track.length - 1], d = Math.max(16, b[2] - a[2]); return { vx: (b[0] - a[0])/d*1000, vy: (b[1] - a[1])/d*1000, x: b[0], y: b[1] }; }


const P = OB.map((b, k) => ({ k, st: 'in', s: 1, used: false, x: 0, y: 0, vx: 0, vy: 0, r: 0, vr: 0, t: 0 }));
let fx, fin, tt, phase, left, pulled, held, sy, sx;
const scene = {
  title: t('gaertner.title'), subtitle: t('gaertner.sub'), emoji: '🌼', accent: '#ffe27a', button: '#4a7a2a', bg: '#2c3e1e',
  init(ctx){ fx = makeFx(); fin = makeFinale(); this.restart(ctx); },
  restart(ctx){ for(const p of P){ p.st = 'in'; p.s = 1; p.used = false; } phase = 'ready'; left = 30; pulled = 0; held = -1; tt = 0; fx.clear(); fin.stop(); },
  pick(x, y){ for(const p of P){ const b = OB[p.k]; if(p.st === 'in' && x > b.x - 10 && x < b.x + b.w + 10 && y > b.y - 30 && y < b.y + b.h + 30) return p.k; } return -1; },
  onTap(x, y, ctx){ if(phase === 'end') return; held = this.pick(x, y); sx = x; sy = y; },
  onDrag(x, y, ctx){ if(held < 0) return; if(sy - y > 45) this.pull(held, (x - sx)*6, ctx); },
  onRelease(ctx){ held = -1; },
  pull(k, vx, ctx){ const p = P[k], c = ctr(k); held = -1; if(phase === 'ready') phase = 'play';
    p.st = 'fly'; p.used = true; p.x = c.x; p.y = c.y; p.vx = vx + (Math.random() - .5)*120; p.vy = -720; p.r = 0; p.vr = (Math.random() - .5)*8; pulled++;
    fx.burst(c.x, OB[k].y + OB[k].h - 10, 16, ['#3a2a1a', '#5a4028', '#2a1a10'], 220, 600, 5); fx.pop(c.x, c.y - 70, '+1', '#ffe27a', 32);
    ctx.noise(0, .18, .18, 700); ctx.tone(660 + pulled*8, 0, .1, 'triangle', .06); },
  update(dt, ctx){ tt += dt; fx.update(dt);
    if(phase === 'play'){ left -= dt; if(left <= 0){ left = 0; this.finish(ctx); } }
    for(const p of P){
      if(p.st === 'fly'){ p.x += p.vx*dt; p.y += p.vy*dt; p.vy += 1500*dt; p.r += p.vr*dt; if(p.y > 1000){ p.st = 'wait'; p.t = .4 + Math.random()*1.4; } }
      else if(p.st === 'wait'){ p.t -= dt; if(p.t <= 0){ p.st = 'grow'; p.s = 0; ctx.tone(1200, 0, .05, 'sine', .03); } }
      else if(p.st === 'grow'){ p.s += dt/.55; if(p.s >= 1){ p.s = 1; p.st = 'in'; } } } },
  finish(ctx){ phase = 'end'; for(const p of P) if(p.st !== 'in'){ p.st = 'in'; p.s = 1; } const b = best('gaertner', pulled, true);
    ctx.melody([['E5', .25], ['G5', .25], ['A5', .25], ['C6', .75]], 160, 'triangle', .1);
    setTimeout(() => fin.start(ctx, greeting('gaertner'), [t('gaertner.line'), t('gaertner.score', { n: pulled }) + (b.isNew && pulled ? '  ★' : '') + '  ·  ' + t('gaertner.best', { n: b.best })], MEL.birthday), 500); },
  draw(g, ctx){ const dt = 1/60;
    for(const p of P){ if(!p.used) continue; hole(g, p.k); const b = OB[p.k], c = ctr(p.k);
      if(p.st === 'in' || p.st === 'grow'){ const s = p.s < 1 ? (1 - Math.pow(1 - p.s, 3))*(1 + .12*Math.sin(p.s*9)) : 1; g.save(); g.translate(c.x, b.y + b.h); g.scale(s, s); g.translate(-c.x, -(b.y + b.h)); spr(g, p.k, c.x, c.y); g.restore(); } }
    for(const p of P) if(p.st === 'fly'){ spr(g, p.k, p.x, p.y, 1, p.r); g.save(); g.strokeStyle = '#e8d8b0'; g.lineWidth = 3; g.translate(p.x, p.y); g.rotate(p.r); g.beginPath(); g.moveTo(0, OB[p.k].h*.35); g.quadraticCurveTo(6, OB[p.k].h*.55, -2, OB[p.k].h*.75); g.stroke(); g.restore(); }
    fx.draw(g);
    if(!fin.on) hud2(g, '🌼 ' + pulled, '⏱ ' + Math.ceil(left) + ' s', 846);
    if(!fin.on && phase === 'ready') hint(g, t('gaertner.hint'), tt, 700, 99);
    fin.draw(g, dt, 'rgba(30,50,20,', .18); } };
startCard(scene);
window.__gt = { get phase(){ return phase; }, get pulled(){ return pulled; }, P, OB };
