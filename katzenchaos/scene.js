// Katze lustig: „Rette die Sachen!“ Der gedruckte Kater schubst die gedruckten Sachen vom Regal – wackelt etwas, schnell antippen und festhalten! Was zu lange wackelt, fällt runter.
import { startCard, t } from '../core/card.js';
import { makeFx, makeFinale, hud2, best, peekBest, greeting, hint, MEL } from '../core/kit.js';
const OB = [
  { n: 'kater', x: 14, y: 284, w: 168, h: 314, cx: 108.7, cy: 456.5, px: 11.5, py: 281.5, pw: 173, ph: 319 },
  { n: 'vase', x: 194, y: 342, w: 98, h: 230, cx: 245.5, cy: 470.6, px: 192, py: 339.5, pw: 102.5, ph: 233 },
  { n: 'tasse', x: 290, y: 480, w: 102, h: 102, cx: 334.9, cy: 531.3, px: 289, py: 483, pw: 101.5, ph: 98.5 },
  { n: 'kaktus', x: 372, y: 404, w: 88, h: 108, cx: 414.3, cy: 465.2, px: 370.5, py: 409, pw: 89, ph: 100 },
  { n: 'buecher', x: 396, y: 502, w: 131, h: 86, cx: 449.6, cy: 544.2, px: 397, py: 503.5, pw: 128.5, ph: 87 },
  { n: 'glas', x: 514, y: 462, w: 78, h: 126, cx: 551.8, cy: 522.4, px: 513, py: 466, pw: 78.5, ph: 119.5 } ];
const IMG = OB.map(b => { const a = new Image(); a.src = b.n + '.png'; const p = new Image(); p.src = b.n + '_platz.png'; return { spr: a, bg: p }; });
function spr(g, i, x, y, s = 1, r = 0, a = 1, fx = 1){ const b = OB[i]; if(!IMG[i].spr.complete) return; g.save(); g.globalAlpha = a; g.translate(x, y); g.rotate(r); g.scale(s*fx, s); g.drawImage(IMG[i].spr, -b.w/2, -b.h/2, b.w, b.h); g.restore(); }
function hole(g, i){ const b = OB[i]; if(IMG[i].bg.complete && IMG[i].bg.naturalWidth) g.drawImage(IMG[i].bg, b.px, b.py, b.pw, b.ph); }
const ctr = i => ({ x: OB[i].x + OB[i].w/2, y: OB[i].y + OB[i].h/2 });
function flick(track){ const now = performance.now(), tr = track.filter(p => now - p[2] < 140), a = tr[0] || track[0], b = track[track.length - 1], d = Math.max(16, b[2] - a[2]); return { vx: (b[0] - a[0])/d*1000, vy: (b[1] - a[1])/d*1000, x: b[0], y: b[1] }; }


