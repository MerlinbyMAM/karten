// Taufe: „Wolken wegwischen“. Fünf gedruckte Wolken hängen am Himmel. Mit dem Finger wegschieben –
// sie treiben davon. Ist der Himmel frei, strahlt die Sonne über der Kapelle und die Glocken läuten. Ohne Punkte.
import { startCard, t } from '../core/card.js';
import { makeFx, makeFinale, greeting, hint } from '../core/kit.js';
const OB = [
  { n: 'wolke1', x: 14, y: 40, w: 152, h: 100, cx: 90.0, cy: 95.1, px: 13, py: 40, pw: 154, ph: 103.5 },
  { n: 'wolke2', x: 455, y: 106, w: 145, h: 90, cx: 528.8, cy: 156.1, px: 455.5, py: 107.5, pw: 144.5, ph: 88.5 },
  { n: 'wolke3', x: 6, y: 246, w: 150, h: 94, cx: 75.2, cy: 299.4, px: 2, py: 248, pw: 151, ph: 93 },
  { n: 'wolke4', x: 478, y: 292, w: 122, h: 74, cx: 538.7, cy: 334.1, px: 477, py: 293, pw: 123, ph: 74.5 },
  { n: 'wolke5', x: 24, y: 456, w: 122, h: 72, cx: 80.2, cy: 499.1, px: 20, py: 459, pw: 125.5, ph: 70.5 } ];
const IMG = OB.map(b => { const a = new Image(); a.src = b.n + '.png'; const p = new Image(); p.src = b.n + '_platz.png'; return { spr: a, bg: p }; });
const CH = { x: 385, y: 520 };
let S, fx, fin, tt, gone, over, last, glow;
const scene = {
  title: t('taufe.title'), subtitle: t('taufe.sub'), emoji: '☁️', accent: '#ffe8a0', button: '#7aa0d0', bg: '#5a80b0',
  init(ctx){ fx = makeFx(); fin = makeFinale(); this.restart(ctx); },
  restart(ctx){ S = OB.map(b => ({ st: 'home', x: b.cx, y: b.cy, vx: 0, vy: 0, moved: false })); tt = 0; gone = 0; over = false; last = null; glow = 0; fx.clear(); fin.stop(); },
  onTap(x, y){ last = [x, y]; },
  onDrag(x, y, ctx){ if(!last || over){ last = [x, y]; return; } const dx = x - last[0], dy = y - last[1]; last = [x, y];
    S.forEach((s, i) => { if(s.st === 'gone') return; const b = OB[i]; if(Math.abs(x - s.x) < b.w*.55 && Math.abs(y - s.y) < b.h*.6){
      if(!s.moved){ s.moved = true; ctx.tone(660 + i*90, 0, .25, 'sine', .04); } s.st = 'drift'; s.vx += dx*14; s.vy += dy*6; } }); },
  onRelease(){ last = null; },
  update(dt, ctx){ tt += dt; fx.update(dt); glow = over ? Math.min(1, glow + dt*.6) : 0;
    S.forEach((s, i) => { if(s.st !== 'drift') return; s.x += s.vx*dt; s.y += s.vy*dt; s.vx *= Math.pow(.6, dt); s.vy *= Math.pow(.3, dt);
      s.vx = Math.max(-900, Math.min(900, s.vx)); s.y = Math.max(-40, Math.min(560, s.y));
      if(s.x < -OB[i].w*.6 || s.x > 600 + OB[i].w*.6){ s.st = 'gone'; gone++; ctx.tone([523, 587, 659, 784, 880][gone - 1], 0, .5, 'sine', .07); if(gone === OB.length) this.finish(ctx); } }); },
  finish(ctx){ over = true; [0, .7, 1.4, 2.1].forEach((d, k) => { ctx.tone(k % 2 ? 523 : 659, d, 1.4, 'sine', .07); ctx.tone(k % 2 ? 1046 : 1318, d, .8, 'sine', .02); });
    for(let k = 0; k < 3; k++) setTimeout(() => fx.burst(CH.x, CH.y - 120, 20, ['#ffe8a0', '#ffffff', '#ffd0e0'], 220, 120, 5), 500 + k*500);
    setTimeout(() => fin.start(ctx, greeting('taufe'), [t('taufe.line')], null), 2400); },
  draw(g, ctx){ const dt = 1/60;
    S.forEach((s, i) => { const b = OB[i]; if(s.moved && IMG[i].bg.complete) g.drawImage(IMG[i].bg, b.px, b.py, b.pw, b.ph); });
    if(glow > 0){ g.save(); g.globalAlpha = glow*.7; const r = g.createRadialGradient(CH.x, CH.y - 130, 10, CH.x, CH.y - 130, 330); r.addColorStop(0, 'rgba(255,245,200,1)'); r.addColorStop(1, 'rgba(255,230,160,0)'); g.fillStyle = r; g.fillRect(0, 0, 600, 800);
      g.globalAlpha = glow*.35; g.strokeStyle = '#fff6d0'; g.lineWidth = 10; for(let k = 0; k < 12; k++){ const a = k/12*Math.PI*2 + tt*.15; g.beginPath(); g.moveTo(CH.x + Math.cos(a)*60, CH.y - 130 + Math.sin(a)*60); g.lineTo(CH.x + Math.cos(a)*300, CH.y - 130 + Math.sin(a)*300); g.stroke(); } g.restore(); }
    S.forEach((s, i) => { if(s.st === 'gone' || !s.moved || !IMG[i].spr.complete) return; const b = OB[i]; g.drawImage(IMG[i].spr, s.x - (b.cx - b.x), s.y - (b.cy - b.y) + Math.sin(tt*1.3 + i)*2, b.w, b.h); });
    fx.draw(g);
    if(!fin.on && gone === 0 && !S.some(s => s.moved)) hint(g, t('taufe.hint'), tt, 600, 10);
    fin.draw(g, dt, 'rgba(60,90,140,', .18); } };
startCard(scene);
window.__tf = { OB, S: () => S, get gone(){ return gone; } };
