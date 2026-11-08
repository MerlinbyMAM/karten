// Opa: „Opas Angelglück“. Die fünf gedruckten Schwimmer schaukeln auf dem See. Immer wieder zuckt einer (ein Fisch knabbert),
// dann taucht er ab – genau jetzt antippen, und ein Fisch springt aus dem Wasser. Zu früh oder zu spät = weg. 40 Sekunden.
import { startCard, t } from '../core/card.js';
import { makeFx, makeFinale, hud2, best, peekBest, greeting, hint, rnd, MEL } from '../core/kit.js';

const BOB = [
  { n: 'pose1', x: 110, y: 503, w: 40, h: 45, cx: 129.5, cy: 528.8, px: 110.5, py: 504, pw: 39, ph: 42.5 },
  { n: 'pose2', x: 176, y: 480, w: 36, h: 37, cx: 194, cy: 501.4, px: 177.5, py: 479.5, pw: 34.5, ph: 37.5 },
  { n: 'pose3', x: 258, y: 501, w: 38, h: 41, cx: 277.5, cy: 524.1, px: 259, py: 500, pw: 37.5, ph: 41 },
  { n: 'pose4', x: 338, y: 535, w: 42, h: 45, cx: 359.5, cy: 560.9, px: 338.5, py: 533.5, pw: 43, ph: 48 },
  { n: 'pose5', x: 188, y: 554, w: 44, h: 48, cx: 210.2, cy: 582.3, px: 188, py: 553, pw: 45, ph: 50 } ];
const IMG = BOB.map(b => { const a = new Image(); a.src = b.n + '.png'; const p = new Image(); p.src = b.n + '_platz.png'; return { spr: a, bg: p }; });
const TIME = 40, FISHC = [['#f2a65a', '#c8682a'], ['#9fc7d8', '#5d8aa0'], ['#e8c35a', '#a8842a']];

let S, fish, rings, fx, fin, tt, time, caught, over, next, started;
const water = b => b.y + b.h - 9;

