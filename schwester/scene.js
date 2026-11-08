// Schwester: „Ballon-Party“. Fünf gedruckte Luftballons hängen am Geschenk. Antippen: die Schnur reißt und der Ballon steigt –
// schnell nochmal antippen, dann platzt er mit Konfetti! Entwischt er oben, ist er weg.
import { startCard, t } from '../core/card.js';
import { makeFx, makeFinale, hud2, best, greeting, hint, MEL } from '../core/kit.js';
const OB = [
  { n: 'ballon1', x: 76, y: 290, w: 128, h: 156, cx: 142.4, cy: 365.2, px: 75.5, py: 290.5, pw: 129.5, ph: 158 },
  { n: 'ballon2', x: 163, y: 214, w: 123, h: 162, cx: 225.5, cy: 290.1, px: 162.5, py: 216, pw: 123, ph: 163.5 },
  { n: 'ballon3', x: 284, y: 212, w: 120, h: 164, cx: 341.5, cy: 286.8, px: 283, py: 214, pw: 122.5, ph: 165 },
  { n: 'ballon4', x: 358, y: 284, w: 124, h: 158, cx: 417.3, cy: 357.0, px: 357, py: 285, pw: 125.5, ph: 160 },
  { n: 'ballon5', x: 411, y: 380, w: 123, h: 146, cx: 471.4, cy: 449.2, px: 411, py: 381, pw: 124.5, ph: 138 } ];
const IMG = OB.map(b => { const a = new Image(); a.src = b.n + '.png'; const p = new Image(); p.src = b.n + '_platz.png'; return { spr: a, bg: p }; });
const COL = [['#ff8ab8', '#ffd0e4'], ['#7fe0c8', '#d0fff0'], ['#ffd34a', '#fff0b0'], ['#b48aff', '#e8d8ff'], ['#ffa880', '#ffe0d0']];
let S, fx, fin, tt, popped, done, over;
const scene = {
  title: t('schwester.title'), subtitle: t('schwester.sub'), emoji: '🎈', accent: '#ffd0e4', button: '#c04a8a', bg: '#8a3a6a',
  init(ctx){ fx = makeFx(); fin = makeFinale(); this.restart(ctx); },
  restart(ctx){ S = OB.map(b => ({ st: 'home', x: b.cx, y: b.cy, vy: 0, t: 0, ph: Math.random()*6 })); tt = 0; popped = 0; done = 0; over = false; fx.clear(); fin.stop(); },
  onTap(x, y, ctx){ if(over) return; let bi = -1, bd = 1e9;
    S.forEach((s, i) => { if(s.st !== 'home' && s.st !== 'free') return; const b = OB[i]; if(Math.abs(x - s.x) < b.w*.6 && Math.abs(y - s.y) < b.h*.55){ const d = Math.hypot(x - s.x, y - s.y); if(d < bd){ bd = d; bi = i; } } });
    if(bi < 0) return; const s = S[bi];
    if(s.st === 'home'){ s.st = 'free'; s.t = 0; s.vy = -110; ctx.tone(880, 0, .06, 'sine', .05); ctx.tone(1320, .05, .08, 'sine', .04); }
    else { s.st = 'pop'; s.t = 0; popped++; done++; ctx.noise(0, .12, .35, 1500); ctx.tone(1046 + popped*120, .05, .2, 'triangle', .08);
      fx.burst(s.x, s.y, 34, [...COL[bi], '#ffffff', '#ffe27a'], 340, 300, 6); fx.pop(s.x, s.y - 50, t('schwester.peng'), '#ffffff', 30); if(done === OB.length) this.finish(ctx); } },
  update(dt, ctx){ tt += dt; fx.update(dt);
    S.forEach((s, i) => { s.t += dt; if(s.st === 'free'){ s.vy = Math.max(-330, s.vy - 170*dt); s.y += s.vy*dt; s.x = OB[i].cx + Math.sin(s.t*2.5 + s.ph)*18;
      if(s.y < -OB[i].h*.6){ s.st = 'lost'; done++; ctx.tone(330, 0, .3, 'sine', .05); fx.pop(s.x, 60, t('schwester.weg'), '#ffe0f0', 24); if(done === OB.length) this.finish(ctx); } } }); },
  finish(ctx){ over = true; const b = best('schwester', popped, true);
    ctx.melody([['E5', .25], ['G5', .25], ['C6', .25], ['E6', .5], ['C6', .25], ['E6', .75]], 200, 'triangle', .1);
    setTimeout(() => fin.start(ctx, greeting('schwester'), [t('schwester.line'), t('schwester.score', { n: popped }) + (b.isNew && popped ? '  ★' : '')], MEL.birthday), 1000); },
  draw(g, ctx){ const dt = 1/60;
    S.forEach((s, i) => { const b = OB[i]; if(s.st !== 'home' && IMG[i].bg.complete) g.drawImage(IMG[i].bg, b.px, b.py, b.pw, b.ph); });
    S.forEach((s, i) => { const b = OB[i]; if(!IMG[i].spr.complete || s.st === 'pop' || s.st === 'lost') return;
      const sway = s.st === 'home' ? Math.sin(tt*1.6 + s.ph)*.02 : Math.sin(s.t*2.5 + s.ph)*.08;
      if(s.st === 'free'){ g.save(); g.strokeStyle = 'rgba(160,140,150,.8)'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(s.x, s.y + b.h*.5); g.quadraticCurveTo(s.x + Math.sin(s.t*4)*10, s.y + b.h*.5 + 40, s.x - 4, s.y + b.h*.5 + 80); g.stroke(); g.restore(); }
      g.save(); g.translate(s.x, s.y + b.h*.5); g.rotate(sway); g.drawImage(IMG[i].spr, b.x - b.cx, b.y - b.cy - b.h*.5, b.w, b.h); g.restore(); });
    fx.draw(g);
    if(!fin.on) hud2(g, '🎈 ' + popped + '/5', '💨 ' + S.filter(s => s.st === 'lost').length, 846);
    if(!fin.on && done === 0 && !S.some(s => s.st === 'free')) hint(g, t('schwester.hint'), tt, 640, 99);
    fin.draw(g, dt, 'rgba(120,40,90,', .18); } };
startCard(scene);
window.__sw = { OB, S: () => S, get done(){ return done; }, get popped(){ return popped; } };