const CAT = 0, ITEMS = [1, 2, 3, 4, 5], FLOOR = 830, ROUNDS = 14;
let S, phase, aim, wait, saved, lost, round, fx, fin, tt, paw;
const scene = {
  title: t('katzenchaos.title'), subtitle: t('katzenchaos.sub'), emoji: '🐈‍⬛', accent: '#ffd36a', button: '#2a5a5a', bg: '#1e3a3a',
  init(ctx){ fx = makeFx(); fin = makeFinale(); this.restart(ctx); },
  restart(ctx){ S = OB.map((b, i) => ({ st: 'shelf', w: 0, t: 0, x: b.x + b.w/2, y: b.y + b.h/2, r: 0, vy: 0 })); phase = 'ready'; aim = -1; wait = 1; saved = 0; lost = 0; round = 0; tt = 0; paw = 0; fx.clear(); fin.stop(); },
  onTap(x, y, ctx){ if(phase === 'ready'){ phase = 'play'; return; } if(phase !== 'play' || aim < 0) return; const b = OB[aim], s = S[aim];
    if(Math.abs(x - s.x) < b.w*.7 + 20 && Math.abs(y - s.y) < b.h*.6 + 20){ s.st = 'shelf'; s.w = 0; saved++; aim = -1; wait = .5 + Math.random()*.6; ctx.tone(784, 0, .1, 'triangle', .08); ctx.tone(1046, .08, .12, 'triangle', .07); fx.pop(s.x, b.y - 30, t('katzenchaos.puh'), '#ffffff', 26); } },
  update(dt, ctx){ tt += dt; fx.update(dt); paw = Math.max(0, paw - dt*2);
    if(phase === 'play'){
      if(aim < 0){ wait -= dt; if(wait <= 0){ const av = ITEMS.filter(i => S[i].st === 'shelf'); if(!av.length || round >= ROUNDS){ this.finish(ctx); return; }
        aim = av[Math.floor(Math.random()*av.length)]; round++; const s = S[aim]; s.st = 'wobble'; s.t = 0; s.lim = Math.max(.8, 1.7 - round*.06); paw = 1; ctx.tone(220, 0, .08, 'square', .04); } }
      else { const s = S[aim]; s.t += dt; s.w = Math.min(1, s.t/s.lim); if(Math.floor(s.t*10) % 3 === 0 && Math.random() < .2) ctx.tone(300 + Math.random()*100, 0, .03, 'triangle', .02);
        if(s.t >= s.lim){ s.st = 'fall'; s.vy = -60; s.vx = 40 + Math.random()*60; lost++; aim = -1; wait = .8; ctx.tone(400, 0, .3, 'sine', .05); } } }
    S.forEach((s, i) => { if(s.st === 'fall'){ s.vy += 1500*dt; s.y += s.vy*dt; s.x += s.vx*dt; s.r += dt*4;
      if(s.y > FLOOR){ s.st = 'down'; s.y = FLOOR; ctx.noise(0, .25, .12, 1800); ctx.tone(120, 0, .15, 'square', .05); fx.burst(s.x, FLOOR, 22, i === 5 ? ['#bfe9f5', '#ffffff'] : ['#ffffff', '#c89a5a', '#7a9a5a', '#a04030'], 260, 700, 5); fx.pop(s.x, FLOOR - 60, t('katzenchaos.klirr'), '#ffe0e0', 26); } } }); },
  finish(ctx){ phase = 'end'; const b = best('katzenchaos', saved, true);
    ctx.melody([['C5', .25], ['E5', .25], ['G5', .25], ['C6', .75]], 200, 'triangle', .1);
    setTimeout(() => fin.start(ctx, greeting('katzenchaos'), [t('katzenchaos.line'), t('katzenchaos.score', { n: saved, m: lost }) + (b.isNew && saved ? '  ★' : '')], MEL.birthday), 900); },
  draw(g, ctx){ const dt = 1/60;
    ITEMS.forEach(i => { const s = S[i], b = OB[i]; if(s.st === 'fall' || s.st === 'down'){ hole(g, i); spr(g, i, b.x + b.w/2, b.y + b.h/2, 1, 0, .22); } });
    if(paw > 0 || aim >= 0){ const c = ctr(CAT), e = aim >= 0 ? Math.sin(tt*10)*.02 + .03 : 0; spr(g, CAT, c.x + (aim >= 0 ? 4 : 0), c.y, 1.01, e); }
    ITEMS.forEach(i => { const s = S[i], b = OB[i];
      if(s.st === 'wobble'){ const a = Math.sin(tt*(18 + s.w*14))*(.05 + s.w*.25); g.save(); g.translate(b.x + b.w/2, b.y + b.h); g.rotate(a); g.translate(0, -b.h/2); spr(g, i, 0, 0, 1.02); g.restore();
        g.save(); g.strokeStyle = `rgba(255,90,60,${.5 + .5*Math.sin(tt*16)})`; g.lineWidth = 3; g.beginPath(); g.arc(b.x + b.w/2, b.y + b.h/2, Math.max(b.w, b.h)*.62, 0, 7); g.stroke(); g.restore(); }
      if(s.st === 'fall') spr(g, i, s.x, s.y, 1, s.r); });
    fx.draw(g);
    if(!fin.on) hud2(g, '🙌 ' + saved, '💥 ' + lost, 846);
    if(!fin.on && phase === 'ready') hint(g, t('katzenchaos.hint'), tt, 690, 99);
    fin.draw(g, dt, 'rgba(20,40,40,', .2); } };
startCard(scene);
window.__kl = { OB, get aim(){ return aim; }, get S(){ return S; }, get phase(){ return phase; }, get saved(){ return saved; } };