const scene = {
  title: t('opa.title'), subtitle: t('opa.sub'), emoji: '🎣',
  accent: '#ffe2a0', button: '#2f6f8a', bg: '#1f4a5a',
  init(ctx){ fx = makeFx(); fin = makeFinale(); this.restart(ctx); },
  restart(ctx){ S = BOB.map(() => ({ st: 'idle', t: 0, ph: rnd(0, 6) })); fish = []; rings = []; tt = 0; time = TIME; caught = 0; over = false; next = 1.2; started = false; fx.clear(); fin.stop(); },
  onTap(x, y, ctx){
    if(over) return;
    let bi = -1, bd = 46; BOB.forEach((b, i) => { const d = Math.hypot(x - b.cx, y - b.cy); if(d < bd){ bd = d; bi = i; } });
    if(bi < 0) return; started = true;
    const s = S[bi], b = BOB[bi];
    if(s.st === 'dip'){ s.st = 'up'; s.t = 0; caught++; const c = FISHC[caught % 3];
      fish.push({ x: b.cx, y: water(b), vx: rnd(-90, 90), vy: -560, r: 0, c, t: 0 });
      rings.push({ x: b.cx, y: water(b), r: 6, a: 1 }); fx.burst(b.cx, water(b), 18, ['#e8f6ff', '#bfe3ff', '#ffffff'], 220, 500, 5);
      fx.pop(b.cx, b.y - 40, t('opa.catch'), '#ffe27a', 30); ctx.noise(0, .12, .12, 1500); ctx.melody([['G5', .2], ['C6', .4]], 300, 'triangle', .09); }
    else if(s.st === 'nibble'){ fx.pop(b.cx, b.y - 34, t('opa.early'), '#fff', 26); s.st = 'idle'; s.t = 0; ctx.tone(260, 0, .1, 'sine', .05); }
  },
  update(dt, ctx){
    tt += dt; fx.update(dt);
    if(!over && started){ time -= dt; if(time <= 0){ time = 0; this.finish(ctx); } }
    if(!over){ next -= dt; if(next <= 0){ const idle = S.map((s, i) => i).filter(i => S[i].st === 'idle');
      if(idle.length){ const i = idle[Math.floor(Math.random()*idle.length)]; S[i].st = 'nibble'; S[i].t = 0; S[i].dur = rnd(.5, 1.4); }
      next = Math.max(.5, rnd(.7, 1.6) - (TIME - time)*.012); } }
    S.forEach((s, i) => { s.t += dt; const b = BOB[i];
      if(s.st === 'nibble' && s.t > s.dur){ s.st = 'dip'; s.t = 0; s.win = Math.max(.45, .9 - (TIME - time)*.008); rings.push({ x: b.cx, y: water(b), r: 4, a: .9 }); ctx.noise(0, .05, .03, 1200); }
      if(s.st === 'dip' && s.t > s.win){ s.st = 'up'; s.t = 0; fx.pop(b.cx, b.y - 34, t('opa.late'), '#cfe8ff', 24); }
      if(s.st === 'up' && s.t > .5){ s.st = 'idle'; s.t = 0; } });
    for(const f of fish){ f.t += dt; f.vy += 1300*dt; f.x += f.vx*dt; f.y += f.vy*dt; f.r = Math.atan2(f.vy, f.vx || 1); }
    fish = fish.filter(f => f.t < 1.2);
    for(const r of rings){ r.r += dt*40; r.a -= dt*.9; } rings = rings.filter(r => r.a > 0);
  },
  finish(ctx){
    over = true; const b = best('opa', caught);
    fin.start(ctx, greeting('opa'), [t('opa.score', { n: caught }) + (b.isNew ? '  ★' : ''), t('opa.best', { n: b.best })], MEL.fanfare);
  },
  draw(g, ctx){
    const dt = 1/60;
    for(const r of rings){ g.save(); g.strokeStyle = `rgba(235,248,255,${r.a*.8})`; g.lineWidth = 2; g.beginPath(); g.ellipse(r.x, r.y, r.r, r.r*.3, 0, 0, 7); g.stroke(); g.restore(); }
    S.forEach((s, i) => {
      const b = BOB[i]; if(!IMG[i].spr.complete || !IMG[i].bg.complete) return;
      let dy = Math.sin(tt*2 + s.ph)*1.5, rot = Math.sin(tt*1.6 + s.ph)*.04;
      if(s.st === 'nibble'){ dy += Math.sin(s.t*40)*2.5*(Math.sin(s.t*7) > 0 ? 1 : .2); rot += Math.sin(s.t*31)*.12; }
      if(s.st === 'dip') dy += Math.min(1, s.t/.12)*b.h*.75;
      if(s.st === 'up') dy += b.h*.75*Math.max(0, 1 - s.t/.35);
      if(Math.abs(dy) < .2 && Math.abs(rot) < .01) return;            // ruhig = Druckbild
      g.drawImage(IMG[i].bg, b.px, b.py, b.pw, b.ph);
      g.save(); g.beginPath(); g.rect(b.px - 10, 0, b.pw + 20, water(b) + 1); g.clip();
      g.translate(b.cx, b.cy + dy); g.rotate(rot); g.drawImage(IMG[i].spr, b.x - b.cx, b.y - b.cy, b.w, b.h); g.restore();
      if(s.st === 'dip' || s.st === 'nibble'){ g.save(); g.strokeStyle = 'rgba(235,248,255,.6)'; g.lineWidth = 1.5; g.beginPath(); g.ellipse(b.cx, water(b), b.w*.55 + Math.sin(tt*20)*2, 4, 0, 0, 7); g.stroke(); g.restore(); }
    });
    for(const f of fish){ g.save(); g.translate(f.x, f.y); g.rotate(f.r); const [c1, c2] = f.c;
      const gr = g.createLinearGradient(0, -12, 0, 12); gr.addColorStop(0, c2); gr.addColorStop(.5, c1); gr.addColorStop(1, '#f6efe0'); g.fillStyle = gr;
      g.beginPath(); g.ellipse(0, 0, 26, 11, 0, 0, 7); g.fill(); g.beginPath(); g.moveTo(-22, 0); g.lineTo(-38, -11); g.lineTo(-38, 11); g.closePath(); g.fill();
      g.fillStyle = '#222'; g.beginPath(); g.arc(16, -3, 2.4, 0, 7); g.fill(); g.restore(); }
    fx.draw(g);
    if(!fin.on) hud2(g, '🐟 ' + caught, '⏱ ' + Math.ceil(time) + ' s', 846);
    if(!fin.on && !started) hint(g, t('opa.hint'), tt, 640, 9);
    fin.draw(g, dt, 'rgba(20,50,60,', .22);
  }
};
startCard(scene);
window.__op = { BOB, S: () => S, get caught(){ return caught; } };
